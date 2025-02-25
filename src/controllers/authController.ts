import { RequestHandler } from 'express';
import { User, Vote, IUser } from '../models';
import {
    generateAuthToken,
    splitFullName,
    tryCatch,
    voterLocationInfo,
    verifyToken
} from '../utils';
import { Types } from 'mongoose';
import { sendEmail, EmailOptions } from '../utils';

export default class AuthController {
    static login: RequestHandler = tryCatch(async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email, verified: true }).select('+password');

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

    static preRegister: RequestHandler = tryCatch(async (req, res) => {
        const { email } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.verified) {
            res.status(400).send({ success: false, message: 'Email already exists' });
            return;
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.findOneAndUpdate({ email }, {
            firstName: 'New',
            lastName: 'User',
            email,
            password: 'ValidPass123!',
            phone: '1112223333',
            verified: false,
            verificationCode
        }, { upsert: true, new: true }).select({ email: 1, _id: 0 });


        // Send verification code to user's email
        const options: EmailOptions = {
            to: (user as IUser).email,
            subject: 'Verify your email',
            html: `<p>Your verification code is ${verificationCode}</p>
                   <p>Please use this code in the registration form to continue the signup process.</p>`
        };

        if (process.env.NODE_ENV == 'production') {
            await sendEmail(options);
        } else {
            console.log('options', options);
        }

        res.status(200).send({ success: true, message: 'Temporary user created successfully', data: { user } });
    });

    static register: RequestHandler = tryCatch(async (req, res) => {
        const { name, email, password, verificationCode } = req.body;
        const { firstName, lastName } = splitFullName(name);

        let referrerId = null;
        if (req.cookies) {
            const { referrerToken } = req.cookies;
            const decoded = verifyToken(referrerToken) as { referrerId: string };
            referrerId = decoded.referrerId ? new Types.ObjectId(decoded.referrerId) : null;
        }

        const user = await User.findOneAndUpdate({email, verificationCode}, {
            firstName,
            lastName,
            password,
            referrerId,
            verified: true,
            verificationCode: null
        }, { new: true, runValidators: true });

        if (!user) {
            res.status(400).send({ success: false, message: 'Invalid email or verification code' });
            return;
        }

        // Match new user with existing votes
        const voterLocInfo = voterLocationInfo(req);

        await Vote.updateMany(
            { voterIp: voterLocInfo.voterIp, voterId: undefined },
            { voterId: user.id }
        );

        res.status(201).send({
            success: true,
            message: 'User created successfully',
            data: { user: { id: user.id, name: user.name, email: user.email } }
        });
    });

    static updateProfile: RequestHandler = tryCatch(async (req, res) => {
        const { name, email, password } = req.body;
        const userId = (req as any).currentUserId;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        const { firstName, lastName } = splitFullName(name);

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (password) user.password = password;

        await user.save();

        res.status(200).send({
            success: true,
            message: 'User updated successfully',
            data: { user: { id: user.id, name: user.name, email: user.email } }
        });
    });

    static deleteProfile: RequestHandler = tryCatch(async (req, res) => {
        const userId = (req as any).currentUserId;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        await user.deleteOne();
        res.status(200).send({ success: true, message: 'User deleted successfully' });
    });
}