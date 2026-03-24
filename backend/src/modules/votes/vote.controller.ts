import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../core/utils/apiError';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { createVote } from './vote.service';

const voteSchema = z.object({
  electionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()).default([])
});

export const createVoteHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) {
    throw new ApiError(401, 'Unauthorized');
  }

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