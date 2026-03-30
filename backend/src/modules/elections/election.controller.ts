import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiError } from '../../core/utils/apiError';
import {
  createElection,
  getOpenElections,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  changeElectionStatus,
  getEligibleElections,
  getElectionDetailForVoter
} from './election.service';
import { findOrCreateUserFromToken } from '../users/user.service';

const optionSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional()
});

const createElectionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'yes_no']),
  options: z.array(optionSchema).optional(),
  startDate: z.string(),
  endDate: z.string(),
  allowResultsBeforeClose: z.boolean().optional(),
  maxSelections: z.number().int().positive().optional(),
  maxVotes: z.number().int().positive().nullable().optional(),
  isLocationRestricted: z.boolean().optional(),
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

const updateElectionSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  options: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(1),
    description: z.string().optional()
  })).min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  allowResultsBeforeClose: z.boolean().optional(),
  maxSelections: z.number().int().positive().optional(),
  maxVotes: z.number().int().positive().nullable().optional(),
  isLocationRestricted: z.boolean().optional(),
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

// --- Admin handlers ---

export const createElectionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');

  const parsed = createElectionSchema.parse(req.body);

  let options = parsed.options || [];
  if (parsed.type === 'yes_no') {
    options = [{ label: 'Sí' }, { label: 'No' }];
  } else if (options.length === 0) {
    throw new ApiError(400, 'Options are required for this election type');
  }

  const election = await createElection({
    title: parsed.title,
    description: parsed.description,
    type: parsed.type,
    status: 'draft',
    startDate: new Date(parsed.startDate),
    endDate: new Date(parsed.endDate),
    createdByKeycloakId: req.authUser.sub,
    allowResultsBeforeClose: parsed.allowResultsBeforeClose ?? false,
    maxSelections: parsed.type === 'single_choice' || parsed.type === 'yes_no' ? 1 : (parsed.maxSelections ?? 1),
    maxVotes: parsed.maxVotes ?? undefined,
    isLocationRestricted: parsed.isLocationRestricted ?? false,
    visibilityRules: parsed.visibilityRules ?? {},
    options
  });

  res.status(201).json(new ApiResponse('Election created', election));
});

export const getAllElectionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const elections = await getAllElections();
  res.json(new ApiResponse('All elections retrieved', elections));
});

export const getElectionByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const election = await getElectionById(req.params.id as string);
  if (!election) throw new ApiError(404, 'Election not found');
  res.json(new ApiResponse('Election retrieved', election));
});

export const updateElectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateElectionSchema.parse(req.body);

  const updateData: Record<string, unknown> = { ...parsed };
  if (parsed.startDate) updateData.startDate = new Date(parsed.startDate);
  if (parsed.endDate) updateData.endDate = new Date(parsed.endDate);

  const election = await updateElection(req.params.id as string, updateData as any);
  res.json(new ApiResponse('Election updated', election));
});

export const deleteElectionHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteElection(req.params.id as string);
  res.json(new ApiResponse('Election deleted'));
});

export const changeStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({
    status: z.enum(['published', 'open', 'closed', 'archived'])
  }).parse(req.body);

  const election = await changeElectionStatus(req.params.id as string, status);
  res.json(new ApiResponse('Election status updated', election));
});

// --- Public handler ---

export const getPublicElectionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const elections = await getOpenElections();
  res.json(new ApiResponse('Elections retrieved', elections));
});

// --- Voter handlers ---

export const getEligibleElectionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');

  const user = await findOrCreateUserFromToken({
    keycloakId: req.authUser.sub,
    email: req.authUser.email || '',
    firstName: req.authUser.firstName || 'User',
    lastName: req.authUser.lastName || '',
    username: req.authUser.username || req.authUser.email || 'user',
    role: req.authUser.realmRoles?.includes('admin') ? 'admin' : 'voter',
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  const elections = await getEligibleElections({
    location: user.location || {},
    eligibilityTags: user.eligibilityTags || []
  });
  res.json(new ApiResponse('Eligible elections retrieved', elections));
});

export const getElectionDetailHandler = asyncHandler(async (req: Request, res: Response) => {
  const election = await getElectionDetailForVoter(req.params.id as string);
  res.json(new ApiResponse('Election detail retrieved', election));
});
