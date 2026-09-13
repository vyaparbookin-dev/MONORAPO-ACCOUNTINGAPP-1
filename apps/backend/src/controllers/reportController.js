import Report from "../model/report.js";
import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Expance from "../model/expenses.js";
import Purchase from "../model/purchase.js";
import Salary from "../model/salary.js";
import User from "../model/user.js"; // User model ko import karein
import Staff from "../model/staff.js";
import mongoose from "mongoose";

export const generateReport = async (req, res) => {
  try {
    const { type, filter, siteName, startDate, endDate } = req.body; // Added siteName, startDate, endDate

    const queryFilter = { ...(filter || {}) };
    if (!queryFilter.companyId && req.companyId) {
      queryFilter.companyId = req.companyId;
    }
    if (queryFilter.isDeleted === undefined) {
      queryFilter.isDeleted = false;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      queryFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (queryFilter.date) {
        // If queryFilter already has a date filter (e.g., from req.body.filter), ensure it's Date objects
        if (typeof queryFilter.date === 'string') {
            const startOfDay = new Date(queryFilter.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(queryFilter.date);
            endOfDay.setHours(23, 59, 59, 999);
            queryFilter.date = { $gte: startOfDay, $lte: endOfDay };
        }
    }

    // Add siteName filter if provided
    if (siteName) {
      queryFilter.siteName = siteName;
    }

    // If client asks for GST report, build it from bills
    if (type === "gst") {
      const bills = await Bill.find(filter || {}).lean();

      const reports = bills.map((b) => {
        // compute taxable value from items if available
        let taxableValue = 0;
        if (Array.isArray(b.items) && b.items.length > 0) {
          taxableValue = b.items.reduce((sum, it) => {
            const price = Number(it.rate || it.price || 0);
            const qty = Number(it.quantity || 1);
            return sum + price * qty;
          }, 0);
        } else if (typeof b.total === "number") {
          taxableValue = b.total;
        }

        // use stored tax if present, otherwise assume 18%
        const tax = typeof b.tax === "number" ? b.tax : +(taxableValue * 0.18).toFixed(2);
        const cgst = +(tax / 2).toFixed(2);
        const sgst = +(tax / 2).toFixed(2);
        const igst = 0;

        return {
          _id: b._id,
          invoiceNo: b.billNumber || String(b._id),
          taxableValue,
          cgst,
          sgst,
          igst,
          totalGst: tax,
        };
      });

      return res.json({ success: true, type: "gst", reports });
    }

    // Product-wise GST report
    if (type === "productwise") {
      const bills = await Bill.find(filter || {}).lean();
      const map = new Map();

      for (const b of bills) {
        if (!Array.isArray(b.items)) continue;
        for (const it of b.items) {
          const pid = String(it.productId || it.product || "unknown");
          const price = Number(it.rate || it.price || 0);
          const qty = Number(it.quantity || 1);
          const taxable = price * qty;

          const entry = map.get(pid) || { productId: pid, qtySold: 0, taxableValue: 0 };
          entry.qtySold += qty;
          entry.taxableValue += taxable;
          map.set(pid, entry);
        }
      }

      const productIds = Array.from(map.keys()).filter((id) => id !== "unknown");
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const prodMap = new Map(products.map((p) => [String(p._id), p]));

      const reports = Array.from(map.values()).map((e) => {
        const prod = prodMap.get(String(e.productId));
        const gstRate = prod?.gstRate || prod?.gst || 18;
        const gstCollected = +(e.taxableValue * (gstRate / 100)).toFixed(2);
        return {
          productId: e.productId,
          name: prod?.name || "Unknown Product",
          qtySold: e.qtySold,
          taxableValue: +e.taxableValue.toFixed(2),
          gstRate,
          gstCollected,
        };
      });

      return res.json({ success: true, type: "productwise", reports });
    }

      // Item-wise GST report (aggregate per product across bills)
      if (type === "itemwise") {
        const bills = await Bill.find(filter || {}).lean();
        const map = new Map();

        for (const b of bills) {
          if (!Array.isArray(b.items)) continue;
          for (const it of b.items) {
            const pid = String(it.productId || it.product || "unknown");
            const price = Number(it.rate || it.price || 0);
            const qty = Number(it.quantity || 1);
            const taxable = price * qty;

            const key = pid; // aggregate by product id
            const entry = map.get(key) || { productId: pid, qtySold: 0, taxableValue: 0, gstCollected: 0 };
            entry.qtySold += qty;
            entry.taxableValue += taxable;
            map.set(key, entry);
          }
        }

        const productIds = Array.from(map.keys()).filter((id) => id !== "unknown");
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const prodMap = new Map(products.map((p) => [String(p._id), p]));

        const reports = Array.from(map.values()).map((e) => {
          const prod = prodMap.get(String(e.productId));
          const gstRate = prod?.gstRate || prod?.gst || 18;
          const gstCollected = +(e.taxableValue * (gstRate / 100)).toFixed(2);
          return {
            productId: e.productId,
            name: prod?.name || "Unknown Product",
            qtySold: e.qtySold,
            taxableValue: +e.taxableValue.toFixed(2),
            gstRate,
            gstCollected,
          };
        });

        return res.json({ success: true, type: "itemwise", reports });
      }
    
    // Sitewise Report (new type)
    if (type === "sitewise") {
      const bills = await Bill.find(queryFilter).lean(); // Filter bills by siteName already applied
      
      const siteSummary = {};
      for (const bill of bills) {
        const currentSite = bill.siteName || "Unknown Site";
        if (!siteSummary[currentSite]) {
          siteSummary[currentSite] = {
            siteName: currentSite,
            totalBills: 0,
            totalAmount: 0,
            totalTax: 0,
            itemsSold: {} // Aggregating items per site
          };
        }
        siteSummary[currentSite].totalBills += 1;
        siteSummary[currentSite].totalAmount += bill.finalAmount || bill.total || 0;
        siteSummary[currentSite].totalTax += bill.tax || 0;

        if (Array.isArray(bill.items)) {
            for (const item of bill.items) {
                const itemName = item.name || "Unknown Item";
                if (!siteSummary[currentSite].itemsSold[itemName]) {
                    siteSummary[currentSite].itemsSold[itemName] = {
                        name: itemName,
                        totalQuantity: 0,
                        totalValue: 0,
                    };
                }
                siteSummary[currentSite].itemsSold[itemName].totalQuantity += item.quantity || 0;
                siteSummary[currentSite].itemsSold[itemName].totalValue += item.total || 0;
            }
        }
      }

      const reports = Object.values(siteSummary).map(site => ({
          ...site,
          itemsSold: Object.values(site.itemsSold)
      }));

      return res.json({ success: true, type: "sitewise", reports });
    }


    // GSTR-3B / Quarterly GST summary
    if (type === "gstr3b" || type === "quarterly") {
      // filter can include date range: { date: { $gte: ISODate, $lte: ISODate } }
      const bills = await Bill.find(filter || {}).lean();

      let totalTaxable = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let totalGST = 0;

      for (const b of bills) {
        // compute taxable and tax similar to gst logic
        let taxableValue = 0;
        if (Array.isArray(b.items) && b.items.length > 0) {
          taxableValue = b.items.reduce((sum, it) => {
            const price = Number(it.rate || it.price || 0);
            const qty = Number(it.quantity || 1);
            return sum + price * qty;
          }, 0);
        } else if (typeof b.total === "number") {
          taxableValue = b.total;
        }

        const tax = typeof b.tax === "number" ? b.tax : +(taxableValue * 0.18).toFixed(2);
        const cgst = +(tax / 2).toFixed(2);
        const sgst = +(tax / 2).toFixed(2);
        const igst = 0;

        totalTaxable += taxableValue;
        totalCGST += cgst;
        totalSGST += sgst;
        totalIGST += igst;
        totalGST += tax;
      }

      const result = {
        totalTaxable: +totalTaxable.toFixed(2),
        totalCGST: +totalCGST.toFixed(2),
        totalSGST: +totalSGST.toFixed(2),
        totalIGST: +totalIGST.toFixed(2),
        totalGST: +totalGST.toFixed(2),
        invoiceCount: bills.length,
      };

      return res.json({ success: true, type: "gstr3b", report: result });
    }

      // Bill-wise / Invoice detail report
      if (type === "billwise" || type === "invoice") {
        const bills = await Bill.find(filter || {}).lean();

        const reports = bills.map((b) => {
          // items with enriched product info if available
          const items = (Array.isArray(b.items) ? b.items : []).map((it) => ({
            productId: it.productId || it.product || null,
            name: it.name || it.productName || null,
            price: Number(it.rate || it.price || 0),
            quantity: Number(it.quantity || 1),
            taxable: Number((Number(it.rate || it.price || 0) * Number(it.quantity || 1)).toFixed(2)),
            gstRate: it.gstRate || it.gst || null,
          }));

          let taxableValue = items.reduce((s, i) => s + (i.taxable || 0), 0);
          if (!items.length && typeof b.total === "number") taxableValue = b.total;

          const tax = typeof b.tax === "number" ? b.tax : +(taxableValue * 0.18).toFixed(2);
          const cgst = +(tax / 2).toFixed(2);
          const sgst = +(tax / 2).toFixed(2);
          const igst = 0;

          return {
            _id: b._id,
            invoiceNo: b.billNumber || String(b._id),
            date: b.date || b.createdAt || null,
            customer: b.customer || b.customerName || null,
            items,
            taxableValue: +taxableValue.toFixed(2),
            cgst,
            sgst,
            igst,
            totalGst: tax,
            totalAmount: +((taxableValue + tax) || 0).toFixed(2),
          };
        });

        return res.json({ success: true, type: "billwise", reports });
      }

    // fallback: return stored reports (if any)
    const reports = await Report.find(filter || {});
    res.json({ success: true, type, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Staff Performance Report
 * @route   GET /api/reports/staff-performance
 * @access  Private
 */
export const getStaffPerformanceReport = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const coFilter = mongoose.Types.ObjectId.isValid(companyId)
      ? { $in: [companyId, new mongoose.Types.ObjectId(companyId)] }
      : companyId;

    // 1. Get all staff members from User collection AND Staff collection
    const [userStaff, directStaff] = await Promise.all([
      User.find({ companyId: coFilter, role: { $ne: 'owner' } }).select('name email role salesTarget').lean(),
      Staff.find({ companyId: coFilter, isActive: { $ne: false } }).select('name role salary position salesTarget').lean()
    ]);

    const staffMap = new Map();
    (userStaff || []).forEach(s => {
      const key = String(s.name || '').toLowerCase().trim();
      if (key) staffMap.set(key, s);
    });
    (directStaff || []).forEach(s => {
      const key = String(s.name || '').toLowerCase().trim();
      if (key && !staffMap.has(key)) staffMap.set(key, s);
    });

    const staffMembers = Array.from(staffMap.values());

    // 2. Get all bills for the company with review data
    const bills = await Bill.find({ companyId: coFilter, isDeleted: { $ne: true } })
      .select('salesmanId waiter finalAmount items total review customerName billNumber date')
      .lean();

    // 3. Process data to calculate performance for each staff member
    const performanceData = staffMembers.map(staff => {
      const staffIdString = String(staff._id);
      const staffName = String(staff.name || '').toLowerCase().trim();
      const staffTokens = staffName.split(/\s+/).filter(Boolean);

      const staffBills = bills.filter(bill => {
        if (bill.salesmanId && String(bill.salesmanId) === staffIdString) return true;
        if (bill.waiter) {
          const w = String(bill.waiter).toLowerCase().trim();
          if (w.includes(staffName) || staffTokens.some(tok => tok.length > 2 && w.includes(tok))) return true;
        }
        if (bill.review?.reviewedStaffName) {
          const rw = String(bill.review.reviewedStaffName).toLowerCase().trim();
          if (rw.includes(staffName) || staffTokens.some(tok => tok.length > 2 && rw.includes(tok))) return true;
        }
        return false;
      });

      const totalRevenue = staffBills.reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);

      // Customer review analytics for this staff
      const reviewedBills = staffBills.filter(b => b.review && (b.review.staffRating || b.review.comment));
      const ratings = reviewedBills.map(b => Number(b.review.staffRating)).filter(r => r > 0);
      const avgRating = ratings.length > 0 ? Number((ratings.reduce((a, c) => a + c, 0) / ratings.length).toFixed(1)) : 5.0;
      const positiveCount = ratings.filter(r => r >= 4).length;
      const customerFeedback = reviewedBills.filter(b => b.review.comment).map(b => ({
        billNumber: b.billNumber,
        customerName: b.customerName,
        rating: b.review.staffRating || 5,
        foodRating: b.review.foodRating || 5,
        comment: b.review.comment,
        date: b.date
      }));

      return {
        _id: staff._id,
        name: staff.name,
        role: staff.role || staff.position || "Staff",
        revenue: totalRevenue,
        bills: staffBills.length,
        salesTarget: staff.salesTarget || 50000,
        averageOrderValue: staffBills.length > 0 ? Math.round(totalRevenue / staffBills.length) : 0,
        rating: avgRating,
        ratingCount: ratings.length,
        positiveCount: positiveCount,
        customerFeedback: customerFeedback.slice(0, 10)
      };
    });

    res.status(200).json(performanceData);
  } catch (error) {
    console.error("Error generating staff performance report:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getProfitLoss = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { startDate, endDate } = req.query;
    const coFilter = mongoose.Types.ObjectId.isValid(req.companyId)
      ? { $in: [req.companyId, new mongoose.Types.ObjectId(req.companyId)] }
      : req.companyId;

    let dateFilter = {};
    let daysCount = 30; // default period days
    if (startDate && endDate) {
      const s = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      const e = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      dateFilter = { $gte: s, $lte: e };
      daysCount = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    }

    const billQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const expenseQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const purchaseQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const salaryQuery = { companyId: coFilter, isDeleted: { $ne: true } };

    if (startDate && endDate) {
      billQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      expenseQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      purchaseQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      salaryQuery.$or = [{ date: dateFilter }, { paymentDate: dateFilter }, { createdAt: dateFilter }];
    }

    const [bills, expenses, purchases, salaries] = await Promise.all([
      Bill.find(billQuery),
      Expance.find(expenseQuery),
      Purchase.find(purchaseQuery),
      Salary.find(salaryQuery)
    ]);

    const totalSales = bills.reduce((sum, b) => {
      const val = b.finalAmount !== undefined && b.finalAmount !== null ? Number(b.finalAmount) : ((Number(b.total) || 0) - (Number(b.discount) || 0));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Direct Purchases (Raw Materials / Groceries)
    const directPurchases = purchases.reduce((sum, p) => sum + (Number(p.totalAmount || p.amountPaid || p.total) || 0), 0);

    // Categorize Expenses dynamically
    let foodCost = directPurchases;
    let staffSalaries = salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    let gasAndPower = 0;
    let rentAndProperty = 0;
    let otherExpenses = 0;
    let gharKharch = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      const title = String(exp.title || "").toLowerCase();
      const cat = String(exp.category || "").toLowerCase();
      const desc = String(exp.description || "").toLowerCase();
      const combined = `${title} ${cat} ${desc}`;
      const isDrawing = exp.expenseType === 'drawings' || (exp.familyMember && String(exp.familyMember).trim() !== '');

      if (isDrawing) {
        gharKharch += amt;
      } else if (/दूध|सब्जी|राशन|raw|grocery|food|kitchen|paneer|dairy|चिकन|मसाले|किराना|सब्जियां/.test(combined)) {
        foodCost += amt;
      } else if (/गैस|सिलेंडर|lpg|gas|bijli|बिजली|power|electric/.test(combined)) {
        gasAndPower += amt;
      } else if (/salary|वेतन|staff|मजदूरी|wage|chef|waiter|cashier/.test(combined)) {
        staffSalaries += amt;
      } else if (/rent|किराया|shop|दुकान|hall/.test(combined)) {
        rentAndProperty += amt;
      } else {
        otherExpenses += amt;
      }
    }

    const totalPurchase = foodCost;
    const businessExpenses = foodCost + staffSalaries + gasAndPower + rentAndProperty + otherExpenses;
    const totalExpenses = businessExpenses + gharKharch;
    const netProfit = totalSales - totalExpenses;

    const dailyAvgSales = Math.round(totalSales / daysCount);
    const dailyAvgExpenses = Math.round(totalExpenses / daysCount);
    const breakEvenDailySalesNeeded = Math.round(dailyAvgExpenses / 0.6);

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchase,
        totalExpenses,
        businessExpenses,
        gharKharch,
        netProfit,
        daysCount,
        dailyAvgSales,
        dailyAvgExpenses,
        breakEvenDailySalesNeeded,
        breakdown: {
          foodCost,
          staffSalaries,
          gasAndPower,
          rentAndProperty,
          gharKharch,
          otherExpenses
        },
        billsCount: bills.length,
        expensesCount: expenses.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Nayi Chart Data API - Dashboard Graphs aur Charts ke liye
export const getChartData = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const coFilter = mongoose.Types.ObjectId.isValid(req.companyId)
      ? { $in: [req.companyId, new mongoose.Types.ObjectId(req.companyId)] }
      : req.companyId;

    // 1. Sales Trend (Last 7 Days) - Line/Bar Chart ke liye
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesTrend = await Bill.aggregate([
      { $match: { companyId: coFilter, isDeleted: false, date: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: { $ifNull: ["$finalAmount", "$total"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Top 5 Selling Products - Pie Chart/Donut Chart ke liye
    const topProducts = await Bill.aggregate([
      { $match: { companyId: coFilter, isDeleted: false } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // 3. Sitewise Revenue (Builder / Contractor ke Bar Chart ke liye)
    const siteRevenue = await Bill.aggregate([
      { $match: { companyId: coFilter, isDeleted: false, siteName: { $exists: true, $ne: "" } } },
      { $group: {
          _id: "$siteName",
          totalRevenue: { $sum: { $ifNull: ["$finalAmount", "$total"] } }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ success: true, data: { salesTrend, topProducts, siteRevenue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBalanceSheet = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    // 1. Calculate Assets (Current Assets)
    // - Cash/Bank Balance (Not tracked yet, assuming 0 or manual)
    // - Accounts Receivable (Unpaid Bills/Udhar)
    // - Inventory Value (Stock * Cost Price)

    // Accounts Receivable (Total of unpaid/issued bills)
    const unpaidBills = await Bill.find({
      companyId: req.companyId,
      status: { $in: ["issued", "unpaid", "partial"] },
      isDeleted: false
    });
    const accountsReceivable = unpaidBills.reduce((sum, bill) => sum + (bill.total || 0), 0);

    // Inventory Value
    const products = await Product.find({ companyId: req.companyId, isActive: true });
    const inventoryValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.currentStock || 0)), 0);

    const totalAssets = accountsReceivable + inventoryValue;

    // 2. Calculate Liabilities (Current Liabilities)
    // - Accounts Payable (Unpaid Expenses/Purchases)
    // - Loans (Not tracked yet)

    // Total Expenses (Assuming all are paid for now, but in future we can track unpaid expenses)
    // For Balance Sheet, usually only *unpaid* expenses are liabilities.
    // Since we don't have "unpaid expenses" status yet, we'll just show Total Expenses as a separate metric or 0 for liability.
    // Let's assume 0 for now unless we add Purchase module.
    const totalLiabilities = 0;

    // 3. Equity (Assets - Liabilities)
    const equity = totalAssets - totalLiabilities;

    res.json({
      success: true,
      data: { accountsReceivable, inventoryValue, totalAssets, totalLiabilities, equity }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Non-Moving Items Report
 * @route   GET /api/reports/non-moving-items
 * @access  Private
 */
export const getNonMovingItems = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    // Placeholder logic: This feature is not fully implemented yet.
    res.status(200).json({ success: true, message: "Non-moving items report is under development.", data: [] });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get Restaurant Deep Analytics (Petpooja Benchmark: Order types, Table Rush, Notes & Reviews)
 * @route   GET /api/reports/restaurant-analytics
 * @access  Private
 */
export const getRestaurantAnalytics = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const coFilter = mongoose.Types.ObjectId.isValid(companyId)
      ? { $in: [companyId, new mongoose.Types.ObjectId(companyId)] }
      : companyId;

    const bills = await Bill.find({ companyId: coFilter, isDeleted: { $ne: true } }).lean();

    // 1. Order Type Breakdown (Dine-in vs Takeaway vs Delivery)
    const orderTypes = {
      dine_in: { count: 0, revenue: 0, avgTicket: 0 },
      takeaway: { count: 0, revenue: 0, avgTicket: 0 },
      delivery: { count: 0, revenue: 0, avgTicket: 0 },
    };

    let totalTableNotesCount = 0;
    let totalFoodNotesCount = 0;
    const specialNotesList = [];

    // Review metrics
    const allFoodRatings = [];
    const allStaffRatings = [];
    const allAmbienceRatings = [];
    const customerReviewsList = [];

    bills.forEach(b => {
      const type = b.orderType || (b.tableNo?.toLowerCase().includes("parcel") || b.customerAddress?.toLowerCase().includes("takeaway") ? "takeaway" : "dine_in");
      const rev = Number(b.finalAmount || b.total || 0);

      if (orderTypes[type]) {
        orderTypes[type].count += 1;
        orderTypes[type].revenue += rev;
      } else {
        orderTypes.dine_in.count += 1;
        orderTypes.dine_in.revenue += rev;
      }

      // Check for Table Notes
      if (b.tableNotes && b.tableNotes.trim()) {
        totalTableNotesCount += 1;
      }

      // Check for Food-wise Cooking Instructions
      let hasFoodNote = false;
      if (Array.isArray(b.items)) {
        b.items.forEach(it => {
          if (it.cookingInstructions && it.cookingInstructions.trim()) {
            totalFoodNotesCount += 1;
            hasFoodNote = true;
          }
        });
      }

      if ((b.tableNotes && b.tableNotes.trim()) || hasFoodNote) {
        specialNotesList.push({
          billNumber: b.billNumber,
          table: b.tableNo || b.table || "Table",
          waiter: b.waiter || "Staff",
          tableNotes: b.tableNotes || "",
          foodNotes: (b.items || [])
            .filter(it => it.cookingInstructions)
            .map(it => `${it.name}: ${it.cookingInstructions}`),
          date: b.date
        });
      }

      // Reviews
      if (b.review) {
        if (b.review.foodRating) allFoodRatings.push(Number(b.review.foodRating));
        if (b.review.staffRating) allStaffRatings.push(Number(b.review.staffRating));
        if (b.review.ambienceRating) allAmbienceRatings.push(Number(b.review.ambienceRating));
        if (b.review.comment) {
          customerReviewsList.push({
            billNumber: b.billNumber,
            customerName: b.customerName || "Customer",
            table: b.tableNo || b.table || "Dine-in",
            staffName: b.review.reviewedStaffName || b.waiter || "Staff",
            foodRating: b.review.foodRating || 5,
            staffRating: b.review.staffRating || 5,
            ambienceRating: b.review.ambienceRating || 5,
            comment: b.review.comment,
            date: b.date
          });
        }
      }
    });

    Object.keys(orderTypes).forEach(k => {
      orderTypes[k].avgTicket = orderTypes[k].count > 0 
        ? Math.round(orderTypes[k].revenue / orderTypes[k].count) 
        : 0;
    });

    const avg = arr => arr.length > 0 ? Number((arr.reduce((a, c) => a + c, 0) / arr.length).toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      data: {
        totalBills: bills.length,
        totalRevenue: bills.reduce((s, b) => s + (b.finalAmount || b.total || 0), 0),
        orderTypes,
        notesAnalytics: {
          totalBillsWithNotes: specialNotesList.length,
          totalTableNotes: totalTableNotesCount,
          totalFoodNotes: totalFoodNotesCount,
          sampleNotes: specialNotesList.slice(0, 15)
        },
        reviewsAnalytics: {
          totalReviews: customerReviewsList.length,
          avgFoodRating: avg(allFoodRatings),
          avgStaffRating: avg(allStaffRatings),
          avgAmbienceRating: avg(allAmbienceRatings),
          recentReviews: customerReviewsList.slice(0, 15)
        }
      }
    });
  } catch (error) {
    console.error("Error in getRestaurantAnalytics:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};