import { RequestHandler } from 'express';
import { Poll, User, UserRole, IUser } from '../models';
import { generateShareToken, verifyToken, generateInviteToken, tryCatch } from '../utils';

export class PollAccessController {
    static listPolls: RequestHandler = tryCatch(async (req, res) => {
        const { currentUserId } = (req as any);

        const polls = await Poll.find({ creatorId: currentUserId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: 'Polls fetched successfully', data: { polls } });
    });

    static getPoll: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const { currentUserId, role } = (req as any);

        if (role !== UserRole.Subscriber) {
            res.status(403).json({ success: false, message: 'You are not authorized to access this poll' });
            return;
        }

        const poll = await Poll.findById(pollId);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        if (poll.creatorId.toString() !== currentUserId && (await User.findById(currentUserId) as IUser).role !== UserRole.Admin) {
            res.status(403).json({ success: false, message: 'You are not authorized to access this poll' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
    });

    static generatePollInvites: RequestHandler = tryCatch(async (req, res) => {
            const { pollId } = req.params;
            const { emails, expiresIn = 1000 * 60 * 60 * 24 * 7 } = req.body;
            const { currentUserId } = (req as any);

            // Verify poll exists and is private
            const poll = await Poll.findById(pollId);
            if (!poll) {
                res.status(404).json({
                    success: false,
                    message: 'Poll not found'
                });
                return;
            }

            // Verify user is poll creator or admin
            if (poll.creatorId.toString() !== currentUserId && (await User.findById(currentUserId) as IUser).role !== UserRole.Admin) {
                res.status(403).json({
                    success: false,
                    message: 'Only poll creator can generate invite links'
                });
                return;
            }

            // Generate tokens for each email
            const invites = emails.map((email: string) => {
                const token = generateInviteToken({
                    pollId: poll.id,
                    email,
                    type: 'poll-invite',
                    expiresIn
                });

                return {
                    email,
                    accessToken: token,
                    accessLink: `${process.env.FRONTEND_URL}/poll/${token}`,
                    expiresIn
                };
            });

            res.status(200).json({
                success: true,
                message: 'Poll invites generated successfully',
                data: {
                    invites
                }
            });
    });

    static accessPollWithToken: RequestHandler = tryCatch(async (req, res) => {
            const { token } = req.params;

            // Verify token
            const decoded = verifyToken(token);

            if (typeof decoded === 'string' || decoded.type !== 'poll-invite') {
                res.status(403).json({
                    success: false,
                    message: 'Invalid or expired access token'
                });
                return;
            }

            // Get poll
            const poll = await Poll.findById(decoded.pollId);
            if (!poll) {
                res.status(404).json({
                    success: false,
                    message: 'Poll not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    poll: poll,
                }
            });
    })

    static createShareLink: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const { currentUserId } = (req as any);

        const poll = await Poll.findById(pollId);
        if (!poll) {
            res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
            return;
        }

        const token = generateShareToken({ pollId, referrerId: currentUserId });

        res.status(200).json({
            success: true,
            message: 'Poll share link generated successfully',
            data: {
                shareToken: token,
                shareLink: `${process.env.FRONTEND_URL}/polls/${token}`
            }
        });
    })

    static getSharedPoll: RequestHandler = tryCatch(async (req, res) => {
        const { shareToken } = req.params;

        const decoded = verifyToken(shareToken);
        if (typeof decoded === 'string' || !decoded.pollId) {
            res.status(403).json({
                success: false,
                message: 'Invalid or expired access token'
            });
            return;
        }

        const poll = await Poll.findById(decoded.pollId);
        if (!poll) {
            res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
            return;
        }

        res.cookie('referrerToken', shareToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({
            success: true,
            message: 'Poll fetched successfully',
            data: { poll }
        });
    })
}