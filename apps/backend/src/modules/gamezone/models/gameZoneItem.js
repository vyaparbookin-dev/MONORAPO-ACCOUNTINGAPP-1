import mongoose from 'mongoose';

const gameZoneItemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Game item name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['arcade', 'vr', 'sports', 'ticket', 'console'],
    default: 'arcade',
  },
  zoneType: {
    type: String,
    enum: ['single_player', 'multi_player', 'team', 'general'],
    default: 'general',
  },
  hourlyRate: {
    type: Number,
    default: 0,
  },
  basePrice: {
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

gameZoneItemSchema.index({ companyId: 1, name: 1 }, { unique: false });

export default mongoose.models.GameZoneItem || mongoose.model("GameZoneItem", gameZoneItemSchema);
