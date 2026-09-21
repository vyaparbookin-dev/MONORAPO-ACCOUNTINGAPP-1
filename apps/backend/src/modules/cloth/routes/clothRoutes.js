import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createClothItem,
  deleteClothItem,
  getClothItemById,
  getClothItems,
  getClothSummary,
  getLowStockClothItems,
  updateClothItem,
} from '../controllers/clothController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getClothSummary);
router.get('/low-stock', getLowStockClothItems);

router.route('/')
  .get(getClothItems)
  .post(createClothItem);

router.route('/:id')
  .get(getClothItemById)
  .put(updateClothItem)
  .delete(deleteClothItem);

export default router;
