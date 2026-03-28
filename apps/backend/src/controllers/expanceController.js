import Expance from "../model/expance.js";
import { logActivity } from "../utils/logger.js";

export const addExpance = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const expanceData = { ...req.body, companyId: req.companyId };
    const expance = await Expance.create(expanceData);
    
    // Audit Trail
    await logActivity(req, `Added new Expense: ${expance.title || 'Unknown'} for ₹${expance.amount || 0}`);
    
    res.status(201).json({ success: true, expance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const listExpances = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    
    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { companyId: req.companyId, isDeleted: false };

    // Fetch data and count in parallel for speed
    const [expances, totalExpances] = await Promise.all([
      Expance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Expance.countDocuments(filter)
    ]);

    res.json({ 
      success: true, 
      expances,
      pagination: { total: totalExpances, page, limit, totalPages: Math.ceil(totalExpances / limit) }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Soft delete an expense
export const deleteExpance = async (req, res) => {
  try {
    const oldExpance = await Expance.findOne({ _id: req.params.id, companyId: req.companyId });
    const expance = await Expance.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!expance) return res.status(404).json({ success: false, error: "Expense not found" });
    
    await logActivity(req, `Deleted Expense (ID: ${req.params.id}) | Title: ${oldExpance?.title || 'Unknown'}, Amount was: ₹${oldExpance?.amount || 0}`);
    
    res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};