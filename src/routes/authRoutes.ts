import { Router } from 'express';
import { AuthController } from '../controllers';
import { auth } from '../middlewares';

const router = Router();

router.post('/login', AuthController.login);
router.post('/logout', auth(), AuthController.logout);

export default router;