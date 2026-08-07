import TdsTcs from "../model/tdsTcs.js";
import { logActivity } from "../utils/logger.js";

// Create new TDS/TCS entry
export const createTaxEntry = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const entry = new TdsTcs({ ...req.body, companyId });
    await entry.save();

    await logActivity(req, `Recorded ${entry.type} of ₹${entry.taxAmount} under section ${entry.section}`);

    res.status(201).json({ success: true, message: "Tax entry recorded successfully!", entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all TDS/TCS entries for reports
export const getTaxEntries = async (req, res) => {
  try {
    const entries = await TdsTcs.find({ companyId: req.companyId, isDeleted: false })
      .populate("partyId", "name panNumber")
      .sort({ date: -1 });

    res.status(200).json({ success: true, entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update status when tax is paid to government
export const updateTaxStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, challanNumber, paymentDate } = req.body;

    const entry = await TdsTcs.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status, challanNumber, paymentDate },
      { new: true }
    );
    
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    res.status(200).json({ success: true, message: `Tax status updated to ${status}`, entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};