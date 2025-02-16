import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { envConfig } from '../config/environment';
// import { blacklist } from '../services/blacklist';

const config = envConfig[process.env.NODE_ENV || 'development'];

export function generateAuthToken(userId: string): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign({ currentUserId: userId }, secret, { expiresIn: '1h' });
}

export function generateInviteToken(payload: { pollId: string; email: string; type: 'poll-invite'; expiresIn?: number }): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn: payload.expiresIn || 1000 * 60 * 60 * 24 * 7 });
}

export function generateShareToken(payload: { pollId: string; referrerId: string }): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret);
}

export function verifyToken(token: string): string | jwt.JwtPayload {
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
