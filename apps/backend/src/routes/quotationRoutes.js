import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertQuotationToBill,
  logQuotationFollowUp,
  sendQuotationWhatsApp,
  triggerAiFollowUpCall,
} from '../controllers/quotationController.js';

const router = express.Router();

router.route('/').post(protect, createQuotation).get(protect, getQuotations);
router.route('/:id').get(protect, getQuotationById).put(protect, updateQuotation).delete(protect, deleteQuotation);
router.route('/:id/status').patch(protect, updateQuotationStatus);
router.post('/:id/convert-to-bill', protect, convertQuotationToBill);
router.post('/:id/follow-up', protect, logQuotationFollowUp);
router.post('/:id/send-whatsapp', protect, sendQuotationWhatsApp);
router.post('/:id/ai-call', protect, triggerAiFollowUpCall);

export default router;
