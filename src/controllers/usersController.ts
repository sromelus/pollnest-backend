import { RequestHandler } from 'express';
import { User } from '../models'
import { splitFullName, tryCatch } from '../utils';

export default class UsersController {
    static listUsers: RequestHandler = tryCatch(async (req, res) => {
        const users = await User.find();

        res.status(200).send({ success: true, message: 'Users fetched successfully', data: { users } });
    });

    static getUser: RequestHandler = tryCatch(async (req, res) => {
        const { userId } = req.params;
        const user = await User.findById(userId);


        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).send({ success: true, message: 'User fetched successfully', data: { user: { id: user.id, name: user.name, email: user.email } } });
    });

    static createUser: RequestHandler = tryCatch(async (req, res) => {
        const { name, email, password, role, verified } = req.body;
        const { firstName, lastName } = splitFullName(name);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        });

        res.status(201).send({
            success: true, message: 'User created successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    verified: user.verified
                }
            }
        });
    });

    static updateUser: RequestHandler = tryCatch(async (req, res) => {
        const { userId } = req.params;
        const { name, email } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        // Update user attributes
        if (name) {
            const { firstName, lastName } = splitFullName(name);
            user.firstName = firstName;
            user.lastName = lastName;
        }

        if (email) {
            user.email = email;
        }

        // Save the updated user
        await user.save();

        res.status(200).send({ success: true, message: 'User updated successfully', data: { user: { id: user.id, name: user.name, email: user.email } } });
    });

    static deleteUser: RequestHandler = tryCatch(async (req, res) => {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        await user.deleteOne();

        res.status(200).send({ success: true, message: 'User deleted successfully' });
    });
}