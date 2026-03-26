import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../core/utils/apiError';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { findOrCreateUserFromToken, getAllUsers, updateUserRole, toggleUserActive } from './user.service';

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
    role: req.authUser.realmRoles?.includes('admin') ? 'admin' : 'voter',
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
  const { role } = z.object({ role: z.enum(['admin', 'voter']) }).parse(req.body);
  const user = await updateUserRole(req.params.keycloakId as string, role);
  res.json(new ApiResponse('User role updated', user));
});

export const toggleUserActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await toggleUserActive(req.params.keycloakId as string);
  res.json(new ApiResponse(`User ${user.isActive ? 'activated' : 'deactivated'}`, user));
});
