import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true },
  shortCode: { type: String, trim: true }, // Alias for backwards compatibility
  isCompound: { type: Boolean, default: false },
  baseUnit: { type: String, trim: true }, // e.g. "pcs" when unit is "box"
  conversionValue: { type: Number, default: 1 }, // e.g. 10 (1 box = 10 pcs)
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Unit", unitSchema);
