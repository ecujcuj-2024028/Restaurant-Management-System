import { Router } from 'express';
import Restaurant from './restaurant.model.js';
import {
    createRestaurant,
    getRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
} from './restaurant.controller.js';

import { upload } from '../../helpers/file-upload.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { validateOwnership } from '../../middlewares/validate-ownership.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Gestión de sedes de restaurantes y su información
 */

/* Solo admin */
/**
 * @swagger
 * /restaurants/create:
 *   post:
 *     summary: Crear un nuevo restaurante (Admin)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, address, phone]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Restaurante creado }
 */
router.post(
    '/create',
    validateJWT,
    upload.single('image'),
    hasRole(ADMIN_SISTEMA, ADMIN_RESTAURANTE),
    createRestaurant
);  

// EDITAR: Ahora el dueño también puede, pero validamos que sea SUYO
/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     summary: Actualizar datos de un restaurante específico
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Restaurante actualizado }
 */
router.put(
    '/:id',
    validateJWT,
    hasRole(ADMIN_SISTEMA, ADMIN_RESTAURANTE),
    validateOwnership(Restaurant),
    upload.single('image'),
    updateRestaurant
);

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Eliminar un restaurante (Admin)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Restaurante eliminado }
 */
router.delete(
    '/:id',
    [
        validateJWT,
        hasRole(ADMIN_SISTEMA, ADMIN_RESTAURANTE),
        validateOwnership(Restaurant)
    ],
    deleteRestaurant
);

/* publico*/
/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Obtener lista de todos los restaurantes (Filtrado por rol)
 *     tags: [Restaurants]
 *     responses:
 *       200: { description: Lista de restaurantes }
 */
router.get('/', validateJWT, getRestaurants);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Obtener información detallada de un restaurante
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del restaurante }
 */
router.get('/:id', getRestaurantById);

export default router;