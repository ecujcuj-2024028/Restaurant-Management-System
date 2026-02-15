import { Router } from 'express';
import { createRestaurant, getRestaurants } from './restaurant.controller.js';
import { uploadRestaurantImage } from '../../middlewares/restaurant-uploader.js';

const router = Router();

router.post(
    '/create',
    uploadRestaurantImage.single('image'),
    createRestaurant
);

router.get(
    '/',
    getRestaurants
);

export default router;
