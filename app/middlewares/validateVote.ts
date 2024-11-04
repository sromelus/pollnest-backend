import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateVote: RequestHandler[] = [
  body('candidate').isString().isIn(['kamala', 'trump']).withMessage('Invalid candidate. Must be either kamala or trump'),
  body('voterEthnicity').isString().isIn(['white', 'black', 'hispanic', 'asian', 'other']).withMessage('Invalid voter ethnicity. Must be either white, black, hispanic, asian, or other'),
  body('voterGender').isString().isIn(['male', 'female', 'non-binary', 'other']).withMessage('Invalid voter gender. Must be either male, female, non-binary, or other'),
  body('chatMessage').optional().isString().isLength({ max: 62 }).withMessage('Chat message must be a string with less than 62 characters'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    next();
  }
];