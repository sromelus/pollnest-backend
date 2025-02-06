import { Request, Response } from 'express';
import { Poll } from '../models';

export default class ChatController {
    static async getChat(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ error: 'Poll not found' });
                return;
            }

            res.status(200).json({ messages: poll.messages });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch poll chat' });
        }
    }

    static async createChatMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content, userId } = req.body;
            console.log('************************************************* ', req.body, id);
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