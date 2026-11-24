import mongoose from "mongoose";

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  uuid: { type: String, sparse: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyType: { type: String, enum: ["supplier", "customer", "both", "personal"], default: "both" },
  contactPerson: String,
  email: String,
  mobileNumber: { type: String, default: "" },
  alternatePhone: String,
  address: { type: String, default: "Local" },
  city: String,
  state: String,
  pincode: String,
  gstNumber: { type: String, sparse: true },
  panNumber: String,
  creditLimit: { type: Number, default: 0 },
  // 💳 SMART CREDIT LIMIT LINE & MANDATE SYSTEM
  isCreditLimitActive: { type: Boolean, default: false },
  creditLimitStatus: { 
    type: String, 
    enum: ["INACTIVE", "PENDING_OTP", "ACTIVE", "LOCKED", "SUSPENDED"], 
    default: "INACTIVE" 
  },
  creditLimitOtp: { type: String, default: "" },
  creditLimitOtpExpiresAt: { type: Date },
  creditLimitSanctionedAt: { type: Date },
  creditLimitAgreementText: { type: String, default: "" },
  hasPendingBillApproval: { type: Boolean, default: false },
  pendingApprovalBillId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
  creditLimitLockedReason: { type: String, default: "" },
  paymentTerms: String,
  openingBalance: { type: Number, default: 0 },
  openingBalanceDate: { type: Date },
  currentBalance: { type: Number, default: 0 },
  website: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolder: String,
  },
  notes: String,
  billImageUrl: { type: String, default: "" },
  billImageUrls: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure uniqueness per company only for active parties with a non-empty mobile number
partySchema.index(
  { companyId: 1, mobileNumber: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      isActive: true, 
      mobileNumber: { $type: "string", $gt: "" } 
    } 
  }
);

export default mongoose.model("Party", partySchema);
