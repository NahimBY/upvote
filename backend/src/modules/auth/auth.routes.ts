import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

router.get('/me', checkJwt, attachAuthUser, (req, res) => {
  res.json({
    success: true,
    message: 'Authenticated user',
    data: req.authUser
  });
});

router.get('/admin-only', checkJwt, attachAuthUser, requireRole('admin'), (_req, res) => {
  res.json({
    success: true,
    message: 'Admin access granted'
  });
});

router.get('/voter-only', checkJwt, attachAuthUser, requireRole('voter', 'admin'), (_req, res) => {
  res.json({
    success: true,
    message: 'Voter access granted'
  });
});

export default router;