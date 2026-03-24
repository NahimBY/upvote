export type ElectionType = 'single_choice' | 'multiple_choice' | 'yes_no';
export type ElectionStatus = 'draft' | 'published' | 'open' | 'closed' | 'archived';

export interface IElection {
  title: string;
  description?: string;
  type: ElectionType;
  status: ElectionStatus;
  visibilityRules: {
    locations?: {
      country?: string[];
      state?: string[];
      city?: string[];
      district?: string[];
    };
    requiredTags?: string[];
  };
  startDate: Date;
  endDate: Date;
  createdByKeycloakId: string;
  allowResultsBeforeClose: boolean;
  maxSelections?: number;
  createdAt?: Date;
  updatedAt?: Date;
}