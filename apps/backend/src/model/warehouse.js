import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  location: String,
  capacity: Number,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Warehouse", warehouseSchema);