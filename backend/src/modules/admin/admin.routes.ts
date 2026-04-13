import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  getAllUsersHandler,
  updateUserRoleHandler,
  toggleUserActiveHandler,
  createUserHandler,
  getUserStatsHandler
} from './admin.controller';

const router = Router();

const adminAuth = [checkJwt, attachAuthUser, requireRole('admin')] as const;

// Dashboard stats
router.get('/admin/stats', ...adminAuth, getUserStatsHandler);

// User management
router.get('/admin/users', ...adminAuth, getAllUsersHandler);
router.post('/admin/users', ...adminAuth, createUserHandler);
router.patch('/admin/users/:keycloakId/role', ...adminAuth, updateUserRoleHandler);
router.patch('/admin/users/:keycloakId/active', ...adminAuth, toggleUserActiveHandler);

export default router;
