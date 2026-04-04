import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Removed unique:true to avoid cross-company errors
  description: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  parentCategory: mongoose.Schema.Types.ObjectId,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Category", categorySchema);
