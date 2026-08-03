import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReaction extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

const ReactionSchema: Schema = new Schema<IReaction>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emoji: { type: String, required: true },
  },
  { timestamps: true }
);

ReactionSchema.index({ postId: 1, userId: 1, emoji: 1 }, { unique: true });

export const Reaction = mongoose.model<IReaction>('Reaction', ReactionSchema);
