import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { getMe, getAllUsersHandler, updateUserRoleHandler, toggleUserActiveHandler } from './user.controller';

const router = Router();

// User profile
router.get('/me', checkJwt, attachAuthUser, getMe);

// Organizator user management
router.get('/organizator/users', checkJwt, attachAuthUser, requireRole('organizator'), getAllUsersHandler);
router.patch('/organizator/users/:keycloakId/role', checkJwt, attachAuthUser, requireRole('organizator'), updateUserRoleHandler);
router.patch('/organizator/users/:keycloakId/active', checkJwt, attachAuthUser, requireRole('organizator'), toggleUserActiveHandler);

export default router;
