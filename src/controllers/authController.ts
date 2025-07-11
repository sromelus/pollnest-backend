import { RequestHandler, Response, Request } from 'express';
import { User, Vote, IUser } from '../models';
import {
    generateAuthAccessToken,
    splitFullName,
    tryCatch,
    voterLocationInfo,
    verifyToken,
    JwtTokenType
} from '../utils';
import { Types } from 'mongoose';
import { sendEmail, EmailOptions } from '../utils';
import { generateRefreshToken } from '../utils/jwtManager';

export default class AuthController {
    static login: RequestHandler = tryCatch(async (req, res) => {
        const { email, password } = req.body;

        const user = await AuthController.validateCredentials(email, password);
        if (!user) {
            res.status(401).send({success: false, message: 'Invalid credentials'})
            return;
        }

        const authAccessToken = await generateAuthAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Set refreshToken in res as a HTTP-only cookie
        AuthController.setRefreshTokenCookie(res, refreshToken);

        // Set authAccessToken in res as a header
        res.setHeader('auth-access-token', authAccessToken);

        // Return user data without the token in body
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });
    });

    static logout: RequestHandler = tryCatch(async (req, res) => {
        const { currentUserId } = (req as any);

        await User.findByIdAndUpdate(currentUserId, { lastLogoutAt: new Date() });

        AuthController.unsetRefreshTokenCookie(res);

        res.json({ success: true, message: 'Logout successful' });
    });

    static preRegister: RequestHandler = tryCatch(async (req, res) => {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser?.verified) {
            res.status(400).send({ success: false, message: 'Email already exists or user is not verified' });
            return;
        }

        const verificationCode = AuthController.generateVerificationCode();
        const user = await AuthController.preRegisterUserWithEmail(email, verificationCode);
        await AuthController.sendVerificationEmail(user, verificationCode);

        res.status(200).send({
            success: true,
            message: 'Temporary user created successfully',
            data: { user }
        });
    });

    static register: RequestHandler = tryCatch(async (req, res) => {
        const { name, email, password, verificationCode } = req.body;
        const { firstName, lastName } = splitFullName(name);

        const { referrerToken } = req.cookies;

        // get referrerId from cookie if it exists
        let referrerId = null;
        if (referrerToken) {
            const { decoded, error } = verifyToken(referrerToken) as JwtTokenType;

            if (error) {
                res.status(401).send({ success: false, message: 'Invalid referrer token' });
                return;
            }

            referrerId = decoded?.referrerId ? Types.ObjectId.createFromHexString(decoded.referrerId) : null;
        }

        const user = await User.findOne({email, verificationCode});

        if (!user) {
            res.status(400).send({ success: false, message: 'Invalid email or verification code' });
            return;
        }

        user.firstName = firstName;
        user.lastName = lastName;
        user.password = password;
        user.referrerId = referrerId;
        user.verified = true;
        user.verificationCode = null;

        await user.save();

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
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        await user.deleteOne();

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    });

    private static async validateCredentials(email: string, password: string): Promise<IUser | null> {
        const user = await User.findOne({ email, verified: true }).select('+password');
        if (!user || !await user.comparePassword(password)) {
            return null;
        }

        await user.updateOne({ lastLoginAt: new Date() });

        return user;
    }

    private static generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async preRegisterUserWithEmail(email: string, verificationCode:    string | null): Promise<IUser> {
        return await User.findOneAndUpdate(
            { email },
            {
                firstName: 'New',
                lastName: 'User',
                email,
                password: 'ValidPass123!',
                phone: '1112223333',
                verified: false,
                verificationCode
            },
            { upsert: true, new: true }
        ).select({ email: 1, _id: 0 });
    }

    private static async sendVerificationEmail(user: IUser, verificationCode: string): Promise<void> {
        const options: EmailOptions = {
            to: user.email,
            subject: 'Verify your email',
            html: `<p>Your verification code is ${verificationCode}</p>
                   <p>Please use this code in the registration form to continue the signup process.</p>`
        };

        if (process.env.NODE_ENV === 'production') {
            await sendEmail(options);
        } else {
            // console.log('options', options);
        }
    }

    private static setRefreshTokenCookie(res: Response, token: string): void {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });


    }

    private static unsetRefreshTokenCookie(res: Response): void {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
        });
    }
}