import mongoose from "mongoose";

const bankStatementSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  statementName: { type: String, default: "Bank Statement Upload" },
  uploadDate: { type: Date, default: Date.now },
  entries: [{
    date: Date,
    amount: Number,
    type: { type: String, enum: ['credit', 'debit'] },
    description: String,
    isReconciled: { type: Boolean, default: false },
    matchType: { type: String }, // 'PartyTransaction' ya 'Expance'
    matchId: { type: mongoose.Schema.Types.ObjectId }
  }]
}, { timestamps: true });

export default mongoose.model("BankStatement", bankStatementSchema);