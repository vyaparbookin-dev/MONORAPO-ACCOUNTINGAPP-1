import express from "express";
import { getUnits, createUnit } from "../controllers/unitController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.route("/").get(protect, getUnits).post(protect, createUnit);

export default router;