import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../core/utils/apiError';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { createVote, getElectionResults, getVotesByVoter, verifyReceipt } from './vote.service';

const voteSchema = z.object({
  electionId: z.string().min(1),
  selectedOptionIds: z.array(z.string().min(1)).min(1)
});

export const createVoteHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');

  const parsed = voteSchema.parse(req.body);

  const vote = await createVote({
    electionId: parsed.electionId,
    voterKeycloakId: req.authUser.sub,
    selectedOptionIds: parsed.selectedOptionIds,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json(new ApiResponse('Vote submitted', vote));
});

export const getResultsHandler = asyncHandler(async (req: Request, res: Response) => {
  const results = await getElectionResults(req.params.electionId as string);
  res.json(new ApiResponse('Election results retrieved', results));
});

export const getMyVotesHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const votes = await getVotesByVoter(req.authUser.sub);
  res.json(new ApiResponse('Your votes retrieved', votes));
});

export const verifyReceiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const result = await verifyReceipt(req.params.receiptCode as string, req.authUser.sub);
  res.json(new ApiResponse('Receipt verified', result));
});
