import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  discountValue: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  maxUsage: { type: Number, default: 0 }, // 0 = unlimited
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);