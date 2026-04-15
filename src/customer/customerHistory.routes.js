'use strict';

import { Router } from 'express';
import { CustomerHistoryController } from './customerHistory.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: Gestión de datos y actividad del cliente
 */

/**
 * @swagger
 * /customer/history:
 *   get:
 *     summary: Obtener el historial de pedidos y actividades del cliente
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial recuperado exitosamente
 *       401:
 *         description: No autorizado - Token JWT inválido o ausente
 */
router.get('/history', validateJWT, CustomerHistoryController.getHistory);

export default router;