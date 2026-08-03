import { Router } from 'express';
import {
  getStatsHandler,
  getPostsHandler,
  quarantinePostHandler,
  deletePostHandler,
  getUsersHandler,
  updateRoleHandler,
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin routes with authentication & requireAdmin role
router.use(authenticateToken, requireAdmin);

router.get('/stats', getStatsHandler);
router.get('/posts', getPostsHandler);
router.put('/posts/:id/quarantine', quarantinePostHandler);
router.delete('/posts/:id', deletePostHandler);
router.get('/users', getUsersHandler);
router.put('/users/:id/role', updateRoleHandler);

export default router;
