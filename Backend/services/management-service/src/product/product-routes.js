'use strict';

import { Router } from 'express';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats,
} from '../product/product-controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { uploadProductImage } from '../../middlewares/restaurant-uploader.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de platos y bebidas (productos) en el catálogo
 */

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Obtener lista de todos los productos (Filtrado por rol)
 *     tags: [Products]
 *     responses:
 *       200: { description: Lista de productos obtenida }
 */
router.get('/', validateJWT, getProducts);

// Estadísticas de productos por restaurante — solo ADMIN_RESTAURANTE y ADMIN_SISTEMA
/**
 * @swagger
 * /product/stats/{restaurantId}:
 *   get:
 *     summary: Obtener estadísticas de productos de un restaurante específico
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Estadísticas de productos }
 */
router.get(
    '/stats/:restaurantId',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    getProductStats
);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detalles del producto }
 *       404: { description: No encontrado }
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Crear un nuevo producto (incluye imagen)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId, restaurantId]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               description: { type: string }
 *               categoryId: { type: string }
 *               restaurantId: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Producto creado }
 */
router.post(
    '/',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    uploadProductImage.single('image'),
    createProduct
);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags: [Products]
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
 *               price: { type: number }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Producto actualizado }
 */
router.put(
    '/:id',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    uploadProductImage.single('image'),
    updateProduct
);

// ELIMINAR
/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Producto eliminado }
 */
router.delete(
    '/:id',
    validateJWT,
    hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),
    deleteProduct
);

export default router;