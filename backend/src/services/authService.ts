import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export interface RegisterDTO {
  fullName: string;
  employeeCode: string;
  password: string;
  team?: string;
}

export interface LoginDTO {
  employeeCode: string;
  password: string;
}

export const registerUser = async (data: RegisterDTO) => {
  const code = data.employeeCode.trim().toUpperCase();

  const existingUser = await User.findOne({ employeeCode: code });
  if (existingUser) {
    throw { statusCode: 400, message: `Employee Code '${code}' is already registered` };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const colors = ['#0058bd', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6366F1'];
  const randomAvatarColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser = await User.create({
    employeeCode: code,
    fullName: data.fullName.trim(),
    passwordHash,
    avatarColor: randomAvatarColor,
    team: data.team?.trim() || '',
  });

  const tokenPayload = { userId: newUser._id.toString(), employeeCode: newUser.employeeCode, role: newUser.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: newUser._id,
      employeeCode: newUser.employeeCode,
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
  const code = data.employeeCode.trim().toUpperCase();

  const user = await User.findOne({ employeeCode: code });
  if (!user) {
    throw { statusCode: 401, message: 'Invalid employee code or password' };
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid employee code or password' };
  }

  const tokenPayload = { userId: user._id.toString(), employeeCode: user.employeeCode, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      avatarColor: user.avatarColor,
      team: user.team,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};
