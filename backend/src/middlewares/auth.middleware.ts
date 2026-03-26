import { NextFunction, Request, Response } from 'express';

type KeycloakAuthPayload = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
};

export function attachAuthUser(req: Request, _res: Response, next: NextFunction): void {
  const auth = (req as Request & { auth?: KeycloakAuthPayload }).auth;

  req.authUser = {
    sub: auth?.sub || '',
    email: auth?.email,
    username: auth?.preferred_username,
    firstName: auth?.given_name,
    lastName: auth?.family_name,
    realmRoles: auth?.realm_access?.roles || []
  };

  next();
}