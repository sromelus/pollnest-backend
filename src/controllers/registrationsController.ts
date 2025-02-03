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

            res.status(200).send({ user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } })
        } catch (error: any) {
                res.status(400).send({ message: 'User creation failed', error: error.message })
        }
    }

    static updateUser: RequestHandler = async (req, res) => {
        const { name, email, password } = req.body;

        const userId = (req as any).userId;

        try {
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).send({ message: 'User not found' });
                return;
            }

            const { firstName, lastName } = splitFullName(name);

            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (email) user.email = email;
            if (password) user.password = password;

            await user.save();

            res.status(200).send({ message: 'User updated successfully', user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } });
        } catch (error: any) {
            res.status(400).send({ message: 'User deletion failed', error: error.message })
        }
    }

    static deleteUser: RequestHandler = async (req, res) => {
        const userId = (req as any).userId;

        try {
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).send({ message: 'User not found' });
                return;
            }

            await user.deleteOne();
            res.status(200).send({ message: 'User deleted successfully' });
        } catch (error: any) {
            res.status(400).send({ message: 'User deletion failed', error: error.message })
        }
    }
}
