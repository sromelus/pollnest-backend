import { Request, Response, NextFunction } from 'express';

export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: process.env.MAINTENANCE_MESSAGE || 'The server is under maintenance. Please try again later.'
    });
  }
  next();
};