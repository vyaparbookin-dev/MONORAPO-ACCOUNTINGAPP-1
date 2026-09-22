import Expense from "../model/expenses.js";
import BankAccount from "../model/bankAccount.js";
import { logActivity } from "../utils/logger.js";

export const addExpense = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const expanceData = { ...req.body, companyId: req.companyId };

    // Auto-deduct from Bank / UPI Account if paymentMethod is 'upi' or 'bank'
    const pMethod = String(req.body.paymentMethod || 'cash').toLowerCase();
    const amountNum = Number(req.body.amount) || 0;

    let targetBank = null;
    if (req.body.bankAccountId) {
      targetBank = await BankAccount.findOne({ _id: req.body.bankAccountId, companyId: req.companyId, isDeleted: { $ne: true } });
    } else if (pMethod === 'upi') {
      // Find default UPI account or any account with UPI ID
      targetBank = await BankAccount.findOne({ companyId: req.companyId, isDefaultUPI: true, isDeleted: { $ne: true } })
        || await BankAccount.findOne({ companyId: req.companyId, upiId: { $exists: true, $ne: "" }, isDeleted: { $ne: true } });
    } else if (pMethod === 'bank') {
      targetBank = await BankAccount.findOne({ companyId: req.companyId, accountType: 'CURRENT', isDeleted: { $ne: true } })
        || await BankAccount.findOne({ companyId: req.companyId, isDeleted: { $ne: true } });
    }

    if (targetBank) {
      expanceData.bankAccountId = targetBank._id;
    }

    const expense = await Expense.create(expanceData);

    // --- ASYNC DUAL-WRITE SYNC TO SUPABASE ---
    (async () => {
      try {
        const { supabase } = await import("../config/supabase.js");
        if (supabase) {
          await supabase.from('expenses').upsert({
            title: expense.title || "खर्च",
            amount: Number(expense.amount || 0),
            category: expense.category || "अन्य",
            description: expense.description || expense.notes || expense.title || "",
            status: expense.status || "approved",
            date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
            is_deleted: false
          });
        }
      } catch (sbErr) {
        console.warn("[Supabase Dual-Write] expense sync note:", sbErr.message);
      }
    })();

    // If target bank found and amount > 0, post withdrawal transaction
    if (targetBank && amountNum > 0) {
      targetBank.transactions.push({
        date: expense.date ? new Date(expense.date) : new Date(),
        type: 'withdrawal',
        amount: amountNum,
        note: `खर्च: ${expense.title || 'खर्च'} (${expense.category || ''})`,
        referenceNo: req.body.referenceNo || `EXP-${expense._id}`
      });

      if (targetBank.accountType === "CC_OVERDRAFT") {
        targetBank.currentOutstanding = (Number(targetBank.currentOutstanding) || 0) + amountNum;
      } else {
        targetBank.currentBalance = (Number(targetBank.currentBalance) || 0) - amountNum;
      }

      await targetBank.save();
    }
    
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

    if (req.query.startDate && req.query.endDate) {
      const parseIST = (dateStr) => (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T00:00:00+05:30`) : new Date(dateStr));
      const ISTDayEnd = (dateStr) => new Date(parseIST(dateStr).getTime() + 24 * 60 * 60 * 1000 - 1);
      const s = parseIST(req.query.startDate);
      const e = ISTDayEnd(req.query.endDate);
      filter.$or = [{ date: { $gte: s, $lte: e } }, { createdAt: { $gte: s, $lte: e } }];
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

       // Revert Bank deduction if this expense was deducted from a bank account
       if (oldExpense.bankAccountId && Number(oldExpense.amount) > 0) {
         try {
           const bank = await BankAccount.findOne({ _id: oldExpense.bankAccountId, companyId: req.companyId });
           if (bank) {
             const revAmt = Number(oldExpense.amount);
             if (bank.accountType === "CC_OVERDRAFT") {
               bank.currentOutstanding = Math.max(0, (Number(bank.currentOutstanding) || 0) - revAmt);
             } else {
               bank.currentBalance = (Number(bank.currentBalance) || 0) + revAmt;
             }
             bank.transactions.push({
               date: new Date(),
               type: "deposit",
               amount: revAmt,
               note: `खर्च हटाया गया (रिफंड): ${oldExpense.title || 'खर्च'}`,
               referenceNo: `REV-EXP-${oldExpense._id}`
             });
             await bank.save();
           }
         } catch (revertErr) {
           console.warn("Error reverting bank balance on expense deletion:", revertErr.message);
         }
       }
     }
     
     res.json({ success: true, message: "Expense deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
