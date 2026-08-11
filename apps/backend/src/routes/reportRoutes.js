import express from "express";
import {
  generateReport,
  getBalanceSheet,
  getChartData,
  getProfitLoss,
  getStaffPerformanceReport,
  getNonMovingItems, // Import the new controller
} from "../controllers/reportController.js";
import { protect } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

// All routes are protected by default
router.use(protect);

router.route("/generate").post(generateReport);

// Staff Performance Report
router.get("/staff-performance", authorizeRoles("owner", "admin", "manager"), getStaffPerformanceReport);

// Non-moving Stock Report
router.get("/non-moving-items", authorizeRoles("owner", "admin", "manager"), getNonMovingItems);

// Dashboard Charts Route (Sales trend, Top Items, Site-wise revenue)
router.get("/charts", getChartData);

// Balance Sheet Route
router.get("/balancesheet", authorizeRoles("owner", "admin"), getBalanceSheet);

// Profit & Loss Route
router.get("/profitloss", authorizeRoles("owner", "admin"), getProfitLoss);

export default router;