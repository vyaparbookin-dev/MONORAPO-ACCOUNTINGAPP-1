import express from "express";
import { addAsset, getAssets, calculateDepreciation } from "../controllers/fixedAssetController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, addAsset);
router.get("/", protect, getAssets);
router.post("/calculate-depreciation", protect, calculateDepreciation);

export default router;