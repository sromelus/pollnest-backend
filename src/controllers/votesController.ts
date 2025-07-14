import '../loadEnvironmentVariables';
import { RequestHandler } from 'express';
import { Poll, Vote, User, IUser } from '../models';
import mongoose, { Document } from 'mongoose';
import { tryCatch, voterLocationInfo } from '../utils';

type PollOption = {
    image?: string;
    pollOptionText: string;
    count: number;
    _id: string;
}

interface IPoll extends Document {
    pollOptions: PollOption[];
}


export default class VotesController {
    static getVotes: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const votes = await Vote.find({ pollId });
        res.status(200).json({ success: true, data: { votes } });
    });

    static createVote: RequestHandler = tryCatch(async (req, res) => {
        // just need to create a vote, no need to check for auth
        // we should abstract this to a query object or something
        // to be able to do
        // const updatedOption = await CastVote(req.body)

        const voterLocInfo = voterLocationInfo(req);

        // get all votes for the ip address
        const nonAuthVotes = await Vote.countDocuments({ voterIp: voterLocInfo.voterIp });

        const user = await User.exists({ _id: req.body.voterId });

        if (!user && nonAuthVotes >= 5) {
            res.status(403).send({
                success: false,
                message: 'You have reached the maximum number of free votes. Please create an account to vote more.'
            });
            return;
        }

        const vote = await Vote.create({ ...req.body, ...voterLocInfo });

        // check if the voter is a referred user
        if (vote.voterId) {
            const referredUser = await User.findById(vote.voterId) as IUser;

            if (referredUser && referredUser.referrerId && referredUser.points == 0) {
                await User.findByIdAndUpdate(referredUser.referrerId, { $inc: { referralPoints: 10 } });
            }
        }

        const poll = await Poll.findOneAndUpdate(
            {
                _id: vote.pollId,
                'pollOptions._id': vote.pollOptionId
            },
            {
                $inc: { 'pollOptions.$.count': 1 }
            },
            {
                new: true,
                runValidators: true
            }
        ) as IPoll | null;

        if (!poll) {
            res.status(404).send({
                success: false,
                message: 'Poll or option not found'
            });
            return;
        }

        let userData = {};
        // Only update stats if there's an authenticated user
        if (vote.voterId) {
            // Increment both points and vote count
            const user = await User.findByIdAndUpdate(
                vote.voterId,
                {
                    $inc: {
                        points: 1,
                        voteCount: 1
                    }
                },
                { new: true }
            );

            userData = {
                pointsEarned: 1,
                totalPoints: user?.points || 0,
                voteCount: user?.voteCount || 0
            };
        }

        const updatedOption = poll.pollOptions.find(option => option._id.toString() === vote.pollOptionId);

        res.status(201).send({
            success: true,
            message: 'Vote created successfully',
            data: {
                optionVoteTally: {
                    pollOptionText: updatedOption?.pollOptionText,
                    count: updatedOption?.count,
                    _id: updatedOption?._id
                },
                ...userData
            }
        });
    });

    static getPollVoters: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;

        // First, verify the poll exists
        const poll = await Poll.findById(pollId);
        if (!poll) {
            res.status(404).json({ 
                success: false, 
                message: 'Poll not found' 
            });
            return;
        }

        // Get all votes for this poll, including anonymous ones
        const allVotes = await Vote.find({ pollId: new mongoose.Types.ObjectId(pollId) })
            .populate('voterId', 'firstName lastName email points voteCount')
            .sort({ createdAt: -1 });

        // Separate registered and anonymous votes
        const registeredVotes = allVotes.filter(vote => vote.voterId != null);
        const anonymousVotes = allVotes.filter(vote => vote.voterId == null);

        // Group registered votes by voterId
        const votesByUser = registeredVotes.reduce((acc: Record<string, any[]>, vote: any) => {
            const userId = vote.voterId?.toString();
            if (userId) {
                if (!acc[userId]) {
                    acc[userId] = [];
                }
                acc[userId].push(vote);
            }
            return acc;
        }, {} as Record<string, any[]>);

        // Build the response for each user
        const voters = Object.entries(votesByUser).map( ([userId, userVotes]: [string, any[]]) => {
            const firstVote = userVotes[0];
            const user = firstVote.voterId as any;

            // Group this user's votes by voteOptionText and count them
            const votesByOption = userVotes.reduce((acc: Record<string, any[]>, vote: any) => {
                const optionText = vote.voteOptionText;
                if (!acc[optionText]) {
                    acc[optionText] = [];
                }
                acc[optionText].push(vote);
                return acc;
            }, {} as Record<string, any[]>);

            // Create votes array with user's vote counts for each option
            const votes = poll.pollOptions.map(option => {
                const userVotesForOption = votesByOption[option.pollOptionText] || [];

                return {
                    id: option._id?.toString(),
                    voteOptionText: option.pollOptionText,
                    totalVotes: userVotesForOption.length
                };
            });

            // Find the poll option with the most votes for this user
            const mostVotes = votes.reduce((max, current) => 
                current.totalVotes > max.totalVotes ? current : max
            );

            return {
                user: {
                    id: user?._id?.toString(),
                    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
                    email: user?.email,
                },
                votes,
                mostVotes,
            };
        });

        res.status(200).json({ 
            success: true, 
            message: 'Poll voters fetched successfully',
            data: { 
                poll: {
                    id: poll._id,
                    title: poll.title,
                    allowMultipleVotes: poll.allowMultipleVotes
                },
                voters,
            }
        });
    });

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

