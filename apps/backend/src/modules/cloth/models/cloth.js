import mongoose from 'mongoose';

const clothSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Cloth name is required'],
    trim: true,
  },
  category: {
    type: String,
    default: 'general',
  },
  fabric: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  size: {
    type: String,
    trim: true,
  },
  style: {
    type: String,
    trim: true,
  },
  season: {
    type: String,
    enum: ['summer', 'winter', 'all-season', 'festive'],
    default: 'all-season',
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  purchasePrice: {
    type: Number,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  },
  sku: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

clothSchema.index({ companyId: 1, name: 1 });

export default mongoose.models.Cloth || mongoose.model("Cloth", clothSchema);
