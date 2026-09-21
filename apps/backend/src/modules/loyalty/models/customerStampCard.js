import mongoose from "mongoose";

const customerStampCardSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.Mixed, required: false },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "StampProgram", required: true },
  
  // Customer Identity
  customerPhone: { type: String, required: true, trim: true },
  customerName: { type: String, default: "", trim: true },

  // Stamp Count & Progress
  currentStamps: { type: Number, default: 0 },
  totalStamps: { type: Number, default: 6 },
  cycle: { type: Number, default: 1 }, // Completed cards counter (1st round, 2nd round...)

  // Lifecycle status: 'ACTIVE' (collecting), 'REWARD_READY' (target reached), 'REDEEMED' (claimed)
  status: {
    type: String,
    enum: ["ACTIVE", "REWARD_READY", "REDEEMED", "EXPIRED"],
    default: "ACTIVE"
  },

  // Reward Data once target reached
  unlockedReward: {
    code: { type: String, default: "" }, // Coupon code generated for billing
    rewardType: { type: String, default: "" },
    rewardItemName: { type: String, default: "" },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    unlockedAt: { type: Date },
    expiresAt: { type: Date },
    isRedeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date },
    redeemedInBillNumber: { type: String, default: "" }
  },

  // Audit history of stamps earned
  stampsHistory: [
    {
      stampNumber: { type: Number, required: true },
      earnedAt: { type: Date, default: Date.now },
      billNumber: { type: String, default: "" },
      billAmount: { type: Number, default: 0 },
      billId: { type: mongoose.Schema.Types.Mixed }
    }
  ],

  lastStampDate: { type: Date },
  expiresAt: { type: Date }, // When current active card expires if validityDays > 0

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to quickly find active card for customer per program
customerStampCardSchema.index({ companyId: 1, customerPhone: 1, programId: 1, status: 1 });

export default mongoose.models.CustomerStampCard || mongoose.model("CustomerStampCard", customerStampCardSchema);
