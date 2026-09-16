import BankAccount from "../model/bankAccount.js";
import mongoose from "mongoose";

// Get all bank & CC accounts
export const getBankAccounts = async (req, res) => {
  try {
    const coConditions = [];
    if (req.companyId) {
      if (mongoose.Types.ObjectId.isValid(req.companyId)) {
        coConditions.push({ companyId: req.companyId });
        coConditions.push({ companyId: new mongoose.Types.ObjectId(req.companyId) });
      } else {
        coConditions.push({ companyId: req.companyId });
      }
    }
    if (req.user?._id) {
      coConditions.push({ userId: req.user._id });
    }

    const query = { isDeleted: { $ne: true } };
    if (coConditions.length > 0) {
      query.$or = coConditions;
    }

    console.log("[BankAccount Debug] getBankAccounts query:", JSON.stringify(query));
    const accounts = await BankAccount.find(query).sort({ createdAt: -1 });
    console.log("[BankAccount Debug] found accounts count:", accounts.length);

    const totalCurrentBalance = accounts
      .filter((a) => a.accountType === "CURRENT" || a.accountType === "SAVINGS" || a.accountType === "PERSONAL_BUSINESS")
      .reduce((s, a) => s + (Number(a.currentBalance || a.balance) || 0), 0);

    const totalCCSanctioned = accounts
      .filter((a) => a.accountType === "CC_OVERDRAFT")
      .reduce((s, a) => s + (Number(a.sanctionedLimit) || 0), 0);

    const totalCCOutstanding = accounts
      .filter((a) => a.accountType === "CC_OVERDRAFT")
      .reduce((s, a) => s + (Number(a.currentOutstanding) || 0), 0);

    const totalCCAvailable = Math.max(0, totalCCSanctioned - totalCCOutstanding);

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

    // CRITICAL FIX: If client sent a non-ObjectId string _id like 'bnk_...', strip it so MongoDB generates a valid ObjectId
    if (data._id && !mongoose.Types.ObjectId.isValid(data._id)) {
      data.clientTempId = String(data._id);
      delete data._id;
    }
    if (data.id && !mongoose.Types.ObjectId.isValid(data.id)) {
      if (!data.clientTempId) data.clientTempId = String(data.id);
      delete data.id;
    }

    console.log("[BankAccount Debug] Creating bank account:", data.accountName, data.bankName, "companyId:", data.companyId);
    const newAccount = await BankAccount.create(data);
    console.log("[BankAccount Debug] Created bank account ID:", newAccount._id);

    res.status(201).json({ success: true, data: newAccount, account: newAccount, message: "बैंक / CC खाता दर्ज हो गया!" });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update bank / CC account
export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ _id: id }, { clientTempId: id }] };

    const updateBody = { ...req.body };
    delete updateBody._id;
    delete updateBody.id;

    const updated = await BankAccount.findOneAndUpdate(query, updateBody, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    res.status(200).json({ success: true, data: updated, account: updated, message: "खाता अपडेट हो गया!" });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete bank / CC account
export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ _id: id }, { clientTempId: id }] };

    await BankAccount.findOneAndUpdate(query, { isDeleted: true });
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

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ _id: id }, { clientTempId: id }] };

    const account = await BankAccount.findOne(query);
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
        account.currentOutstanding = Math.max(0, (Number(account.currentOutstanding) || 0) - txAmt);
      } else if (type === "withdrawal" || type === "interest_debit" || type === "charges") {
        account.currentOutstanding = (Number(account.currentOutstanding) || 0) + txAmt;
      }
    } else {
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
      account: account,
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

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ _id: id }, { clientTempId: id }] };

    const account = await BankAccount.findOne(query);
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
      account: account,
      message: `${monthName || monthKey} का बैंक ब्याज ₹${interestAmt.toLocaleString("en-IN")} सफलतापूर्वक दर्ज हो गया!`,
    });
  } catch (error) {
    console.error("Error adding monthly interest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
