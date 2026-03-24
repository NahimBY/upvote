import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { getMe } from './user.controller';

const router = Router();

router.get('/me', checkJwt, attachAuthUser, getMe);

export default router;