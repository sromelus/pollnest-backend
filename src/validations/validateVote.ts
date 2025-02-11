import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validateVote: RequestHandler[] = [
  body('pollId').isMongoId().withMessage('Invalid poll ID'),
  body('voterId').isString().withMessage('Invalid voter ID'),
  body('pollOptionId').isString().isLength({ min: 24, max: 24 }).withMessage('Invalid voter vote option ID'),
  body('voterEthnicity').isString().isIn(['white', 'black', 'hispanic', 'asian', 'other']).withMessage('Invalid voter ethnicity. Must be either white, black, hispanic, asian, or other'),
  body('voterGender').isString().isIn(['male', 'female', 'non-binary', 'other']).withMessage('Invalid voter gender. Must be either male, female, non-binary, or other'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: 'validation error', errors: errors.array() });
      return;
    }
    next();
  }
];