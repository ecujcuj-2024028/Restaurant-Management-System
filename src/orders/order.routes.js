import { Router } from 'express';
import {
  createOrder,
  cancelOrder,
  getOrderHistory,
  updateOrderStatus,
  getRestaurantOrders,
  getInvoice,
} from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de pedidos internos y facturación en el restaurante
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear un nuevo pedido interno
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableId, restaurantId, items]
 *             properties:
 *               tableId: { type: string }
 *               restaurantId: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: number }
 *     responses:
 *       201: { description: Pedido creado }
 */
router.post('/',           validateJWT, createOrder);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancelar un pedido interno
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Pedido cancelado }
 */
router.patch('/:id/cancel',     validateJWT, cancelOrder);

/**
 * @swagger
 * /orders/history:
 *   get:
 *     summary: Obtener historial de pedidos del usuario
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Historial recuperado }
 */
router.get('/history',   validateJWT, getOrderHistory);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de un pedido (Admin)
 *     tags: [Orders]
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
 *               status: { type: string, enum: [PENDING, PREPARING, READY, DELIVERED] }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.patch('/:id/status', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateOrderStatus);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar todos los pedidos del restaurante (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de pedidos }
 */
router.get('/',              validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), getRestaurantOrders);

/**
 * @swagger
 * /orders/{id}/invoice:
 *   get:
 *     summary: Generar factura de un pedido entregado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Factura generada }
 */
router.get('/:id/invoice',  validateJWT, getInvoice);

export default router;