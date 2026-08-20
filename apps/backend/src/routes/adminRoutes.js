import express from "express";
import { getAdminMetrics, updateCompanyPlan } from "../controllers/adminDashboardController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/metrics", getAdminMetrics);
router.patch("/companies/:id/plan", updateCompanyPlan);

export default router;
