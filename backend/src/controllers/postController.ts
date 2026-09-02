import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createPost,
  getWallPosts,
  toggleEmojiReaction,
  reportPost,
  updatePost,
  deletePost,
  getPostReactions,
  markPostAsRead,
  markPostsAsBatchRead,
  getPostReads,
} from '../services/postService';

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

export const updatePostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Must be logged in to edit post' });
      return;
    }

    const post = await updatePost(postId, userId, req.body, userRole);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const deletePostHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Must be logged in to delete post' });
      return;
    }

    const result = await deletePost(postId, userId, userRole);
    res.json({ success: true, data: result });
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

export const getPostReactionsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reactions = await getPostReactions(postId);
    res.json({ success: true, data: reactions });
  } catch (error) {
    next(error);
  }
};

export const markPostReadHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Must be logged in to record read' });
      return;
    }
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await markPostAsRead(postId, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markPostReadsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Must be logged in to record reads' });
      return;
    }
    const { postIds } = req.body;
    const result = await markPostsAsBatchRead(postIds || [], userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPostReadsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getPostReads(postId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
