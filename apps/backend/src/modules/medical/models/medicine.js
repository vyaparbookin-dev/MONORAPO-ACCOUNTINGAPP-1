import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  genericName: {
    type: String,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    default: 'general',
  },
  dosage: {
    type: String,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  mrp: {
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
  stockQuantity: {
    type: Number,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    default: 0,
  },
  prescriptionRequired: {
    type: Boolean,
    default: false,
  },
  scheduleType: {
    type: String,
    enum: ['general', 'scheduleH', 'scheduleX', 'scheduleY'],
    default: 'general',
  },
  manufacturer: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

medicineSchema.index({ companyId: 1, name: 1 });

export default mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);
