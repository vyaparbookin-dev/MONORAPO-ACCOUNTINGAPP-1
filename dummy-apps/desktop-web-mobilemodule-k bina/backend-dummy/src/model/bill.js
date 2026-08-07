import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true },
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Track salesman for incentives (Clothes/Retail)
  customerName: { type: String, required: true },
  customerMobile: { type: String },
  customerAddress: String,
  customerGst: String,
  siteName: String, // Hardware/Builder - Tracking multiple sites for same customer
  projectName: String, // Builder/Developer project grouping
  billImageUrl: { type: String }, // Field to store the URL of the bill image
  date: { type: Date, default: Date.now },
  dueDate: Date,
  items: [
    {
      name: String,
      quantity: { type: Number, default: 1 },
      rate: { type: Number, default: 0 },
      unit: { type: String, default: "pcs" },
      hsnCode: { type: String, default: "" },
      taxable: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure billNumber is unique per company
billSchema.index({ companyId: 1, billNumber: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);