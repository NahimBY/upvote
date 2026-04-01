import crypto from 'crypto';
import { ElectionModel } from './election.model';
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

export async function getAllElections() {
  return ElectionModel.find().sort({ createdAt: -1 });
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
  const elections = await ElectionModel.find({ status: { $in: ['published', 'open'] } }).sort({ createdAt: -1 });
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
