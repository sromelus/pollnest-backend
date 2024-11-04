import { RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateMessage: RequestHandler[] = [
    body('chatMessage').isString().isLength({ max: 62 }).withMessage('Chat message must be a string with less than 62 characters'),
    (req: Request, res: Response, next: NextFunction): void => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        next();
    }
];