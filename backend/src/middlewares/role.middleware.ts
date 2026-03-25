import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../core/utils/apiError';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles = req.authUser?.realmRoles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new ApiError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
}