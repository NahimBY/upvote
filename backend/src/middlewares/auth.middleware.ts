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
  // express-oauth2-jwt-bearer typically attaches the token payload on `req.auth.payload`
  const authPayload = (req as any).auth?.payload as KeycloakAuthPayload | undefined;

  req.authUser = {
    sub: authPayload?.sub || '',
    email: authPayload?.email,
    username: authPayload?.preferred_username,
    firstName: authPayload?.given_name,
    lastName: authPayload?.family_name,
    realmRoles: authPayload?.realm_access?.roles || []
  };

  next();
}