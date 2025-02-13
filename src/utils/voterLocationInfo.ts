import { Request } from 'express';
import { envConfig } from "../config/environment";

interface VoterLocationInfo {
    voterIp: string;
    voterCity: string;
    voterRegion: string;
    voterCountry: string;
}

export const voterLocationInfo = (req: Request): VoterLocationInfo => {
    const config = envConfig[process.env.NODE_ENV || 'development'];

    if (config.nodeEnv === 'test' || config.nodeEnv === 'development') {
        return {
            voterIp: '127.0.0.1',
            voterCity: 'Medford',
            voterRegion: 'MA',
            voterCountry: 'US',
        };
    }

    return {
        voterIp: (req.headers['x-appengine-user-ip'] || req.headers['x-forwarded-for'] || req.ip) as string,
        voterCity: req.headers['x-appengine-city'] as string,
        voterRegion: req.headers['x-appengine-region'] as string,
        voterCountry: req.headers['x-appengine-country'] as string,
    };
};