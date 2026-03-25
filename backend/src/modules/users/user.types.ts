export type UserRole = 'admin' | 'voter';

export interface IUser {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  location: {
    country?: string;
    state?: string;
    city?: string;
    district?: string;
  };
  eligibilityTags: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}