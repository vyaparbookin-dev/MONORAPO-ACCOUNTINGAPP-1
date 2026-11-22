import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema({
  transferNumber: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: false },
  fromLocationName: { type: String, default: "" },
  toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: false },
  toLocationName: { type: String, default: "" },
  vehicleNumber: { type: String, default: "" },
  driverName: { type: String, default: "" },
  driverPhone: { type: String, default: "" },
  ewayBillNumber: { type: String, default: "" },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "Pcs" },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: "" }
  }],
  totalQuantity: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
  status: { 
    type: String, 
    enum: ['pending', 'dispatched', 'received', 'completed', 'cancelled'], 
    default: 'completed' 
  },
  receivedDate: { type: Date },
  receivedBy: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.StockTransfer || mongoose.model("StockTransfer", stockTransferSchema);
