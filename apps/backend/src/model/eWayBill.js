import mongoose from "mongoose";

const eWayBillSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  invoiceNumber: { type: String, required: true },
  ewayBillNumber: { type: String }, // 12 Digit Number
  irn: { type: String }, // E-Invoice Reference Number (64 chars)
  generatedDate: { type: Date, default: Date.now },
  validUpto: { type: Date },
  status: { type: String, enum: ['generated', 'cancelled'], default: 'generated' },
  vehicleNumber: { type: String }
}, { timestamps: true });

export default mongoose.model("EWayBill", eWayBillSchema);