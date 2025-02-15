import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import Vote, { IVote } from './Vote';

export enum UserRole {
  Admin = 'admin',
  Subscriber = 'subscriber',
  User = 'user'
};

export interface IUser extends Document {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    role: UserRole;
    name: string;
    comparePassword(password: string): Promise<boolean>;
    userIp: string;
    referrerId: Types.ObjectId;
    votes: () => Promise<IVote[]>;
    points: number;
    voteCount: number;
}

const UserSchema = new Schema<IUser>({
        firstName: {
            type: Schema.Types.String,
            trim: true,
            required: true,
            minLength: [2, 'First name must be at least 2 characters long'],
            maxLength: [30, 'First name cannot exceed 30 characters']
        },
        lastName: {
            type: Schema.Types.String,
            trim: true,
            maxLength: [30, 'Last name cannot exceed 30 characters']
        },
        email: {
            type: Schema.Types.String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
            maxLength: [50, 'Email cannot be more than 50 characters'],
            validate: [
                {
                    validator: async function(this: mongoose.Document & Partial<IUser>, email: string) {
                        if (this.isModified('email')) {
                            const user = await (this.constructor as typeof mongoose.Model)
                                        .findOne({ email: email.toLowerCase() });
                            return !user;
                        }
                        return true;
                    },
                    message: 'Email already exists'
                }
            ]
        },
        password: {
            type: Schema.Types.String,
            required: true,
            minLength: [8, 'Password must be at least 8 characters long'],
            maxLength: [128, 'Password cannot exceed 128 characters'],
            select: false,
            validate: {
                validator: function(password: string) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
                },
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }
        },
        userIp: {
            type: Schema.Types.String,
        },
        referrerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        role: {
            type: Schema.Types.String,
            enum: Object.values(UserRole),
            required: true,
            default: UserRole.User
        },
        points: {
            type: Schema.Types.Number,
            default: 0,
            min: 0
        },
        voteCount: {
            type: Schema.Types.Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Add pre-save middleware to hash password
UserSchema.pre('save', async function(this: IUser, next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

UserSchema.virtual('name').get(function(this: IUser) {
    return `${this.firstName} ${this.lastName}`;
});

// Add method to compare passwords
UserSchema.methods.comparePassword = async function(this: IUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

UserSchema.methods.votes = async function(this: IUser) {
    return await Vote.find({ voterId: this._id });
};

export default mongoose.model<IUser>('User', UserSchema);
