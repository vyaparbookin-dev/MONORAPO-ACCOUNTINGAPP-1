import express from "express";
import { sendReminder } from '../controllers/reminderController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.post("/", protect, sendReminder);

export default router;
