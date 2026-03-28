import mongoose from "mongoose";

const expanceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: String,
  synced: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
});

export default mongoose.model("Expance", expanceSchema);