import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  type: { type: String, enum: ["addition", "reduction"], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, enum: ["damaged", "lost", "correction", "internal_use", "wastage", "spoilage", "other"], default: "correction" }, // Added 'wastage' and 'spoilage'
  notes: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("StockAdjustment", stockAdjustmentSchema);