import { User } from '../models/User';
import { Post } from '../models/Post';
import { cleanInput } from '../utils/sanitizer';

export const searchUsers = async (query: string, currentUserId?: string) => {
  const cleanQ = cleanInput(query);
  if (!cleanQ || cleanQ.length < 1) return [];

  const filter: any = {
    $or: [
      { employeeCode: { $regex: cleanQ, $options: 'i' } },
      { fullName: { $regex: cleanQ, $options: 'i' } },
    ],
  };

  if (currentUserId) {
    filter._id = { $ne: currentUserId };
  }

  return User.find(filter)
    .select('_id employeeCode fullName avatarColor')
    .limit(10)
    .lean();
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  return user;
};

export const getTopGratitudeUsers = async () => {
  // Aggregate top tagged users in posts
  const topTagged = await Post.aggregate([
    { $match: { isQuarantined: false } },
    { $unwind: '$taggedUsers' },
    {
      $group: {
        _id: '$taggedUsers',
        gratitudeCount: { $sum: 1 },
      },
    },
    { $sort: { gratitudeCount: -1 } },
    { $limit: 3 },
  ]);

  if (!topTagged || topTagged.length === 0) {
    return [];
  }

  const userIds = topTagged.map((t) => t._id);
  const users = await User.find({ _id: { $in: userIds } })
    .select('_id fullName employeeCode avatarColor')
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return topTagged.map((t) => {
    const user = userMap.get(t._id.toString());
    return {
      user: user || { fullName: 'Employee', employeeCode: 'EMP' },
      count: t.gratitudeCount,
    };
  });
};
