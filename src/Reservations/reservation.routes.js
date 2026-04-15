'use strict';

import { Router } from 'express';
import {
    createReservation,
    getMyReservations,
    getReservationsByRestaurant,
    cancelReservation,
} from './reservation.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestión de reservaciones de mesas en los restaurantes
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crear una nueva reserva
 *     description: Verifica la disponibilidad real de la mesa antes de confirmar.
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableId, restaurantId, date, time]
 *             properties:
 *               tableId: { type: string }
 *               restaurantId: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string, pattern: "^[0-9]{2}:[0-9]{2}$" }
 *               guestCount: { type: number, default: 1 }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Reserva creada }
 *       400: { description: Mesa no disponible o datos inválidos }
 */
router.post('/', createReservation);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Listar mis reservaciones (Cliente)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Lista de reservaciones }
 */
router.get('/', getMyReservations);

/**
 * @swagger
 * /reservations/restaurant/{restaurantId}:
 *   get:
 *     summary: Listar todas las reservaciones de un restaurante (Admin)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de reservaciones del restaurante }
 */
router.get('/restaurant/:restaurantId', getReservationsByRestaurant);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   patch:
 *     summary: Cancelar una reserva y liberar la mesa
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reserva cancelada }
 */
router.patch('/:id/cancel', cancelReservation);

export default router;