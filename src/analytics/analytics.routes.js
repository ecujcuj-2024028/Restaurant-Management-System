'use strict';

import { Router } from 'express';
import {
    crearReview,
    getReviewsPorPlato,
    getPlatosMasVendidos,
    getStatsAdmin,
    getStatsByRestaurant
} from './analytics.controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js'

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Análisis de datos, reseñas y estadísticas de consumo
 */

// ─── RUTAS DE REVIEWS ──────
/**
 * @swagger
 * /analytics/reviews:
 *   post:
 *     summary: Publicar una nueva reseña de un plato
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuarioId, restauranteId, platoId, rating, comentario]
 *             properties:
 *               usuarioId: { type: string }
 *               restauranteId: { type: string }
 *               platoId: { type: string }
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comentario: { type: string }
 *               consumo: { type: string, description: "Opcional: ID de la orden de consumo" }
 *     responses:
 *       201: { description: Reseña creada exitosamente }
 *       401: { description: No autorizado }
 */
router.post('/reviews', validateJWT, crearReview);

/**
 * @swagger
 * /analytics/reviews/plato/{platoId}:
 *   get:
 *     summary: Obtener todas las reseñas de un plato específico
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: platoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de reseñas y promedio de rating }
 */
router.get('/reviews/plato/:platoId', getReviewsPorPlato);

// ─── RUTAS DE ESTADÍSTICAS ──────
/**
 * @swagger
 * /analytics/platos/mas-vendidos:
 *   get:
 *     summary: Listar los platos más vendidos
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: restauranteId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de platos destacados }
 */
router.get('/platos/mas-vendidos', getPlatosMasVendidos);

/**
 * @swagger
 * /analytics/stats:
 *   get:
 *     summary: Obtener estadísticas globales (Admin Sistema)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meses
 *         schema: { type: integer, default: 6 }
 *     responses:
 *       200: { description: Datos de ingresos, ocupación y satisfacción }
 *       403: { description: Acceso denegado - Se requiere rol ADMIN_SISTEMA }
 */
router.get('/stats', validateJWT, hasRole(ADMIN_SISTEMA), getStatsAdmin);

/**
 * @swagger
 * /analytics/stats/restaurant/{restaurantId}:
 *   get:
 *     summary: Obtener estadísticas de un restaurante específico
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Estadísticas detalladas del restaurante }
 */
router.get('/stats/restaurant/:restaurantId',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    getStatsByRestaurant
);

export default router;