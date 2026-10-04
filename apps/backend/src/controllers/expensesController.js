import mongoose from "mongoose";
import Expense from "../model/expenses.js";
import BankAccount from "../model/bankAccount.js";
import Staff from "../model/staff.js";
import StaffTransaction from "../model/StaffTransaction.js";
import { logActivity } from "../utils/logger.js";

export const addExpense = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const expanceData = { ...req.body, companyId: req.companyId };

    // Strict separation: Operating / Business expenses MUST NEVER carry a familyMember string (prevents Ghar Kharch misclassification)
    if (!expanceData.expenseType || expanceData.expenseType === 'operating') {
      expanceData.expenseType = 'operating';
      expanceData.familyMember = '';
    }

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

    // Auto-sync Staff Transaction if staffId is provided (e.g. staff advance / payment from expense form)
    if (expanceData.staffId && amountNum > 0) {
      try {
        let staffDoc = null;
        if (mongoose.Types.ObjectId.isValid(expanceData.staffId)) {
          staffDoc = await Staff.findOne({ _id: expanceData.staffId, companyId: req.companyId }) || await Staff.findById(expanceData.staffId);
        }
        if (!staffDoc && expanceData.staffId) {
          staffDoc = await Staff.findOne({ companyId: req.companyId, name: new RegExp(`^${expanceData.staffId}$`, "i") });
        }
        if (staffDoc) {
          const stTx = await StaffTransaction.create({
            staffId: staffDoc._id,
            companyId: staffDoc.companyId || req.companyId,
            type: 'advance',
            date: expense.date ? new Date(expense.date) : new Date(),
            debit: amountNum,
            credit: 0,
            notes: (expense.description || expense.title || `दुकान खर्च से दर्ज स्टाफ एडवांस: ${staffDoc.name}`).trim(),
            expenseId: expense._id
          });
          expense.staffTransactionId = stTx._id;
          expense.staffId = staffDoc._id;
          await expense.save();

          // Sync Staff Balance: Advance reduces due salary (Negative: Advance, Positive: Due Salary)
          staffDoc.balance = (Number(staffDoc.balance) || 0) - amountNum;
          staffDoc.updatedAt = new Date();
          await staffDoc.save();
        }
      } catch (staffTxErr) {
        console.warn("Auto-sync staff transaction warning:", staffTxErr.message);
      }
    }

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
    const updateData = { ...req.body, companyId: req.companyId };
    // Strict separation: Operating expenses MUST NEVER carry a familyMember
    if (!updateData.expenseType || updateData.expenseType === 'operating') {
      updateData.expenseType = 'operating';
      updateData.familyMember = '';
    }
    const oldExpense = await Expense.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!oldExpense) return res.status(404).json({ success: false, error: "Expense not found" });

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId, isDeleted: false },
      { $set: updateData },
      { new: true }
    );

    // Auto-sync Staff Transaction if staffId is provided or updated
    const targetStaffId = updateData.staffId || expense.staffId;
    const amountNum = Number(expense.amount) || 0;
    const oldStaffId = oldExpense.staffId ? String(oldExpense.staffId) : null;
    const oldAmount = Number(oldExpense.amount) || 0;

    if (targetStaffId && amountNum > 0 && expense.expenseType === 'operating') {
      try {
        const staffDoc = await Staff.findOne({ _id: targetStaffId, companyId: req.companyId }) || await Staff.findById(targetStaffId);
        if (staffDoc) {
          let targetTx = null;
          if (expense.staffTransactionId) {
            targetTx = await StaffTransaction.findById(expense.staffTransactionId);
          }
          if (!targetTx) {
            targetTx = await StaffTransaction.findOne({ expenseId: expense._id, isDeleted: { $ne: true } });
          }
          if (targetTx) {
            targetTx.debit = amountNum;
            targetTx.date = expense.date ? new Date(expense.date) : new Date();
            targetTx.notes = (expense.description || expense.title || `दुकान खर्च से दर्ज स्टाफ एडवांस: ${staffDoc.name}`).trim();
            await targetTx.save();
          } else {
            const newStTx = await StaffTransaction.create({
              staffId: staffDoc._id,
              companyId: staffDoc.companyId || req.companyId,
              type: 'advance',
              date: expense.date ? new Date(expense.date) : new Date(),
              debit: amountNum,
              credit: 0,
              notes: (expense.description || expense.title || `दुकान खर्च से दर्ज स्टाफ एडवांस: ${staffDoc.name}`).trim(),
              expenseId: expense._id
            });
            expense.staffTransactionId = newStTx._id;
            await expense.save();
          }

          // Balance adjustment
          if (oldStaffId === String(staffDoc._id)) {
            staffDoc.balance = (Number(staffDoc.balance) || 0) + oldAmount - amountNum;
            staffDoc.updatedAt = new Date();
            await staffDoc.save();
          } else {
            staffDoc.balance = (Number(staffDoc.balance) || 0) - amountNum;
            staffDoc.updatedAt = new Date();
            await staffDoc.save();
            if (oldStaffId) {
              const oldStaff = await Staff.findOne({ _id: oldStaffId, companyId: req.companyId }) || await Staff.findById(oldStaffId);
              if (oldStaff) {
                oldStaff.balance = (Number(oldStaff.balance) || 0) + oldAmount;
                oldStaff.updatedAt = new Date();
                await oldStaff.save();
              }
            }
          }
        }
      } catch (staffTxErr) {
        console.warn("Auto-sync staff transaction on update warning:", staffTxErr.message);
      }
    }

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
      expenseType: { $ne: 'operating' },
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
    
    // Offline-only IDs (exp_, temp_) don't exist in MongoDB
    if (id && (id.startsWith('exp_') || id.startsWith('temp_'))) {
      return res.json({ success: true, message: "Offline expense deleted locally", offline: true });
    }

    let query = { companyId: req.companyId };

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      return res.status(404).json({ success: false, error: "Invalid expense ID format" });
    }

    const oldExpense = await Expense.findOne(query);
    if (!oldExpense) {
      return res.status(404).json({ success: false, error: "Expense not found" });
    }
    const expense = await Expense.findOneAndUpdate(
       query,
       { isDeleted: true },
       { new: true }
     );
     
     if (oldExpense) {
       // Revert linked Staff Transaction if this expense was for a staff advance
        if (oldExpense.staffId && Number(oldExpense.amount) > 0) {
          try {
            if (oldExpense.staffTransactionId) {
              await StaffTransaction.findOneAndUpdate(
                { _id: oldExpense.staffTransactionId, companyId: req.companyId },
                { isDeleted: true }
              );
            } else {
              const byExp = await StaffTransaction.findOneAndUpdate(
                { expenseId: oldExpense._id, companyId: req.companyId },
                { isDeleted: true }
              );
              if (!byExp) {
                await StaffTransaction.findOneAndUpdate(
                  { staffId: oldExpense.staffId, companyId: req.companyId, debit: Number(oldExpense.amount), isDeleted: { $ne: true } },
                  { isDeleted: true }
                );
              }
            }

            // Revert staff balance
            const staffDoc = await Staff.findOne({ _id: oldExpense.staffId, companyId: req.companyId }) || await Staff.findById(oldExpense.staffId);
            if (staffDoc) {
              staffDoc.balance = (Number(staffDoc.balance) || 0) + Number(oldExpense.amount);
              staffDoc.updatedAt = new Date();
              await staffDoc.save();
            }
          } catch (stErr) {
            console.warn("Error reverting staff transaction on expense deletion:", stErr.message);
          }
        }
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
