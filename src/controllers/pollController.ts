import { RequestHandler } from 'express';
import { Poll, IPoll } from '../models';
import { tryCatch } from '../utils';

export default class PollController {
    static getPolls: RequestHandler = tryCatch(async (req, res) => {
        const polls = await Poll.find();

        res.status(200).json({ success: true, message: 'Polls fetched successfully', data: { polls } });
    });

    static getPollOptions: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId) as IPoll | null;

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
    });

    static getPoll: RequestHandler = tryCatch(async (req, res) => {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId)

        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Poll fetched successfully', data: { poll } });
    });

    static createPoll: RequestHandler = tryCatch(async (req, res) => {
        const { title, description, pollOptions, creatorId } = req.body;
        const poll = await Poll.create({ title, description, pollOptions, creatorId });

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