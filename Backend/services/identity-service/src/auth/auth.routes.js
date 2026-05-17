import { Router } from 'express';
import {
    register,
    login,
    verifyEmail,
    handleRoleRequest,
    getRoleRequests,
    approveRoleRequest,
    rejectRoleRequest,
    requestRoleUpgrade,
    forgotPassword,
    resetPassword,
} from './auth.controller.js';
import { validateRegister, validateVerifyEmail, validateForgotPassword, validateResetPassword } from '../../middlewares/validation.js';
import { authRateLimit, emailRateLimit } from '../../middlewares/request-limit.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { CLIENTE, ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de roles
 */

/**
 * @swagger
 * /auth/role-upgrade:
 *   post:
 *     summary: Solicitar un ascenso de rol (ej. a Admin de Restaurante)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestedRole: { type: string }
 *     responses:
 *       200: { description: Solicitud enviada }
 */
router.post(
    '/role-upgrade',
    validateJWT,
    hasRole(CLIENTE, ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    requestRoleUpgrade
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, surname, username, email, password, phone]
 *             properties:
 *               name: { type: string }
 *               surname: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Usuario registrado }
 */
router.post('/register', [authRateLimit, validateRegister], register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailOrUsername, password]
 *             properties:
 *               emailOrUsername: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso, retorna JWT }
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verificar el correo electrónico mediante un token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Email verificado }
 */
router.post('/verify-email', validateVerifyEmail, verifyEmail);

/* ============================================================
   RESET DE CONTRASEÑA 
   ============================================================ */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Correo enviado }
 */
router.post('/forgot-password', [emailRateLimit, validateForgotPassword], forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Contraseña actualizada }
 */
router.post('/reset-password', validateResetPassword, resetPassword);

/* ============================================================
   GESTIÓN DE ROLES (ADMIN ROOT)
   ============================================================ */

/**
 * @swagger
 * /auth/role-requests/{id}/approve:
 *   get:
 *     summary: Aprobar una solicitud de cambio de rol
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Token de aprobación enviado por correo
 *     responses:
 *       200: { description: Solicitud aprobada }
 *       403: { description: Token inválido }
 */
router.get('/role-requests/:id/approve', handleRoleRequest);

/**
 * @swagger
 * /auth/role-requests/{id}/reject:
 *   get:
 *     summary: Rechazar una solicitud de cambio de rol
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Token de rechazo enviado por correo
 *     responses:
 *       200: { description: Solicitud rechazada }
 *       403: { description: Token inválido }
 */
router.get('/role-requests/:id/reject', handleRoleRequest);

/**
 * @swagger
 * /auth/role-requests:
 *   get:
 *     summary: Listar todas las solicitudes de cambio de rol (Solo Admin)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Lista de solicitudes }
 */
router.get(
    '/role-requests',
    validateJWT,
    hasRole(ADMIN_SISTEMA),
    getRoleRequests
);

router.patch(
    '/role-requests/:id/approve',
    validateJWT,
    hasRole(ADMIN_SISTEMA),
    approveRoleRequest
);

router.patch(
    '/role-requests/:id/reject',
    validateJWT,
    hasRole(ADMIN_SISTEMA),
    rejectRoleRequest
);

export default router;
