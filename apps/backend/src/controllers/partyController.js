import Party from "../model/party.js";
import Bill from "../model/bill.js";
import PartyTransaction from "../model/PartyTransaction.js";
import mongoose from "mongoose";

export const createParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { name, mobileNumber, address } = req.body;
    if (!name || !mobileNumber || !address) {
      return res.status(400).json({ success: false, error: "Name, Mobile, and Address are required" });
    }

    const existingParty = await Party.findOne({ mobileNumber, companyId: req.companyId });
    if (existingParty) {
      return res.status(400).json({ success: false, error: "Party with this mobile already exists" });
    }

    const party = new Party({ ...req.body, companyId: req.companyId });
    await party.save();
    res.status(201).json({ success: true, party, message: `Party ${name} created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get quick summary for a party (last purchase date and amount)
 * @route   GET /api/parties/:id/quick-summary
 * @access  Private
 */
export const getPartyQuickSummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;

    // Find the last bill for this party
    const lastBill = await Bill.findOne({
      partyId: new mongoose.Types.ObjectId(id),
      companyId: req.companyId,
      isDeleted: false,
    })
    .sort({ date: -1 }) // Sort by date descending to get the latest
    .select('date finalAmount total billNumber') // Select only necessary fields
    .lean();

    res.json({
      success: true,
      summary: lastBill ? {
        lastPurchaseDate: lastBill.date,
        lastPurchaseAmount: lastBill.finalAmount || lastBill.total,
        lastBillNumber: lastBill.billNumber,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartySummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;
    const party = await Party.findOne({ _id: id, companyId: req.companyId }).lean();    
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const bills = await Bill.find({ partyId: id, companyId: req.companyId, isDeleted: false }).sort({ date: 1 }).lean();
    const Return = mongoose.models.Return || mongoose.model('Return'); // Prevent OverwriteModelError

    if (bills.length === 0) {
      return res.json({ success: true, summary: { ...party, lifetimeValue: 0, visitCount: 0, topProducts: [] } });
    }

    const lifetimeValue = bills.reduce((sum, bill) => sum + (bill.finalAmount || bill.total || 0), 0);
    const firstVisit = bills[0].date;
    const lastVisit = bills[bills.length - 1].date;

    const productFrequency = new Map();
    bills.forEach(bill => {
      if (Array.isArray(bill.items)) {
        bill.items.forEach(item => {
          const name = item.name || "Unknown Product";
          productFrequency.set(name, (productFrequency.get(name) || 0) + (item.quantity || 1));
        });
      }
    });

    const topProducts = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // --- NEW: Calculate Return History & Recent Transactions ---
    const returns = await Return.find({ partyId: id, companyId: req.companyId, type: 'sales_return', isDeleted: { $ne: true } }).sort({ date: -1 }).lean();
    const totalReturnValue = returns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const returnCount = returns.length;

    const billHistory = bills.map(b => ({
        type: 'Sale',
        date: b.date,
        details: `Invoice #${b.billNumber || b._id.toString().slice(-4)}`,
        amount: b.finalAmount || b.total || 0
    }));
    const returnHistory = returns.map(r => ({
        type: 'Return',
        date: r.date,
        details: `Return #${r.returnNumber || r._id.toString().slice(-4)}`,
        amount: -(r.totalAmount || 0) // Negative amount for returns
    }));
    const transactionHistory = [...billHistory, ...returnHistory]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // Send last 5 transactions

    res.json({
      success: true,
      summary: {
        ...party,
        lifetimeValue,
        visitCount: bills.length,
        firstVisit,
        lastVisit,
        topProducts,
        totalReturnValue,
        returnCount,
        transactionHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyStatement = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const transactions = await PartyTransaction.find({ partyId: req.params.id, companyId: req.companyId }).sort({ date: -1 });
    res.json({ success: true, party, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listParties = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { type } = req.query;
    const filter = { isActive: true, companyId: req.companyId };
    if (type) filter.partyType = { $in: [type, "both"] };

    const parties = await Party.find(filter).select("_id name mobileNumber address gstNumber partyType");
    res.json({ success: true, parties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party, message: "Party updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isActive: false },
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, message: "Party deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
