import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      price: Number,
      gst: Number,
    },
  ],
  totalAmount: { type: Number },
  gstTotal: { type: Number },
  discount: { type: Number, default: 0 },
  billType: { type: String, default: "GST" }, // GST / Non-GST
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);