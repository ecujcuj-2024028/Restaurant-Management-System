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

// ─── RUTAS DEL CLIENTE ──────────────────────────────────────────────────────────

// POST   /external-orders ---Crear pedido (domicilio o para llevar)
router.post('/', validateJWT, createExternalOrder);

// GET    /external-orders/history      --- Historial del cliente (filtro ?orderType=domicilio|para_llevar)
router.get('/history', validateJWT, getExternalOrderHistory);

// GET    /external-orders/:id          --- Ver detalle de un pedido
router.get('/:id', validateJWT, getExternalOrderById);

// PATCH  /external-orders/:id/cancel   --- Cancelar pedido (solo en estado recibido/confirmado)
router.patch('/:id/cancel', validateJWT, cancelExternalOrder);

// GET    /external-orders/:id/invoice  --- Generar factura (pedido entregado)
router.get('/:id/invoice', validateJWT, getExternalOrderInvoice);

// ─── RUTAS DE ADMINISTRADOR ─────────────────────────────────────────────────────

// GET    /external-orders              --- Listar pedidos del restaurante (?restaurantId=&status=&orderType=)
router.get('/', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), getRestaurantExternalOrders);

// PATCH  /external-orders/:id/status   --- Avanzar estado del pedido
router.patch('/:id/status', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateExternalOrderStatus);

export default router;
