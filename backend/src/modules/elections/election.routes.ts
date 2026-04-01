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
  getElectionDetailHandler,
  getDashboardStatsHandler
} from './election.controller';

const router = Router();

// Public
router.get('/elections/public', getPublicElectionsHandler);

// Voter (authenticated)
router.get('/elections', checkJwt, attachAuthUser, getEligibleElectionsHandler);
router.get('/elections/:id', checkJwt, attachAuthUser, getElectionDetailHandler);

// Organizator
router.get('/organizator/dashboard', checkJwt, attachAuthUser, requireRole('organizator'), getDashboardStatsHandler);
router.post('/organizator/elections', checkJwt, attachAuthUser, requireRole('organizator'), createElectionHandler);
router.get('/organizator/elections', checkJwt, attachAuthUser, requireRole('organizator'), getAllElectionsHandler);
router.get('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), getElectionByIdHandler);
router.put('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), updateElectionHandler);
router.delete('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), deleteElectionHandler);
router.patch('/organizator/elections/:id/status', checkJwt, attachAuthUser, requireRole('organizator'), changeStatusHandler);

export default router;
