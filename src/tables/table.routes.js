import { Router } from 'express';
import { createTable, getTables } from './table.controller.js';

const router = Router();

router.post(
    '/create',
    createTable
);

router.get(
    '/',
    getTables
);

export default router;
