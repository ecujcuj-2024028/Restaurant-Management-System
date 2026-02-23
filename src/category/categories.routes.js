'use strict';

import { Router } from 'express';
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from './categories.controller.js';
import { upload } from '../../helpers/file-upload.js';


const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/create', upload.single('image'), createCategory);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
