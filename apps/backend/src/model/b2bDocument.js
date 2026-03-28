import mongoose from "mongoose";

const b2bDocumentSchema = new mongoose.Schema({
  documentNumber: { type: String, required: true },
  type: { type: String, enum: ["quotation", "sales_order", "delivery_challan"], required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true }, // Customer
  date: { type: Date, default: Date.now },
  validUntil: { type: Date }, // Especially for Quotations
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      quantity: { type: Number, required: true, default: 1 },
      rate: { type: Number, required: true, default: 0 },
      taxable: { type: Number, default: 0 },
      taxRate: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    }
  ],
  totalAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["open", "converted", "cancelled"], default: "open" },
  convertedBillId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }, // Reference to the generated bill
  notes: String,
  termsAndConditions: String,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

b2bDocumentSchema.index({ companyId: 1, documentNumber: 1 }, { unique: true });

export default mongoose.model("B2bDocument", b2bDocumentSchema);