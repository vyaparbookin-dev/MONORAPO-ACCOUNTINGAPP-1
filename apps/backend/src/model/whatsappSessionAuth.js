import mongoose from "mongoose";

const whatsappSessionAuthSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  channel: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  data: { type: String, required: true }, // base64 or string content
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

whatsappSessionAuthSchema.index({ companyId: 1, channel: 1, fileName: 1 }, { unique: true });

const WhatsAppSessionAuth = mongoose.models.WhatsAppSessionAuth || mongoose.model("WhatsAppSessionAuth", whatsappSessionAuthSchema);
export default WhatsAppSessionAuth;
