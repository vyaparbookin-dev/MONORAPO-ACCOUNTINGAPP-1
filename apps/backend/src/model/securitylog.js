import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Securitylog", securityLogSchema);