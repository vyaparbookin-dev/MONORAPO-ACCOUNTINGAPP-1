import express from "express";
import { getAgingReport } from "../controllers/agingController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", protect, getAgingReport);

export default router;