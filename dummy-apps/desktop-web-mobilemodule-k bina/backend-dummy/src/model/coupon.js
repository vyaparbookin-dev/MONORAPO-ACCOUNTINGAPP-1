import mongoose from "mongoose";

const coupanSchema = new mongoose.Schema({
  code: { type: String, required: true },
  discount: Number,
  expiryDate: Date,
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Coupan", coupanSchema);