import mongoose from "mongoose";

const savingsSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["FD", "RD", "SIP", "PPF", "LIC", "GOLD", "OTHER"],
      default: "FD",
    },
    bankOrPlatform: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    principalAmount: {
      type: Number,
      default: 0,
    },
    monthlyInstallment: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
      default: null,
    },
    monthlyDueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 5,
    },
    sourceOfFunds: {
      type: String,
      enum: ["business_salary", "business_capital", "personal_funds"],
      default: "business_salary",
    },
    savingsCategory: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },
    maturityAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "matured", "closed"],
      default: "active",
    },
    installmentsHistory: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        source: { type: String, default: "business_salary" },
        note: { type: String, default: "" },
        paymentMode: { type: String, default: "bank_transfer" },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Savings || mongoose.model("Savings", savingsSchema);
