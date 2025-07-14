import { Router } from 'express';
import { PollsController, PollAccessController, ChatController, VotesController } from '../controllers';
import rateLimit from 'express-rate-limit';
import { validatePoll, validatePollUpdate, validateVote, validateCreateChatMessage } from '../validations';
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


// Poll access and sharing routes
router.get('/my_polls', auth(), PollAccessController.listPolls);
router.get('/my_polls/:pollId', auth(), PollAccessController.getPoll);
router.post('/:pollId/invites', auth(), PollAccessController.createPrivatePollInvites);
router.get('/private_poll_access/:accessToken', PollAccessController.accessPrivatePollWithToken);
router.post('/:pollId/public_poll_share_link', auth(), PollAccessController.createPublicPollShareLink);
router.get('/public_poll_access/:accessToken', PollAccessController.accessPublicPoll);

// Votes routes
router.get('/:pollId/votes', auth({ required: false }), VotesController.getVotes);
router.get('/:pollId/voters', auth({ required: false }), VotesController.getPollVoters);
router.post('/:pollId/votes', auth({ required: false }), validateVote, VotesController.createVote);

// Chat routes
router.post('/:pollId/chat/message', auth(), validateCreateChatMessage, ChatController.createChatMessage);
router.get('/:pollId/chat', auth({ required: false }), ChatController.getChat);

// Poll routes
router.get('/', auth({ required: false }), PollsController.listPolls);
router.post('/', auth(), validatePoll, PollsController.createPoll);
router.get('/:pollId', auth({ required: false }), PollsController.getPoll);
router.get('/slug/:slug', auth({ required: false }), PollsController.getPollBySlug);
router.get('/:pollId/options', auth({ required: false }), PollsController.getPollOptions);
router.put('/:pollId', auth(), validatePollUpdate, PollsController.updatePoll);
router.delete('/:pollId', auth(), PollsController.deletePoll);

export default router;