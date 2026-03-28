import express from "express";
import { initiateTransfer, getTransfers } from "../controllers/stockTransferController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, initiateTransfer);
router.get("/", protect, getTransfers);

export default router;