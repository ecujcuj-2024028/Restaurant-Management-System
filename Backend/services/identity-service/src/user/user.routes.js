'use strict';

import { Router } from 'express';
import { getProfile, getUsers, getUserById, updateProfile, updateProfilePicture, changePassword, saveExpoToken } from './user.controller.js';
import { uploadUserProfileImage } from '../../middlewares/restaurant-uploader.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gestión de perfiles de usuario
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener listado de usuarios del sistema
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre, apellido, usuario o correo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: No autorizado
 */
router.get(
    '/',
    hasRole(ADMIN_SISTEMA),
    getUsers
);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar datos básicos del perfil
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               surname: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /users/profile/picture:
 *   patch:
 *     summary: Actualizar la foto de perfil
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto actualizada con éxito
 */
router.patch(
    '/profile/picture',
    uploadUserProfileImage.single('image'),
    updateProfilePicture
);

router.patch('/profile/password', changePassword);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por su ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario encontrado }
 *       404: { description: Usuario no encontrado }
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /users/profile/notifications/token:
 *   post:
 *     summary: Guardar el token de Expo para notificaciones push
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expoToken: { type: string }
 *     responses:
 *       200: { description: Token guardado correctamente }
 */
router.post('/profile/notifications/token', saveExpoToken);

export default router;