import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createMobileDevice,
  deleteMobileDevice,
  getMobileDeviceById,
  getMobileDevices,
  getMobileSummary,
  updateMobileDevice,
} from '../controllers/mobileDeviceController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getMobileSummary);

router.route('/')
  .get(getMobileDevices)
  .post(createMobileDevice);

router.route('/:id')
  .get(getMobileDeviceById)
  .put(updateMobileDevice)
  .delete(deleteMobileDevice);

export default router;
