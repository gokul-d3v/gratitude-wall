import { Notification } from '../models/Notification';

export const getUserNotifications = async (userId: string, limit = 20) => {
  return Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const markNotificationsAsRead = async (userId: string, notificationIds?: string[]) => {
  if (notificationIds && notificationIds.length > 0) {
    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipientId: userId },
      { $set: { isRead: true } }
    );
  } else {
    await Notification.updateMany({ recipientId: userId }, { $set: { isRead: true } });
  }
  return { success: true };
};
