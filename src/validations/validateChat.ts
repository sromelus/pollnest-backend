import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateCreateChatMessage: RequestHandler[] = [
    body('content').isString().withMessage('Invalid message'),
    body('userId').isString().withMessage('Invalid user ID'),

    (req: Request, res: Response, next: NextFunction): void => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'validation error', errors: errors.array() });
        return;
      }
      next();
    }
  ];