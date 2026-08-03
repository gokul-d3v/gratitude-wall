import { Router } from 'express';
import { searchUsersHandler, getProfileHandler, getTopGratitudeHandler } from '../controllers/userController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/top-gratitude', getTopGratitudeHandler);
router.get('/search', optionalAuth, searchUsersHandler);
router.get('/:id', getProfileHandler);

export default router;
