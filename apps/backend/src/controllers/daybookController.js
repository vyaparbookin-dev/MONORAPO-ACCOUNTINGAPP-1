import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import Expance from "../model/expance.js";
import PartyTransaction from "../model/PartyTransaction.js";
import Salary from "../model/salary.js";

export const getDayBook = async (req, res) => {
  try {
    const { companyId } = req;
    const { date } = req.query; // Client se date aayegi (e.g., "2023-10-25")

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    // Calculate Start and End of the given Date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

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

    // Combine and send everything back
    res.status(200).json({
      success: true,
      data: {
        targetDate: startOfDay,
        bills,
        purchases,
        expenses,
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