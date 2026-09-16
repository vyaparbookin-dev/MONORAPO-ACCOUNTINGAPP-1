import BankAccount from "../model/bankAccount.js";
import mongoose from "mongoose";

// Get all bank & CC accounts
export const getBankAccounts = async (req, res) => {
  try {
    const coFilter = req.companyId
      ? mongoose.Types.ObjectId.isValid(req.companyId)
        ? { $in: [req.companyId, new mongoose.Types.ObjectId(req.companyId)] }
        : req.companyId
      : null;

    const query = { isDeleted: { $ne: true } };
    if (coFilter) query.companyId = coFilter;

    const accounts = await BankAccount.find(query).sort({ createdAt: -1 });

    const totalCurrentBalance = accounts
      .filter((a) => a.accountType === "CURRENT" || a.accountType === "SAVINGS")
      .reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);

    const totalCCSanctioned = accounts
      .filter((a) => a.accountType === "CC_OVERDRAFT")
      .reduce((s, a) => s + (Number(a.sanctionedLimit) || 0), 0);

    const totalCCOutstanding = accounts
      .filter((a) => a.accountType === "CC_OVERDRAFT")
      .reduce((s, a) => s + (Number(a.currentOutstanding) || 0), 0);

    const totalCCAvailable = totalCCSanctioned - totalCCOutstanding;

    res.status(200).json({
      success: true,
      data: accounts,
      accounts: accounts,
      summary: {
        totalCurrentBalance,
        totalCCSanctioned,
        totalCCOutstanding,
        totalCCAvailable,
        count: accounts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new bank / CC account
export const createBankAccount = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.companyId) data.companyId = req.companyId;
    if (req.user?._id) data.userId = req.user._id;

    const newAccount = await BankAccount.create(data);
    res.status(201).json({ success: true, data: newAccount, message: "बैंक / CC खाता दर्ज हो गया!" });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update bank / CC account
export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BankAccount.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    res.status(200).json({ success: true, data: updated, message: "खाता अपडेट हो गया!" });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete bank / CC account
export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await BankAccount.findByIdAndUpdate(id, { isDeleted: true });
    res.status(200).json({ success: true, message: "खाता हटा दिया गया!" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record transaction in Bank / CC (Deposit, Withdrawal, Interest Debit, Charges)
export const addAccountTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, note, referenceNo, date } = req.body;

    const account = await BankAccount.findById(id);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const txAmt = Number(amount) || 0;
    account.transactions.push({
      date: date ? new Date(date) : new Date(),
      type: type || "deposit",
      amount: txAmt,
      note: note || "",
      referenceNo: referenceNo || "",
    });

    if (account.accountType === "CC_OVERDRAFT") {
      if (type === "deposit") {
        // Deposited money into CC -> reduces borrowed outstanding
        account.currentOutstanding = Math.max(0, (Number(account.currentOutstanding) || 0) - txAmt);
      } else if (type === "withdrawal") {
        // Withdrew money from CC -> increases borrowed outstanding
        account.currentOutstanding = (Number(account.currentOutstanding) || 0) + txAmt;
      } else if (type === "interest_debit" || type === "charges") {
        // Bank debited interest/charges -> increases borrowed outstanding
        account.currentOutstanding = (Number(account.currentOutstanding) || 0) + txAmt;
      }
    } else {
      // Regular Current / Savings Account
      if (type === "deposit") {
        account.currentBalance = (Number(account.currentBalance) || 0) + txAmt;
      } else if (type === "withdrawal" || type === "interest_debit" || type === "charges") {
        account.currentBalance = (Number(account.currentBalance) || 0) - txAmt;
      }
    }

    await account.save();

    res.status(200).json({
      success: true,
      data: account,
      message: `लेनदेन (₹${txAmt.toLocaleString("en-IN")}) सफलतापूर्वक दर्ज हो गया!`,
    });
  } catch (error) {
    console.error("Error recording account transaction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record monthly interest (System Auto Calculated vs Actual Statement Interest)
export const addMonthlyInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, monthName, calculatedInterest, actualInterest, date, note, postToExpenses } = req.body;

    const account = await BankAccount.findById(id);
    if (!account) {
      return res.status(404).json({ success: false, message: "खाता नहीं मिला (Account not found)" });
    }

    const interestAmt = Number(actualInterest) || 0;
    const calcAmt = Number(calculatedInterest) || 0;
    const recordDate = date ? new Date(date) : new Date();

    if (!account.monthlyInterests) {
      account.monthlyInterests = [];
    }

    const monthKey = month || new Date().toISOString().slice(0, 7);
    const existingIndex = account.monthlyInterests.findIndex((m) => m.month === monthKey);
    const newEntry = {
      month: monthKey,
      monthName: monthName || monthKey,
      calculatedInterest: calcAmt,
      actualInterest: interestAmt,
      date: recordDate,
      note: note || "",
      postedToExpenses: postToExpenses !== false,
    };

    if (existingIndex >= 0) {
      account.monthlyInterests[existingIndex] = newEntry;
    } else {
      account.monthlyInterests.push(newEntry);
    }

    // Also record in transactions history
    account.transactions.push({
      date: recordDate,
      type: "interest_debit",
      amount: interestAmt,
      note: note || `मासिक ब्याज (${monthName || monthKey}) - असली ब्याज डेबिट`,
      referenceNo: `INT-${monthKey}`,
    });

    if (account.accountType === "CC_OVERDRAFT") {
      account.currentOutstanding = (Number(account.currentOutstanding) || 0) + interestAmt;
    } else {
      account.currentBalance = (Number(account.currentBalance) || 0) - interestAmt;
    }

    await account.save();

    res.status(200).json({
      success: true,
      data: account,
      message: `${monthName || monthKey} का बैंक ब्याज ₹${interestAmt.toLocaleString("en-IN")} सफलतापूर्वक दर्ज हो गया!`,
    });
  } catch (error) {
    console.error("Error adding monthly interest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
