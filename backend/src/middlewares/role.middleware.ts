import { NextFunction, Request, Response } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.authUser?.realmRoles || [];
    const allowed = roles.some((role) => userRoles.includes(role));

    if (!allowed) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
}