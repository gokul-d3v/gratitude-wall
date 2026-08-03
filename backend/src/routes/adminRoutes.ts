import { Router } from 'express';
import {
  getStatsHandler,
  getPostsHandler,
  quarantinePostHandler,
  deletePostHandler,
  getUsersHandler,
  updateRoleHandler,
} from '../controllers/adminController';
import { createTeamHandler, deleteTeamHandler } from '../controllers/teamController';
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

// Admin Team Management
router.post('/teams', createTeamHandler);
router.delete('/teams/:id', deleteTeamHandler);

export default router;
