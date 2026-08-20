import express from "express";
import { getAdminMetrics, updateCompanyPlan } from "../controllers/adminDashboardController.js";
import { authenticateToken } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/metrics", getAdminMetrics);
router.patch("/companies/:id/plan", updateCompanyPlan);

export default router;
