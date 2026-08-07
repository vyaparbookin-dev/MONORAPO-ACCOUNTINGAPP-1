import express from "express";
import { addCoupon, listCoupons } from "../controllers/couponController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addCoupon).get(protect, listCoupons);

export default router;