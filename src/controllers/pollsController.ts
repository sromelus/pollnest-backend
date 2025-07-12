import { RequestHandler } from 'express';
import { Poll, IPoll, UserRole } from '../models';
import { tryCatch } from '../utils';

export default class PollsController {
    static listPolls: RequestHandler = tryCatch(async (req, res) => {
        const { role } = req as any;

        let polls;
        if (role === UserRole.Admin) {
            polls = await Poll.find().sort({ createdAt: -1 });
        } else {
            polls = await Poll.find({ public: true }).sort({ createdAt: -1 });
        }

        res.status(200).json({ success: true, message: 'Polls fetched successfully', data: { polls } });
    });

    static getPollOptions: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId) as IPoll | null;

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        // Remove image_alt from response (keeping imageUrl, color, and other fields)
        const pollOptionsWithoutImageAlt = poll.pollOptions.map(({ image_alt, ...rest }) => rest);

        res.status(200).json({
            success: true,
            message: 'Poll options fetched successfully',
            data: { voteTallies: pollOptionsWithoutImageAlt }
        });
    });

    static getPoll: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        // Public polls are accessible to everyone
        if (poll.public) {
            res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
            return;
        }

        // For private polls, check if user is creator or admin
        if (poll.creatorId.toString() === (req as any).currentUserId || (req as any).role === UserRole.Admin) {
            res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
            return;
        }

        // If none of the above conditions are met, return unauthorized
        res.status(403).json({
            success: false,
            message: 'Poll is not public'
        });
    });

    static getPollBySlug: RequestHandler = tryCatch(async (req, res) => {
        const { slug } = req.params;
        const poll = await Poll.findOne({ slug });

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        // Public polls are accessible to everyone
        if (poll.public) {
            res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
            return;
        }

        // For private polls, check if user is creator or admin
        if (poll.creatorId.toString() === (req as any).currentUserId || (req as any).role === UserRole.Admin) {
            res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
            return;
        }

        // If none of the above conditions are met, return unauthorized
        res.status(403).json({
            success: false,
            message: 'Poll is not public'
        });
    });

    static createPoll: RequestHandler = tryCatch(async (req, res) => {
        const { title, description, pollOptions, creatorId } = req.body;
        
        // Generate slug from title
        const generateSlug = (title: string): string => {
            return title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };
        
        const baseSlug = generateSlug(title);
        const slug = baseSlug + '-' + Math.random().toString(36).substr(2, 9);
        
        const poll = await Poll.create({ 
            title, 
            description, 
            pollOptions, 
            creatorId, 
            slug 
        });

        res.status(201).json({ success: true, message: 'Poll created successfully', data: { poll } });
    });

    static updatePoll: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const { title, description } = req.body;
        const poll = await Poll.findById(pollId);

        if (!poll) {
            res.status(404).json({success: false, message: 'Poll not found' });
            return;
        }

        if (title) poll.title = title;
        if (description) poll.description = description;

        await poll.save();

        res.status(200).json({ success: true, message: 'Poll updated successfully', data: { poll } });
    });

    static deletePoll: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        poll.active = false;

        await poll.save();

        res.status(200).json({ success: true, message: 'Poll deleted successfully' });
    });
}
