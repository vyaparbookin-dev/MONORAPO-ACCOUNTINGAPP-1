import Savings from "../models/savings.js";
import mongoose from "mongoose";

// Get all savings / investments
export const getSavings = async (req, res) => {
  try {
    const coFilter = req.companyId
      ? mongoose.Types.ObjectId.isValid(req.companyId)
        ? { $in: [req.companyId, new mongoose.Types.ObjectId(req.companyId)] }
        : req.companyId
      : null;

    const query = { isDeleted: { $ne: true } };
    if (coFilter) query.companyId = coFilter;

    const items = await Savings.find(query).sort({ createdAt: -1 });

    const totalPrincipal = items.reduce((s, i) => s + (Number(i.principalAmount) || 0), 0);
    const totalMonthlyCommitment = items
      .filter((i) => (i.type === "RD" || i.type === "SIP") && i.status === "active")
      .reduce((s, i) => s + (Number(i.monthlyInstallment) || 0), 0);

    const businessSavingsTotal = items
      .filter((i) => i.savingsCategory === "business")
      .reduce((s, i) => s + (Number(i.principalAmount) || 0), 0);

    const personalSavingsTotal = items
      .filter((i) => i.savingsCategory === "personal")
      .reduce((s, i) => s + (Number(i.principalAmount) || 0), 0);

    res.status(200).json({
      success: true,
      data: items,
      savings: items,
      summary: {
        totalPrincipal,
        totalMonthlyCommitment,
        businessSavingsTotal,
        personalSavingsTotal,
        count: items.length,
      },
    });
  } catch (error) {
    console.error("Error fetching savings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new savings account (FD / RD / SIP / etc.)
export const createSavings = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.companyId) data.companyId = req.companyId;
    if (req.user?._id) data.userId = req.user._id;

    const newItem = await Savings.create(data);
    res.status(201).json({ success: true, data: newItem, message: "बचत खाता सफलतापूर्वक दर्ज हो गया!" });
  } catch (error) {
    console.error("Error creating savings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update savings account
export const updateSavings = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Savings.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Savings record not found" });
    }
    res.status(200).json({ success: true, data: updated, message: "बदलाव सेव हो गए!" });
  } catch (error) {
    console.error("Error updating savings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete savings account
export const deleteSavings = async (req, res) => {
  try {
    const { id } = req.params;
    await Savings.findByIdAndUpdate(id, { isDeleted: true });
    res.status(200).json({ success: true, message: "रिकॉर्ड हटा दिया गया!" });
  } catch (error) {
    console.error("Error deleting savings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add installment deposit (किस्त जमा करना)
export const addInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, source, note, paymentMode } = req.body;

    const record = await Savings.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Savings record not found" });
    }

    const depositAmt = Number(amount) || 0;
    record.installmentsHistory.push({
      date: date ? new Date(date) : new Date(),
      amount: depositAmt,
      source: source || record.sourceOfFunds || "business_salary",
      note: note || "",
      paymentMode: paymentMode || "bank_transfer",
    });

    // Increase principal for RD / SIP
    record.principalAmount = (Number(record.principalAmount) || 0) + depositAmt;
    await record.save();

    res.status(200).json({
      success: true,
      data: record,
      message: `₹${depositAmt.toLocaleString("en-IN")} की किस्त सफलतापूर्वक जमा हो गई!`,
    });
  } catch (error) {
    console.error("Error adding installment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
