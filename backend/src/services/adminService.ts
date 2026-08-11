import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { Post } from '../models/Post';
import { Reaction } from '../models/Reaction';
import { Notification } from '../models/Notification';
import { Team } from '../models/Team';
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

export const getAdminPosts = async (options?: { filter?: 'active' | 'quarantined' | 'reported' }) => {
  const query: any = {};
  if (options?.filter === 'quarantined') {
    query.isQuarantined = true;
  } else if (options?.filter === 'reported') {
    query.reportsCount = { $gt: 0 };
  } else if (options?.filter === 'active') {
    query.isQuarantined = false;
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

  return post;
};

export const deletePost = async (postId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  await Post.findByIdAndDelete(postId);
  await Reaction.deleteMany({ postId });
  await Notification.deleteMany({ postId });

  broadcastPostDelete(postId);

  return { postId };
};

export const getAdminUsers = async () => {
  return User.find({ role: { $ne: 'ADMIN' } })
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
  email?: string;
  Email?: string;
  EMAIL?: string;
  fullName?: string;
  FullName?: string;
  name?: string;
  Name?: string;
  team?: string;
  Team?: string;
  department?: string;
  [key: string]: any;
}

export const bulkUploadUsers = async (users: BulkUploadUser[], defaultPassword: string, targetDepartment?: string) => {
  if (!users || !Array.isArray(users) || users.length === 0) {
    throw { statusCode: 400, message: 'No users provided or invalid data array' };
  }
  if (!defaultPassword || !defaultPassword.trim()) {
    throw { statusCode: 400, message: 'Default password is required' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(defaultPassword.trim(), salt);

  const colors = ['#0058bd', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6366F1'];

  const selectedDept = (targetDepartment && typeof targetDepartment === 'string' && targetDepartment.trim() && targetDepartment.trim().toUpperCase() !== 'ALL')
    ? targetDepartment.trim()
    : null;

  // Cleanup legacy employeeCode_1 index if it exists in MongoDB
  try {
    const indexes = await User.collection.indexes();
    if (indexes.some((idx) => idx.name === 'employeeCode_1')) {
      await User.collection.dropIndex('employeeCode_1');
      console.log('[BulkUpload] Automatically dropped legacy employeeCode_1 index.');
    }
  } catch {
    // Ignore if index doesn't exist
  }

  if (selectedDept) {
    await Team.updateOne(
      { name: selectedDept },
      { $setOnInsert: { name: selectedDept, description: `${selectedDept} Department` } },
      { upsert: true }
    );
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let idx = 0; idx < users.length; idx++) {
    const u = users[idx];
    const rowNum = idx + 1;

    try {
      if (!u || typeof u !== 'object') {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Invalid user object format.`);
        continue;
      }

      // Flexibly extract email across all standard key conventions
      const rawEmail =
        u.email ||
        u.Email ||
        u.EMAIL ||
        u['E-mail'] ||
        u['e-mail'] ||
        u.emailAddress ||
        u.EmailAddress ||
        u.user_email ||
        u.username ||
        u.Username;

      if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Missing or empty email address.`);
        continue;
      }

      const email = rawEmail.trim().toLowerCase();

      // Email format regex validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Invalid email address format (${email}).`);
        continue;
      }

      // Flexibly extract full name across all standard key conventions
      const rawName =
        u.fullName ||
        u.FullName ||
        u['Full Name'] ||
        u['full name'] ||
        u.fullname ||
        u.name ||
        u.Name ||
        u.displayName ||
        (u.firstName || u['First Name']
          ? `${u.firstName || u['First Name']} ${u.lastName || u['Last Name'] || ''}`.trim()
          : '');

      const fullName = (typeof rawName === 'string' && rawName.trim())
        ? rawName.trim()
        : email.split('@')[0];

      // Flexibly extract department/team across all standard key conventions
      const rawTeam =
        selectedDept ||
        u.team ||
        u.Team ||
        u.department ||
        u.Department ||
        u.dept ||
        u.Dept ||
        u['Department Name'] ||
        u.group ||
        u.Group;

      const team = (typeof rawTeam === 'string' && rawTeam.trim())
        ? rawTeam.trim()
        : 'General';

      // Ensure department exists in Active Departments
      await Team.updateOne(
        { name: team },
        { $setOnInsert: { name: team, description: `${team} Department` } },
        { upsert: true }
      );

      const existing = await User.findOne({ email });
      if (existing) {
        results.failed++;
        results.errors.push(`Row ${rowNum} (${email}): Account with this email already exists.`);
        continue;
      }

      const randomAvatarColor = colors[Math.floor(Math.random() * colors.length)];
      await User.create({
        email,
        fullName,
        team,
        passwordHash,
        avatarColor: randomAvatarColor,
        role: 'USER',
      });
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: ${err.message || 'Database creation error'}`);
    }
  }

  return results;
};

export const deleteUser = async (userId: string, currentAdminId?: string) => {
  if (currentAdminId && userId === currentAdminId) {
    throw { statusCode: 400, message: 'You cannot delete your own active admin account.' };
  }
  const user = await User.findById(userId);
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  await User.findByIdAndDelete(userId);
  return { userId };
};

export const bulkDeleteUsers = async (userIds: string[], currentAdminId?: string) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw { statusCode: 400, message: 'No user IDs provided for deletion' };
  }
  const targetIds = currentAdminId ? userIds.filter((id) => id !== currentAdminId) : userIds;
  const res = await User.deleteMany({ _id: { $in: targetIds } });
  return { deletedCount: res.deletedCount || 0 };
};

