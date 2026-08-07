import express from "express";
import { protect } from '../middleware/authmiddleware.js';
import { createBrand, listBrands, updateBrand, deleteBrand } from "../controllers/brandController.js";

const router = express.Router();

// Routes are now cleaner and point to controller functions
router.route('/')
    .get(protect, listBrands)
    .post(protect, createBrand);

router.route('/:id')
    .put(protect, updateBrand)
    .delete(protect, deleteBrand);

export default router;