import { RequestHandler } from 'express';
import { User } from '../models'
import { splitFullName } from '../utils/formatName';

export class RegistrationsController {
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
                res.status(400).send({ msg: 'User creation failed', error: error.message })
        }
    }

    // static updateUser: RequestHandler = async (req, res) => {
    //     const { email, name, password } = req.body;

    //     try {
    //         const user = await User.findOne({ email });
    //         if (!user) {
    //             res.status(404).send({ msg: 'User not found' });
    //             return;
    //         }

    //         await user.updateOne({ password });
    //         res.status(200).send({ msg: 'User updated successfully' });
    //     } catch (error: any) {
    //         res.status(400).send({ msg: 'User deletion failed', error: error.message })
    //     }
    // }

    // static deleteUser: RequestHandler = async (req, res) => {
    //     const { email, password } = req.body;

    //     try {
    //         const user = await User.findOne({ email });
    //         if (!user) {
    //             res.status(404).send({ msg: 'User not found' });
    //             return;
    //         }

    //         await user.deleteOne();
    //         res.status(200).send({ msg: 'User deleted successfully' });
    //     } catch (error: any) {
    //         res.status(400).send({ msg: 'User deletion failed', error: error.message })
    //     }
    // }
}

export default RegistrationsController;