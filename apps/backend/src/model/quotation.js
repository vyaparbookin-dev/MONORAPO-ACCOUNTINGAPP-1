import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Pcs' },
  rate: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

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
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

quotationSchema.index({ companyId: 1, quotationNumber: 1 }, { unique: true });

export default mongoose.model('Quotation', quotationSchema);