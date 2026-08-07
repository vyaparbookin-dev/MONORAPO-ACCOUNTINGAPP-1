import express from "express";
import { addLog, listLogs } from "../controllers/securityController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/", protect, addLog);
router.get("/", protect, listLogs);

export default router;