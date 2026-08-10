import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from '../services/authService';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const result = await registerUser(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await loginUser(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await loginUser(req.body);

    if (result.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
      return;
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers['x-refresh-token'] as string) ||
      req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Session expired. Please log in.' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({
      userId: payload.userId,
      employeeCode: payload.employeeCode,
      role: payload.role,
    });

    res.json({ success: true, data: { accessToken, refreshToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired. Please log in.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
