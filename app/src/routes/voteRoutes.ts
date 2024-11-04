import { RequestHandler, Router } from 'express';
import { getVotes, castVote, postMessage } from '../controllers/voteController';
import rateLimit from 'express-rate-limit';
import { validateVote, validateMessage } from '../../middlewares';
const router = Router();

const getVotesLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
});

const voteLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
});

const messageLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 200,
    message: { error: 'You have exceeded the maximum number of messages. Please try again in 30 minutes.' },
});

router.get('/', getVotesLimiter, getVotes);
router.post('/', voteLimiter, validateVote, castVote as RequestHandler);
router.post('/chat', messageLimiter, validateMessage, postMessage as RequestHandler);

export default router;
