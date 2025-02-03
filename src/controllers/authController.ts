import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils';

export default class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');

            if (!user || !await user.comparePassword(password)){
                res.status(401).send({message: 'Invalid credentials'})
                return;
            }

            const token = generateToken(user.id);

            res.json({token});
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async logout(req: Request, res: Response) {
        const userId = (req as any).userId;

        res.json({message: 'Logout successful'})
    }
}