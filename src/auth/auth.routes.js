import { Router } from 'express';
import { register, login, verifyEmail } from './auth.controller.js';
import { validateRegister } from '../../middlewares/validation.js';
import { authRateLimit } from '../../middlewares/request-limit.js';
import { validateVerifyEmail } from '../../middlewares/validation.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

router.post('/register', [authRateLimit, validateRegister], register);
router.post('/login', login);
router.post('/verify-email', validateVerifyEmail, verifyEmail);

router.get('/users-list', [
    validateJWT, 
    hasRole(ADMIN_SISTEMA)
], (req, res) => {
    res.json({ message: "Solo los administradores ven esto" });
});

export default router;