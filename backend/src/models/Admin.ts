import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  fullName: string;
  passwordHash: string;
  avatarColor: string;
  role: 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
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
    role: {
      type: String,
      default: 'ADMIN',
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = model<IAdmin>('Admin', AdminSchema);
