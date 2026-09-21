import express from "express";
import { 
  addCoupon, 
  listCoupons, 
  updateCoupon, 
  deleteCoupon, 
  validateAndApplyCoupon 
} from "../controllers/couponController.js";
import { protect } from "../../../middleware/authmiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, addCoupon)
  .get(protect, listCoupons);

router.post("/validate", protect, validateAndApplyCoupon);

router.route("/:id")
  .put(protect, updateCoupon)
  .delete(protect, deleteCoupon);

export default router;