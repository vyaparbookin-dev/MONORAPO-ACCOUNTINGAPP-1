import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // Supplier
  orderNumber: { type: String, required: true }, // Jaise: PO-2023-001
  date: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    rate: Number,
    taxAmount: { type: Number, default: 0 },
    totalAmount: Number
  }],
  subTotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);