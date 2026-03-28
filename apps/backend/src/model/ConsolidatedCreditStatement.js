import mongoose from "mongoose";

const consolidatedCreditStatementSchema = new mongoose.Schema({
  statementNumber: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true },
  customerName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  bills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },
  ],
  totalAmount: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["generated", "settled", "cancelled"],
    default: "generated",
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure statementNumber is unique per company
consolidatedCreditStatementSchema.index({ companyId: 1, statementNumber: 1 }, { unique: true });

export default mongoose.model("ConsolidatedCreditStatement", consolidatedCreditStatementSchema);
