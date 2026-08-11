import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  team?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterDTO) => {
  const code = data.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: code });
  if (existingUser) {
    throw { statusCode: 400, message: `Email '${code}' is already registered` };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const colors = ['#0058bd', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6366F1'];
  const randomAvatarColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser = await User.create({
    email: code,
    fullName: data.fullName.trim(),
    passwordHash,
    avatarColor: randomAvatarColor,
    team: data.team?.trim() || '',
  });

  const tokenPayload = { userId: newUser._id.toString(), email: newUser.email, role: newUser.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      avatarColor: newUser.avatarColor,
      team: newUser.team,
      role: newUser.role,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (data: LoginDTO) => {
  const code = data.email.trim().toLowerCase();

  // Block Admin accounts from signing in via regular User login
  const adminAccount = await Admin.findOne({ email: code });
  if (adminAccount) {
    throw { statusCode: 403, message: 'Admin accounts cannot log in to the Gratitude Wall. Please use the Admin Portal.' };
  }

  const user = await User.findOne({ email: code });
  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  if (user.role === 'ADMIN') {
    throw { statusCode: 403, message: 'Admin accounts cannot log in to the Gratitude Wall. Please use the Admin Portal.' };
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarColor: user.avatarColor,
      team: user.team,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const adminLoginUser = async (data: LoginDTO) => {
  const code = data.email.trim().toLowerCase();

  const admin = await Admin.findOne({ email: code });
  if (!admin) {
    throw { statusCode: 401, message: 'Invalid admin credentials' };
  }

  const isMatch = await bcrypt.compare(data.password, admin.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid admin credentials' };
  }

  const tokenPayload = { userId: admin._id.toString(), email: admin.email, role: admin.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      avatarColor: admin.avatarColor,
      role: admin.role,
    },
    accessToken,
    refreshToken,
  };
};

export interface ResetPasswordDTO {
  email: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordDTO) => {
  const code = data.email.trim().toLowerCase();

  const user = await User.findOne({ email: code });
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(data.newPassword, salt);

  user.passwordHash = passwordHash;
  await user.save();

  return { message: 'Password reset successful' };
};
