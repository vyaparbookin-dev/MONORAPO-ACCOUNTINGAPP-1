import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createMedicine,
  deleteMedicine,
  getExpiringMedicines,
  getLowStockMedicines,
  getMedicineById,
  getMedicines,
  getMedicineSummary,
  updateMedicine,
} from '../controllers/medicineController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getMedicineSummary);
router.get('/low-stock', getLowStockMedicines);
router.get('/expiring', getExpiringMedicines);

router.route('/')
  .get(getMedicines)
  .post(createMedicine);

router.route('/:id')
  .get(getMedicineById)
  .put(updateMedicine)
  .delete(deleteMedicine);

export default router;
