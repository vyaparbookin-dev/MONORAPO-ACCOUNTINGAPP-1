import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  name: { type: String, required: true },
  location: { type: String, default: "" },
  address: { type: String, default: "" },
  managerName: { type: String, default: "" },
  phone: { type: String, default: "" },
  capacity: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);
