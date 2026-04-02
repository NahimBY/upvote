import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  loginHandler,
  registerHandler,
  refreshTokenHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  checkSessionHandler,
  getMeHandler,
  organizatorOnlyHandler
} from './auth.controller';

const router = Router();

// Public - no auth required
router.post('/auth/login', authLimiter, loginHandler);
router.post('/auth/register', authLimiter, registerHandler);
router.post('/auth/refresh', refreshTokenHandler);
router.post('/auth/logout', logoutHandler);
router.post('/auth/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/auth/reset-password', authLimiter, resetPasswordHandler);

// Protected
router.get('/auth/check', checkJwt, attachAuthUser, checkSessionHandler);
router.get('/auth/me', checkJwt, attachAuthUser, getMeHandler);
router.get('/auth/organizator-only', checkJwt, attachAuthUser, requireRole('organizator'), organizatorOnlyHandler);

export default router;
