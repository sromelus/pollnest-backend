import { RequestHandler } from 'express';
import { Poll, User, UserRole, IUser } from '../models';
import AuthController from './authController';
import { generatePublicPollShareToken, verifyToken, generatePrivatePollInviteToken, tryCatch, JwtTokenType } from '../utils';

export default class PollAccessController {
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

    static createPrivatePollInvites: RequestHandler = tryCatch(async (req, res) => {
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

            // Verify user is the poll creator or admin
            if (poll.creatorId.toString() !== currentUserId && (await User.findById(currentUserId) as IUser).role !== UserRole.Admin) {
                res.status(403).json({
                    success: false,
                    message: 'Only poll creator can generate invite links'
                });
                return;
            }

            // Generate tokens for each email
            const inviteData = await Promise.all(emails.map(async (email: string) => {
                await AuthController.preRegisterUserWithEmail(email, null);
                // Generate token for user
                const token = generatePrivatePollInviteToken({
                    pollId: poll.id,
                    email,
                    type: 'private-poll-invite',
                    expiresIn
                });

                return {
                    email,
                    inviteAccessToken: token,
                    inviteAccessLink: `${process.env.FRONTEND_URL}/poll/${token}`,
                    expiresIn
                };
            }));

            res.status(200).json({
                success: true,
                message: 'Poll invites generated successfully',
                data: {
                    invites: inviteData
                }
            });
    });

    static accessPrivatePollWithToken: RequestHandler = tryCatch(async (req, res) => {
            const { accessToken } = req.params;

            // Verify accessToken
            const { decoded, error } = verifyToken(accessToken) as JwtTokenType;

            if (error || typeof decoded === 'string' || decoded?.type !== 'private-poll-invite') {
                res.status(403).json({
                    success: false,
                    message: 'Invalid or expired access token'
                });
                return;
            }

            // Get poll
            const poll = await Poll.findById(decoded?.pollId);
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

    static createPublicPollShareLink: RequestHandler = tryCatch(async (req, res) => {
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

        const token = generatePublicPollShareToken({ pollId, referrerId: currentUserId });

        res.status(200).json({
            success: true,
            message: 'Poll share link generated successfully',
            data: {
                shareToken: token,
                shareLink: `${process.env.FRONTEND_URL}/polls/${token}`
            }
        });
    })

    static accessPublicPoll: RequestHandler = tryCatch(async (req, res) => {
        const { accessToken } = req.params;

        const { decoded, error } = verifyToken(accessToken) as JwtTokenType;

        if (error || typeof decoded === 'string' || !decoded?.pollId) {
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

        res.cookie('referrerToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });

        res.status(200).json({
            success: true,
            message: 'Poll fetched successfully',
            data: { poll }
        });
    })
}