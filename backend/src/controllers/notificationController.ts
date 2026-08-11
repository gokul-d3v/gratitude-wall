import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getUserNotifications, markNotificationsAsRead, clearAllNotifications } from '../services/notificationService';

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

export const clearAllHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await clearAllNotifications(req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

import { subscribeToPush, unsubscribeFromPush } from '../services/notificationService';

export const subscribeHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const { subscription } = req.body;
    if (!subscription) {
      res.status(400).json({ success: false, message: 'Missing subscription' });
      return;
    }
    const result = await subscribeToPush(req.user.userId, subscription);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const unsubscribeHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ success: false, message: 'Missing endpoint' });
      return;
    }
    const result = await unsubscribeFromPush(req.user.userId, endpoint);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
