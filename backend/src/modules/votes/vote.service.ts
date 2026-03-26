import crypto from 'crypto';
import mongoose from 'mongoose';
import { VoteModel } from './vote.model';
import { ElectionModel } from '../elections/election.model';
import { UserModel } from '../users/user.model';
import { ApiError } from '../../core/utils/apiError';
import { isUserEligible } from '../elections/election.service';
import { IElection } from '../elections/election.types';

export async function createVote(data: {
  electionId: string;
  voterKeycloakId: string;
  selectedOptionIds: string[];
  ip?: string;
  userAgent?: string;
}) {
  // 1. Find election
  const election = await ElectionModel.findById(data.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  // 2. Check status
  if (election.status !== 'open') {
    throw new ApiError(400, 'Election is not open for voting');
  }

  // 3. Check dates
  const now = new Date();
  if (now < election.startDate || now > election.endDate) {
    throw new ApiError(400, 'Election is not within its voting period');
  }

  // 4. Validate option IDs
  const validIds = new Set(election.options.map((o) => o.id));
  for (const optId of data.selectedOptionIds) {
    if (!validIds.has(optId)) {
      throw new ApiError(400, `Invalid option selected: ${optId}`);
    }
  }

  // 5. Check selection count
  if (data.selectedOptionIds.length < 1) {
    throw new ApiError(400, 'Must select at least one option');
  }
  if (data.selectedOptionIds.length > (election.maxSelections || 1)) {
    throw new ApiError(400, `Too many options selected. Maximum: ${election.maxSelections || 1}`);
  }

  // 6. Check user eligibility
  const user = await UserModel.findOne({ keycloakId: data.voterKeycloakId });
  if (!user || !user.isActive) {
    throw new ApiError(403, 'User account is inactive or not found');
  }
  if (!isUserEligible(election.toObject() as IElection, {
    location: user.location || {},
    eligibilityTags: user.eligibilityTags || []
  })) {
    throw new ApiError(403, 'Not eligible for this election');
  }

  // 7. Create vote (unique index handles duplicate detection)
  try {
    return await VoteModel.create({
      electionId: data.electionId,
      voterKeycloakId: data.voterKeycloakId,
      selectedOptionIds: data.selectedOptionIds,
      submittedAt: new Date(),
      receiptCode: crypto.randomUUID(),
      metadata: {
        ip: data.ip,
        userAgent: data.userAgent
      }
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already voted in this election');
    }
    throw err;
  }
}

export async function getElectionResults(electionId: string) {
  const election = await ElectionModel.findById(electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (['draft', 'published'].includes(election.status)) {
    throw new ApiError(400, 'Election has not started yet');
  }

  if (election.status === 'open' && !election.allowResultsBeforeClose) {
    throw new ApiError(403, 'Results not available until election closes');
  }

  const pipeline = [
    { $match: { electionId: electionId } },
    { $unwind: '$selectedOptionIds' },
    { $group: { _id: '$selectedOptionIds', count: { $sum: 1 } } }
  ];

  const counts = await VoteModel.aggregate(pipeline);
  const totalVotes = await VoteModel.countDocuments({ electionId });

  const results = election.options.map((opt) => {
    const match = counts.find((c) => c._id === opt.id);
    return {
      optionId: opt.id,
      label: opt.label,
      description: opt.description,
      count: match?.count || 0
    };
  });

  return { election: { _id: election._id, title: election.title, status: election.status }, totalVotes, results };
}

export async function getVotesByVoter(voterKeycloakId: string) {
  const votes = await VoteModel.find({ voterKeycloakId }).sort({ submittedAt: -1 }).lean();

  const electionIds = [...new Set(votes.map((v) => v.electionId))];
  const elections = await ElectionModel.find({ _id: { $in: electionIds } }).lean();
  const electionMap = new Map(elections.map((e) => [e._id.toString(), e]));

  return votes.map((v) => ({
    ...v,
    election: electionMap.get(v.electionId) ? {
      _id: electionMap.get(v.electionId)!._id,
      title: electionMap.get(v.electionId)!.title,
      status: electionMap.get(v.electionId)!.status
    } : null
  }));
}

export async function verifyReceipt(receiptCode: string, voterKeycloakId: string) {
  const vote = await VoteModel.findOne({ receiptCode, voterKeycloakId }).lean();
  if (!vote) throw new ApiError(404, 'Receipt not found');

  const election = await ElectionModel.findById(vote.electionId).lean();
  return {
    ...vote,
    election: election ? { _id: election._id, title: election.title, status: election.status } : null
  };
}
