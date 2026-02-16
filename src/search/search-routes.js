'use strict';

import { Router } from 'express';
import {
    globalSearch,
    searchRestaurants,
    searchProducts
} from '../search/search-controller.js';

const router = Router();

router.get('/',            globalSearch);
router.get('/restaurants', searchRestaurants);
router.get('/products',    searchProducts);

export default router;