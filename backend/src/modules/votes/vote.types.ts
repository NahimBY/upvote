export interface IVote {
    electionId: string;
    voterKeycloakId: string;
    selectedOptionIds: string[];
    submittedAt: Date;
    receiptCode: string;
    metadata?: {
      ip?: string;
      userAgent?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }