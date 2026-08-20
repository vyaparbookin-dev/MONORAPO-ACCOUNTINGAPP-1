import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  query: { type: String, required: true },
  responseSummary: String,
  queryType: { 
    type: String, 
    enum: ['sales_insight', 'stock_reorder', 'khata_overdue', 'profit_growth', 'general_query', 'product_search'],
    default: 'general_query'
  },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, required: true },
  costInr: { type: Number, default: 0 }, // Estimated cost in INR (e.g. ₹0.002 per 1k tokens)
  ipAddress: String
}, { timestamps: true });

export default mongoose.model("AiUsage", aiUsageSchema);
