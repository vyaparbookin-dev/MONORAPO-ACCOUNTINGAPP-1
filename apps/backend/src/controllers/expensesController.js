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

    const filter = { companyId: req.companyId, isDeleted: { $ne: true } };

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

// Family Member-wise Ghar Kharch & Money In/Out (Paise Lena aur Dena) Summary & Analytics
export const getGharKharchSummary = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const gharKharchFilter = {
      companyId: req.companyId,
      $or: [
        { expenseType: "drawings" },
        { familyMember: { $exists: true, $nin: ["", null] } }
      ],
      isDeleted: { $ne: true }
    };

    const allGharKharch = await Expense.find(gharKharchFilter).sort({ date: -1, createdAt: -1 });

    const memberBreakdown = {};
    let totalGiven = 0;
    let totalReceived = 0;

    allGharKharch.forEach(exp => {
      const member = exp.familyMember?.trim() || "अन्य (Family)";
      const amt = Number(exp.amount) || 0;
      const flow = exp.transactionFlow === 'received' ? 'received' : 'given';

      if (!memberBreakdown[member]) {
        memberBreakdown[member] = {
          member,
          totalGiven: 0,
          totalReceived: 0,
          netBalance: 0,
          transactionsCount: 0
        };
      }

      if (flow === 'received') {
        totalReceived += amt;
        memberBreakdown[member].totalReceived += amt;
      } else {
        totalGiven += amt;
        memberBreakdown[member].totalGiven += amt;
      }
      memberBreakdown[member].transactionsCount += 1;
      // Net balance: positive means net given (खर्च/दिया), negative means net taken (लिया/उधार)
      memberBreakdown[member].netBalance = memberBreakdown[member].totalGiven - memberBreakdown[member].totalReceived;
    });

    const memberList = Object.values(memberBreakdown).map(m => ({
      ...m,
      percentage: (totalGiven + totalReceived) > 0 ? +(((m.totalGiven + m.totalReceived) / (totalGiven + totalReceived)) * 100).toFixed(1) : 0
    })).sort((a, b) => (b.totalGiven + b.totalReceived) - (a.totalGiven + a.totalReceived));

    res.json({
      success: true,
      totalGharKharch: totalGiven,
      totalGiven,
      totalReceived,
      netBalance: totalGiven - totalReceived,
      count: allGharKharch.length,
      members: memberList,
      recentExpenses: allGharKharch.slice(0, 100)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const id = req.params.id;
    let query = { companyId: req.companyId };

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ _id: id }, { id: id }];
    } else {
      query.$or = [{ id: id }, { _id: id.startsWith('exp_') ? undefined : id }].filter(Boolean);
    }

    const oldExpense = await Expense.findOne(query);
    const expense = await Expense.findOneAndUpdate(
      query,
      { isDeleted: true },
      { new: true }
    );
    
    if (oldExpense) {
      await logActivity(req, `Deleted Expense (ID: ${id}) | Title: ${oldExpense?.title || 'Unknown'}, Amount: ₹${oldExpense?.amount || 0}`);
    }
    
    res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
