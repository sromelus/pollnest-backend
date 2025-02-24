import { Router } from 'express';
import { AuthController } from '../controllers';
import { auth } from '../middlewares';
import { validatePreRegister, validateRegister, validateLogin } from '../validations';

const router = Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/logout', auth(), AuthController.logout);
router.post('/pre-register', validatePreRegister, AuthController.preRegister);
router.post('/register', validateRegister, AuthController.register);
// router.post('/forgot-password', AuthController.forgotPassword);
// router.get('/reset-password/:token', AuthController.resetPassword);
// router.post('/refresh-token', AuthController.refreshToken);
router.put('/profile', auth(), AuthController.updateProfile);
router.delete('/profile', auth(), AuthController.deleteProfile);


export default router;