import { Request, Response } from 'express';
import { Poll } from '../models';

type PollOptionType = {
    image?: string;
    pollOptionText: string;
    count: number;
    _id: string;
}

type PollType = {
    pollOptions: PollOptionType[];
}

export default class PollController {
    static async getPolls(req: Request, res: Response) {
        const polls = await Poll.find();

        res.status(200).json({ success: true, message: 'Polls fetched successfully', data: { polls } });
    }

    static async getPollOptions(req: Request, res: Response) {
        const { id } = req.params;
        const poll = await Poll.findById(id) as PollType | null;

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        const pollOptionsWithoutImage = poll.pollOptions.map(({ image, ...rest }) => rest);

        res.status(200).json({
            success: true,
            message: 'Poll options fetched successfully',
            data: { voteTallies: pollOptionsWithoutImage }
        });
    }

    static async getPoll(req: Request, res: Response) {
        const { id } = req.params;
        const poll = await Poll.findById(id)

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
    }

    static async createPoll(req: Request, res: Response) {
        try {
            const { title, description, pollOptions, creatorId } = req.body;
            const poll = await Poll.create({ title, description, pollOptions, creatorId });

            res.status(200).json({ success: true, message: 'Poll created successfully', data: { poll } });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to create poll', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ success: false, message: 'Internal server error', errors: (error as Error).message });
        }
    }

    static async updatePoll(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, description, userId } = req.body;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({success: false, message: 'Poll not found' });
                return;
            }

            if (title) poll.title = title;
            if (description) poll.description = description;
            if (userId) poll.userId = userId;

            await poll.save();

            res.status(200).json({ success: true, message: 'Poll updated successfully', data: { poll } });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to update poll', errors: (error as Error).message});
                return;
            }

            res.status(500).json({success: false, message: 'Internal server error', errors: (error as Error).message });
        }
    }

    static async deletePoll(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ success: false, message: 'Poll not found' });
                return;
            }

            poll.active = false;
            await poll.save();
            res.status(200).json({ success: true, message: 'Poll deleted successfully' });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({success: false, message: 'Internal server error', errors: (error as Error).message });
        }
    }
}