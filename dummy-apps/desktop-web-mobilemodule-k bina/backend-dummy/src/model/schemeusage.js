import mongoose from "mongoose";

const schemeUsageSchema = new mongoose.Schema({
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: "Scheme" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  usedDate: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

export default mongoose.model("SchemeUsage", schemeUsageSchema);