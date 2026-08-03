import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getAdminStats,
  getAdminPosts,
  toggleQuarantinePost,
  deletePost,
  getAdminUsers,
  updateUserRole,
} from '../services/adminService';

export const getStatsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getPostsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filter } = req.query;
    const posts = await getAdminPosts({ filter: filter as any });
    res.json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

export const quarantinePostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await toggleQuarantinePost(postId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deletePostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deletePost(postId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUsersHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await getAdminUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateRoleHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body;
    const result = await updateUserRole(userId, role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
