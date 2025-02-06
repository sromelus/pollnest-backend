import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateRegistration: RequestHandler[] = [
  body('name').isString().withMessage('Invalid name'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isString().withMessage('Invalid password'),
  body('passwordConfirmation').isString().withMessage('Invalid password confirmation'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    next();
  }
];