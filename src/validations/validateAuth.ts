import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateLogin: RequestHandler[] = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array().map(error => error.msg).join(', ') });
      return;
    }
    next();
  }
];

export const validatePreRegister: RequestHandler[] = [
  body('email').isEmail().withMessage('Invalid email'),
  body('email').isLength({ max: 50 }).withMessage('Email must be less than 50 characters long'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array().map(error => error.msg).join(', ') });
      return;
    }
    next();
  }
];

export const validateRegister: RequestHandler[] = [
  body('name').notEmpty().withMessage('firstName: Path `firstName` is required.'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('verificationCode').isString().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 characters long'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array().map(error => error.msg).join(', ') });
      return;
    }
    next();
  }
];


