import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  loginHandler,
  registerHandler,
  refreshTokenHandler,
  logoutHandler,
  checkSessionHandler,
  getMeHandler,
  adminOnlyHandler
} from './auth.controller';

const router = Router();

// Public - no auth required
router.post('/auth/login', loginHandler);
router.post('/auth/register', registerHandler);
router.post('/auth/refresh', refreshTokenHandler);
router.post('/auth/logout', logoutHandler);

// Protected
router.get('/auth/check', checkJwt, attachAuthUser, checkSessionHandler);
router.get('/auth/me', checkJwt, attachAuthUser, getMeHandler);
router.get('/auth/admin-only', checkJwt, attachAuthUser, requireRole('admin'), adminOnlyHandler);

export default router;
