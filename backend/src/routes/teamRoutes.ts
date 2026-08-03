import { Router } from 'express';
import { getTeamsHandler } from '../controllers/teamController';

const router = Router();

router.get('/', getTeamsHandler);

export default router;
