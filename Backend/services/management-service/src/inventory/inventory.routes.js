'use strict';

import { Router } from 'express';
import {
    createInventoryItemPg,
    getInventoryByRestaurant,
    updateQuantity,
    updateInventoryItem,
    deleteInventoryItemPg,
} from './inventory.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Gestión de inventario y stock de productos en PostgreSQL
 */

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Crear un nuevo ítem en el inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, restaurant, stock, minStock, cost]
 *             properties:
 *               name: { type: string }
 *               restaurant: { type: string }
 *               stock: { type: number }
 *               minStock: { type: number }
 *               cost: { type: number }
 *     responses:
 *       201: { description: Ítem creado }
 */
router.post(
    '/',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    createInventoryItemPg
);

/**
 * @swagger
 * /inventory/{restaurantId}:
 *   get:
 *     summary: Obtener el inventario de un restaurante específico
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *         description: Filtrar solo productos con bajo stock
 *     responses:
 *       200: { description: Inventario obtenido }
 */
router.get(
    '/:restaurantId',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    getInventoryByRestaurant
);

/**
 * @swagger
 * /inventory/{id}/quantity:
 *   patch:
 *     summary: Actualizar la cantidad de un ítem de inventario
 *     tags: [Inventory]
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
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number }
 *               operation: { type: string, enum: [set, add, subtract], default: set }
 *     responses:
 *       200: { description: Stock actualizado }
 */
router.patch(
    '/:id/quantity',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    updateQuantity
);

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Actualizar un ítem de inventario completo
 *     tags: [Inventory]
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
 *               name: { type: string }
 *               quantity: { type: number }
 *               unit: { type: string }
 *               costPerUnit: { type: number }
 *               minStock: { type: number }
 *     responses:
 *       200: { description: Ítem actualizado }
 */
router.put(
    '/:id',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    updateInventoryItem
);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Eliminar (lógicamente) un ítem del inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ítem eliminado }
 */
router.delete(
    '/:id',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    deleteInventoryItemPg
);

export default router;
