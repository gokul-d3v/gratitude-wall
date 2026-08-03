import { User } from '../models/User';
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
