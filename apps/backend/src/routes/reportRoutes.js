import express from "express";
import { generateReport, getBalanceSheet, getChartData, getProfitLoss, getStaffPerformanceReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/generate").post(protect, generateReport);

// Staff Performance Report
router.get("/staff-performance", protect, getStaffPerformanceReport);
// Dashboard Charts Route (Sales trend, Top Items, Site-wise revenue)
router.get("/charts", protect, getChartData);

// Balance Sheet Route
router.get("/balancesheet", protect, getBalanceSheet);

// Profit & Loss Route
router.get("/profitloss", protect, getProfitLoss);

export default router;