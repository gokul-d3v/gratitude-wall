import { Schema, model, Document, Types } from 'mongoose';

export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface IPost extends Document {
  content: string;
  author: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  taggedUsers: Types.ObjectId[];
  team?: string;
  color: StickyColor;
  likesCount: number;
  reportsCount: number;
  isQuarantined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorEmail: {
      type: String,
      required: true,
    },
    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    team: {
      type: String,
      default: 'General',
      index: true,
    },
    color: {
      type: String,
      enum: ['yellow', 'green', 'blue', 'pink', 'purple'],
      default: 'yellow',
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    isQuarantined: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ createdAt: -1, isQuarantined: 1 });
PostSchema.index({ color: 1, createdAt: -1 });

export const Post = model<IPost>('Post', PostSchema);
