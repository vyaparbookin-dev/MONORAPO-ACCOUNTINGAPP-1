import express from "express";
import { askAiAdvisor, getAiUsageStats } from "../controllers/aiAdvisorController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/ask", askAiAdvisor);
router.get("/usage-stats", getAiUsageStats);

export default router;
