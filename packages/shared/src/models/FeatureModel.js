import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: false },
  applyTo: [{ type: String }], // e.g., ["party", "product"]
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Feature || mongoose.model("Feature", FeatureSchema);