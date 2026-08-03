import { User } from '../models/User';
import { Post } from '../models/Post';
import { Like } from '../models/Like';
import { broadcastNotificationToLoggedUsers } from '../config/socket';

export const getAdminStats = async () => {
  const [totalUsers, totalPosts, totalLikes, quarantinedPosts, reportedPosts] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Like.countDocuments(),
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
    .populate('author', 'fullName employeeCode')
    .populate('taggedUsers', 'fullName employeeCode')
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
    Like.deleteMany({ postId }),
  ]);

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
