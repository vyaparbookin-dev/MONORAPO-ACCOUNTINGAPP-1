import express from "express";
import {
  getEWayBills,
  generateEWayBill,
  updateVehicleDetails,
  cancelEWayBill,
  downloadNicJson
} from "../controllers/eWayBillController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", protect, getEWayBills);
router.post("/generate", protect, generateEWayBill);
router.post("/:id/update-vehicle", protect, updateVehicleDetails);
router.post("/:id/cancel", protect, cancelEWayBill);
router.get("/:id/nic-json", protect, downloadNicJson);

export default router;
