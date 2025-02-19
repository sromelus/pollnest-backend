import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils";

export const auth = ({ required = true }: { required?: boolean } = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!required && !token) {
            (req as any).currentUserId = null;
            (req as any).role = null;

            next();
            return;
        }

        try {
            if (!token) {
                res.status(401).send({ success: false, message: 'Unauthorized' });
                return;
            }

            const decoded = verifyToken(token);

            if (!decoded || typeof decoded !== 'object') {
                res.status(401).send({ success: false, message: 'Unauthorized' });
                return;
            }

            (req as any).currentUserId = decoded.currentUserId;
            (req as any).role = decoded.role;

            next();
        } catch (error) {
            res.status(401).send({ success: false, message: 'Unauthorized', errors: (error as Error).message});
            return;
        }
   }
}