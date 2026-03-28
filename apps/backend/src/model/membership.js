import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  memberName: { type: String, required: true },
  type: String,
  startDate: Date,
  endDate: Date,
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Membership", membershipSchema);