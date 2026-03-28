import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: Array,
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Report", reportSchema);