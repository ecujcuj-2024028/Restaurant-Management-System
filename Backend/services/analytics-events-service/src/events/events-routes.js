'use strict';

import { Router } from 'express';
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    addFeaturedProduct,
    removeFeaturedProduct
} from './events-controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Gestión de eventos especiales y promociones en los restaurantes
 */

// públicos
/**
 * @swagger
 * /Eventos:
 *   get:
 *     summary: Obtener lista de todos los eventos activos
 *     tags: [Events]
 *     responses:
 *       200: { description: Lista de eventos obtenida }
 */
router.get('/', getEvents);

/**
 * @swagger
 * /Eventos/{id}:
 *   get:
 *     summary: Obtener detalles de un evento por ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detalles del evento }
 *       404: { description: Evento no encontrado }
 */
router.get('/:id', getEvent);

/**
 * @swagger
 * /Eventos:
 *   post:
 *     summary: Crear un nuevo evento (Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, date, restaurant]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               restaurant: { type: string }
 *     responses:
 *       201: { description: Evento creado }
 */
router.post('/', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), createEvent);

/**
 * @swagger
 * /Eventos/{id}:
 *   put:
 *     summary: Actualizar un evento existente
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *     responses:
 *       200: { description: Evento actualizado }
 */
router.put('/:id', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateEvent);

/**
 * @swagger
 * /Eventos/{id}/status:
 *   patch:
 *     summary: Cambiar el estado de un evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.patch('/:id/status', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateEventStatus);

/**
 * @swagger
 * /Eventos/{id}:
 *   delete:
 *     summary: Eliminar un evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Evento eliminado }
 */
router.delete('/:id', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), deleteEvent);

/**
 * @swagger
 * /Eventos/{id}/featured-products:
 *   post:
 *     summary: Agregar productos destacados a un evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *     responses:
 *       200: { description: Producto agregado }
 */
router.post('/:id/featured-products', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), addFeaturedProduct);

/**
 * @swagger
 * /Eventos/{id}/featured-products/{productId}:
 *   delete:
 *     summary: Remover un producto destacado del evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Producto removido }
 */
router.delete('/:id/featured-products/:productId', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), removeFeaturedProduct);

export default router;