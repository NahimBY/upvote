import crypto from 'crypto';
import { ElectionModel } from './election.model';
import { VoteModel } from '../votes/vote.model';
import { IElection, ElectionStatus } from './election.types';
import { ApiError } from '../../core/utils/apiError';
import { IUser } from '../users/user.types';

const ALLOWED_TRANSITIONS: Record<ElectionStatus, ElectionStatus | null> = {
  draft: 'published',
  published: 'open',
  open: 'closed',
  closed: 'archived',
  archived: null
};

function isUserEligible(
  election: IElection,
  user: { location: IUser['location']; eligibilityTags: string[] }
): boolean {
  if (election.isLocationRestricted) {
    const locs = election.visibilityRules?.locations;
    if (locs) {
      if (locs.country?.length && !locs.country.includes(user.location?.country || '')) return false;
      if (locs.state?.length && !locs.state.includes(user.location?.state || '')) return false;
      if (locs.city?.length && !locs.city.includes(user.location?.city || '')) return false;
      if (locs.district?.length && !locs.district.includes(user.location?.district || '')) return false;
    }
  }
  const tags = election.visibilityRules?.requiredTags;
  if (tags?.length) {
    const hasTag = tags.some((t) => user.eligibilityTags.includes(t));
    if (!hasTag) return false;
  }
  return true;
}

export async function createElection(data: Omit<IElection, 'options'> & { options: { label: string; description?: string }[] }) {
  const options = data.options.map((opt) => ({
    id: crypto.randomUUID(),
    label: opt.label,
    description: opt.description
  }));
  return ElectionModel.create({ ...data, options });
}

export async function getOpenElections() {
  return ElectionModel.find({ status: { $in: ['published', 'open'] } }).sort({ createdAt: -1 });
}

export async function getElectionById(id: string) {
  return ElectionModel.findById(id);
}

export async function getAllElections(organizatorId?: string) {
  const query = organizatorId ? { createdByKeycloakId: organizatorId } : {};
  return ElectionModel.find(query).sort({ createdAt: -1 });
}

export async function updateElection(id: string, data: Partial<IElection>) {
  const election = await ElectionModel.findById(id);
  if (!election) throw new ApiError(404, 'Election not found');
  if (election.status !== 'draft') throw new ApiError(400, 'Can only edit elections in draft status');

  if (data.options) {
    data.options = data.options.map((opt) => ({
      id: opt.id || crypto.randomUUID(),
      label: opt.label,
      description: opt.description
    }));
  }

  return ElectionModel.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteElection(id: string) {
  const election = await ElectionModel.findById(id);
  if (!election) throw new ApiError(404, 'Election not found');
  // if (election.status !== 'draft') throw new ApiError(400, 'Can only delete elections in draft status');
  return ElectionModel.findByIdAndDelete(id);
}

export async function changeElectionStatus(id: string, newStatus: ElectionStatus) {
  const election = await ElectionModel.findById(id);
  if (!election) throw new ApiError(404, 'Election not found');

  const allowed = ALLOWED_TRANSITIONS[election.status as ElectionStatus];
  if (allowed !== newStatus) {
    throw new ApiError(400, `Cannot transition from '${election.status}' to '${newStatus}'`);
  }

  election.status = newStatus;
  return election.save();
}

export async function getEligibleElections(user: { location: IUser['location']; eligibilityTags: string[] }) {
  const elections = await ElectionModel.find({ status: { $in: ['published', 'open', 'closed'] } }).sort({ createdAt: -1 });
  return elections.filter((e) => isUserEligible(e.toObject() as IElection, user));
}

export async function getElectionDetailForVoter(id: string) {
  const election = await ElectionModel.findById(id);
  if (!election) throw new ApiError(404, 'Election not found');
  if (!['published', 'open', 'closed'].includes(election.status)) {
    throw new ApiError(404, 'Election not found');
  }
  return election;
}

export async function closeExpiredElections(): Promise<number> {
  const result = await ElectionModel.updateMany(
    { status: 'open', endDate: { $lte: new Date() } },
    { status: 'closed' }
  );
  return result.modifiedCount;
}

export async function openScheduledElections(): Promise<number> {
  const result = await ElectionModel.updateMany(
    { status: 'published', startDate: { $lte: new Date() } },
    { status: 'open' }
  );
  return result.modifiedCount;
}

export async function closeElectionIfMaxVotesReached(electionId: string): Promise<boolean> {
  const election = await ElectionModel.findById(electionId);
  if (!election || election.status !== 'open' || !election.maxVotes) return false;

  const { VoteModel } = await import('../votes/vote.model');
  const voteCount = await VoteModel.countDocuments({ electionId });

  if (voteCount >= election.maxVotes) {
    election.status = 'closed';
    await election.save();
    return true;
  }
  return false;
}

export { isUserEligible };

// --- Organizator statistics ---

export async function getOrganizatorStatsOverview(organizatorId: string) {
  const elections = await ElectionModel.find({ createdByKeycloakId: organizatorId }).lean();
  const electionIds = elections.map((e) => e._id.toString());

  const byStatus: Record<ElectionStatus, number> = {
    draft: 0,
    published: 0,
    open: 0,
    closed: 0,
    archived: 0
  };
  for (const e of elections) {
    byStatus[e.status as ElectionStatus] = (byStatus[e.status as ElectionStatus] || 0) + 1;
  }

  const totalVotes = electionIds.length
    ? await VoteModel.countDocuments({ electionId: { $in: electionIds } })
    : 0;

  const finishedElections = elections.filter((e) => ['open', 'closed', 'archived'].includes(e.status));
  let averageParticipation = 0;
  if (finishedElections.length) {
    const perElection = await Promise.all(
      finishedElections.map(async (e) => {
        if (!e.maxVotes) return null;
        const count = await VoteModel.countDocuments({ electionId: e._id.toString() });
        return Math.min(100, (count / e.maxVotes) * 100);
      })
    );
    const valid = perElection.filter((n): n is number => n !== null);
    if (valid.length) averageParticipation = valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  return {
    totalElections: elections.length,
    totalVotes,
    activeElections: byStatus.open + byStatus.published,
    draftElections: byStatus.draft,
    closedElections: byStatus.closed,
    archivedElections: byStatus.archived,
    averageParticipation: Math.round(averageParticipation * 10) / 10,
    byStatus
  };
}

export async function getOrganizatorVotesTimeline(organizatorId: string, days: number) {
  const elections = await ElectionModel.find({ createdByKeycloakId: organizatorId }, { _id: 1 }).lean();
  const electionIds = elections.map((e) => e._id.toString());

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const buckets: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  if (!electionIds.length) return buckets;

  const votes = await VoteModel.find(
    { electionId: { $in: electionIds }, submittedAt: { $gte: since } },
    { submittedAt: 1 }
  ).lean();

  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const v of votes) {
    const key = new Date(v.submittedAt).toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i !== undefined) buckets[i]!.count += 1;
  }
  return buckets;
}

export async function getOrganizatorUpcomingElections(organizatorId: string) {
  return ElectionModel.find({
    createdByKeycloakId: organizatorId,
    status: { $in: ['draft', 'published'] },
    startDate: { $gte: new Date() }
  })
    .sort({ startDate: 1 })
    .limit(10)
    .lean();
}

export async function getElectionParticipation(electionId: string, organizatorId: string) {
  const election = await ElectionModel.findById(electionId).lean();
  if (!election) throw new ApiError(404, 'Election not found');
  if (election.createdByKeycloakId !== organizatorId) throw new ApiError(403, 'Forbidden');

  const totalVotes = await VoteModel.countDocuments({ electionId });
  const totalVoters = election.maxVotes ?? 0;
  const participation = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 1000) / 10 : 0;

  return {
    electionId,
    totalVotes,
    totalVoters,
    participation,
    status: election.status,
    startDate: election.startDate,
    endDate: election.endDate
  };
}

export async function getElectionDistribution(electionId: string, organizatorId: string) {
  const election = await ElectionModel.findById(electionId).lean();
  if (!election) throw new ApiError(404, 'Election not found');
  if (election.createdByKeycloakId !== organizatorId) throw new ApiError(403, 'Forbidden');

  const votes = await VoteModel.find({ electionId }, { selectedOptionIds: 1 }).lean();
  const counts: Record<string, number> = {};
  for (const opt of election.options) counts[opt.id] = 0;
  for (const v of votes) {
    for (const id of v.selectedOptionIds) {
      if (counts[id] !== undefined) counts[id] += 1;
    }
  }
  const totalSelections = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    electionId,
    totalVotes: votes.length,
    options: election.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      votes: counts[opt.id] || 0,
      percentage:
        totalSelections > 0
          ? Math.round(((counts[opt.id] || 0) / totalSelections) * 1000) / 10
          : 0
    }))
  };
}
