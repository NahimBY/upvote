import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../core/utils/apiError';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.issues
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({
      success: false,
      message: err.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}