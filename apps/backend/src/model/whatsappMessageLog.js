import mongoose from "mongoose";

const whatsappMessageLogSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  channel: { type: String, enum: ['billing', 'recovery', 'marketing'], default: 'billing', index: true },
  senderPhone: { type: String, default: "" }, // WhatsApp sender number (e.g. 919876543210)
  recipientName: { type: String, default: "ग्राहक" },
  recipientPhone: { type: String, required: true, index: true },
  messageType: { 
    type: String, 
    enum: ['invoice', 'quotation', 'recovery', 'marketing', 'receipt', 'direct'], 
    default: 'direct',
    index: true 
  },
  documentId: { type: String, default: "" },
  documentNumber: { type: String, default: "" },
  messageText: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'FAILED', 'PENDING'], default: 'SENT', index: true },
  statusReason: { type: String, default: "" },
  messageId: { type: String, default: "" }, // Baileys message ID
  sentByUserId: { type: String, default: "" },
  sentByUserName: { type: String, default: "व्यापारी" },
  sentAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

const WhatsAppMessageLog = mongoose.models.WhatsAppMessageLog || mongoose.model("WhatsAppMessageLog", whatsappMessageLogSchema);
export default WhatsAppMessageLog;
