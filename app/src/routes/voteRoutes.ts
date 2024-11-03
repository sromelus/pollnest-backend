import { RequestHandler, Router } from 'express';
import { getVotes, castVote } from '../controllers/voteController';
import rateLimit from 'express-rate-limit';
import { validateVote } from '../../middlewares/validateVote';

const router = Router();

const getVotesLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
});


const voteLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
});

router.get('/', getVotesLimiter, getVotes);
router.post('/', voteLimiter, validateVote, castVote as RequestHandler);

export default router;
