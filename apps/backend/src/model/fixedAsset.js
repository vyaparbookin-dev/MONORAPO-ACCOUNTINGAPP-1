import mongoose from "mongoose";

const fixedAssetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  assetName: { type: String, required: true },
  description: String,
  purchaseDate: { type: Date, required: true },
  purchaseCost: { type: Number, required: true },
  currentValue: { type: Number, required: true }, // Current book value after depreciation
  depreciationRate: { type: Number, required: true }, // Percentage (e.g., 10 for 10%)
  depreciationMethod: { type: String, enum: ['SLM', 'WDV'], default: 'WDV' }, // Straight Line or Written Down Value
  status: { type: String, enum: ['active', 'sold', 'scrapped'], default: 'active' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("FixedAsset", fixedAssetSchema);