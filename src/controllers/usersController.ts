import { RequestHandler } from 'express';
import { User } from '../models'
import { splitFullName } from '../utils';


export default class UsersController {
    static getUsers: RequestHandler = async (req, res) => {
        const users = await User.find();

        res.status(200).send({ success: true, message: 'Users fetched successfully', data: { users } });
    }

    static getUser: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            res.status(404).send({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).send({ success: true, message: 'User fetched successfully', data: { user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } } });
    }

    static createUser: RequestHandler = async (req, res) => {
        const { name, email, password, role } = req.body;
        const { firstName, lastName } = splitFullName(name);

        try {
            const user = await User.create({
                firstName,
                lastName,
                email,
                password,
                role
            });

            res.status(200).send({ success: true, message: 'User created successfully', data: { user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email, role: user.role } } });
        } catch (error: any) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to create user', errors: (error as Error).message});
                return;
            }

            res.status(500).send({ success: false, message: 'Internal server error', errors: (error as Error).message })
        }
    }

    static updateUser: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const { name, email } = req.body;

        try {
            const user = await User.findById(id);

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

            res.status(200).send({ success: true, message: 'User updated successfully', data: { user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } } });
        } catch (error: any) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to update user', errors: (error as Error).message});
                return;
            }

            res.status(500).send({ success: false, message: 'Internal server error', errors: (error as Error).message })
        }
    }

    static deleteUser: RequestHandler = async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                res.status(404).send({ success: false, message: 'User not found' });
                return;
            }

            await user.deleteOne();
            res.status(200).send({ success: true, message: 'User deleted successfully' });
        } catch (error: any) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to delete user', errors: (error as Error).message});
                return;
            }

            res.status(500).send({ success: false, message: 'Internal server error', errors: (error as Error).message })
        }
    }
}
