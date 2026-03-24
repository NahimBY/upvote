import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { createVoteHandler } from './vote.controller';

const router = Router();

router.post('/votes', checkJwt, attachAuthUser, createVoteHandler);

export default router;