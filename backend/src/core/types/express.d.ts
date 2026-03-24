import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: {
      sub: string;
      email?: string;
      preferred_username?: string;
      realmRoles?: string[];
    };
  }
}

export {};