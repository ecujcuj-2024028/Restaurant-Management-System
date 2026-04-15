import { Router } from 'express';
import {
  createExternalOrder,
  cancelExternalOrder,
  getExternalOrderHistory,
  updateExternalOrderStatus,
  getRestaurantExternalOrders,
  getExternalOrderById,
  getExternalOrderInvoice
} from './external-order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole }     from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ExternalOrders
 *   description: Gestión de pedidos a domicilio y para llevar
 */

// ─── RUTAS DEL CLIENTE ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /external-orders:
 *   post:
 *     summary: Crear un nuevo pedido externo (Domicilio/Para llevar)
 *     tags: [ExternalOrders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, items, orderType, address]
 *             properties:
 *               restaurantId: { type: string }
 *               items: 
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: number }
 *               orderType: { type: string, enum: [domicilio, para_llevar] }
 *               address: { type: string }
 *     responses:
 *       201: { description: Pedido creado }
 */
router.post('/', validateJWT, createExternalOrder);

/**
 * @swagger
 * /external-orders/history:
 *   get:
 *     summary: Obtener historial de pedidos externos del cliente
 *     tags: [ExternalOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderType
 *         schema: { type: string, enum: [domicilio, para_llevar] }
 *     responses:
 *       200: { description: Historial recuperado }
 */
router.get('/history', validateJWT, getExternalOrderHistory);

/**
 * @swagger
 * /external-orders/{id}:
 *   get:
 *     summary: Ver detalles de un pedido externo específico
 *     tags: [ExternalOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detalles del pedido }
 */
router.get('/:id', validateJWT, getExternalOrderById);

/**
 * @swagger
 * /external-orders/{id}/cancel:
 *   patch:
 *     summary: Cancelar un pedido externo
 *     tags: [ExternalOrders]
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
router.patch('/:id/cancel', validateJWT, cancelExternalOrder);

/**
 * @swagger
 * /external-orders/{id}/invoice:
 *   get:
 *     summary: Generar factura de un pedido entregado
 *     tags: [ExternalOrders]
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
router.get('/:id/invoice', validateJWT, getExternalOrderInvoice);

// ─── RUTAS DE ADMINISTRADOR ─────────────────────────────────────────────────────

/**
 * @swagger
 * /external-orders:
 *   get:
 *     summary: Listar todos los pedidos externos del restaurante (Admin)
 *     tags: [ExternalOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: orderType
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de pedidos }
 */
router.get('/', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), getRestaurantExternalOrders);

/**
 * @swagger
 * /external-orders/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de un pedido (Admin)
 *     tags: [ExternalOrders]
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
 *               status: { type: string }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.patch('/:id/status', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateExternalOrderStatus);

export default router;
