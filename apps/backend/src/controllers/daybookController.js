import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import Expance from "../model/expenses.js";
import PartyTransaction from "../model/PartyTransaction.js";
import Salary from "../model/salary.js";

export const getDayBook = async (req, res) => {
  try {
    const { companyId } = req;
    const { date, startDate: reqStartDate, endDate: reqEndDate, period } = req.query;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    // Calculate Start and End range based on parameters
    let startOfDay;
    let endOfDay;

    const now = new Date();

    if (reqStartDate && reqEndDate) {
      startOfDay = new Date(new Date(reqStartDate).setHours(0, 0, 0, 0));
      endOfDay = new Date(new Date(reqEndDate).setHours(23, 59, 59, 999));
    } else if (period === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
      endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfDay = new Date(startOfWeek.setHours(0, 0, 0, 0));
      endOfDay = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'month') {
      startOfDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startOfDay = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      startOfDay = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      const targetDate = date ? new Date(date) : now;
      startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
      endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));
    }

    // Common time query logic
    const timeQuery = { $gte: startOfDay, $lte: endOfDay };
    
    // Filter queries
    const billQuery = { companyId, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: false };
    const purchaseQuery = { companyId, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: false };
    const expanceQuery = { companyId, $or: [{ date: timeQuery }, { createdAt: timeQuery }], isDeleted: false };
    const partyTxQuery = { companyId, date: timeQuery, type: 'manual', isDeleted: false };
    const salaryQuery = { companyId, $or: [{ date: timeQuery }, { paymentDate: timeQuery }, { createdAt: timeQuery }], isDeleted: false };

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
      
      PartyTransaction.find(partyTxQuery).populate("partyId", "name partyType").skip(skip).limit(limit),
      PartyTransaction.countDocuments(partyTxQuery),
      
      Salary.find(salaryQuery).populate("staffId", "name").skip(skip).limit(limit),
      Salary.countDocuments(salaryQuery)
    ]);

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
        partyTransactions,
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