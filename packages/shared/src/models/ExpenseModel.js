import mongoose from "mongoose";

const ExpensesSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Rent, Electricity, Staff, etc.
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.models.Expenses || mongoose.model("Expenses", ExpensesSchema);