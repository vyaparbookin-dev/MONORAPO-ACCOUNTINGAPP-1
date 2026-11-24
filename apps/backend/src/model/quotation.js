import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  brand: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Pcs' },
  rate: { type: Number, required: true },
  rateTier: { type: String, enum: ['A', 'B', 'C', 'custom'], default: 'A' },
  rateA: { type: Number, default: 0 },
  rateB: { type: Number, default: 0 },
  rateC: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, required: true },
  isUnknown: { type: Boolean, default: false },
}, { strict: false });

const quotationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: false,
  },
  customerName: {
    type: String,
    default: 'ग्राहक',
    trim: true,
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true,
  },
  customerAddress: {
    type: String,
    default: '',
    trim: true,
  },
  quotationNumber: {
    type: String,
    required: true,
  },
  rateTier: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'A',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
  },
  items: [itemSchema],
  subTotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'invoiced', 'converted', 'pending'],
    default: 'pending',
  },
  convertedBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    default: null,
  },
  // 📞 CRM Follow-up & Expected Purchase Tracking
  expectedPurchaseDate: { type: Date }, // ग्राहक कब माल खरीदेगा (Expected Purchase Date)
  followUpDate: { type: Date }, // कब फोन / संपर्क करना है (Next Follow-up Date)
  followUpStatus: {
    type: String,
    enum: ['PENDING', 'CALL_DONE', 'INTERESTED', 'NEEDS_DISCOUNT', 'CONVERTED', 'LOST'],
    default: 'PENDING'
  },
  followUpNotes: { type: String, default: '' }, // ग्राहक से क्या बात हुई (Call details/notes)
  followUpLogs: [{
    calledAt: { type: Date, default: Date.now },
    calledBy: { type: String, default: 'Shop Owner' },
    callType: { type: String, enum: ['MANUAL', 'AI_VOICE'], default: 'MANUAL' },
    summary: { type: String, default: '' },
    customerResponse: { type: String, default: '' },
    nextFollowUpDate: { type: Date }
  }],
  aiCallStatus: {
    type: String,
    enum: ['NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED', 'FAILED'],
    default: 'NOT_SCHEDULED'
  },
  aiCallSummary: { type: String, default: '' },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true, strict: false });

quotationSchema.index({ companyId: 1, quotationNumber: 1 }, { unique: true });

export default mongoose.model('Quotation', quotationSchema);