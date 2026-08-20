import mongoose from "mongoose";

const capitalSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  entryType: { 
    type: String, 
    enum: [
      'opening_cash',          // गल्ले में प्रारंभिक रोकड़
      'opening_bank',          // बैंक खाते का ओपनिंग बैलेंस
      'owner_capital',         // मालिक की प्रारंभिक पूंजी
      'partner_capital',       // पार्टनर की पूंजी
      'additional_capital',    // अतिरिक्त पूंजी निवेश
      'unsecured_loan',        // परिवार/मित्रों से लिया गया लोन
      'startup_renovation',    // दुकान स्थापना व इंटीरियर खर्च (कच्चा/पक्का)
      'legal_license_setup'    // लाइसेंस, रजिस्ट्रेशन, CA फीस
    ], 
    required: true 
  },
  title: { type: String, required: true },
  contributorName: { type: String, default: "Owner / प्रोपराइटर" },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['cash', 'bank', 'upi', 'cheque'], default: 'cash' },
  bankName: String,
  accountNumber: String,
  notes: String,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Capital", capitalSchema);
