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

  // Event Dedicated Groceries (Bought separately for this event)
  eventGroceryExpenses: [
    {
      itemName: String,
      qty: Number,
      unit: String,
      cost: Number,
      vendorName: String,
      billNo: String,
      isDirectExpense: { type: Boolean, default: true },
      isSharedKitchenStock: { type: Boolean, default: false },
      date: { type: Date, default: Date.now }
    }
  ],

  // Commercial Gas Cylinders Usage & Cost
  gasCylinderUsage: [
    {
      cylinderCount: { type: Number, default: 0 },
      ratePerCylinder: { type: Number, default: 1850 },
      totalCost: { type: Number, default: 0 },
      supplierName: { type: String, default: "Commercial Gas Agency" },
      date: { type: Date, default: Date.now }
    }
  ],

  // Operational Staffing (Internal Team + External Freelancers / Halwai Labor)
  staffingRoster: {
    bookedBy: { type: String, default: "General Manager" },
    eventManager: { type: String, default: "Floor Captain" },
    headChef: { type: String, default: "Master Chef" },
    internalStaffCount: { type: Number, default: 8 },
    externalStaff: [
      {
        role: { type: String, default: "Waiter" }, // "Waiter", "Halwai Assistant", "Bartender", "Bouncer"
        vendorOrAgency: String,
        staffCount: { type: Number, default: 0 },
        wagePerPerson: { type: Number, default: 600 },
        totalWage: { type: Number, default: 0 },
        isPaid: { type: Boolean, default: false }
      }
    ]
  },

  // Food Service Timeline & Special Arrangements
  serviceTimeline: {
    welcomeDrinksStartersTime: { type: String, default: "07:00 PM - 08:30 PM" },
    buffetOpeningTime: { type: String, default: "08:30 PM - 10:30 PM" },
    dessertsTime: { type: String, default: "10:00 PM onwards" },
    closeTime: { type: String, default: "12:00 AM" },
    specialArrangements: [{ type: String }], // e.g. "Stage floral arch", "Cold pyro entry", "DJ sound permit"
    specialFoodInstructions: { type: String, default: "" } // e.g. "Separate Jain counter 40 pax"
  },

  // Milestone Installment Schedule & Split Payments
  paymentInstallments: [
    {
      milestoneName: { type: String, default: "Token Advance" }, // "Token Advance", "Pre-Event 7 Days", "Event Day Settlement"
      percent: { type: Number, default: 25 },
      dueDate: String,
      amount: { type: Number, default: 0 },
      status: { type: String, enum: ["paid", "due", "overdue"], default: "due" },
      paidDate: Date,
      paymentModeBreakdown: {
        cash: { type: Number, default: 0 },
        upi: { type: Number, default: 0 },
        cheque: {
          chequeNo: { type: String, default: "" },
          bankName: { type: String, default: "" },
          amount: { type: Number, default: 0 }
        },
        card: { type: Number, default: 0 },
        onlineRef: { type: String, default: "" }
      }
    }
  ],

  // Cancellation Policy & Refund Calculation
  cancellationPolicy: {
    noticeDays30PlusRefundPercent: { type: Number, default: 90 },
    noticeDays15To30RefundPercent: { type: Number, default: 50 },
    noticeDaysBelow15RefundPercent: { type: Number, default: 0 },
    isCancelled: { type: Boolean, default: false },
    cancellationDate: Date,
    refundAmount: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    cancellationReason: { type: String, default: "" }
  },

  // Physical Plate Count Audit & Host Verification Sign-Off
  plateAudit: {
    agreedPlates: { type: Number, default: 0 },
    actualPlatesCounted: { type: Number, default: 0 },
    extraPlatesUsed: { type: Number, default: 0 },
    extraPlateRate: { type: Number, default: 0 },
    extraPlatesTotalCost: { type: Number, default: 0 },
    verifiedByHostName: { type: String, default: "" },
    verifiedByHostPhone: { type: String, default: "" },
    hostRelation: { type: String, default: "Host" }, // "Host himself", "Father", "Brother", "Planner"
    hostSignatureNotes: { type: String, default: "" },
    auditTimestamp: Date,
    isSigned: { type: Boolean, default: false }
  },

  // CRM & Reference Metadata
  referralSource: { type: String, default: "Direct Walk-in" },
  handledByStaff: { type: String, default: "Sales Executive" },
  customerHistorySnippet: {
    isRepeatDiner: { type: Boolean, default: false },
    dinerVisitsCount: { type: Number, default: 0 },
    dinerTotalSpend: { type: Number, default: 0 },
    isRepeatBanquetHost: { type: Boolean, default: false },
    previousBanquetCount: { type: Number, default: 0 }
  },

  // Post-Event Leftover Raw Material Reconciliation & Return/Transfer
  leftoverReconciliation: {
    reconciledAt: Date,
    reconciledBy: { type: String, default: "Kitchen Manager" },
    totalCreditValue: { type: Number, default: 0 },
    items: [
      {
        itemName: String,
        leftoverQty: Number,
        unit: String,
        unitRate: Number,
        totalCreditValue: Number,
        disposition: { 
          type: String, 
          enum: ["transferred_to_restaurant", "returned_to_vendor"],
          default: "transferred_to_restaurant" 
        },
        recipientOrVendor: String,
        notes: String
      }
    ]
  },

  // 🏨 Large Banquet Resort & Hotel Room Allotment (PMS Integration)
  hotelRoomBlocks: [
    {
      roomNumber: { type: String, required: true }, // e.g. "101", "Villa 1"
      roomType: { type: String, default: "Deluxe AC" }, // "Deluxe AC", "Super Deluxe", "Luxury Suite", "Dormitory"
      checkInDate: String,
      checkOutDate: String,
      guestName: { type: String, default: "" },
      guestMobile: { type: String, default: "" },
      guestCount: { type: Number, default: 2 },
      extraBedsCount: { type: Number, default: 0 },
      extraBedChargePerNight: { type: Number, default: 800 },
      roomTariffPerNight: { type: Number, default: 4500 },
      billingMode: { 
        type: String, 
        enum: ["included_in_event_package", "host_master_bill", "guest_direct_cash"], 
        default: "included_in_event_package" 
      },
      roomServiceEnabled: { type: Boolean, default: true },
      roomServiceBillingMode: { 
        type: String, 
        enum: ["bill_to_master_host", "guest_direct_cash", "complimentary_in_package"], 
        default: "bill_to_master_host" 
      },
      welcomeKits: [{ type: String }], // ["Bottled Water 2L", "Dry Fruit Box", "Toiletry Kit", "Wedding Itinerary Badge"]
      status: { 
        type: String, 
        enum: ["reserved", "checked_in", "checked_out"], 
        default: "reserved" 
      }
    }
  ],

  // 📅 Multi-Hall & Multi-Day Wedding Itinerary Rundown
  eventItineraryRundown: [
    {
      dayNumber: { type: Number, default: 1 },
      dayTitle: { type: String, default: "Day 1: Mehendi & Welcome High Tea" },
      venueHallOrLawn: { type: String, default: "Emerald Green Party Lawn" },
      date: String,
      timeSpan: { type: String, default: "04:00 PM - 08:00 PM" },
      expectedPax: { type: Number, default: 100 },
      seatingArrangement: { type: String, default: "Low Diwan Seating with Canopies" },
      cateringType: { type: String, default: "High Tea & Live Chaat Pavilions" },
      decorTheme: { type: String, default: "Bright Marigold & Folk Music" }
    }
  ],

  // 👔 Departmental Managers & Customer SPOC Responsibility Matrix
  departmentalManagers: [
    {
      department: { type: String, default: "Main Kitchen & F&B Production" },
      managerName: { type: String, default: "मास्टर शेफ राजवीर सिंह" },
      mobileNumber: { type: String, default: "98260-11223" },
      dutyShift: { type: String, default: "Full Event" },
      customerFacing: { type: Boolean, default: false },
      keyResponsibilities: { type: String, default: "भोजन की गुणवत्ता, समय पर बुफे रीफिल, और शुद्ध जैन काउंटर व्यवस्था" }
    }
  ],

  notes: { type: String, default: "" },
  beoGeneratedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("BanquetBooking", banquetBookingSchema);
