import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, default: "Other" },
  
  // Classification: Operating, Owner Drawings, Personal FD/RD, Dealership Security Deposit, Bank Interest
  expenseType: { 
    type: String, 
    enum: ['operating', 'drawings', 'personal_investment', 'security_deposit', 'bank_interest_paid', 'bank_interest_received'], 
    default: 'operating' 
  },
  
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], default: 'cash' },

  // Dealership & Security Deposit Details
  depositDetails: {
    dealershipCompany: String, // e.g. "Berger Paints", "Kamdhenu", "Astral Pipes"
    depositType: { type: String, default: 'dealership_security' }, // 'dealership_security', 'distributor_advance', 'rent_security', 'cylinder_security'
    hasInterest: { type: Boolean, default: false },
    interestRate: { type: Number, default: 0 }, // e.g. 6.5% p.a.
    interestCycle: { type: String, default: 'yearly' }, // 'monthly', 'quarterly', 'yearly'
    refundDate: Date,
    terms: String
  },

  isDeleted: { type: Boolean, default: false },
  synced: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

export default mongoose.model("Expense", expenseSchema);