import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// POST /api/auth/login - Login user
router.post('/login', authController.login.bind(authController));

// GET /api/auth/verify - Verify token (protected route)
router.get('/verify', authMiddleware, authController.verify.bind(authController));

// POST /api/auth/logout - Logout user (protected route)
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export default router;
