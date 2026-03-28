import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ['admin', 'manager', 'cashier', 'salesman', 'godown'],
    default: 'admin' // By default naya user admin banega
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);