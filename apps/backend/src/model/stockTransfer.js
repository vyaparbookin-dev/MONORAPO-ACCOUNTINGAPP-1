import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema({
  transferNumber: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    quantity: { type: Number, required: true }
  }],
  date: { type: Date, default: Date.now },
  notes: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' }
}, { timestamps: true });

export default mongoose.model("StockTransfer", stockTransferSchema);