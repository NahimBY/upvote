import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import userRoutes from '../modules/users/user.routes';
import electionRoutes from '../modules/elections/election.routes';
import voteRoutes from '../modules/votes/vote.routes';
import authRoutes from '../modules/auth/auth.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

router.use(healthRoutes);
router.use('/api', userRoutes);
router.use('/api', electionRoutes);
router.use('/api', voteRoutes);
router.use('/api', authRoutes);
router.use('/api', adminRoutes);

export default router;