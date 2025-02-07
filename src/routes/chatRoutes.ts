import { Router } from 'express';
import { ChatController } from '../controllers';
import rateLimit from 'express-rate-limit';
import { validateCreateChatMessage } from '../validations';
const router = Router({ mergeParams: true });

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

router.get('/', ChatController.getChat);
router.post('/message', validateCreateChatMessage, ChatController.createChatMessage);

export default router;