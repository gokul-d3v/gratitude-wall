import { Router } from 'express';
import { z } from 'zod';
import { createPostHandler, getPostsHandler, toggleLikeHandler, reportPostHandler, updatePostHandler, deletePostHandler } from '../controllers/postController';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { postRateLimiter } from '../middleware/security';

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Content must not exceed 500 characters'),
  taggedUserIds: z.array(z.string()).optional(),
  color: z.enum(['yellow', 'green', 'blue', 'pink', 'purple']).optional(),
});

const updatePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Content must not exceed 500 characters').optional(),
  color: z.enum(['yellow', 'green', 'blue', 'pink', 'purple']).optional(),
  taggedUserIds: z.array(z.string()).optional(),
});

router.get('/', optionalAuth, getPostsHandler);
router.post('/', authenticateToken, postRateLimiter, validateRequest(createPostSchema), createPostHandler);
router.post('/:id/like', authenticateToken, toggleLikeHandler);
router.post('/:id/report', reportPostHandler);
router.put('/:id', authenticateToken, validateRequest(updatePostSchema), updatePostHandler);
router.delete('/:id', authenticateToken, deletePostHandler);

// Add a test route to verify routing
router.get('/test', (req, res) => {
  res.json({ message: 'Post routes are working!' });
});

export default router;
