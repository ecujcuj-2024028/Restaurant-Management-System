import { Router } from 'express';
import { 
    createTable, 
    getTables,
    getTablesByRestaurant,
    updateTableStatus
} from './table.controller.js';

const router = Router();

router.post('/create', createTable);
router.get('/', getTables);
router.get('/restaurant/:restaurantId', getTablesByRestaurant);
router.patch('/:tableId/status', updateTableStatus);

export default router;