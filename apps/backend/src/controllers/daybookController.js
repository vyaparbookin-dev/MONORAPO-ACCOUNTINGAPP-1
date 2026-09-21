import mongoose from "mongoose";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import Expance from "../model/expenses.js";
import PartyTransaction from "../model/PartyTransaction.js";
import Salary from "../model/salary.js";
import Party from "../model/party.js";
import Staff from "../model/staff.js";

export const getDayBook = async (req, res) => {
  try {
    const { companyId } = req;
    const { date, startDate: reqStartDate, endDate: reqEndDate, period } = req.query;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(200).json({
        success: true,
        data: {
          bills: [],
          purchases: [],
          expenses: [],
          operatingExpenses: [],
          ownerDrawings: [],
          ownerInvestments: [],
          securityDeposits: [],
          bankInterestPaid: [],
          bankInterestReceived: [],
          partyTransactions: [],
          salaries: [],
          pagination: { page, limit, totalBills: 0, totalPurchases: 0, totalExpenses: 0, totalPartyTransactions: 0 }
        }
      });
    }

    const coFilter = { $in: [companyId, new mongoose.Types.ObjectId(companyId)] };

    // Calculate Start and End range based on parameters
    let startOfDay;
    let endOfDay;

    // IST = UTC+5:30. Compute "today in IST" correctly regardless of server timezone.
    const now = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in ms
    const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
    const todayISTDateStr = nowIST.toISOString().split("T")[0]; // "YYYY-MM-DD" in IST

    const parseIST = (dateStr) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}T00:00:00+05:30`);
      }
      return new Date(dateStr);
    };
    const ISTDayEnd = (dateStr) => new Date(parseIST(dateStr).getTime() + 24 * 60 * 60 * 1000 - 1);

    if (reqStartDate && reqEndDate) {
      startOfDay = parseIST(reqStartDate);
      endOfDay = ISTDayEnd(reqEndDate);
    } else if (period === 'yesterday') {
      const yIST = new Date(nowIST);
      yIST.setUTCDate(yIST.getUTCDate() - 1);
      const yStr = yIST.toISOString().split("T")[0];
      startOfDay = parseIST(yStr);
      endOfDay = ISTDayEnd(yStr);
    } else if (period === 'week') {
      const sevenDaysAgoIST = new Date(nowIST.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekStartStr = sevenDaysAgoIST.toISOString().split("T")[0];
      startOfDay = parseIST(weekStartStr);
      endOfDay = ISTDayEnd(todayISTDateStr);
    } else if (period === 'month') {
      const monthStartStr = `${todayISTDateStr.substring(0, 7)}-01`;
      startOfDay = parseIST(monthStartStr);
      endOfDay = ISTDayEnd(todayISTDateStr);
    } else if (period === 'quarter') {
      const istMonth = nowIST.getUTCMonth(); // 0-11
      const istYear = nowIST.getUTCFullYear();
      const quarterStartMonth = Math.floor(istMonth / 3) * 3;
      const qStr = `${istYear}-${String(quarterStartMonth + 1).padStart(2, "0")}-01`;
      startOfDay = parseIST(qStr);
      endOfDay = ISTDayEnd(todayISTDateStr);
    } else if (period === 'year') {
      const istYear = nowIST.getUTCFullYear();
      startOfDay = parseIST(`${istYear}-01-01`);
      endOfDay = ISTDayEnd(`${istYear}-12-31`);
    } else if (period === 'all') {
      startOfDay = new Date(2020, 0, 1, 0, 0, 0, 0);
      endOfDay = ISTDayEnd(`${nowIST.getUTCFullYear() + 1}-12-31`);
    } else {
      // Default: today in IST, or a specific date param
      const targetStr = date ? (date.length === 10 ? date : new Date(date).toISOString().split("T")[0]) : todayISTDateStr;
      startOfDay = parseIST(targetStr);
      endOfDay = ISTDayEnd(targetStr);
    }

    // Common time query logic
    const timeQuery = { $gte: startOfDay, $lte: endOfDay };
    
    // Filter queries
    const billQuery = { companyId: coFilter, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: { $ne: true } };
    const purchaseQuery = { companyId: coFilter, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: { $ne: true } };
    const expanceQuery = { companyId: coFilter, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: { $ne: true } };
    const partyTxQuery = { companyId: coFilter, date: timeQuery, isDeleted: { $ne: true } };
    const salaryQuery = { companyId: coFilter, $or: [{ date: timeQuery }, { paymentDate: timeQuery }, { createdAt: timeQuery }], isDeleted: { $ne: true } };

    // Sabhi collections me ek sath request bhejenge (Maximum Speed)
    const [
      bills, totalBills,
      purchases, totalPurchases,
      expenses, totalExpenses,
      partyTransactions, totalPartyTransactions,
      salaries, totalSalaries
    ] = await Promise.all([
      Bill.find(billQuery).populate("partyId", "name").skip(skip).limit(limit),
      Bill.countDocuments(billQuery),
      
      Purchase.find(purchaseQuery).populate("partyId", "name").skip(skip).limit(limit),
      Purchase.countDocuments(purchaseQuery),
      
      Expance.find(expanceQuery).skip(skip).limit(limit),
      Expance.countDocuments(expanceQuery),
      
      PartyTransaction.find(partyTxQuery).populate("partyId", "name partyType isActive").skip(skip).limit(limit),
      PartyTransaction.countDocuments(partyTxQuery),
      
      Salary.find(salaryQuery).populate("staffId", "name").skip(skip).limit(limit),
      Salary.countDocuments(salaryQuery)
    ]);

    // Only include party transactions for active parties
    const activePartyTransactions = partyTransactions.filter(pt => !pt.partyId || pt.partyId.isActive !== false);

    // --- New/Returning Customer Logic ---
    const billsWithCustomerStatus = [...bills]; // Create a mutable copy
    const partyIds = bills
      .map(b => b.partyId?._id)
      .filter(id => id);

    if (partyIds.length > 0) {
      // Find the first bill date for each customer
      const firstBillDates = await Bill.aggregate([
        { $match: { partyId: { $in: partyIds } } },
        { $group: { _id: "$partyId", firstBillDate: { $min: "$date" } } }
      ]);

      const firstBillDateMap = new Map(
        firstBillDates.map(item => [item._id.toString(), new Date(item.firstBillDate).toISOString().split('T')[0]])
      );

      // Add isNewCustomer flag to each bill
      for (let i = 0; i < billsWithCustomerStatus.length; i++) {
        const bill = billsWithCustomerStatus[i];
        if (bill.partyId?._id) {
          const partyIdStr = bill.partyId._id.toString();
          const firstDate = firstBillDateMap.get(partyIdStr);
          const billDate = new Date(bill.date).toISOString().split('T')[0];
          
          // Convert to plain object to modify
          billsWithCustomerStatus[i] = bill.toObject(); 
          billsWithCustomerStatus[i].isNewCustomer = (firstDate === billDate);
        }
      }
    }

    // Categorize expenses for clean P&L separation vs Daybook cash flow
    const operatingExpenses = expenses.filter(e => !e.expenseType || e.expenseType === 'operating');
    const ownerDrawings = expenses.filter(e => e.expenseType === 'drawings');
    const ownerInvestments = expenses.filter(e => e.expenseType === 'personal_investment');
    const securityDeposits = expenses.filter(e => e.expenseType === 'security_deposit');
    const bankInterestPaid = expenses.filter(e => e.expenseType === 'bank_interest_paid');
    const bankInterestReceived = expenses.filter(e => e.expenseType === 'bank_interest_received');

    // Combine and send everything back
    res.status(200).json({
      success: true,
      data: {
        targetDate: startOfDay,
        bills: billsWithCustomerStatus,
        purchases,
        expenses,
        operatingExpenses,
        ownerDrawings,
        ownerInvestments,
        securityDeposits,
        bankInterestPaid,
        bankInterestReceived,
        partyTransactions: activePartyTransactions,
        salaries,
        pagination: {
           page, limit,
           totalBills,
           totalPurchases,
           totalExpenses,
           totalPartyTransactions
        }
      }
    });

  } catch (error) {
    console.error("Daybook Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};