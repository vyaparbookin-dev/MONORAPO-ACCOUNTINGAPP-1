import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { createCategory, listCategories, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

// Routes are now cleaner and point to controller functions
router.route('/')
    .get(protect, listCategories)
    .post(protect, createCategory);

router.route('/:id')
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

export default router;