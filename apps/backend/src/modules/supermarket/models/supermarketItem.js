import mongoose from 'mongoose';

const supermarketItemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  category: {
    type: String,
    default: 'general',
  },
  brand: {
    type: String,
    trim: true,
  },
  barcode: {
    type: String,
    trim: true,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    default: 0,
  },
  purchasePrice: {
    type: Number,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock'],
    default: 'active',
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

supermarketItemSchema.index({ companyId: 1, barcode: 1 });

export default mongoose.models.SupermarketItem || mongoose.model("SupermarketItem", supermarketItemSchema);
