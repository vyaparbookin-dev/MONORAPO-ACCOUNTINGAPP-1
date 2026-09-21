import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  getSalonSummary,
  updateAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getSalonSummary);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment)
  .delete(deleteAppointment);

export default router;
