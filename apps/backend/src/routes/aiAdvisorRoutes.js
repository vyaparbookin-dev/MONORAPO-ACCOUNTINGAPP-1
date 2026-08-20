import express from "express";
import { askAiAdvisor, getAiUsageStats } from "../controllers/aiAdvisorController.js";
import { authenticateToken } from "../middleware/authmiddleware.js";
import { companyMiddleware } from "../middleware/companyMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(companyMiddleware);

router.post("/ask", askAiAdvisor);
router.get("/usage-stats", getAiUsageStats);

export default router;
