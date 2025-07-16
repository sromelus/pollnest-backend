import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateVote: RequestHandler[] = [
  body('pollId').isMongoId().withMessage('Invalid poll ID'),
  body('voterId').optional().isMongoId().withMessage('Invalid voter ID'),
  body('pollOptionId').isString().isLength({ min: 24, max: 24 }).withMessage('Invalid pollOptionId'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array().map(error => error.msg).join(', ') });
      return;
    }
    next();
  }
];