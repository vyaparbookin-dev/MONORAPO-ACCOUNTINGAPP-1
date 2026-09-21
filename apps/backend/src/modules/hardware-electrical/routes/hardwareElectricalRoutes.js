import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  getEquipmentById,
  getEquipmentSummary,
  getLowStockEquipment,
  updateEquipment,
} from '../controllers/equipmentController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getEquipmentSummary);
router.get('/low-stock', getLowStockEquipment);

router.route('/')
  .get(getEquipment)
  .post(createEquipment);

router.route('/:id')
  .get(getEquipmentById)
  .put(updateEquipment)
  .delete(deleteEquipment);

export default router;
