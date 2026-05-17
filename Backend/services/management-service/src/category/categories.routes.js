'use strict';

import { Router } from 'express';
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from './categories.controller.js';
import { upload } from '../../helpers/file-upload.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestión de categorías de comida por restaurante
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtener todas las categorías activas (Filtrado por rol)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida con éxito
 */
router.get('/', validateJWT, getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la categoría
 */
router.get('/:id', getCategory);

/**
 * @swagger
 * /categories/create:
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               restaurantId:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Categoría creada
 */
router.post('/create', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), upload.single('image'), createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Actualizar una categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *   delete:
 *     summary: Desactivar una categoría (Soft Delete)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Categoría desactivada con éxito
 */
router.put('/:id',     validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), upload.single('image'), updateCategory);
router.delete('/:id',  validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), deleteCategory);

export default router;