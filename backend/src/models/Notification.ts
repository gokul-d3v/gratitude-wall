import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'NEW_POST' | 'TAGGED' | 'LIKED' | 'SYSTEM';

export interface INotification extends Document {
  recipientId?: Types.ObjectId | null; // null for broadcast
  senderId?: Types.ObjectId;
  senderName: string;
  postId?: Types.ObjectId;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: {
      type: String,
      default: 'Someone',
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    type: {
      type: String,
      enum: ['NEW_POST', 'TAGGED', 'LIKED', 'SYSTEM'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // 1-day TTL

export const Notification = model<INotification>('Notification', NotificationSchema);
