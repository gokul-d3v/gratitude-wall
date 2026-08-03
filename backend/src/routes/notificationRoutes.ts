import { Router } from 'express';
import { getNotificationsHandler, markReadHandler } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getNotificationsHandler);
router.put('/read', markReadHandler);

export default router;
