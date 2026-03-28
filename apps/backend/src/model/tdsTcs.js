import mongoose from "mongoose";

const tdsTcsSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  type: { type: String, enum: ['TDS_PAYABLE', 'TDS_RECEIVABLE', 'TCS_PAYABLE', 'TCS_RECEIVABLE'], required: true },
  section: { type: String, required: true }, // e.g., '194J', '194C', '206C'
  rate: { type: Number, required: true },
  baseAmount: { type: Number, required: true }, // Amount on which tax is calculated
  taxAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  relatedDocumentId: { type: mongoose.Schema.Types.ObjectId }, // Bill, Purchase, or Expance ID
  relatedDocumentModel: { type: String, enum: ['Bill', 'Purchase', 'Expance'] },
  status: { type: String, enum: ['pending', 'filed', 'paid'], default: 'pending' },
  challanNumber: { type: String }, // Jab Govt ko deposit kar dein tab yahan Challan No aayega
  paymentDate: { type: Date },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("TdsTcs", tdsTcsSchema);