import { Router } from 'express';
import { CustomerHistoryController } from './customerHistory.controller.js';

const router = Router();

router.get('/customer/:customerName/history', CustomerHistoryController.getHistory);

export default router;