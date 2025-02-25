import { Router } from 'express';
import { PollsController, PollAccessController } from '../controllers';
import rateLimit from 'express-rate-limit';
import { validatePoll, validatePollUpdate } from '../validations';
import { auth } from '../middlewares';
const router = Router();



const getVotesLimiter = rateLimit({
    // windowMs: 2 * 60 * 1000,
    // max: 500,
    // message: { error: 'You have exceeded the maximum number of requests. Please try again in 2 minutes.' },
});

const voteLimiter = rateLimit({
    // windowMs: 24 * 60 * 60 * 1000,
    // max: 3,
    // message: { error: 'You have exceeded the maximum number of votes. Please try again tomorrow.' },
});

const messageLimiter = rateLimit({
    // windowMs: 30 * 60 * 1000,
    // max: 200,
    // message: { error: 'You have exceeded the maximum number of messages. Please try again in 30 minutes.' },
});

// router.get('/', getVotesLimiter, registrationController.signUp);

// router.get('/my_polls', auth(), PollAccessController.listPolls);
// router.get('/my_polls/:pollId', auth(), PollAccessController.getPoll);
// router.get('/:shareToken/share', PollAccessController.getSharePoll);
// router.post('/:pollId/share', auth(), PollAccessController.sharePoll);
// router.post('/:pollId/invites', auth(), PollAccessController.generatePollInvites);
// router.get('/access/:token', PollAccessController.accessPollWithToken);

export default router;