import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  amount: Number,
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Salary", salarySchema);