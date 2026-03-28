import express from "express";
import { addLog, listLogs } from "../controllers/securityController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/log", protect, addLog);
router.get("/logs", protect, listLogs);

export default router;