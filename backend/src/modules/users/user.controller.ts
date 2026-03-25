import { Request, Response } from 'express';
import { ApiError } from '../../core/utils/apiError';
import { ApiResponse } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { findOrCreateUserFromToken } from './user.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser?.sub) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await findOrCreateUserFromToken({
    keycloakId: req.authUser.sub,
    email: req.authUser.email || '',
    firstName: req.authUser.preferred_username || 'User',
    lastName: '',
    username: req.authUser.preferred_username || req.authUser.email || 'user',
    role: req.authUser.realmRoles?.includes('admin') ? 'admin' : 'voter',
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  res.json(new ApiResponse('User profile retrieved', user));
});