'use strict';

import { Router } from 'express';
import {
    getMenus,
    getMenu,
    createMenu,
    updateMenu,
    addMenuItem,
    removeMenuItem,
    deleteMenu,
    toggleMenuStatus,
    activateCategory
} from '../menu/menu-controller.js';

import { validateJWT }    from '../../middlewares/validate-JWT.js';
import { hasRole }        from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Gestión de menús y su disponibilidad en los restaurantes
 */

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Obtener todos los menús
 *     tags: [Menu]
 *     responses:
 *       200: { description: Lista de menús }
 */
router.get('/',    getMenus);

/**
 * @swagger
 * /menu/{id}:
 *   get:
 *     summary: Obtener detalles de un menú por ID
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detalles del menú }
 */
router.get('/:id', getMenu);

/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Crear un nuevo menú (Admin)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, restaurant]
 *             properties:
 *               name: { type: string }
 *               restaurant: { type: string }
 *     responses:
 *       201: { description: Menú creado }
 */
router.post('/',    [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], createMenu);

/**
 * @swagger
 * /menu/{id}:
 *   put:
 *     summary: Actualizar un menú existente
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menú actualizado }
 */
router.put('/:id',  [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], updateMenu);

/**
 * @swagger
 * /menu/{id}:
 *   delete:
 *     summary: Eliminar un menú
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menú eliminado }
 */
router.delete('/:id', [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], deleteMenu);

/**
 * @swagger
 * /menu/{id}/items:
 *   post:
 *     summary: Agregar un plato al menú
 *     tags: [Menu]
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
 *               productId: { type: string }
 *     responses:
 *       200: { description: Plato agregado }
 */
router.post('/:id/items',              [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], addMenuItem);

/**
 * @swagger
 * /menu/{id}/items/{productId}:
 *   delete:
 *     summary: Remover un plato del menú
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Plato removido }
 */
router.delete('/:id/items/:productId', [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], removeMenuItem);

/**
 * @swagger
 * /menu/{id}/toggle-status:
 *   patch:
 *     summary: Activar/Desactivar disponibilidad del menú
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Estado cambiado }
 */
router.patch('/:id/toggle-status',    [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], toggleMenuStatus);

/**
 * @swagger
 * /menu/{id}/activate-category:
 *   patch:
 *     summary: Activar una categoría dentro del menú
 *     tags: [Menu]
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
 *               categoryId: { type: string }
 *     responses:
 *       200: { description: Categoría activada }
 */
router.patch('/:id/activate-category', [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], activateCategory);

export default router;