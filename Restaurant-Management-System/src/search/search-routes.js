'use strict';

import { Router } from 'express';
import {
    globalSearch,
    searchRestaurants,
    searchProducts,
} from './search-controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Motor de búsqueda global para restaurantes, platos y categorías
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Búsqueda global (Restaurantes + Productos)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Término de búsqueda
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200: { description: Resultados de búsqueda }
 */
router.get('/', globalSearch);

/**
 * @swagger
 * /search/restaurants:
 *   get:
 *     summary: Buscar solo restaurantes con filtros avanzados
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: availability
 *         description: Si es true, solo muestra restaurantes con mesas libres ahora
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Lista de restaurantes filtrada }
 */
router.get('/restaurants', searchRestaurants);

/**
 * @swagger
 * /search/products:
 *   get:
 *     summary: Buscar solo platos o productos del catálogo
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200: { description: Lista de productos filtrada }
 */
router.get('/products', searchProducts);

export default router;