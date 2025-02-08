import { Request, Response } from 'express';
import { Poll } from '../models';

export default class ChatController {
    static async getChat(req: Request, res: Response) {
        const { id } = req.params;
        const poll = await Poll.findById(id);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll chat fetched successfully', data: { messages: poll.messages } });
    }

    static async createChatMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content, userId } = req.body;

            const poll = await Poll.findById(id);

            if (!poll) {
                res.status(404).json({ success: false, message: 'Poll not found' });
                return;
            }

            const message = { userId, content };

            poll.messages.push(message);
            await poll.save();

            res.status(201).json({ success: true, message: 'Message added successfully', data: { message: poll.messages[poll.messages.length - 1] } });
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({success: false, message: 'Failed to add message to poll', errors: (error as Error).message});
                return;
            }

            res.status(500).json({ success: false, message: 'Internal server error', errors: (error as Error).message });
        }
    }
}