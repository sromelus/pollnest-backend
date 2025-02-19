import { RequestHandler } from 'express';
import { User } from '../models';
import { generateAuthToken, tryCatch } from '../utils';

export default class AuthController {
    static login: RequestHandler = tryCatch(async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user || !await user.comparePassword(password)){
            res.status(401).send({success: false, message: 'Invalid credentials'})
            return;
        }

        const token = await generateAuthToken(user.id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
            sameSite: 'strict'
        });

        res.json({ success: true, message: 'Login successful', data: { token } });
    });

    static logout: RequestHandler = tryCatch(async (req, res) => {
        const currentUserId = (req as any).currentUserId;

        res.json({ success: true, message: 'Logout successful' });
    });
}