import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  contactNumber: String,
  isMainBranch: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Branch", branchSchema);