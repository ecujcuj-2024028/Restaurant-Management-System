'use strict';

import { Router } from 'express';
import {
    crearReview,
    getReviewsPorPlato
} from './analytics.controller.js';

const router = Router();

// ─── RUTAS DE REVIEWS ─────────────────────────────────────────────────────────

router.post('/reviews', crearReview);

router.get('/reviews/plato/:platoId', getReviewsPorPlato);

export default router;