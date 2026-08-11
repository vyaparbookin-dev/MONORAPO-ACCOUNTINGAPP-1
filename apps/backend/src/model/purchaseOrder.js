import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Cost price
});

const purchaseOrderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' }, // Optional for now
  orderNumber: { type: String, required: true, unique: true },
  orderDate: { type: Date, default: Date.now },
  items: [purchaseOrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Partially Received', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  notes: { type: String },
}, { timestamps: true });

// Auto-generate order number before saving
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.orderNumber = `PO-${Date.now()}`;
  }
  next();
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);