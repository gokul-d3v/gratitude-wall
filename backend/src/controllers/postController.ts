import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createPost, getWallPosts, toggleEmojiReaction, reportPost } from '../services/postService';

export const createPostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorUserId = req.user?.userId;
    if (!authorUserId) {
      res.status(401).json({ success: false, message: 'Must be logged in to post gratitude' });
      return;
    }
    const post = await createPost(req.body, authorUserId);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const getPostsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { color, team, taggedUserId, search, page, limit } = req.query;

    const result = await getWallPosts({
      color: color as string,
      team: team as string,
      taggedUserId: taggedUserId as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 30,
      currentUserId: req.user?.userId,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Must be logged in to react to a post' });
      return;
    }

    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { emoji } = req.body;
    const targetEmoji = emoji || '❤️';

    const result = await toggleEmojiReaction(postId, req.user.userId, targetEmoji);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const reportPostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await reportPost(postId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
