import Expense from "../model/expenses.js";
import { logActivity } from "../utils/logger.js";

export const addExpense = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const expanceData = { ...req.body, companyId: req.companyId };
    const expense = await Expense.create(expanceData);
    
    // Audit Trail
    await logActivity(req, `Added new Expense: ${expense.title || 'Unknown'} for ₹${expense.amount || 0}`);
    
    res.status(201).json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!expense) return res.status(404).json({ success: false, error: "Expense not found" });
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId, isDeleted: false },
      { $set: { ...req.body, companyId: req.companyId } },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, error: "Expense not found" });
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listExpenses = async (req, res) => {
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
    const [expenses, totalExpenses] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(filter)
    ]);

    res.json({ 
      success: true, 
      expenses,
      pagination: { total: totalExpenses, page, limit, totalPages: Math.ceil(totalExpenses / limit) }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Soft delete an expense
export const deleteExpense = async (req, res) => {
  try {
    const oldExpense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, error: "Expense not found" });
    
    await logActivity(req, `Deleted Expense (ID: ${req.params.id}) | Title: ${oldExpense?.title || 'Unknown'}, Amount was: ₹${oldExpense?.amount || 0}`);
    
    res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};