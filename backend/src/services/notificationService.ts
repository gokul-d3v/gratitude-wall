import { Notification } from '../models/Notification';

export const getUserNotifications = async (userId: string, limit = 30) => {
  return Notification.find({
    $or: [{ recipientId: userId }, { recipientId: null }],
  })
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

export const clearAllNotifications = async (userId: string) => {
  await Notification.deleteMany({
    $or: [{ recipientId: userId }, { recipientId: null }],
  });
  return { success: true };
};

import { User } from '../models/User';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export const subscribeToPush = async (userId: string, subscription: any) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };

  if (!user.pushSubscriptions) {
    user.pushSubscriptions = [];
  }

  // Remove duplicate endpoints if they exist
  user.pushSubscriptions = user.pushSubscriptions.filter(
    (sub) => sub.endpoint !== subscription.endpoint
  );
  user.pushSubscriptions.push(subscription);
  
  await user.save();
  return { success: true };
};

export const unsubscribeFromPush = async (userId: string, endpoint: string) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };

  if (user.pushSubscriptions) {
    user.pushSubscriptions = user.pushSubscriptions.filter(
      (sub) => sub.endpoint !== endpoint
    );
    await user.save();
  }
  return { success: true };
};

export const sendWebPushNotification = async (userId: string, payload: any) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

    const payloadString = JSON.stringify(payload);
    
    // Send to all devices
    const promises = user.pushSubscriptions.map((sub) => 
      webpush.sendNotification(sub, payloadString).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or not found, we should ideally remove it here
          return null;
        }
        console.error('Error sending push:', err);
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendWebPushNotification:', error);
  }
};

export const broadcastWebPushNotification = async (payload: any, excludeUserId?: string) => {
  try {
    const query: any = { 'pushSubscriptions.0': { $exists: true } };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    const users = await User.find(query);
    const payloadString = JSON.stringify(payload);
    
    const promises = users.flatMap(user => 
      user.pushSubscriptions!.map(sub => 
        webpush.sendNotification(sub, payloadString).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
             return null;
          }
          console.error('Web Push send error:', err);
        })
      )
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error broadcasting web push:', error);
  }
};

