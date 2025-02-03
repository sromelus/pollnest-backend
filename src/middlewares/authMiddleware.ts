import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils";

export const auth = ({ required = true }: { required?: boolean } = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
        if (!required) {
            next();
            return;
        }

        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            res.status(401).send({ message: 'Unauthorized' });
            return;
        }

        const decoded = verifyToken(token);

        if (decoded && typeof decoded === 'object') {
            (req as any).userId = decoded.userId;
        }

        next();
    }
}