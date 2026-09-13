import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.Mixed, required: false },
  code: { type: String, required: true, uppercase: true, trim: true },
  
  // Multi-Industry Business Module Association
  // 'all' | 'restaurant' | 'hardware' | 'clothes' | 'gamezone' | 'grocery' | 'banquet'
  businessModule: { 
    type: String, 
    enum: ["all", "restaurant", "hardware", "clothes", "gamezone", "grocery", "banquet"], 
    default: "all" 
  },
  
  // Coupon Type / Calculation Mode
  // 'flat_discount' | 'percentage' | 'buy_x_get_y' | 'cashback_voucher'
  couponType: { 
    type: String, 
    enum: ["flat_discount", "percentage", "buy_x_get_y", "cashback_voucher"], 
    default: "percentage" 
  },
  
  // Discount Values
  discount: { type: Number, default: 0 }, // For backward compatibility / flat / percentage
  discountPercentage: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: 0 }, // Cap on % discount (0 = no cap)
  
  // Qualification Rules
  minBillAmount: { type: Number, default: 0 }, // Minimum cart value to activate
  
  // Buy X Get Y / Specific Product rules (Useful for Garments BOGO, Hardware Combo, Restaurant Food)
  buyQty: { type: Number, default: 0 },
  getQty: { type: Number, default: 0 },
  targetCategory: { type: String, default: "" }, // e.g. "Pants", "Sanitary", "Starters"
  targetItemName: { type: String, default: "" },
  freeItemName: { type: String, default: "" },

  // Validity Dates
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date },
  expiryDate: { type: Date },
  
  // Customer & Anti-Fraud Security
  customerPhone: { type: String, default: "" }, // When bound to a specific customer
  customerName: { type: String, default: "" },
  isSingleUse: { type: Boolean, default: true },
  maxUses: { type: Number, default: 1 },
  timesUsed: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  usedInBillNumber: { type: String, default: "" },
  
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Coupan", couponSchema);
