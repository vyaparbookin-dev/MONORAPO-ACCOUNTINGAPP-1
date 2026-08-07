import Bill from "../model/bill.js";
import Party from "../model/party.js";
import ConsolidatedCreditStatement from "../model/ConsolidatedCreditStatement.js";
import mongoose from "mongoose";

// Helper function to generate a unique statement number
const generateStatementNumber = async (companyId) => {
  const count = await ConsolidatedCreditStatement.countDocuments({ companyId });
  const year = new Date().getFullYear();
  return `CCS-${year}-${count + 1}`; // CCS for Consolidated Credit Statement
};

export const getUdharEntriesForParty = async (req, res) => {
  try {
    const { partyId } = req.params;
    const { companyId } = req; // Assuming companyId is available from auth middleware

    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ success: false, message: "Invalid Party ID." });
    }

    const udharBills = await Bill.find({
      companyId,
      partyId,
      $or: [{ status: "issued" }, { paymentMethod: "credit" }], // Bills that are outstanding/credit
      isDeleted: false,
    }).sort({ date: 1 }); // Sort by date for chronological order

    res.status(200).json({ success: true, bills: udharBills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createConsolidatedStatement = async (req, res) => {
  try {
    const { partyId, billIds, notes } = req.body;
    const { companyId } = req; // Assuming companyId is available from auth middleware

    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ success: false, message: "Invalid Party ID." });
    }
    if (!Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({ success: false, message: "No bills selected for consolidation." });
    }

    // Validate if all billIds are valid ObjectIds
    const invalidBillIds = billIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidBillIds.length > 0) {
      return res.status(400).json({ success: false, message: "One or more invalid Bill IDs provided." });
    }

    // Fetch bills to be consolidated
    const billsToConsolidate = await Bill.find({
      _id: { $in: billIds },
      companyId,
      partyId,
      $or: [{ status: "issued" }, { paymentMethod: "credit" }], // Ensure they are valid udhar bills
      isDeleted: false,
    });

    if (billsToConsolidate.length !== billIds.length) {
      return res.status(400).json({ success: false, message: "Some selected bills are invalid, already consolidated, or do not belong to this party/company." });
    }

    const totalAmount = billsToConsolidate.reduce((sum, bill) => sum + (bill.finalAmount || bill.total || 0), 0);
    const statementNumber = await generateStatementNumber(companyId);

    const party = await Party.findById(partyId);
    if (!party) {
        return res.status(404).json({ success: false, message: "Party not found." });
    }

    const newStatement = new ConsolidatedCreditStatement({
      statementNumber,
      companyId,
      partyId,
      customerName: party.name,
      bills: billIds,
      totalAmount,
      notes,
    });

    await newStatement.save();

    // Optionally update bills to mark them as part of a consolidated statement
    // For now, we just link them. If specific status update is needed, it can be added here.
    // E.g., await Bill.updateMany({ _id: { $in: billIds } }, { $set: { status: 'consolidated' } });

    res.status(201).json({ success: true, message: "Consolidated statement created successfully!", statement: newStatement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsolidatedStatementById = async (req, res) => {
  try {
    const { statementId } = req.params;
    const { companyId } = req;

    if (!mongoose.Types.ObjectId.isValid(statementId)) {
      return res.status(400).json({ success: false, message: "Invalid Statement ID." });
    }

    const statement = await ConsolidatedCreditStatement.findOne({ _id: statementId, companyId })
      .populate("bills"); // Populate the actual Bill documents

    if (!statement) {
      return res.status(404).json({ success: false, message: "Consolidated statement not found." });
    }

    res.status(200).json({ success: true, statement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsolidatedStatementsForParty = async (req, res) => {
  try {
    const { partyId } = req.params;
    const { companyId } = req;

    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ success: false, message: "Invalid Party ID." });
    }

    const statements = await ConsolidatedCreditStatement.find({ companyId, partyId })
      .sort({ date: -1 }); // Latest statements first

    res.status(200).json({ success: true, statements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
