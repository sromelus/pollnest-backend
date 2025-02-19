import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { envConfig } from '../config/environment';
import { User, IUser } from '../models';
// import { blacklist } from '../services/blacklist';

const config = envConfig[process.env.NODE_ENV || 'development'];

export async function generateAuthToken(userId: string) {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const user = await User.findById(userId).select('role') as IUser;

    return jwt.sign({ currentUserId: userId, role: user.role}, secret, { expiresIn: '1h' });
}

export function generateInviteToken(payload: { pollId: string; email: string; type: 'poll-invite'; expiresIn?: number }): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn: payload.expiresIn || '7d' });
}

export function generateShareToken(payload: { pollId: string; referrerId: string }): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret);
}

export function verifyToken(token: string) {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return {};
    }
}

export function decodeToken(token: string): jwt.JwtPayload {
    return jwt.decode(token) as jwt.JwtPayload;
}



// export async function blacklistToken(token: string): Promise<void> {
//     const decoded = jwt.decode(token) as jwt.JwtPayload;
//     const expiresAt = decoded.exp;

//     // Store in Redis or database
//     await blacklist.set(token, 'blacklisted', {
//         expireAt: new Date(expiresAt! * 1000)
//     });
// }

// export async function isTokenBlacklisted(token: string): Promise<boolean> {
//     return await blacklist.exists(token);
// }
