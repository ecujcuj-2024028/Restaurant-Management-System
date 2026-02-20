'use strict';

import { Router } from 'express';
import Product from './products-model.js';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} from '../product/product-controller.js';

// Middlewares
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { validateOwnership } from '../../middlewares/validate-ownership.js';
import { hasRole } from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

// rutas publicas
router.get('/', getProducts);
router.get('/:id', getProduct);

// CREAR: Validamos que sea un Admin, pero la lógica de "a qué restaurante" va en el controlador
router.post(
    '/', 
    [validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA)], 
    createProduct
);

// ACTUALIZAR: Solo el dueño del restaurante al que pertenece el producto
router.put(
    '/:id', 
    [
        validateJWT, 
        hasRole(ADMIN_RESTAURANTE), 
        validateOwnership(Product)
    ], 
    updateProduct
);

// ELIMINAR: Misma protección
router.delete(
    '/:id', 
    [
        validateJWT, 
        hasRole(ADMIN_RESTAURANTE), 
        validateOwnership(Product)
    ], 
    deleteProduct
);

export default router;