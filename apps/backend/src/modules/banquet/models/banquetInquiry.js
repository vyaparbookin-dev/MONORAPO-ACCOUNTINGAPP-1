import mongoose from "mongoose";

const banquetInquirySchema = new mongoose.Schema({
  inquiryNo: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  alternateMobile: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  customerCity: { type: String, default: "" },
  
  // Event Requirements
  eventType: { type: String, default: "Marriage / Ring Ceremony / Birthday" },
  expectedDate: { type: String, required: true },
  preferredShift: { type: String, enum: ["morning", "evening", "full_day"], default: "evening" },
  preferredHallName: { type: String, default: "Grand Royal Ballroom" },
  expectedPax: { type: Number, default: 100 },
  budgetEstimate: { type: Number, default: 75000 },

  // Staff & Hall Tour
  attendedByStaff: { type: String, default: "Banquet Sales Manager" },
  hallShown: { type: Boolean, default: true },
  referredBy: { type: String, default: "Direct Walk-in / Website / Social Media" },

  // Customer History Highlights (Auto-fetched)
  historySnippet: {
    isRepeatDiner: { type: Boolean, default: false },
    dinerVisitsCount: { type: Number, default: 0 },
    dinerTotalSpend: { type: Number, default: 0 },
    isRepeatBanquetHost: { type: Boolean, default: false },
    previousBanquetCount: { type: Number, default: 0 }
  },

  // CRM Pipeline & Follow-up
  status: {
    type: String,
    enum: ["new", "visited_hall", "follow_up", "quotation_sent", "converted", "lost"],
    default: "new"
  },
  nextFollowUpDate: { type: String, default: "" },
  clientFeedback: { type: String, default: "" },
  lostReason: { type: String, default: "" },
  
  convertedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "BanquetBooking" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.BanquetInquiry || mongoose.model("BanquetInquiry", banquetInquirySchema);
