'use strict';

import { Router } from 'express';
import {
    getMenus,
    getMenu,
    createMenu,
    updateMenu,
    addMenuItem,
    removeMenuItem,
    deleteMenu
} from '../menu/menu-controller.js';

const router = Router({ mergeParams: true });

router.get('/',                         getMenus);
router.get('/:id',                      getMenu);
router.post('/',                        createMenu);
router.put('/:id',                      updateMenu);
router.post('/:id/items',              addMenuItem);
router.delete('/:id/items/:productId', removeMenuItem);
router.delete('/:id',                   deleteMenu);

export default router;