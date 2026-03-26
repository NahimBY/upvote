import { Request, Response } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse } from '../../core/utils/apiResponse';

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    new ApiResponse('Authenticated user retrieved', {
      sub: req.authUser?.sub,
      email: req.authUser?.email,
      username: req.authUser?.username,
      firstName: req.authUser?.firstName,
      lastName: req.authUser?.lastName,
      roles: req.authUser?.realmRoles || []
    })
  );
});

export const checkSessionHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse('Session is valid'));
});

export const adminOnlyHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse('Admin access granted'));
});