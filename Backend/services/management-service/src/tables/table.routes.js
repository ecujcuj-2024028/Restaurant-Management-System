import { Router } from 'express';
import {
    createTable,
    deleteTable,
    getTables,
    getTable,
    updateTable,
    updateTableStatus
} from './table.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { hasRole } from '../../middlewares/hasRole.js';

const router = Router();

router.get('/', validateJWT, getTables);
router.get('/restaurant/:restaurantId', validateJWT, getTables);
router.get('/:id', validateJWT, getTable);
router.post('/create', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), createTable);
router.put('/:id', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateTable);
router.delete('/:id', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), deleteTable);
router.patch('/:id/status', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA), updateTableStatus);

export default router;
