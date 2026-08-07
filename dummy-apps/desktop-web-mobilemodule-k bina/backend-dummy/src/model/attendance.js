import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "leave", "half-day"], default: "present" },
  checkInTime: String,
  checkOutTime: String,
  hoursWorked: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique attendance per staff per day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
