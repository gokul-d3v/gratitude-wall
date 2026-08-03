import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getUserNotifications, markNotificationsAsRead } from '../services/notificationService';

export const getNotificationsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const notifications = await getUserNotifications(req.user.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markReadHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { notificationIds } = req.body;
    const result = await markNotificationsAsRead(req.user.userId, notificationIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
