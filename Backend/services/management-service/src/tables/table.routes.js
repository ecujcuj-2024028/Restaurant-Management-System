import { Router } from 'express';
import {
    createTable,
    deleteTable,
    getTables,
    getTablesByRestaurant,
    updateTable,
    updateTableStatus
} from './table.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
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
 *     summary: Crear una nueva mesa
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/create',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    createTable
);

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Obtener todas las mesas del sistema
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
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
 */
router.get('/restaurant/:restaurantId', validateJWT, getTablesByRestaurant);

/**
 * @swagger
 * /tables/{tableId}:
 *   put:
 *     summary: Actualizar una mesa
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    '/:tableId',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    updateTable
);

/**
 * @swagger
 * /tables/{tableId}:
 *   delete:
 *     summary: Eliminar una mesa
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    '/:tableId',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    deleteTable
);

/**
 * @swagger
 * /tables/{tableId}/status:
 *   patch:
 *     summary: Actualizar el estado/disponibilidad de una mesa
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    '/:tableId/status',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    updateTableStatus
);

export default router;