import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  createElectionHandler,
  getPublicElectionsHandler,
  getAllElectionsHandler,
  getElectionByIdHandler,
  updateElectionHandler,
  deleteElectionHandler,
  changeStatusHandler,
  getEligibleElectionsHandler,
  getElectionDetailHandler
} from './election.controller';

const router = Router();

// Public
router.get('/elections/public', getPublicElectionsHandler);

// Voter (authenticated)
router.get('/elections', checkJwt, attachAuthUser, getEligibleElectionsHandler);
router.get('/elections/:id', checkJwt, attachAuthUser, getElectionDetailHandler);

// Admin
router.post('/admin/elections', checkJwt, attachAuthUser, requireRole('admin'), createElectionHandler);
router.get('/admin/elections', checkJwt, attachAuthUser, requireRole('admin'), getAllElectionsHandler);
router.get('/admin/elections/:id', checkJwt, attachAuthUser, requireRole('admin'), getElectionByIdHandler);
router.put('/admin/elections/:id', checkJwt, attachAuthUser, requireRole('admin'), updateElectionHandler);
router.delete('/admin/elections/:id', checkJwt, attachAuthUser, requireRole('admin'), deleteElectionHandler);
router.patch('/admin/elections/:id/status', checkJwt, attachAuthUser, requireRole('admin'), changeStatusHandler);

export default router;
