'use strict';

import { Router } from 'express';
import {
    crearReview,
    getReviewsPorPlato,
    getPlatosMasVendidos,
    getStatsAdmin
} from './analytics.controller.js';

const router = Router();

// ─── RUTAS DE REVIEWS ──────
/**
 * POST /restaurantManagement/v1/analytics/reviews
 * Clientes publican su reseña tras el consumo.
 * Body: { usuarioId, restauranteId, platoId, rating, comentario, consumo? }
 */
router.post('/reviews', crearReview);

/**
 * GET /restaurantManagement/v1/analytics/reviews/plato/:platoId
 * Devuelve todas las reseñas activas de un plato + promedio de rating.
 */
router.get('/reviews/plato/:platoId', getReviewsPorPlato);

// ─── RUTAS DE ESTADÍSTICAS ──────
/**
 * GET /restaurantManagement/v1/analytics/platos/mas-vendidos
 * Retorna los platos más pedidos (conteo de apariciones en reviews).
 * Query params opcionales:
 *   ?limite=10          → número de resultados (default: 10)
 *   ?restauranteId=xxx  → filtrar por restaurante
 */
router.get('/platos/mas-vendidos', getPlatosMasVendidos);

/**
 * GET /restaurantManagement/v1/analytics/stats
 * Endpoint Admin: datos crudos de ingresos, ocupación y satisfacción.
 * Query params opcionales:
 *   ?meses=6  → rango de meses hacia atrás (default: 6)
 */
router.get('/stats', getStatsAdmin);

export default router;