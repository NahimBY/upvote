import 'express';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        sub: string;
        email?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        realmRoles: string[];
      };
    }
  }
}

export {};