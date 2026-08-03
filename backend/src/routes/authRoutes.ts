import { Router } from 'express';
import { z } from 'zod';
import { register, login, adminLogin, refresh, logout, me } from '../controllers/authController';
import { validateRequest } from '../middleware/validate';
import { authRateLimiter } from '../middleware/security';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required').max(100),
  employeeCode: z.string().min(2, 'Employee Code is required').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  team: z.string().optional(),
});

const loginSchema = z.object({
  employeeCode: z.string().min(1, 'Employee Code is required'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/admin-login', authRateLimiter, validateRequest(loginSchema), adminLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

export default router;
