import express from "express";
import { reconcileStatement } from "../controllers/bankRecController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/reconcile", protect, reconcileStatement);

export default router;