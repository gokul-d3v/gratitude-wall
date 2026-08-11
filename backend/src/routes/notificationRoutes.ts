import { Router } from 'express';
import { getNotificationsHandler, markReadHandler, clearAllHandler, subscribeHandler, unsubscribeHandler } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getNotificationsHandler);
router.put('/read', markReadHandler);
router.delete('/clear', clearAllHandler);
router.post('/subscribe', subscribeHandler);
router.post('/unsubscribe', unsubscribeHandler);

export default router;
