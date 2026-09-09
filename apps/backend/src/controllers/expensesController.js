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
    const label = expense.expenseType === 'drawings' ? `Ghar Kharch (${expense.familyMember || 'Family'})` : 'Business Expense';
    await logActivity(req, `Added ${label}: ${expense.title || 'Unknown'} for ₹${expense.amount || 0}`);
    
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
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = { companyId: req.companyId, isDeleted: false };

    // Support filter by expenseType (e.g. 'drawings' for Ghar Kharch, 'operating' for Business)
    if (req.query.expenseType && req.query.expenseType !== 'all') {
      filter.expenseType = req.query.expenseType;
    }

    // Support filter by familyMember
    if (req.query.familyMember && req.query.familyMember !== 'all') {
      filter.familyMember = req.query.familyMember;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const [expenses, totalExpenses] = await Promise.all([
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(filter)
    ]);

    res.json({ 
      success: true, 
      expenses,
      pagination: { total: totalExpenses, page, limit, totalPages: Math.ceil(totalExpenses / limit) }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Family Member-wise Ghar Kharch (Personal Drawings) Summary & Analytics
export const getGharKharchSummary = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const gharKharchFilter = {
      companyId: req.companyId,
      expenseType: "drawings",
      isDeleted: false
    };

    const allGharKharch = await Expense.find(gharKharchFilter).sort({ date: -1 });

    const memberBreakdown = {};
    let totalGharKharch = 0;

    allGharKharch.forEach(exp => {
      const member = exp.familyMember?.trim() || "अन्य (Unassigned)";
      const amt = Number(exp.amount) || 0;
      totalGharKharch += amt;
      memberBreakdown[member] = (memberBreakdown[member] || 0) + amt;
    });

    const memberList = Object.entries(memberBreakdown).map(([member, amount]) => ({
      member,
      amount,
      percentage: totalGharKharch > 0 ? +((amount / totalGharKharch) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      totalGharKharch,
      count: allGharKharch.length,
      members: memberList,
      recentExpenses: allGharKharch.slice(0, 30)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const oldExpense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId });
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, error: "Expense not found" });
    
    await logActivity(req, `Deleted Expense (ID: ${req.params.id}) | Title: ${oldExpense?.title || 'Unknown'}, Amount: ₹${oldExpense?.amount || 0}`);
    
    res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
