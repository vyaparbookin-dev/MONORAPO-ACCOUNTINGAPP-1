import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, lowercase: true, trim: true },
  shortCode: { type: String, lowercase: true, trim: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: false }, // Optional, agar sabke liye common rakhna hai
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Unit", unitSchema);