import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

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
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
        firstName: {
            type: String,
            trim: true,
            required: true,
            minLength: [2, 'First name must be at least 2 characters long'],
            maxLength: [30, 'First name cannot exceed 30 characters']
        },
        lastName: {
            type: String,
            trim: true,
            maxLength: [30, 'Last name cannot exceed 30 characters']
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxLength: [50, 'Email cannot exceed 50 characters'],
            validate: {
                validator: function(email: string) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: 'Please enter a valid email address'
            }
        },
        password: {
            type: String,
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

// Add pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Add method to compare passwords
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password as string);
};

export default mongoose.model<User>('User', UserSchema);