import { Router } from 'express';
import { checkJwt } from '../../config/keycloak';
import { attachAuthUser } from '../../middlewares/auth.middleware';
import { createVoteHandler, getResultsHandler, getMyVotesHandler, verifyReceiptHandler } from './vote.controller';

const router = Router();

router.post('/votes', checkJwt, attachAuthUser, createVoteHandler);
router.get('/votes/my', checkJwt, attachAuthUser, getMyVotesHandler);
router.get('/votes/receipt/:receiptCode', checkJwt, attachAuthUser, verifyReceiptHandler);
router.get('/elections/:electionId/results', checkJwt, attachAuthUser, getResultsHandler);

export default router;
