import mongoose from "mongoose";

const staffTransactionSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true }, // 'advance', 'salary_settlement', 'payment', 'deduction', 'loan_emi', 'overtime', 'commission'
  status: String,
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  notes: String,
  forMonth: { type: String }, // Target salary month in 'YYYY-MM' format (e.g. '2026-09')
  paymentMode: { type: String, default: 'cash' }, // 'cash', 'online', 'bank'
  salarySettlement: { type: Boolean, default: false },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.StaffTransaction || mongoose.model("StaffTransaction", staffTransactionSchema);
