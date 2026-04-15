import { Router } from 'express';
import Table from './table.model.js';
import {
    createTable,
    getTables,
    getTablesByRestaurant,
    updateTableStatus
} from './table.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { validateOwnership } from '../../middlewares/validate-ownership.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { hasRole } from '../../middlewares/hasRole.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Gestión de mesas y su disponibilidad en los restaurantes
 */

/**
 * @swagger
 * /tables/create:
 *   post:
 *     summary: Crear una nueva mesa (Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [number, capacity, restaurantId]
 *             properties:
 *               number: { type: number }
 *               capacity: { type: number }
 *               restaurantId: { type: string }
 *     responses:
 *       201: { description: Mesa creada }
 */
router.post('/create', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), createTable);

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Obtener todas las mesas del sistema (Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de mesas }
 */
router.get('/', validateJWT, getTables);

/**
 * @swagger
 * /tables/restaurant/{restaurantId}:
 *   get:
 *     summary: Obtener las mesas de un restaurante específico
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de mesas del restaurante }
 */
router.get('/restaurant/:restaurantId', validateJWT, getTablesByRestaurant);

/**
 * @swagger
 * /tables/{tableId}/status:
 *   patch:
 *     summary: Actualizar el estado/disponibilidad de una mesa
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [AVAILABLE, OCCUPIED, RESERVED] }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.patch('/:tableId/status', [
    validateJWT,
    validateOwnership(Table)
], updateTableStatus);

export default router;