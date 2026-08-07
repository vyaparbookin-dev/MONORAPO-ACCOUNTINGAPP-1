import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { createSubCategory, listSubCategories, updateSubCategory, deleteSubCategory } from '../controllers/subCategoryController.js';

const router = express.Router();

// Routes are now cleaner and point to controller functions
router.route('/')
    .get(protect, listSubCategories)
    .post(protect, createSubCategory);

router.route('/:id')
    .put(protect, updateSubCategory)
    .delete(protect, deleteSubCategory);

export default router;