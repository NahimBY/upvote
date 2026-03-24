import { Schema, model } from 'mongoose';
import { IVote } from './vote.types';

const voteSchema = new Schema<IVote>(
  {
    electionId: {
      type: String,
      required: true,
      index: true
    },
    voterKeycloakId: {
      type: String,
      required: true,
      index: true
    },
    selectedOptionIds: {
      type: [String],
      default: []
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    receiptCode: {
      type: String,
      required: true
    },
    metadata: {
      ip: { type: String },
      userAgent: { type: String }
    }
  },
  {
    timestamps: true
  }
);

voteSchema.index({ electionId: 1, voterKeycloakId: 1 }, { unique: true });

export const VoteModel = model<IVote>('Vote', voteSchema);