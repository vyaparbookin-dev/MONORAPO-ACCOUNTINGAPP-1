import express from "express";
import {
  generateReport,
  getBalanceSheet,
  getChartData,
  getProfitLoss,
  getPartyWiseReport,
  getStaffPerformanceReport,
  getNonMovingItems,
  getRestaurantAnalytics,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

// All routes are protected by default
router.use(protect);

router.route("/generate").post(generateReport);

// Party-wise sales & balances report
router.get("/partywise", getPartyWiseReport);

// Restaurant Deep Analytics (Petpooja Benchmark: Dine-in vs Takeaway, Notes & Reviews)
router.get("/restaurant-analytics", getRestaurantAnalytics);

// Staff Performance Report
router.get("/staff-performance", authorizeRoles("owner", "admin", "manager"), getStaffPerformanceReport);

// Non-moving Stock Report
router.get("/non-moving-items", authorizeRoles("owner", "admin", "manager"), getNonMovingItems);

// Dashboard Charts Route (Sales trend, Top Items, Site-wise revenue)
router.get("/charts", getChartData);

// Balance Sheet Route
router.get("/balancesheet", getBalanceSheet);

// Profit & Loss Routes (Supports both /profitloss and /profit-loss)
router.get("/profitloss", getProfitLoss);
router.get("/profit-loss", getProfitLoss);

export default router;
