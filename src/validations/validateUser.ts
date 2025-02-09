import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateUser: RequestHandler[] = [
  body('name').isString().isLength({ min: 2, max: 30 }).withMessage('Name must be between 2 and 30 characters long'),
  body('email').isEmail().isLength({ max: 50 }).withMessage('Email must be less than 50 characters long'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: 'validation error', errors: errors.array().map(error => error.msg)[0] });
      return;
    }
    next();
  }
];


export const validateUpdateUser: RequestHandler[] = [
  body('name').optional().isString().isLength({ min: 2, max: 30 }).withMessage('Name must be between 2 and 30 characters long'),
  body('email').optional().isEmail().isLength({ max: 50 }).withMessage('Email must be less than 50 characters long'),
  body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: 'validation error', errors: errors.array().map(error => error.msg)[0] });
      return;
    }
    next();
  }
];