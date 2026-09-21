import express from "express";
import {
  createProgram,
  listPrograms,
  updateProgram,
  deleteProgram,
  getCustomerStampStatus,
  awardStamp,
  redeemReward,
  listCustomerStampCards
} from "../controllers/stampController.js";
import { protect } from "../../../middleware/authmiddleware.js";

const router = express.Router();

// Program CRUD
router.route("/programs")
  .post(protect, createProgram)
  .get(protect, listPrograms);

router.route("/programs/:id")
  .put(protect, updateProgram)
  .delete(protect, deleteProgram);

// Customer Stamps & Rewards
router.get("/customer-status", protect, getCustomerStampStatus);
router.post("/award-stamp", protect, awardStamp);
router.post("/redeem-reward", protect, redeemReward);
router.get("/customer-cards", protect, listCustomerStampCards);

export default router;
