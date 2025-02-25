import { RequestHandler } from 'express';
import { Poll, IPoll } from '../models';
import { tryCatch } from '../utils';

export default class ChatController {
    static getChat: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;

        const poll = await Poll.findById(pollId);

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll chat fetched successfully', data: { messages: poll.messages } });
    });

    static createChatMessage: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const { content, userId } = req.body;

        const poll = await Poll.findByIdAndUpdate(
            pollId,
            { $push: { messages: { userId, content } } },
            { new: true }
        );

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(201).json({ success: true, message: 'Message added successfully', data: { message: poll.messages[poll.messages.length - 1] } });
    });
}