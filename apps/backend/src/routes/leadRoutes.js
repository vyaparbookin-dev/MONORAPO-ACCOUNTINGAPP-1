import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
} from '../controllers/leadController.js';

const router = express.Router();

router.route('/').post(protect, createLead).get(protect, getLeads);
router.route('/:id').get(protect, getLeadById).put(protect, updateLead);

export default router;