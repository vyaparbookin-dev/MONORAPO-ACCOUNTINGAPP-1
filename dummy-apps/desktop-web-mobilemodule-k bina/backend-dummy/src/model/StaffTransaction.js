import mongoose from "mongoose";

const staffTransactionSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true },
  status: String,
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  notes: String,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("StaffTransaction", staffTransactionSchema);