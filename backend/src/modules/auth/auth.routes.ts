import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  adminOnlyHandler,
  checkSessionHandler,
  getMeHandler
} from './auth.controller';

const router = Router();

router.get('/auth/check', checkJwt, attachAuthUser, checkSessionHandler);
router.get('/auth/me', checkJwt, attachAuthUser, getMeHandler);
router.get(
  '/auth/admin-only',
  checkJwt,
  attachAuthUser,
  requireRole('admin'),
  adminOnlyHandler
);

export default router;