import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
} from '../controllers/quotationController.js';

const router = express.Router();

router.route('/').post(protect, createQuotation).get(protect, getQuotations);
router.route('/:id').get(protect, getQuotationById);
router.route('/:id/status').patch(protect, updateQuotationStatus);

export default router;