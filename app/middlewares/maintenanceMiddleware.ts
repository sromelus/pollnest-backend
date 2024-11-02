import { Request, Response, NextFunction, RequestHandler } from 'express';

export const maintenanceMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.MAINTENANCE_MODE === 'true' || true) {
    res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: process.env.MAINTENANCE_MESSAGE || 'The server is under maintenance. Please try again later.'
    });
    return;
  }
  next();
};