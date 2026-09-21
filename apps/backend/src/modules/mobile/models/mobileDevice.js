import mongoose from 'mongoose';

const mobileDeviceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  imei: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  storage: {
    type: String,
    trim: true,
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
    enum: ['active', 'inactive', 'repair', 'sold'],
    default: 'active',
  },
  accessory: {
    type: String,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

mobileDeviceSchema.index({ companyId: 1, imei: 1 }, { unique: false });

export default mongoose.models.MobileDevice || mongoose.model("MobileDevice", mobileDeviceSchema);
