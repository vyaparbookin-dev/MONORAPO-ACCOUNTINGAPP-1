import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createSupermarketItem,
  deleteSupermarketItem,
  getSupermarketItemById,
  getSupermarketItems,
  getSupermarketSummary,
  updateSupermarketItem,
} from '../controllers/supermarketItemController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getSupermarketSummary);

router.route('/')
  .get(getSupermarketItems)
  .post(createSupermarketItem);

router.route('/:id')
  .get(getSupermarketItemById)
  .put(updateSupermarketItem)
  .delete(deleteSupermarketItem);

export default router;
