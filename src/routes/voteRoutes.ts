import { Router } from 'express';
import { getVotes, castVote } from '../controllers/voteController';
import rateLimit from 'express-rate-limit';

const router = Router();

const voteLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
});

router.get('/', getVotes);
router.post('/', voteLimiter, castVote);

export default router;
