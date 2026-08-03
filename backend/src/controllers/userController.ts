import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { searchUsers, getUserProfile, getTopGratitudeUsers } from '../services/userService';

export const searchUsersHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    const users = await searchUsers(q as string, req.user?.userId);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const profile = await getUserProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getTopGratitudeHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topUsers = await getTopGratitudeUsers();
    res.json({ success: true, data: topUsers });
  } catch (error) {
    next(error);
  }
};
