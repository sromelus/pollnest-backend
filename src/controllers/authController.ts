import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils';

export default class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');

            if (!user || !await user.comparePassword(password)){
                res.status(401).send({success: false, message: 'Invalid credentials'})
                return;
            }

            const token = generateToken(user.id);

            res.json({ success: true, message: 'Login successful', data: { token } });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to login', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ success: false, message: 'Internal server error', errors: (error as Error).message });
        }
    }

    static async logout(req: Request, res: Response) {
        const currentUserId = (req as any).currentUserId;

        res.json({ success: true, message: 'Logout successful' });
    }
}