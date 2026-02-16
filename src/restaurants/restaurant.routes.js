import { Router } from 'express';
import {
    createRestaurant,
    getRestaurants,
    getRestaurantById
} from './restaurant.controller.js';

const router = Router();

router.post('/create', createRestaurant);
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

export default router;