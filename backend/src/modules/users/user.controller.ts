import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../core/utils/apiError';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { findOrCreateUserFromToken, getAllUsers, updateUserRole, toggleUserActive } from './user.service';
import { assignRealmRole, removeRealmRole } from '../auth/auth.controller';
import { env } from '../../config/env';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await findOrCreateUserFromToken({
    keycloakId: req.authUser.sub,
    email: req.authUser.email || '',
    firstName: req.authUser.firstName || 'User',
    lastName: req.authUser.lastName || '',
    username: req.authUser.username || req.authUser.email || 'user',
    role: req.authUser.realmRoles?.includes('admin') ? 'admin' : req.authUser.realmRoles?.includes('organizator') ? 'organizator' : 'voter',
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  res.json(new ApiResponse('User profile retrieved', user));
});

export const getAllUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await getAllUsers(page, limit);
  res.json(new ApiResponse('Users retrieved', result));
});

export const updateUserRoleHandler = asyncHandler(async (req: Request, res: Response) => {
  const { role } = z.object({ role: z.enum(['admin', 'organizator', 'voter']) }).parse(req.body);
  const keycloakId = req.params.keycloakId as string;

  // Sync role in Keycloak
  const KEYCLOAK_BASE = env.keycloakIssuerBaseUrl;
  const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', env.keycloakClientId);
  if (env.keycloakClientSecret) {
    params.append('client_secret', env.keycloakClientSecret);
  }
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const tokenData: any = await tokenRes.json();
  if (!tokenRes.ok) throw new ApiError(500, 'Failed to obtain organizator token');
  const organizatorToken = tokenData.access_token;

  const allRoles = ['admin', 'organizator', 'voter'] as const;
  for (const r of allRoles) {
    if (r !== role) await removeRealmRole(organizatorToken, keycloakId, r);
  }
  await assignRealmRole(organizatorToken, keycloakId, role);

  const user = await updateUserRole(keycloakId, role);
  res.json(new ApiResponse('User role updated', user));
});

export const toggleUserActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await toggleUserActive(req.params.keycloakId as string);
  res.json(new ApiResponse(`User ${user.isActive ? 'activated' : 'deactivated'}`, user));
});
