'use strict';

import { Router } from 'express';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
} from './notification-controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

/**
 * ENDPOINT INTERNO (Usado por otros microservicios vía Gateway)
 */
router.post('/internal/create', createNotification);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Sistema de notificaciones en tiempo real para usuarios
 */

/**
 * @swagger
 * /restaurantManagement/v1/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Notifications]
 */
router.get('/', validateJWT, getMyNotifications);

/**
 * @swagger
 * /restaurantManagement/v1/notifications/mark-all-read:
 *   patch:
 *     summary: Marcar todas como leídas
 *     tags: [Notifications]
 */
router.patch('/mark-all-read', validateJWT, markAllAsRead);

/**
 * @swagger
 * /restaurantManagement/v1/notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notifications]
 */
router.patch('/:id/read', validateJWT, markAsRead);

/**
 * @swagger
 * /restaurantManagement/v1/notifications/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     tags: [Notifications]
 */
router.delete('/:id', validateJWT, deleteNotification);

export default router;
