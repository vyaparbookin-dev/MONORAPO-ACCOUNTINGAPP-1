import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  gstNumber: String,
  gstType: { type: String, enum: ['regular', 'composition', 'unregistered'], default: 'regular' },
  enableGst: { type: Boolean, default: true }, // Added to store GST ON/OFF state
  address: String,
  upiId: String, // Merchant UPI ID for QR Code Payments
  businessType: [{ type: String }],
  industryType: String,
  ownershipType: { type: String, enum: ['Proprietorship', 'Partnership', 'Private Limited', 'LLC / LLP', 'HUF', 'Other'], default: 'Proprietorship' },
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
  logo: String, // Base64 string for the logo

  // App Preferences (can be company-specific)
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },

  // Licensing and Subscription
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  freeBillCount: { type: Number, default: 0 }, // Number of bills created by free users
  maxFreeBills: { type: Number, default: 50 }, // Max bills allowed for free plan
  subscriptionExpiresAt: { type: Date }, // Date when premium subscription expires

  // New Settings object for extensibility
  settings: {
    whatsapp: {
      enabled: { type: Boolean, default: false },
      accessToken: { type: String }, // Meta Access Token
      phoneNumberId: { type: String }, // Meta Phone Number ID
      wabaId: { type: String }, // Meta WABA ID (Optional for sending)
      template: { type: String, default: 'Hello {customerName}, your invoice {billNumber} for Rs. {amount} is ready. Thank you for your business, {companyName}.' }
    }
  }
});

export default mongoose.model("Company", companySchema)