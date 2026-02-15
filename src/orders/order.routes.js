import { Router } from 'express';
import { createOrder } from './order.controller.js';

const router = Router();

router.post('/order', createOrder);

export default router;