import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
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
  model: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
  },
  specification: {
    type: String,
  },
  warrantyMonths: {
    type: Number,
    default: 0,
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
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  dealer: {
    type: String,
  },
  projectType: {
    type: String,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

equipmentSchema.index({ companyId: 1, name: 1 });

export default mongoose.models.Equipment || mongoose.model("Equipment", equipmentSchema);
