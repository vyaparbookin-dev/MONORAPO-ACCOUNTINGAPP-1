import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  date: { type: Date, required: true },
  status: { type: String, default: "present" },
  checkInTime: String,
  checkOutTime: String,
  hoursWorked: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Attendance", attendanceSchema);
