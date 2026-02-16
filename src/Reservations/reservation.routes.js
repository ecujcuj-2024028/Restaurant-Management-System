import { Router } from 'express';
import { createReservation } from './reservation.controller.js';

const router = Router();

router.post('/reservation', createReservation);

export default router;