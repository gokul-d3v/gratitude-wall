import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPostRead extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostReadSchema: Schema = new Schema<IPostRead>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure one read receipt record per user per post
PostReadSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostReadSchema.index({ postId: 1, readAt: -1 });

export const PostRead = mongoose.model<IPostRead>('PostRead', PostReadSchema);
