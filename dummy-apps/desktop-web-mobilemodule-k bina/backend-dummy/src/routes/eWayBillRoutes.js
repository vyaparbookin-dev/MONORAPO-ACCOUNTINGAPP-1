import express from "express";
import { generateEWayBill, getEWayBills } from "../controllers/eWayBillController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateEWayBill);
router.get("/", protect, getEWayBills);

export default router;