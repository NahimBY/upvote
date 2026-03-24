import { NextFunction, Request, Response } from 'express';

type AuthUser = {
  sub: string;
  email?: string;
  preferred_username?: string;
  realmRoles: string[];
};

type KeycloakAuthPayload = {
  sub?: unknown;
  email?: unknown;
  preferred_username?: unknown;
  realm_access?: {
    roles?: unknown;
  };
};

export function attachAuthUser(req: Request, _res: Response, next: NextFunction): void {
  const requestWithAuth = req as Request & { auth?: KeycloakAuthPayload; authUser?: AuthUser };
  const auth = requestWithAuth.auth;

  if (auth) {
    requestWithAuth.authUser = {
      sub: String(auth.sub || ''),
      email: auth.email ? String(auth.email) : undefined,
      preferred_username: auth.preferred_username
        ? String(auth.preferred_username)
        : undefined,
      realmRoles: Array.isArray(auth.realm_access?.roles)
        ? auth.realm_access.roles.map(String)
        : []
    };
  }

  next();
}