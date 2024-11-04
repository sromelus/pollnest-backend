import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { profanity } from '@2toad/profanity';
import Vote from '../models/Vote';
import VoteTally from '../models/VoteTally';
import { broadcastVoteUpdate } from '../index';

interface Votes {
  voterEthnicity: string;
  voterGender: string;
  candidate: string;
  voterId: string;
  chatMessage?: string;
};

interface ClientInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
}

const getClientInfo = (req: Request): ClientInfo => {
    return {
        ip: (req.headers['x-appengine-user-ip'] || req.headers['x-forwarded-for'] || req.ip) as string,
        city: req.headers['x-appengine-city'] as string,
        region: req.headers['x-appengine-region'] as string,
        country: req.headers['x-appengine-country'] as string,
    };
};

export const getVotes = async (req: Request, res: Response) => {
    let sessionId = req.cookies?.sessionId;
    const clientInfo = getClientInfo(req);

    const hasVoted = await Vote.exists({ voterId: sessionId });
    const hasVotedByIp = await Vote.exists({ voterIp: clientInfo.ip });

    const isRequestFromOutsideUS = clientInfo.country !== 'US';

    const voteTally = await VoteTally.find().lean();

    const tallyObject = voteTally.reduce((acc, curr) => {
      acc[curr.candidate] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    res.send({ voteTally: tallyObject, visitedUser: { disabledVote: hasVoted || hasVotedByIp, isRequestFromOutsideUS }});
};

export const castVote = async (req: Request, res: Response) => {
    try {
        let sessionId = req.cookies?.sessionId;
        const clientInfo = getClientInfo(req);

        const { candidate, voterEthnicity, voterGender, chatMessage } = req.body as Votes;

        if (!sessionId) {
            sessionId = uuidv4();
        }

        const hasVoted = await Vote.exists({ voterId: sessionId });
        const hasVotedByIp = await Vote.exists({ voterIp: clientInfo.ip });

        if (hasVoted || hasVotedByIp) {
            return res.status(403).send({ success: false, message: 'User has already voted.' });
        }

        const voterCountry = clientInfo.country?.toUpperCase();
        const voterRegion = clientInfo.region?.toUpperCase();
        const voterCity = clientInfo.city?.toUpperCase();

        if (!voterCountry) {
            return res.status(400).send({ success: false, message: 'Unable to determine voter location.' });
        }

        if (voterCountry !== 'US') {
            return res.status(403).send({ success: false, message: 'Voting is only allowed from the United States, Sorry!' });
        }

        await Vote.create({
            candidate,
            voterId: sessionId,
            voterIp: clientInfo.ip,
            voterCountry,
            voterRegion,
            voterCity,
            voterEthnicity,
            voterGender
        });

        await VoteTally.findOneAndUpdate(
            { candidate },
            { $inc: { count: 1 }, lastUpdated: new Date() },
            { upsert: true }
        );

        const voteTally = await VoteTally.find().lean();
        const tallyObject = voteTally.reduce((acc, curr) => {
            acc[curr.candidate] = curr.count;
            return acc;
        }, {} as Record<string, number>);

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 60,
            sameSite: 'none',
        });

        const cleanedMessage = profanity.censor(chatMessage as string);
        res.status(200).send({ success: true, voteTally: tallyObject, chatMessage: cleanedMessage });

        // Broadcast updated tally to all WebSocket clients
        broadcastVoteUpdate({ success: true, voteTally: tallyObject, chatMessage: cleanedMessage });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
};
