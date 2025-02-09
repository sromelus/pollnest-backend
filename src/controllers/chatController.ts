import { RequestHandler } from 'express';
import { Poll } from '../models';
import { tryCatch } from '../utils';

export default class ChatController {
    static getChat: RequestHandler = tryCatch(async (req, res) => {
        const { id } = req.params;
        const poll = await Poll.findById(id);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll chat fetched successfully', data: { messages: poll.messages } });
    });

    static createChatMessage: RequestHandler = tryCatch(async (req, res) => {
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
    });
}