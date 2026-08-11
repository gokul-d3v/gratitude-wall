import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { Post } from '../models/Post';
import { Reaction } from '../models/Reaction';
import { Notification } from '../models/Notification';
import { broadcastNotificationToLoggedUsers, broadcastPostDelete } from '../config/socket';

export const getAdminStats = async () => {
  const [totalUsers, totalPosts, totalLikes, quarantinedPosts, reportedPosts] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Reaction.countDocuments(),
    Post.countDocuments({ isQuarantined: true }),
    Post.countDocuments({ reportsCount: { $gt: 0 } }),
  ]);

  return {
    totalUsers,
    totalPosts,
    totalLikes,
    quarantinedPosts,
    reportedPosts,
  };
};

export const getAdminPosts = async (params: { filter?: 'all' | 'quarantined' | 'reported' }) => {
  const query: any = {};
  if (params.filter === 'quarantined') {
    query.isQuarantined = true;
  } else if (params.filter === 'reported') {
    query.reportsCount = { $gt: 0 };
  }

  return Post.find(query)
    .sort({ createdAt: -1 })
    .populate('author', 'fullName email')
    .populate('taggedUsers', 'fullName email')
    .lean();
};

export const toggleQuarantinePost = async (postId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  post.isQuarantined = !post.isQuarantined;
  await post.save();

  return { postId, isQuarantined: post.isQuarantined };
};

export const deletePost = async (postId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  await Promise.all([
    Post.deleteOne({ _id: postId }),
    Reaction.deleteMany({ postId }),
    Notification.deleteMany({ postId }),
  ]);

  broadcastPostDelete(postId);

  return { postId, deleted: true };
};

export const getAdminUsers = async () => {
  return User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateUserRole = async (userId: string, role: 'USER' | 'ADMIN') => {
  const user = await User.findById(userId);
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  user.role = role;
  await user.save();

  return { userId, role: user.role };
};

export const sendSystemNotification = async (message: string) => {
  if (!message || !message.trim()) {
    throw { statusCode: 400, message: 'Notification message cannot be empty' };
  }

  const notifPayload = {
    id: Date.now().toString(),
    type: 'SYSTEM',
    variant: 'info',
    senderName: 'System Admin',
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  broadcastNotificationToLoggedUsers(notifPayload);
  return notifPayload;
};

export interface BulkUploadUser {
  email: string;
  fullName: string;
  team: string;
}

export const bulkUploadUsers = async (users: BulkUploadUser[], defaultPassword: string) => {
  if (!users || users.length === 0) {
    throw { statusCode: 400, message: 'No users provided' };
  }
  if (!defaultPassword) {
    throw { statusCode: 400, message: 'Default password is required' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const colors = ['#0058bd', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6366F1'];

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const u of users) {
    try {
      const email = u.email.trim().toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) {
        results.failed++;
        results.errors.push(`Email ${email} already exists.`);
        continue;
      }
      const randomAvatarColor = colors[Math.floor(Math.random() * colors.length)];
      await User.create({
        email,
        fullName: u.fullName.trim(),
        team: u.team?.trim() || 'General',
        passwordHash,
        avatarColor: randomAvatarColor,
      });
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Failed to create ${u.email}: ${err.message}`);
    }
  }

  return results;
};

