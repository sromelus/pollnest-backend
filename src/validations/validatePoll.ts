import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Validation middleware
export const validatePoll: RequestHandler[] = [
  body('title').isString().withMessage('Title must be a string'),
  body('description').isString().withMessage('Description must be a string'),
  body('pollOptions')
    .isArray({ min: 2 }).withMessage('At least 2 poll options are required')
    .custom((options) => {
      return options.every((option: any) =>
        typeof option.pollOptionText === 'string' && option.pollOptionText.length >= 2
      );
    }).withMessage('Each poll option must have valid text'),
  body('creatorId').isString().withMessage('Creator ID must be a string'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    next();
  }
];

export const validatePollUpdate: RequestHandler[] = [
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('pollOptions').optional().isArray().withMessage('Poll options must be an array'),
  body('userId').optional().isString().withMessage('User ID must be a string'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    next();
  }
];