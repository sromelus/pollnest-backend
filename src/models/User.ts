import mongoose, { Schema, Document } from 'mongoose';
import { validate } from 'uuid';

enum Role {
  Admin = 'admin',
  Subscriber = 'subscriber',
  User = 'user'
};

export interface User extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'admin' | 'subscriber' | 'user'
}

const UserSchema: Schema = new Schema({
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            index: true,
            unique: true,
            validate: {
                validator: (email) => email.match(/\w.*\@\w.*\.\w{2,5}/),
                message: 'Email is invalid'
            }
        },
        password: {
            type: String,
            trim: true,
            required: true
        },
        role: {
            type: String,
            enum: ['admin','subscriber','user'],
            default: Role.User
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<User>('User', UserSchema);