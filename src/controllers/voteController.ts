import { Request, Response } from 'express';
import { Poll, Vote } from '../models';
import { Document } from 'mongoose';
import '../loadEnvironmentVariables';
import { envConfig } from '../config/environment';

interface PollOption {
    pollOptionText: string;
    count: number;
    _id: string;
}

interface IPoll extends Document {
    pollOptions: PollOption[];
}

interface VoterLocationInfo {
    voterIp: string;
    voterCity: string;
    voterRegion: string;
    voterCountry: string;
}

const getVoterLocationInfo = (req: Request): VoterLocationInfo => {
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

export default class VoteController {
    static async createVote(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const poll = await Poll.findById(id) as IPoll | null;

            if (!poll) {
                res.status(404).send({ success: false, message: 'Poll not found for this vote' });
                return;
            }

            const voterLocationInfo = getVoterLocationInfo(req);

            await Vote.create({ pollId: id, ...req.body, ...voterLocationInfo });

            const { voterVoteOptionId } = req.body;

            const pollOption = poll.pollOptions.find((option: PollOption) => option._id == voterVoteOptionId);

            if (!pollOption) {
                res.status(404).send({ success: false, message: 'Option not found for this vote' });
                return;
            }

            pollOption.count += 1;

            await poll.save();

            res.status(201).send({ success: true, message: 'Vote created successfully', voteTally: poll.pollOptions });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            console.error('Error creating vote:', error);
            res.status(500).send({ success: false, message: 'Internal server error' });
        }
    }
}


// import { v4 as uuidv4 } from 'uuid';
// import { profanity } from '@2toad/profanity';
// import Vote from '../models/Vote';
// import VoteTally from '../models/VoteTally';

// interface Votes {
//   voterEthnicity: string;
//   voterGender: string;
//   candidate: string;
//   voterId: string;
//   chatMessage?: string;
// };

// interface ClientInfo {
//   ip: string;
//   city?: string;
//   region?: string;
//   country?: string;
// }

// let chatMessages: string[] = ['The choice is clear, vote for the candidate that will make America great again!'];

// const handleChatMessage = (message: string, voterRegion: string, voterCity: string) => {
//     message = message.trim();

//     if (!message) {
//         return;
//     }

//     if (chatMessages.length > 100) {
//        chatMessages = chatMessages.slice(35);
//     }

//     const cleanedMessage = profanity.censor(message);

//     chatMessages.push(cleanedMessage);

//     // remove the 'updated' value from the array after 5 seconds, to let the client know that the chat messages have been updated
//     // this is to prevent the client from making unnecessary requests to the server
//     setTimeout(() => {
//         chatMessages = chatMessages.filter(msg => msg !== 'updated');
//     }, 8000);

//     return chatMessages;
// }


// const getClientInfo = (req: Request): ClientInfo => {
//     return {
//         ip: (req.headers['x-appengine-user-ip'] || req.headers['x-forwarded-for'] || req.ip) as string,
//         city: req.headers['x-appengine-city'] as string,
//         region: req.headers['x-appengine-region'] as string,
//         country: req.headers['x-appengine-country'] as string,
//     };
// };

// export const getChatMessages = async (req: Request, res: Response) => {
//     res.send({ chatMessages });
// };

// export const getVotes = async (req: Request, res: Response) => {
//     let sessionId = req.cookies?.sessionId;
//     const clientInfo = getClientInfo(req);

//     const hasVoted = await Vote.exists({ voterId: sessionId });
//     const hasVotedByIp = await Vote.exists({ voterIp: clientInfo.ip });

//     const isRequestFromOutsideUS = clientInfo.country !== 'US';

//     const voteTally = await VoteTally.find().lean();

//     const tallyObject = voteTally.reduce((acc, curr) => {
//       acc[curr.candidate] = curr.count;
//       return acc;
//     }, {} as Record<string, number>);

//     res.send({ voteTally: tallyObject, visitedUser: { disabledVote: hasVoted || hasVotedByIp, isRequestFromOutsideUS }, chatMessages });
// };

// export const castVote = async (req: Request, res: Response) => {
//     try {
//         let sessionId = req.cookies?.sessionId;
//         const clientInfo = getClientInfo(req);

//         const { candidate, voterEthnicity, voterGender, chatMessage } = req.body as Votes;

//         if (!sessionId) {
//             sessionId = uuidv4();
//         }

//         const hasVoted = await Vote.exists({ voterId: Math.floor(Math.random()) });
//         const hasVotedByIp = await Vote.exists({ voterIp: Math.floor(Math.random()) });

//         // const hasVoted = await Vote.exists({ voterId: Math.floor(Math.random()) || sessionId });
//         // const hasVotedByIp = await Vote.exists({ voterIp: Math.floor(Math.random()) || clientInfo.ip });

//         if (hasVoted || hasVotedByIp) {
//             return res.status(403).send({ success: false, message: 'User has already voted.' });
//         }

//         const voterCountry = clientInfo.country?.toUpperCase() || 'US';
//         const voterRegion = clientInfo.region?.toUpperCase() || 'ma';
//         const voterCity = clientInfo.city?.toUpperCase() || 'boston';

//         if (!voterCountry) {
//             return res.status(400).send({ success: false, message: 'Unable to determine voter location.' });
//         }

//         if (voterCountry !== 'US') {
//             return res.status(403).send({ success: false, message: 'Voting is only allowed from the United States, Sorry!' });
//         }

//         await Vote.create({
//             candidate,
//             voterId: Math.floor(Math.random() * 1000) || sessionId,
//             voterIp: Math.floor(Math.random() * 1000) || clientInfo.ip,
//             voterCountry,
//             voterRegion,
//             voterCity,
//             voterEthnicity,
//             voterGender
//         });

//         await VoteTally.findOneAndUpdate(
//             { candidate },
//             { $inc: { count: 1 }, lastUpdated: new Date() },
//             { upsert: true }
//         );

//         const voteTally = await VoteTally.find().lean();
//         const tallyObject = voteTally.reduce((acc, curr) => {
//             acc[curr.candidate] = curr.count;
//             return acc;
//         }, {} as Record<string, number>);

//         res.cookie('sessionId', sessionId, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             maxAge: 1000 * 60 * 60 * 24 * 60,
//             sameSite: 'none',
//         });

//         const chatMessages = handleChatMessage(chatMessage as string, voterRegion as string, voterCity as string);

//         res.status(200).send({ success: true, voteTally: tallyObject, chatMessages });
//     } catch (error) {
//         console.error('Error casting vote:', error);
//         res.status(500).send({ success: false, message: 'Internal server error' });
//     }
// };

// export const postMessage = async (req: Request, res: Response) => {
//     const { chatMessage } = req.body;

//     const clientInfo = getClientInfo(req);

//     const voterRegion = clientInfo.region?.toUpperCase();
//     const voterCity = clientInfo.city?.toUpperCase();

//     handleChatMessage(chatMessage as string, voterRegion as string, voterCity as string);

//     res.status(200).send({ success: true });
// };

