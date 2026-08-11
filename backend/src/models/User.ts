import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName: string;
  passwordHash: string;
  avatarColor: string;
  team: string;
  role: 'USER' | 'ADMIN';
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      default: '#0058bd',
    },
    team: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    pushSubscriptions: {
      type: [
        {
          endpoint: String,
          keys: {
            p256dh: String,
            auth: String,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', UserSchema);
