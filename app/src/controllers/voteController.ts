import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Vote from '../models/Vote';
import VoteTally, { Candidate } from '../models/VoteTally';
import geoip from 'fast-geoip';

interface Votes {
  voterEthnicity: string;
  voterGender: string;
  candidate: string;
  voterId: string;
};

const getClientIp = (req: Request): string => {
    return (req.headers['X-Appengine-User-Ip'] ||
            req.headers['X-Forwarded-For'] ||
            req.headers['X-Real-Ip'] ||
            req.socket.remoteAddress ||
            req.ip) as string;
};

export const getVotes = async (req: Request, res: Response) => {
    let sessionId = req.cookies?.sessionId;
    const clientIp = getClientIp(req);

    const hasVoted = await Vote.exists({ voterId: sessionId });
    const hasVotedByIp = await Vote.exists({ voterIp: clientIp });

    const geo = await geoip.lookup(clientIp as string);
    const voterCountry = geo?.country;
    const isRequestFromOutsideUS = voterCountry !== 'US';

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
        const clientIp = getClientIp(req);

        const { candidate, voterEthnicity, voterGender } = req.body as Votes;

        if (!Object.values(Candidate).includes(candidate as Candidate)) {
            return res.status(400).send({ success: false, message: 'Invalid candidate. Must be either kamala or trump' });
        }

        if (!sessionId) {
            sessionId = uuidv4();
        }

        const hasVoted = await Vote.exists({ voterId: sessionId });
        const hasVotedByIp = await Vote.exists({ voterIp: clientIp });

        if (hasVoted || hasVotedByIp) {
            return res.status(403).send({ success: false, message: 'User has already voted.' });
        }

        if (!voterEthnicity || !voterGender) {
            return res.status(400).send({ success: false, message: 'Voter ethnicity and gender are required.' });
        }

        const geo = await geoip.lookup(clientIp as string);
        if (!geo) {
            return res.status(400).send({ success: false, message: 'We only accept vote from USA, Your vote is not registered on the server, Sorry! Unable to determine voter location.' })
        }

        const voterCountry = geo?.country;
        const voterRegion = geo?.region;
        const voterCity = geo?.city;

        if (voterCountry !== 'US') {
            return res.status(403).send({ success: false, message: 'Voting is only allowed from the United States, Sorry!' });
        }

        await Vote.create({
            candidate,
            voterId: sessionId,
            voterIp: clientIp,
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
        res.status(200).send({ success: true, voteTally: tallyObject });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
};
