import { RequestHandler } from 'express';
import { User, Vote } from '../models'
import { splitFullName, tryCatch, voterLocationInfo, verifyToken } from '../utils';
import { Types } from 'mongoose';

export default class RegistrationsController {
    static signup: RequestHandler = tryCatch(async (req, res) => {
        const { name, email, password} = req.body;
        const { firstName, lastName } = splitFullName(name);

        let referrerId = null;
        if (req.cookies) {
            const { referrerToken } = req.cookies;
            const decoded = verifyToken(referrerToken) as { referrerId: string };
            referrerId = decoded.referrerId ? new Types.ObjectId(decoded.referrerId) : null;
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            referrerId
        });

        // Match new user with existing votes
        const voterLocInfo = voterLocationInfo(req);

        await Vote.updateMany(
            { voterIp: voterLocInfo.voterIp, voterId: undefined },
            { voterId: user.id }
        );

        res.status(200).send({
            success: true,
            message: 'User created successfully',
            data: { user: { id: user.id, name: user.name, email: user.email } }
        });
    });

    static updateUser: RequestHandler = tryCatch(async (req, res) => {
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

    static deleteUser: RequestHandler = tryCatch(async (req, res) => {
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
