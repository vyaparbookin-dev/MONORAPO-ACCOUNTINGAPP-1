import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: String,
  isDeleted: { type: Boolean, default: false }, // Added for soft delete
  synced: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
});

export default mongoose.model("Expense", expenseSchema);