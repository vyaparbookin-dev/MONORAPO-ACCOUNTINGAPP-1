import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  discount: Number,
  startDate: Date,
  endDate: Date,
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Scheme", schemeSchema);