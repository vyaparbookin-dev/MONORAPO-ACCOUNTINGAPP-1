import mongoose from "mongoose";

const banquetBookingSchema = new mongoose.Schema({
  bookingNo: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: "BanquetHall" },
  hallName: { type: String, required: true },
  eventName: { type: String, default: "Marriage / Birthday Party / Corporate" },
  
  // Host & Organizer Details
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  alternateMobile: { type: String, default: "" },
  customerAddress: { type: String, default: "" },
  city: { type: String, default: "" },
  
  // Schedule & Slot Lock
  eventDate: { type: String, required: true }, // Format: YYYY-MM-DD
  timeSlot: { 
    type: String, 
    enum: ["morning", "evening", "full_day"], 
    required: true 
  },
  setupStartTime: { type: String, default: "09:00 AM" },
  foodServingTime: { type: String, default: "01:00 PM" },
  
  // Guest Count
  minGuaranteedPax: { type: Number, required: true, default: 50 },
  actualCountedPax: { type: Number, default: 50 },
  maxFloatingPax: { type: Number, default: 75 },

  // Catering & Menu Engineering
  packageId: { type: String, default: "PKG-GOLD" },
  packageName: { type: String, default: "Gold Royal Buffet" },
  baseRatePerPlate: { type: Number, default: 600 },
  swappedDishesDifferential: { type: Number, default: 0 },
  finalRatePerPlate: { type: Number, default: 600 },
  menuItems: [{ type: String }],
  swappedDishes: [
    {
      originalDish: String,
      replacementDish: String,
      priceDiff: Number
    }
  ],
  extraDishesAdded: [
    {
      dishName: String,
      extraRatePerPlate: Number
    }
  ],

  // Venue & Extra Addons
  hallRent: { type: Number, default: 0 },
  addons: [
    {
      id: String,
      name: String,
      price: Number,
      isIncluded: { type: Boolean, default: false },
      provider: String
    }
  ],

  // Infrastructure & Asset Checklist
  seatingConfig: {
    style: { type: String, default: "Lounge & Round Tables" },
    sofaCount: { type: Number, default: 6 },
    chairCount: { type: Number, default: 100 },
    roundTableCount: { type: Number, default: 12 },
    stageTheme: { type: String, default: "Royal Floral & Warm Lights" }
  },
  crockeryConfig: {
    plateType: { type: String, default: "Bone-China Deluxe" },
    chafingDishesCount: { type: Number, default: 8 },
    glasswareCount: { type: Number, default: 120 },
    cutlerySet: { type: String, default: "SS Mirror Finish Spoons/Forks" }
  },
  breakageCharges: [
    {
      item: String,
      qty: Number,
      rate: Number,
      total: Number
    }
  ],

  // Financial Ledger & Advance
  advancePaid: { type: Number, default: 0 },
  advancePaymentMethod: { type: String, default: "upi" },
  advanceDate: { type: Date, default: Date.now },
  totalEstimatedAmount: { type: Number, default: 0 },
  finalSettlementAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "advance_paid", "partially_paid", "fully_settled"],
    default: "advance_paid"
  },
  status: {
    type: String,
    enum: ["inquiry", "confirmed", "ongoing", "completed", "cancelled"],
    default: "confirmed"
  },

  // Kitchen Operation Mode (Shared vs Independent)
  kitchenSyncMode: { 
    type: String, 
    enum: ["independent", "shared_restaurant"], 
    default: "shared_restaurant" 
  },
  kitchenIndent: [
    {
      rawMaterialName: String,
      estimatedQty: Number,
      unit: String,
      costAllocated: Number
    }
  ],

  notes: { type: String, default: "" },
  beoGeneratedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("BanquetBooking", banquetBookingSchema);
