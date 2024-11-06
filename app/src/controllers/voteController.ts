import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { profanity } from '@2toad/profanity';
import Vote from '../models/Vote';
import VoteTally from '../models/VoteTally';

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

let chatMessages: string[] = ['The choice is clear, vote for the candidate that will make America great again!'];

const handleChatMessage = (message: string, arr = chatMessages) => {
    message = message.trim();

    if (!message) {
        return;
    }

    if (chatMessages.length > 100) {
       chatMessages = chatMessages.slice(35);
    }

    // remove any profanity from the message
    const cleanedMessage = profanity.censor(message);

    // add the cleaned message to the chatMessages array
    chatMessages.push(cleanedMessage);

    // add a 'updated' value to the array to indicate that the chat messages have been updated
    chatMessages.push('updated');

    // remove the 'updated' value from the array after 5 seconds, to let the client know that the chat messages have been updated
    // this is to prevent the client from making unnecessary requests to the server
    setTimeout(() => {
        chatMessages = chatMessages.filter(msg => msg !== 'updated');
    }, 8000);

    return chatMessages;
}


const getClientInfo = (req: Request): ClientInfo => {
    return {
        ip: (req.headers['x-appengine-user-ip'] || req.headers['x-forwarded-for'] || req.ip) as string,
        city: req.headers['x-appengine-city'] as string,
        region: req.headers['x-appengine-region'] as string,
        country: req.headers['x-appengine-country'] as string,
    };
};

export const getChatMessages = async (req: Request, res: Response) => {
    res.send({ chatMessages });
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

    res.send({ voteTally: tallyObject, visitedUser: { disabledVote: hasVoted || hasVotedByIp, isRequestFromOutsideUS }, chatMessages });
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

        const chatMessages = handleChatMessage(`${chatMessage} - Showed UP!!`);

        res.status(200).send({ success: true, voteTally: tallyObject, chatMessages });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
};

export const postMessage = async (req: Request, res: Response) => {
    const { chatMessage } = req.body;

    handleChatMessage(chatMessage as string);

    res.status(200).send({ success: true });
};