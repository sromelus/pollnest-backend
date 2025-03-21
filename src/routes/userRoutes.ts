import { RequestHandler, Router } from 'express';
import { UsersController } from '../controllers';
import rateLimit from 'express-rate-limit';
import { validateUpdateUser, validateUser } from '../validations';
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

router.get('/', auth(), UsersController.listUsers);
router.get('/:userId', auth(), UsersController.getUser);
router.post('/', auth(), validateUser, UsersController.createUser);
router.put('/:userId', auth(), validateUpdateUser, UsersController.updateUser);
router.delete('/:userId', auth(), UsersController.deleteUser);

export default router;