import mongoose from 'mongoose';

const partyTransactionSchema = new mongoose.Schema({
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, required: true, default: Date.now },
  details: { type: String, required: true },
  debit: { type: Number, default: 0 },  // Udhar (Paisa Lena Hai / Bill Amount)
  credit: { type: Number, default: 0 }, // Jama (Paisa Aa Gaya)
  type: { type: String, default: 'manual' }, // 'manual', 'bill', 'purchase', 'opening_balance'
  billImageUrl: { type: String, default: '' }, // Attached photo of bill / receipt
  billNumber: { type: String, default: '' },
  siteName: { type: String, default: '' }, // Site tracking (PWD, COMPLEX, PAINT, etc.)
  referenceBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PartyTransaction', partyTransactionSchema);