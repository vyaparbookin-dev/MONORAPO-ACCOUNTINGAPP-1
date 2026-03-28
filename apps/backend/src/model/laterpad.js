import mongoose from "mongoose";

const laterpadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: Number,
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Laterpad", laterpadSchema);