import express from "express";
import { markAttendance, getAttendance, getMonthlyReport } from "../controllers/attendanceController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/mark", protect, markAttendance);
router.get("/", protect, getAttendance);
router.get("/report/monthly", protect, getMonthlyReport);

export default router;
