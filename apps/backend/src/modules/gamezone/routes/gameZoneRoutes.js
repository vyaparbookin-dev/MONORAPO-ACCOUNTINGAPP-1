import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createGameZoneItem,
  deleteGameZoneItem,
  getGameZoneItemById,
  getGameZoneItems,
  getGameZoneSummary,
  updateGameZoneItem,
} from '../controllers/gameZoneController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getGameZoneSummary);

router.route('/')
  .get(getGameZoneItems)
  .post(createGameZoneItem);

router.route('/:id')
  .get(getGameZoneItemById)
  .put(updateGameZoneItem)
  .delete(deleteGameZoneItem);

export default router;
