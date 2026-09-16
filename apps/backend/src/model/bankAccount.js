import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
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
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["CURRENT", "CC_OVERDRAFT", "SAVINGS"],
      default: "CURRENT",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    ifscCode: {
      type: String,
      trim: true,
      default: "",
    },
    sanctionedLimit: {
      type: Number,
      default: 0,
    },
    currentOutstanding: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ["deposit", "withdrawal", "interest_debit", "charges"],
          default: "deposit",
        },
        amount: { type: Number, required: true },
        note: { type: String, default: "" },
        referenceNo: { type: String, default: "" },
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

export default mongoose.model("BankAccount", bankAccountSchema);
