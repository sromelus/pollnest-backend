import { Router } from 'express';
import { getVotes, castVote } from '../controllers/voteController';

const router = Router();

router.get('/', getVotes);
router.post('/', castVote);

export default router;
