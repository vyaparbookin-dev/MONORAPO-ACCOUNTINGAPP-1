import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({
  returnNumber: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true },
  type: { type: String, enum: ["sales_return", "purchase_return"], required: true }, // Credit Note vs Debit Note
  originalBillId: { type: mongoose.Schema.Types.ObjectId }, // Optional reference to original bill
  date: { type: Date, default: Date.now },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  reason: String,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure returnNumber is unique per company
returnSchema.index({ companyId: 1, returnNumber: 1 }, { unique: true });

export default mongoose.model("Return", returnSchema);