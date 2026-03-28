import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  gstNumber: String,
  address: String,
  upiId: String, // Merchant UPI ID for QR Code Payments
  businessType: { type: String, enum: ['retail', 'wholesale', 'service', 'manufacturing', 'jewellery', 'clothes', 'hardware', 'electronic', 'restaurant', 'hotel', 'science', 'sports'], default: 'retail' },
  website: String,
  businessDescription: String,
  panNumber: String,
  bankName: String,
  accountName: String,
  accountNumber: String,
  ifscCode: String,
  caName: String,
  caPhone: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  synced: { type: Boolean, default: false },

  // Invoice Customization
  invoiceThemeColor: { type: String, default: '#007bff' }, // Default blue color
  invoiceTemplateType: { type: String, enum: ['classic', 'modern', 'minimal'], default: 'classic' },

  // Licensing and Subscription
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  freeBillCount: { type: Number, default: 0 }, // Number of bills created by free users
  maxFreeBills: { type: Number, default: 50 }, // Max bills allowed for free plan
  subscriptionExpiresAt: { type: Date }, // Date when premium subscription expires
});

export default mongoose.model("Company", companySchema)