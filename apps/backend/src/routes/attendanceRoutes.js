import express from "express";
import { markAttendance, getAttendance, getMonthlyReport } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/mark", markAttendance);
router.get("/", getAttendance);
router.get("/report/monthly", getMonthlyReport);

export default router;
