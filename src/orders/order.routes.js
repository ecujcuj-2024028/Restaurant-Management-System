import { Router } from 'express';
import { createOrder, cancelOrder, getOrderHistory } from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/order', validateJWT, createOrder);
router.patch('/cancel/:id', validateJWT, cancelOrder);
router.get('/orders/history', validateJWT, getOrderHistory);

export default router;