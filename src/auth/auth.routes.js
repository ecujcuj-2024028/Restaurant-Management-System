import { Router } from 'express';
import { register, login, verifyEmail } from './auth.controller.js';
import { validateRegister } from '../../middlewares/validation.js';
import { authRateLimit } from '../../middlewares/request-limit.js';
import { validateVerifyEmail } from '../../middlewares/validation.js';

const router = Router();

router.post('/register', [authRateLimit, validateRegister], register);
router.post('/login', login);
router.post('/verify-email', validateVerifyEmail, verifyEmail);

export default router;