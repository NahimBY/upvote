import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { getMe, getAllUsersHandler, updateUserRoleHandler, toggleUserActiveHandler } from './user.controller';

const router = Router();

// User profile
router.get('/me', checkJwt, attachAuthUser, getMe);

// Admin user management
router.get('/admin/users', checkJwt, attachAuthUser, requireRole('admin'), getAllUsersHandler);
router.patch('/admin/users/:keycloakId/role', checkJwt, attachAuthUser, requireRole('admin'), updateUserRoleHandler);
router.patch('/admin/users/:keycloakId/active', checkJwt, attachAuthUser, requireRole('admin'), toggleUserActiveHandler);

export default router;
