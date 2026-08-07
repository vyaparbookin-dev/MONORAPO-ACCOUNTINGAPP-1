import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // Hide password by default
  phone: { type: String },
  role: {
    type: String,
    enum: ['admin', 'manager', 'cashier', 'salesman', 'godown'],
    default: 'admin' // By default naya user admin banega
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true },
  
  // Fields for OTP Verification
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,

  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);