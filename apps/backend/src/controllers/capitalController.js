import Capital from "../model/capital.js";
import { logActivity } from "../utils/logger.js";

export const addCapitalEntry = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const entry = new Capital({ ...req.body, companyId });
    await entry.save();

    await logActivity(req, `Added Capital / Startup Entry: ${entry.title} worth ₹${entry.amount}`);
    res.status(201).json({ success: true, message: "Entry added successfully", entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCapitalSummary = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const entries = await Capital.find({ companyId, isDeleted: false }).sort({ date: -1 });

    // Calculate Totals
    let totalOpeningCash = 0;
    let totalOpeningBank = 0;
    let totalOwnerCapital = 0;
    let totalPartnerCapital = 0;
    let totalUnsecuredLoans = 0;
    let totalStartupExpenses = 0;

    entries.forEach(e => {
      if (e.entryType === 'opening_cash') totalOpeningCash += e.amount;
      else if (e.entryType === 'opening_bank') totalOpeningBank += e.amount;
      else if (e.entryType === 'owner_capital' || e.entryType === 'additional_capital') totalOwnerCapital += e.amount;
      else if (e.entryType === 'partner_capital') totalPartnerCapital += e.amount;
      else if (e.entryType === 'unsecured_loan') totalUnsecuredLoans += e.amount;
      else if (e.entryType === 'startup_renovation' || e.entryType === 'legal_license_setup') totalStartupExpenses += e.amount;
    });

    const totalGrossCapital = totalOwnerCapital + totalPartnerCapital + totalUnsecuredLoans;
    const netCapitalIntroduced = totalGrossCapital - totalStartupExpenses;

    res.json({
      success: true,
      data: {
        entries,
        summary: {
          totalOpeningCash,
          totalOpeningBank,
          totalOwnerCapital,
          totalPartnerCapital,
          totalUnsecuredLoans,
          totalStartupExpenses,
          totalGrossCapital,
          netCapitalIntroduced
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCapitalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Capital.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, error: "Entry not found" });

    await logActivity(req, `Deleted Capital Entry: ${entry.title} (₹${entry.amount})`);
    res.json({ success: true, message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
