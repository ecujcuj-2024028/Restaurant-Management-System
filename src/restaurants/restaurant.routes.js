import { Router } from 'express';
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
import { ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const router = Router();

/* Solo admin */
router.post(
    '/create',
    validateJWT,
    upload.single('image'),
    hasRole(ADMIN_SISTEMA),
    createRestaurant
);

router.put(
    '/:id',
    validateJWT,
    upload.single('image'),
    hasRole(ADMIN_SISTEMA),
    updateRestaurant
);

router.delete(
    '/:id',
    validateJWT,
    hasRole(ADMIN_SISTEMA),
    deleteRestaurant
);

/* Usuarios autenticados */
router.get('/', validateJWT, getRestaurants);
router.get('/:id', validateJWT, getRestaurantById);

export default router;
