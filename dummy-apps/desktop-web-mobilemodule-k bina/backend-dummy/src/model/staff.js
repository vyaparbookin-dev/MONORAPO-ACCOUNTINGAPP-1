import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  email: { type: String, unique: true, sparse: true },
  mobileNumber: { type: String, required: true },
  position: String,
  role: { type: String, default: 'staff' },
  wageType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
  wageAmount: { type: Number, default: 0 },
  shiftStartTime: String, // e.g., "09:00 AM" (For restaurant/resort shift management)
  shiftEndTime: String, // e.g., "06:00 PM"
  incentiveType: { type: String, enum: ['fixed', 'percentage', 'none'], default: 'none' }, // For clothes/retail sales incentive
  incentiveValue: { type: Number, default: 0 }, // Incentive value based on type
  earnedIncentives: { type: Number, default: 0 }, // Total incentives earned by the staff
  balance: { type: Number, default: 0 }, // Negative: Advance, Positive: Due Salary
  department: String,
  dateOfJoining: { type: Date, default: Date.now },
  salary: { type: Number, default: 0 },
  address: String,
  aadharNumber: String,
  panNumber: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolder: String,
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Staff", staffSchema);
