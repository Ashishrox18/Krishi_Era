import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

// OTP-based registration
router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTPAndRegister);

// Traditional registration (without OTP)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);
router.put('/profile', authenticate, controller.updateProfile);

export default router;
