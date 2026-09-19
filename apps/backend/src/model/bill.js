import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party" }, // Optional for POS walk-in customers
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Track salesman for incentives (Clothes/Retail/Restaurant)
  customerName: { type: String, required: true },
  customerMobile: { type: String },
  customerAddress: String,
  customerGst: String,
  siteName: String, // Hardware/Builder - Tracking multiple sites for same customer
  projectName: String, // Builder/Developer project grouping
  billImageUrl: { type: String }, // Field to store the URL of the bill image
  date: { type: Date, default: Date.now },
  dueDate: Date,
  // 🍽️ RESTAURANT SPECIFIC FIELDS (Petpooja Benchmark)
  orderType: { 
    type: String, 
    enum: ["dine_in", "takeaway", "delivery"], 
    default: "dine_in" 
  },
  tableNo: { type: String, default: "" },
  tableNotes: { type: String, default: "" }, // Special table instructions (e.g. VIP guest, Birthday, High chair)
  waiter: { type: String, default: "" },
  kotNumber: { type: String, default: "" },
  pax: { type: Number, default: 2 },
  review: {
    foodRating: { type: Number, min: 1, max: 5 },
    staffRating: { type: Number, min: 1, max: 5 },
    ambienceRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },
    reviewedStaffName: { type: String, default: "" }
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      quantity: { type: Number, default: 1 },
      rate: { type: Number, default: 0 },
      unit: { type: String, default: "pcs" },
      hsnCode: { type: String, default: "" },
      taxable: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      station: { type: String, default: "MAIN_KITCHEN" },
      cookingInstructions: { type: String, default: "" }, // Special food notes (e.g. Jain / No onion-garlic, Extra spicy, Crispy naan)
      // Jewellery Specific Fields in Bill
      weight: { type: Number },
      purity: { type: String },
      makingCharges: { type: Number, default: 0 },
    },
  ],
  total: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  freightCharges: { type: Number, default: 0 }, // Hardware: Transport/Delivery charges
  laborCharges: { type: Number, default: 0 }, // Builder: Mazdoori / Installation charges
  finalAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ["cash", "cheque", "card", "online", "credit"], default: "cash" },
  notes: String,
  status: { 
    type: String, 
    enum: ["draft", "issued", "paid", "cancelled"],
    default: "draft" 
  },
  editHistory: [{
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedByName: String,
    editedAt: { type: Date, default: Date.now },
    previousTotal: Number,
    newTotal: Number,
    changesSummary: String
  }],
  isDeleted: { type: Boolean, default: false },
  synced: { type: Boolean, default: false },

  // 🛡️ LEGAL UDHAR PROTECTION & OTP HANDOVER (IT Act 2000 Section 10A)
  isUdharProtected: { type: Boolean, default: false },
  otpCode: { type: String, default: "" },
  otpExpiresAt: { type: Date },
  isOtpVerified: { type: Boolean, default: false },
  otpVerifiedAt: { type: Date },
  legalAgreementText: { type: String, default: "" },
  lateInterestPercent: { type: Number, default: 2 }, // Monthly interest percentage (e.g. 2% per month)
  handoverStatus: { 
    type: String, 
    enum: ["PENDING_OTP", "VERIFIED_HANDED_OVER", "BYPASSED", "CASH_PAID", "NOT_REQUIRED"], 
    default: "CASH_PAID" 
  },
  whatsappDeliveryStatus: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure billNumber is unique per company
billSchema.index({ companyId: 1, billNumber: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);