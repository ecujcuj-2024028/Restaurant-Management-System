'use strict';
import { Router } from 'express';
import { getProfile, updateProfile, updateProfilePicture } from './user.controller.js';
import { uploadRestaurantImage } from '../../middlewares/restaurant-uploader.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gestión de perfiles de usuario
 */

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
    uploadRestaurantImage.single('image'),
    updateProfilePicture
);

export default router;