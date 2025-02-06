import { Request, Response } from 'express';
import { Poll } from '../models';

export default class PollController {
    static async getPolls(req: Request, res: Response) {
        try {
            const polls = await Poll.find();

            res.status(200).json({ polls });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ error: 'Failed to fetch polls' });
        }
    }

    static async getPoll(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            res.status(200).json({ poll });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ error: 'Failed to fetch poll' });
        }
    }

    static async createPoll(req: Request, res: Response) {
        try {
            const { title, description, pollOptions, userId } = req.body;
            const poll = await Poll.create({ title, description, pollOptions, userId });

            res.status(200).json({ poll });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(400).json({ error: error });
        }
    }

    static async updatePoll(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, description, userId } = req.body;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            if (title) poll.title = title;
            if (description) poll.description = description;
            if (userId) poll.userId = userId;

            await poll.save();

            res.status(200).json({ poll });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ error: 'Failed to update poll' });
        }
    }

    static async deletePoll(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            await poll.deleteOne();
            res.status(200).json({ message: 'Poll deleted successfully' });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ error: 'Failed to delete poll' });
        }
    }

    static async getPollChat(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            res.status(200).json({ messages: poll.messages });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }
            res.status(500).json({ error: 'Failed to fetch poll chat' });
        }
    }

    static async createPollChatMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content, userId } = req.body;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            const message = { userId, content };

            poll.messages.push(message);
            await poll.save();

            res.status(200).json({ messages: poll.messages });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Validation error', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ error: 'Failed to add message to poll' });
        }
    }
}