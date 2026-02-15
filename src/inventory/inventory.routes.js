import { Router } from 'express';
import {createInventoryItem, getInventory } from './inventory.controller.js';

const router = Router();

router.post(
    '/create',
    createInventoryItem
);

router.get(
    '/',
    getInventory
);

export default router;
