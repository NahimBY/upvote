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
  getElectionDetailForVoter,
  getOrganizatorStatsOverview,
  getOrganizatorVotesTimeline,
  getOrganizatorUpcomingElections,
  getElectionParticipation,
  getElectionDistribution
} from './election.service';
import { findOrCreateUserFromToken } from '../users/user.service';
import { ElectionModel } from './election.model';
import { VoteModel } from '../votes/vote.model';
import { UserModel } from '../users/user.model';
import { getIO } from '../../core/socket';

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

// --- Organizator handlers ---

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

  const io = getIO();
  if (io) io.to('admin_elections').emit('elections_updated');
});

export const getAllElectionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const elections = await getAllElections(req.authUser.sub);
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

  const io = getIO();
  if (io) io.to('admin_elections').emit('elections_updated', election);
});

export const deleteElectionHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteElection(req.params.id as string);
  res.json(new ApiResponse('Election deleted'));

  const io = getIO();
  if (io) io.to('admin_elections').emit('elections_updated');
});

export const changeStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({
    status: z.enum(['published', 'open', 'closed', 'archived'])
  }).parse(req.body);

  const election = await changeElectionStatus(req.params.id as string, status);
  res.json(new ApiResponse('Election status updated', election));

  const io = getIO();
  if (io) io.to('admin_elections').emit('elections_updated', election);
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
    role: req.authUser.realmRoles?.includes('admin') ? 'admin' : req.authUser.realmRoles?.includes('organizator') ? 'organizator' : 'voter',
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

export const getDashboardStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const organizatorId = req.authUser?.sub;
  if (!organizatorId) throw new ApiError(401, 'Unauthorized');

  const organizatorElections = await ElectionModel.find({ createdByKeycloakId: organizatorId }).lean();
  const organizatorElectionIds = organizatorElections.map(e => e._id.toString());
  const organizatorElectionMap = new Map(organizatorElections.map(e => [e._id.toString(), e.title]));

  const [totalVotes, activeRooms, recentVotes, recentElections] = await Promise.all([
    VoteModel.countDocuments({ electionId: { $in: organizatorElectionIds } }),
    ElectionModel.countDocuments({ createdByKeycloakId: organizatorId, status: { $in: ['open', 'published'] } }),
    VoteModel.find({ electionId: { $in: organizatorElectionIds } }).sort({ submittedAt: -1 }).limit(5).lean(),
    ElectionModel.find({ createdByKeycloakId: organizatorId }).sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const recentVotesMapped = recentVotes.map(v => ({
    user: 'Un elector',
    action: 'votó en',
    room: organizatorElectionMap.get(v.electionId) || 'una elección',
    time: v.submittedAt
  }));

  const recentElectionsMapped = recentElections.map((e: any) => ({
    user: 'Tú',
    action: 'creaste la sala',
    room: e.title,
    time: e.createdAt || new Date()
  }));

  const allActivity = [...recentVotesMapped, ...recentElectionsMapped]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)
    .map(act => {
      const diffMs = new Date().getTime() - new Date(act.time).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeStr = 'Hace un momento';
      if (diffDays > 0) timeStr = `Hace ${diffDays} d`;
      else if (diffHours > 0) timeStr = `Hace ${diffHours} h`;
      else if (diffMins > 0) timeStr = `Hace ${diffMins} min`;

      return {
        user: act.user,
        action: act.action,
        room: act.room,
        time: timeStr
      };
    });

  res.json(new ApiResponse('Dashboard stats retrieved', {
    stats: {
      totalVotes,
      activeRooms
    },
    recentActivity: allActivity
  }));
});

// --- Organizator stats handlers ---

export const getStatsOverviewHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const overview = await getOrganizatorStatsOverview(req.authUser.sub);
  res.json(new ApiResponse('Stats overview retrieved', overview));
});

export const getVotesTimelineHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const days = Math.min(90, Math.max(1, parseInt((req.query.days as string) || '7', 10) || 7));
  const timeline = await getOrganizatorVotesTimeline(req.authUser.sub, days);
  res.json(new ApiResponse('Votes timeline retrieved', { days, timeline }));
});

export const getUpcomingElectionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const upcoming = await getOrganizatorUpcomingElections(req.authUser.sub);
  res.json(new ApiResponse('Upcoming elections retrieved', upcoming));
});

export const getElectionParticipationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const data = await getElectionParticipation(req.params.id as string, req.authUser.sub);
  res.json(new ApiResponse('Participation retrieved', data));
});

export const getElectionDistributionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) throw new ApiError(401, 'Unauthorized');
  const data = await getElectionDistribution(req.params.id as string, req.authUser.sub);
  res.json(new ApiResponse('Distribution retrieved', data));
});
