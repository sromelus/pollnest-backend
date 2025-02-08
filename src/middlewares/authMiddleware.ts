import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils";

export const auth = ({ required = true }: { required?: boolean } = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
        if (!required) {
            next();
            return;
        }

        try {
            const token = req.headers['authorization']?.split(' ')[1];

            if (!token) {
                res.status(401).send({ message: 'Unauthorized' });
                return;
            }

            const decoded = verifyToken(token);

            if (!decoded || typeof decoded !== 'object' || !('currentUserId' in decoded)) {
                res.status(401).send({ message: 'Unauthorized' });
                return;
            }

            (req as any).currentUserId = decoded.currentUserId;

            next();
        } catch (error) {
            res.status(401).send({ success: false, message: 'Unauthorized', errors: (error as Error).message});
            return;
        }
    }
}