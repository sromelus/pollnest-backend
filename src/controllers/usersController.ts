import { RequestHandler } from 'express';
import { User } from '../models'
import { splitFullName } from '../utils';


export default class UsersController {
    static getUsers: RequestHandler = async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).send({ users });
        } catch (error: any) {
            res.status(400).send({ message: 'User creation failed', error: error.message })
        }
    }

    static getUser: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        res.status(200).send({ user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } });
    }

    static createUser: RequestHandler = async (req, res) => {
        const { name, email, password } = req.body;
        const { firstName, lastName } = splitFullName(name);

        try {
            const user = await User.create({
                firstName,
                lastName,
                email,
                password
            });

            res.status(200).send({ user: { id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email } });
        } catch (error: any) {
            res.status(400).send({ message: 'User creation failed', error: error.message })
        }
    }

    static updateUser: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const { name, email } = req.body;

        try {
            const user = await User.findById(id);

            if (!user) {
                res.status(404).send({ message: 'User not found' });
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

            res.status(200).send({
                user: {
                    id: user.id,
                    name: user.firstName + ' ' + user.lastName,
                    email: user.email
                }
            });
        } catch (error: any) {
            res.status(400).send({ message: 'User update failed', error: error.message })
        }
    }

    static deleteUser: RequestHandler = async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);

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
