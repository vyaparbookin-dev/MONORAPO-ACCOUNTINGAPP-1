import express from "express";
import { createTaxEntry, getTaxEntries, updateTaxStatus } from "../controllers/tdsTcsController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createTaxEntry);
router.get("/", protect, getTaxEntries);
router.patch("/:id/status", protect, updateTaxStatus);

export default router;