import jwt from 'jsonwebtoken';
import { envConfig } from '../config/environment';
// import { blacklist } from '../services/blacklist';

const config = envConfig[process.env.NODE_ENV || 'development'];

export function generateToken(userId: string): string {
    const secret = config.jwtSecret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign({ currentUserId: userId }, secret, { expiresIn: '5m' });
}

export function verifyToken(token: string): string | jwt.JwtPayload {
    const secret = config.jwtSecret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, secret);
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
