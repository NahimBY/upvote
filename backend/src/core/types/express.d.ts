import 'express';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        sub: string;
        email?: string;
        preferred_username?: string;
        realmRoles?: string[];
      };
    }
  }
}