import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import userRoutes from '../modules/users/user.routes';
import electionRoutes from '../modules/elections/election.routes';
import voteRoutes from '../modules/votes/vote.routes';

const router = Router();

router.use(healthRoutes);
router.use('/api', userRoutes);
router.use('/api', electionRoutes);
router.use('/api', voteRoutes);

export default router;