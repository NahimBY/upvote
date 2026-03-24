import crypto from 'crypto';
import { VoteModel } from './vote.model';

export async function createVote(data: {
  electionId: string;
  voterKeycloakId: string;
  selectedOptionIds: string[];
  ip?: string;
  userAgent?: string;
}) {
  return VoteModel.create({
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
}