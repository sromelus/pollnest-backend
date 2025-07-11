import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { envConfig } from '../config/environment';
import { User, IUser } from '../models';
import { JWT_EXPIRATION } from '../constants/jwt';
// import { blacklist } from '../services/blacklist';

const config = envConfig[process.env.NODE_ENV as string];

export type JwtAuthAccessTokenType = {
    newAuthAccessToken: string | null;
    decoded: jwt.JwtPayload | null;
    error: Error | null;
};

export type JwtTokenType = {
    decoded: jwt.JwtPayload | null;
    error: Error | null;
};

export type PrivatePollInvitePayload = {
    pollId: string;
    email: string;
    type: 'private-poll-invite';
    expiresIn?: number;
};

export async function generateAuthAccessToken(userId: string, expiresIn: string = JWT_EXPIRATION.ACCESS_TOKEN): Promise<string> {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const user = await User.findById(userId).select('role') as IUser;

    return jwt.sign({ currentUserId: user.id, role: user.role}, secret, { expiresIn } as SignOptions);
}

export function generateReferrerToken(userId: string, expiresIn: string = '0s'): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ referrerId: userId}, secret, { expiresIn } as SignOptions);
}

export function generateRefreshToken(userId: string, expiresIn: string = JWT_EXPIRATION.REFRESH_TOKEN): string {
    const secret = config.jwtRefreshSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign({ currentUserId: userId }, secret, { expiresIn } as SignOptions);
}

export function generatePrivatePollInviteToken(payload: PrivatePollInvitePayload, expiresIn: string = JWT_EXPIRATION.INVITE_TOKEN): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function generatePublicPollShareToken(payload: { pollId: string; referrerId: string }): string {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret);
}

export async function verifyAuthAccessToken(accessToken: string, refreshToken: string): Promise<JwtAuthAccessTokenType> {
    const secret = config.jwtSecret as Secret;
    const refreshSecret = config.jwtRefreshSecret as Secret;

    if (!secret || !refreshSecret) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        const decoded = jwt.verify(accessToken, secret) as jwt.JwtPayload;
        return { newAuthAccessToken: null, decoded, error: null };
    } catch (err: any) {
        // check if token is expired
        if (err?.name === 'TokenExpiredError') {
            try {
                const refreshDecoded = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload;
                const expiredAccessTokenDecoded = jwt.decode(accessToken) as jwt.JwtPayload;

                // Verify both tokens belong to the same user
                if (expiredAccessTokenDecoded.currentUserId !== refreshDecoded.currentUserId) {
                    const error = new Error('Token mismatch');
                    error.name = 'TokenMismatchError';
                    throw error;
                }

                const newAuthAccessToken = await generateAuthAccessToken(refreshDecoded.currentUserId);
                return { newAuthAccessToken, decoded: expiredAccessTokenDecoded, error: null };
            } catch (refreshErr: any) {
                return { newAuthAccessToken: null, decoded: null, error: refreshErr as Error };
            }
        }

        return { newAuthAccessToken: null, decoded: null, error: err };
    }
}

export function verifyToken(token: string): JwtTokenType {
    const secret = config.jwtSecret as Secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
        return { decoded, error: null };
    } catch (error: any) {
        return { decoded: null, error: error as Error };
    }
}

export function decodeToken(token: string): jwt.JwtPayload {
    return jwt.decode(token) as jwt.JwtPayload;
}

