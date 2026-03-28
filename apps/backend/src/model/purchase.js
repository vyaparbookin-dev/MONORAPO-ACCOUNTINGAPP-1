import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true }, // Supplier
  supplierName: { type: String, required: true },
  billImageUrl: { type: String }, // Agar purchase bill ki photo upload karni ho
  date: { type: Date, default: Date.now },
  dueDate: Date,
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: String,
      quantity: { type: Number, required: true, default: 1 },
      rate: { type: Number, required: true, default: 0 },
      unit: { type: String, default: "pcs" },
      taxable: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  ],
  totalAmount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 }, // Ye total amount payable hoga
  paymentStatus: { type: String, enum: ["unpaid", "paid", "partial"], default: "unpaid" },
  paymentMethod: { type: String, enum: ["cash", "cheque", "online", "credit"], default: "credit" },
  amountPaid: { type: Number, default: 0 }, // Kitna turant pay kar diya
  notes: String,
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure purchaseNumber is unique per company
purchaseSchema.index({ companyId: 1, purchaseNumber: 1 }, { unique: true });

export default mongoose.model("Purchase", purchaseSchema);