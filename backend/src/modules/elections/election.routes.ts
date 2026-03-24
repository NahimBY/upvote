import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  createElectionHandler,
  getPublicElectionsHandler
} from './election.controller';

const router = Router();

router.get('/elections/public', getPublicElectionsHandler);
router.post('/admin/elections', checkJwt, attachAuthUser, requireRole('admin'), createElectionHandler);

export default router;