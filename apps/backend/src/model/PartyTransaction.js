import mongoose from 'mongoose';

const partyTransactionSchema = new mongoose.Schema({
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, required: true, default: Date.now },
  details: { type: String, required: true },
  debit: { type: Number, default: 0 },  // Udhar (Paisa Lena Hai / Bill Amount)
  credit: { type: Number, default: 0 }, // Jama (Paisa Aa Gaya)
  type: { type: String, default: 'manual' } // 'manual', 'bill', 'opening_balance'
}, { timestamps: true });

export default mongoose.model('PartyTransaction', partyTransactionSchema);