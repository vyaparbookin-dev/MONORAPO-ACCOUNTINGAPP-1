import mongoose from "mongoose";

const stampProgramSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.Mixed, required: false },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  // Multi-Industry Support
  businessModule: {
    type: String,
    enum: ["all", "restaurant", "grocery", "clothes", "salon", "hardware", "gamezone", "services"],
    default: "restaurant"
  },

  // Target Goal (how many visits/stamps to complete card)
  totalStamps: { type: Number, default: 6, min: 2, max: 20 },

  // Minimum spending rule to earn 1 stamp (₹)
  minBillAmount: { type: Number, default: 0, min: 0 },

  // Reward Configurations
  // 'free_item' = Free Dish / Free Service
  // 'percentage' = % discount on total bill
  // 'flat_discount' = Flat ₹ amount off
  rewardType: {
    type: String,
    enum: ["free_item", "percentage", "flat_discount"],
    default: "free_item"
  },
  rewardItemName: { type: String, default: "" }, // e.g. "1 पनीर टिक्का / 1 डेज़र्ट"
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  maxDiscountAmount: { type: Number, default: 0 }, // Cap on % discount (0 = no limit)
  discountAmount: { type: Number, default: 0 }, // Flat ₹ discount

  // Expiry Rules
  validityDays: { type: Number, default: 60 }, // Days to collect all stamps (0 = never expires)
  rewardValidityDays: { type: Number, default: 30 }, // Days to redeem reward once unlocked

  // Anti-fraud / Anti-gaming rule
  oneStampPerDay: { type: Boolean, default: true },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.StampProgram || mongoose.model("StampProgram", stampProgramSchema);
