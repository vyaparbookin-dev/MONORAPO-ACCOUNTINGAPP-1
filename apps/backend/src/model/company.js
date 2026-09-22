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
  modulesEnabled: [{ type: String }],
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

  // 🌐 Social Media & Google Business Hub
  googleReviewUrl: { type: String, default: "" }, // Google My Business / Google Maps review link
  instagramUrl: { type: String, default: "" },
  facebookUrl: { type: String, default: "" },
  youtubeUrl: { type: String, default: "" },
  whatsappBusinessNumber: { type: String, default: "" },
  reviewRewardCouponCode: { type: String, default: "STAR5" }, // Coupon gifted for 4 & 5-star review
  reviewRewardCouponDiscount: { type: Number, default: 10 }, // 10% or Rs 100

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
  freeAiScanCount: { type: Number, default: 0 }, // Free AI Bill Scans used
  maxFreeAiScans: { type: Number, default: 25 }, // Free limit of 25 AI scans
  subscriptionExpiresAt: { type: Date }, // Date when premium subscription expires

  // Udhar / Credit Settings
  udharOtpThreshold: { type: Number, default: 500 }, // Under this amount, Udhar OTP is not mandatory / auto-approved

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