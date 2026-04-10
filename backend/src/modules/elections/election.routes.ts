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
  getDashboardStatsHandler,
  getStatsOverviewHandler,
  getVotesTimelineHandler,
  getUpcomingElectionsHandler,
  getElectionParticipationHandler,
  getElectionDistributionHandler
} from './election.controller';

const router = Router();

// Public
router.get('/elections/public', getPublicElectionsHandler);

// Voter (authenticated)
router.get('/elections', checkJwt, attachAuthUser, getEligibleElectionsHandler);
router.get('/elections/:id', checkJwt, attachAuthUser, getElectionDetailHandler);

// Organizator
router.get('/organizator/dashboard', checkJwt, attachAuthUser, requireRole('organizator'), getDashboardStatsHandler);
router.get('/organizator/stats/overview', checkJwt, attachAuthUser, requireRole('organizator'), getStatsOverviewHandler);
router.get('/organizator/stats/votes-timeline', checkJwt, attachAuthUser, requireRole('organizator'), getVotesTimelineHandler);
router.get('/organizator/elections/upcoming', checkJwt, attachAuthUser, requireRole('organizator'), getUpcomingElectionsHandler);
router.post('/organizator/elections', checkJwt, attachAuthUser, requireRole('organizator'), createElectionHandler);
router.get('/organizator/elections', checkJwt, attachAuthUser, requireRole('organizator'), getAllElectionsHandler);
router.get('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), getElectionByIdHandler);
router.get('/organizator/elections/:id/participation', checkJwt, attachAuthUser, requireRole('organizator'), getElectionParticipationHandler);
router.get('/organizator/elections/:id/distribution', checkJwt, attachAuthUser, requireRole('organizator'), getElectionDistributionHandler);
router.put('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), updateElectionHandler);
router.delete('/organizator/elections/:id', checkJwt, attachAuthUser, requireRole('organizator'), deleteElectionHandler);
router.patch('/organizator/elections/:id/status', checkJwt, attachAuthUser, requireRole('organizator'), changeStatusHandler);

export default router;
