import express from "express";
import { getGstReport, verifyGstin } from "../controllers/gstController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/report", protect, getGstReport);
router.post("/verify", protect, verifyGstin);

export default router;