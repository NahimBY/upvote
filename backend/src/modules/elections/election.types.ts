export type ElectionType = 'single_choice' | 'multiple_choice' | 'yes_no';
export type ElectionStatus = 'draft' | 'published' | 'open' | 'closed' | 'archived';

export interface IElectionOption {
  id: string;
  label: string;
  description?: string;
}

export interface IElection {
  title: string;
  description?: string;
  type: ElectionType;
  status: ElectionStatus;
  options: IElectionOption[];
  isLocationRestricted: boolean;
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
  maxVotes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}