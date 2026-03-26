import { Schema, model } from 'mongoose';
import { IElection } from './election.types';

const electionSchema = new Schema<IElection>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    options: [
      {
        _id: false,
        id: { type: String, required: true },
        label: { type: String, required: true, trim: true },
        description: { type: String, trim: true }
      }
    ],
    type: {
      type: String,
      enum: ['single_choice', 'multiple_choice', 'yes_no'],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'open', 'closed', 'archived'],
      default: 'draft'
    },
    visibilityRules: {
      locations: {
        country: { type: [String], default: [] },
        state: { type: [String], default: [] },
        city: { type: [String], default: [] },
        district: { type: [String], default: [] }
      },
      requiredTags: { type: [String], default: [] }
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    createdByKeycloakId: {
      type: String,
      required: true
    },
    allowResultsBeforeClose: {
      type: Boolean,
      default: false
    },
    maxSelections: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

export const ElectionModel = model<IElection>('Election', electionSchema);