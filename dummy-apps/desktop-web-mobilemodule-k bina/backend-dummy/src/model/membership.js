import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  memberName: { type: String, default: "" },
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  type: { type: String, default: "standard" },
  tier: { type: String, default: "Silver" },
  points: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  isDeleted: { type: Boolean, default: false },
  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Membership", membershipSchema);