import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { createElection, getOpenElections } from './election.service';
import { ApiError } from '../../core/utils/apiError';

const createElectionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'yes_no']),
  startDate: z.string(),
  endDate: z.string(),
  allowResultsBeforeClose: z.boolean().optional(),
  maxSelections: z.number().int().positive().optional(),
  visibilityRules: z
    .object({
      locations: z
        .object({
          country: z.array(z.string()).optional(),
          state: z.array(z.string()).optional(),
          city: z.array(z.string()).optional(),
          district: z.array(z.string()).optional()
        })
        .optional(),
      requiredTags: z.array(z.string()).optional()
    })
    .optional()
});

export const createElectionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) {
    throw new ApiError(401, 'Unauthorized');
  }

  const parsed = createElectionSchema.parse(req.body);

  const election = await createElection({
    title: parsed.title,
    description: parsed.description,
    type: parsed.type,
    status: 'draft',
    startDate: new Date(parsed.startDate),
    endDate: new Date(parsed.endDate),
    createdByKeycloakId: req.authUser.sub,
    allowResultsBeforeClose: parsed.allowResultsBeforeClose ?? false,
    maxSelections: parsed.maxSelections ?? 1,
    visibilityRules: parsed.visibilityRules ?? {}
  });

  res.status(201).json(new ApiResponse('Election created', election));
});

export const getPublicElectionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const elections = await getOpenElections();
  res.json(new ApiResponse('Elections retrieved', elections));
});