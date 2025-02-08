import { RequestHandler } from 'express';
import { User } from '../models'
import { splitFullName } from '../utils';

export default class RegistrationsController {
    static signup: RequestHandler = async (req, res) => {
        const { name, email, password} = req.body;

        try {
            const { firstName, lastName } = splitFullName(name);
            const user = await User.create({
                firstName,
                lastName,
                email,
                password
            })

            res.status(200).send({ success: true, message: 'User created successfully', data: { user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } } })
        } catch (error: any) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to create user', errors: (error as Error).message});
                return;
            }

            res.status(500).send({ success: false, message: 'Internal server error', errors: (error as Error).message })
        }
    }

    static updateUser: RequestHandler = async (req, res) => {
        const { name, email, password } = req.body;

        const userId = (req as any).currentUserId;

        try {
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
        const userId = (req as any).currentUserId;
        console.log(userId);
        try {
            const user = await User.findById(userId);
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
