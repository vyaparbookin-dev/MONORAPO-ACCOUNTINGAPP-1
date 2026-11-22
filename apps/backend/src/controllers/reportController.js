import Report from "../model/report.js";
import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Expance from "../model/expenses.js";
import Purchase from "../model/purchase.js";
import Salary from "../model/salary.js";
import StaffTransaction from "../model/StaffTransaction.js";
import User from "../model/user.js";
import Staff from "../model/staff.js";
import Party from "../model/party.js";
import BankAccount from "../model/bankAccount.js";
import FixedAsset from "../model/fixedAsset.js";
import Capital from "../model/capital.js";
import Company from "../model/company.js";
import { mongoIdToUuid } from "../services/supabaseSyncService.js";
import { supabase } from "../config/supabase.js";
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

        // use stored tax if present, otherwise assume 0
        const tax = typeof b.tax === "number" ? b.tax : 0;
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

        const tax = typeof b.tax === "number" ? b.tax : 0;
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

          const tax = typeof b.tax === "number" ? b.tax : 0;
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

    const parseIST = (dateStr) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}T00:00:00+05:30`);
      }
      return new Date(dateStr);
    };
    const ISTDayEnd = (dateStr) => new Date(parseIST(dateStr).getTime() + 24 * 60 * 60 * 1000 - 1);

    let dateFilter = {};
    let daysCount = 30; // default period days
    if (startDate && endDate) {
      const s = parseIST(startDate);
      const e = ISTDayEnd(endDate);
      dateFilter = { $gte: s, $lte: e };
      daysCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const billQuery = { companyId: coFilter, isDeleted: { $ne: true }, status: { $ne: 'cancelled' } };
    const expenseQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const purchaseQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const salaryQuery = { companyId: coFilter, isDeleted: { $ne: true } };
    const staffTxQuery = { companyId: coFilter, isDeleted: { $ne: true }, debit: { $gt: 0 } };

    if (startDate && endDate) {
      billQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      expenseQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      purchaseQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
      salaryQuery.$or = [{ date: dateFilter }, { paymentDate: dateFilter }, { createdAt: dateFilter }];
      staffTxQuery.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
    }

    const [bills, expenses, purchases, salaries, staffTxs, activeStaffList] = await Promise.all([
      Bill.find(billQuery),
      Expance.find(expenseQuery),
      Purchase.find(purchaseQuery),
      Salary.find(salaryQuery),
      StaffTransaction.find(staffTxQuery),
      Staff.find({ companyId: coFilter, isActive: true })
    ]);

    const totalSales = bills.reduce((sum, b) => {
      const val = b.finalAmount !== undefined && b.finalAmount !== null ? Number(b.finalAmount) : ((Number(b.total) || 0) - (Number(b.discount) || 0));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Direct Purchases (Raw Materials / Goods Purchases)
    const directPurchases = purchases.reduce((sum, p) => {
      const val = Number(p.finalAmount ?? p.totalAmount ?? p.total ?? p.amountPaid ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Monthly Fixed Staff Salary liability from Staff Profile (Auto-Overhead)
    const fixedMonthlyStaffSalaries = activeStaffList.reduce((sum, s) => sum + (Number(s.salary || s.wageAmount || 0)), 0);
    const fixedStaffPeriodLiability = Math.round((fixedMonthlyStaffSalaries * daysCount) / 30);

    // Categorize Operating Expenses dynamically
    let actualPaidSalaries = salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) +
                             (staffTxs || []).reduce((sum, st) => sum + (Number(st.debit) || 0), 0);
    let gasAndPower = 0;
    let rentAndProperty = 0;
    let otherExpenses = 0;
    let gharKharch = 0;
    let directExpensePurchases = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      const title = String(exp.title || "").toLowerCase();
      const cat = String(exp.category || "").toLowerCase();
      const desc = String(exp.description || "").toLowerCase();
      const combined = `${title} ${cat} ${desc}`;
      const isDrawing = exp.expenseType !== 'operating' && (
                        exp.expenseType === 'drawings' || 
                        exp.expenseType === 'ghar_kharch' || 
                        exp.expenseType === 'personal' ||
                        cat.includes('घर खर्च') || 
                        cat.includes('family') || 
                        cat.includes('personal') || 
                        title.includes('घर खर्च') ||
                        (exp.familyMember && String(exp.familyMember).trim() !== ''));

      if (isDrawing) {
        gharKharch += amt;
      } else if (/दूध|सब्जी|राशन|raw|grocery|food|kitchen|paneer|dairy|चिकन|मसाले|किराना|सब्जियां/.test(combined)) {
        directExpensePurchases += amt;
      } else if (/गैस|सिलेंडर|lpg|gas|bijli|बिजली|power|electric/.test(combined)) {
        gasAndPower += amt;
      } else if (/salary|वेतन|staff|मजदूरी|wage|chef|waiter|cashier/.test(combined)) {
        actualPaidSalaries += amt;
      } else if (/rent|किराया|shop|दुकान|hall/.test(combined)) {
        rentAndProperty += amt;
      } else {
        otherExpenses += amt;
      }
    }

    // Dynamic Margin & Cost of Goods Sold (COGS) Configuration (15% System)
    const marginParam = req.query.marginPercent !== undefined && req.query.marginPercent !== ""
      ? parseFloat(req.query.marginPercent)
      : null;
    const recordedTotalPurchases = directPurchases + directExpensePurchases;

    // In auto mode, if recorded purchases are unrealistically low (< 50% of sales),
    // purchases are incomplete. Default to the 15% profit margin system!
    const isActualRealistic = recordedTotalPurchases >= (totalSales * 0.5);
    const requestedMode = req.query.costMode;
    const costMode = requestedMode === "actual"
      ? "actual"
      : (requestedMode === "margin" ? "margin" : (isActualRealistic ? "actual" : "margin"));

    const effectiveMarginPercent = (marginParam !== null && !isNaN(marginParam)) ? marginParam : 15;
    const marginFrac = Math.max(0, Math.min(100, effectiveMarginPercent)) / 100;
    const estimatedCOGS = Math.round(totalSales * (1 - marginFrac));

    const effectivePurchases = (costMode === "actual" && recordedTotalPurchases > 0)
      ? recordedTotalPurchases
      : (estimatedCOGS > 0 ? estimatedCOGS : recordedTotalPurchases);

    // Effective staff salaries: Use actual disbursed or accrued fixed staff liability
    const staffSalaries = Math.max(actualPaidSalaries, fixedStaffPeriodLiability);

    const totalPurchase = effectivePurchases;
    const grossProfit = totalSales - effectivePurchases;
    const businessOperatingExpenses = staffSalaries + gasAndPower + rentAndProperty + otherExpenses;
    const businessExpenses = effectivePurchases + businessOperatingExpenses;
    const totalExpenses = businessExpenses + gharKharch;
    const netProfit = grossProfit - businessOperatingExpenses;

    const dailyAvgSales = Math.round(totalSales / daysCount);
    const dailyAvgExpenses = Math.round(totalExpenses / daysCount);
    // Daily fixed overhead burn rate (Rent + Staff + Power)
    const dailyBurnRate = Math.round((staffSalaries + gasAndPower + rentAndProperty + otherExpenses) / daysCount);
    const breakEvenDailySalesNeeded = Math.round(dailyBurnRate / 0.6);

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchase,
        actualPurchases: recordedTotalPurchases,
        estimatedCOGS,
        grossProfit,
        businessOperatingExpenses,
        totalExpenses,
        businessExpenses,
        gharKharch,
        netProfit,
        costMode,
        marginPercent: marginParam !== null ? marginParam : (totalSales > 0 ? Math.round(((totalSales - effectivePurchases) / totalSales) * 100) : 15),
        grossMarginPercent: totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 15,
        netMarginPercent: totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 12,
        daysCount,
        dailyAvgSales,
        dailyAvgExpenses,
        dailyBurnRate,
        fixedMonthlyStaffSalaries,
        activeStaffCount: activeStaffList.length,
        breakEvenDailySalesNeeded,
        breakdown: {
          foodCost: effectivePurchases,
          staffSalaries,
          fixedMonthlyStaffSalaries,
          actualPaidSalaries,
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

    const coIdStr = String(req.companyId || "");
    const validMongoCoIds = [];
    if (mongoose.Types.ObjectId.isValid(coIdStr)) {
      validMongoCoIds.push(new mongoose.Types.ObjectId(coIdStr));
    } else {
      try {
        const allCompanies = await Company.find({}, { _id: 1 }).lean();
        for (const c of allCompanies) {
          if (mongoIdToUuid(c._id) === coIdStr) {
            validMongoCoIds.push(c._id);
            break;
          }
        }
      } catch (cErr) {}
    }

    const coFilter = validMongoCoIds.length > 0 ? { $in: validMongoCoIds } : req.companyId;

    // 1. Current Assets:
    // A. Cash in Hand & Bank Balances
    let bankAccountsList = [];
    try {
      bankAccountsList = await BankAccount.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const totalBankBalance = bankAccountsList.reduce((acc, b) => acc + (Number(b.balance ?? b.currentBalance ?? 0) || 0), 0);

    // B. Accounts Receivable (Sundry Debtors / देनदार ग्राहक)
    let partiesList = [];
    try {
      partiesList = await Party.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    // In dual mode, fallback to Supabase if Mongo empty
    if (partiesList.length === 0 && supabase) {
      try {
        const sbCoUuid = mongoIdToUuid(req.companyId);
        const { data: sbP } = await supabase.from("parties").select("*").eq("company_id", sbCoUuid).eq("is_active", true);
        if (Array.isArray(sbP)) {
          partiesList = sbP.map(p => ({
            name: p.name,
            currentBalance: Number(p.current_balance || 0),
            partyType: p.party_type
          }));
        }
      } catch (e) {}
    }

    const debtors = partiesList.filter(p => Number(p.currentBalance || p.balance || 0) > 0);
    const totalDebtors = debtors.reduce((sum, p) => sum + (Number(p.currentBalance || p.balance || 0)), 0);

    // C. Inventory / Closing Stock Value (दुकान में स्टॉक का मूल्य)
    let productsList = [];
    try {
      productsList = await Product.find({
        companyId: coFilter,
        isActive: { $ne: false },
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const inventoryValue = productsList.reduce((sum, p) => {
      const stock = Number(p.stock ?? p.currentStock ?? 0);
      const rate = Number(p.purchasePrice ?? p.costPrice ?? p.price ?? 0);
      return sum + (stock > 0 ? stock * rate : 0);
    }, 0);

    // D. Estimated Cash in Hand (दुकान गल्ला)
    let cashSales = 0;
    try {
      const bills = await Bill.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }, { total: 1, finalAmount: 1, paymentMethod: 1, paymentMode: 1, paidAmount: 1 }).lean();

      bills.forEach(b => {
        const pMode = String(b.paymentMethod || b.paymentMode || "CASH").toUpperCase();
        if (pMode === "CASH") {
          cashSales += Number(b.paidAmount ?? b.finalAmount ?? b.total ?? 0);
        }
      });
    } catch (e) {}

    let cashExpenses = 0;
    try {
      const exps = await Expance.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }, { amount: 1, paymentMethod: 1 }).lean();

      exps.forEach(e => {
        const m = String(e.paymentMethod || "cash").toLowerCase();
        if (m === "cash") {
          cashExpenses += Number(e.amount || 0);
        }
      });
    } catch (e) {}

    const estimatedCashInHand = Math.max(0, cashSales - cashExpenses);
    const totalCurrentAssets = totalBankBalance + totalDebtors + inventoryValue + estimatedCashInHand;

    // 2. Fixed Assets (स्थिर संपत्तियां: फर्नीचर, मशीन, वाहन, कंप्यूटर)
    let fixedAssetsList = [];
    try {
      fixedAssetsList = await FixedAsset.find({
        companyId: coFilter,
        isDeleted: { $ne: true },
        status: { $ne: 'scrapped' }
      }).lean();
    } catch (e) {}

    const totalFixedAssets = fixedAssetsList.reduce((sum, a) => sum + (Number(a.currentValue ?? a.purchaseCost ?? 0) || 0), 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // 3. Current Liabilities (चालू देनदारियां):
    // Sundry Creditors (सप्लायर / लेनदार पार्टियां - देने हैं)
    const creditors = partiesList.filter(p => Number(p.currentBalance || p.balance || 0) < 0 || p.partyType === 'supplier');
    const totalCreditors = creditors.reduce((sum, p) => {
      const bal = Number(p.currentBalance || p.balance || 0);
      return sum + (bal < 0 ? Math.abs(bal) : (p.partyType === 'supplier' && bal > 0 ? bal : 0));
    }, 0);

    const totalCurrentLiabilities = totalCreditors;

    // 4. Non-Current Liabilities (लोन व ऋण):
    let capitalEntries = [];
    try {
      capitalEntries = await Capital.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const totalUnsecuredLoans = capitalEntries
      .filter(e => e.entryType === 'unsecured_loan')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalNonCurrentLiabilities = totalUnsecuredLoans;
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // 5. Capital & Equity (मालिक की पूंजी):
    const ownerInvestedCapital = capitalEntries
      .filter(e => e.entryType === 'owner_capital' || e.entryType === 'partner_capital' || e.entryType === 'additional_capital')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Calculate Net Profit
    let totalRevenue = 0;
    try {
      const allBills = await Bill.find({ companyId: coFilter, isDeleted: { $ne: true } }, { finalAmount: 1, total: 1 }).lean();
      totalRevenue = allBills.reduce((s, b) => s + (Number(b.finalAmount ?? b.total ?? 0)), 0);
    } catch (e) {}

    let totalPurchases = 0;
    try {
      const allPurchases = await Purchase.find({ companyId: coFilter, isDeleted: { $ne: true } }, { totalAmount: 1, total: 1 }).lean();
      totalPurchases = allPurchases.reduce((s, p) => s + (Number(p.totalAmount ?? p.total ?? 0)), 0);
    } catch (e) {}

    let operatingExpenses = 0;
    let drawingsGharKharch = 0;
    try {
      const allExpenses = await Expance.find({ companyId: coFilter, isDeleted: { $ne: true } }).lean();
      allExpenses.forEach(exp => {
        const isPersonal = exp.expenseType === 'drawings' || exp.expenseType === 'personal' || (exp.familyMember && exp.familyMember.trim() !== '');
        const amt = Number(exp.amount || 0);
        if (isPersonal) {
          drawingsGharKharch += amt;
        } else {
          operatingExpenses += amt;
        }
      });
    } catch (e) {}

    const netProfit = totalRevenue - totalPurchases - operatingExpenses;
    const effectiveOpeningCapital = ownerInvestedCapital > 0 ? ownerInvestedCapital : Math.max(0, totalAssets - totalLiabilities - netProfit + drawingsGharKharch);
    const closingCapital = effectiveOpeningCapital + netProfit - drawingsGharKharch;

    const totalLiabilitiesAndCapital = totalLiabilities + closingCapital;
    const difference = Math.round((totalAssets - totalLiabilitiesAndCapital) * 100) / 100;

    res.json({
      success: true,
      data: {
        asOnDate: new Date().toISOString(),
        assets: {
          currentAssets: {
            cashInHand: Math.round(estimatedCashInHand),
            bankBalances: Math.round(totalBankBalance),
            bankAccounts: bankAccountsList.map(b => ({
              accountName: b.accountName,
              bankName: b.bankName,
              balance: Number(b.balance ?? b.currentBalance ?? 0)
            })),
            sundryDebtors: Math.round(totalDebtors),
            debtorsCount: debtors.length,
            topDebtors: debtors.sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0)).slice(0, 10).map(d => ({
              name: d.name,
              balance: Number(d.currentBalance || d.balance || 0)
            })),
            closingStock: Math.round(inventoryValue),
            total: Math.round(totalCurrentAssets)
          },
          fixedAssets: {
            total: Math.round(totalFixedAssets),
            items: fixedAssetsList.map(a => ({
              assetName: a.assetName,
              currentValue: Number(a.currentValue ?? a.purchaseCost ?? 0),
              purchaseCost: Number(a.purchaseCost || 0)
            }))
          },
          totalAssets: Math.round(totalAssets)
        },
        liabilitiesAndCapital: {
          capitalAccount: {
            openingCapital: Math.round(effectiveOpeningCapital),
            netProfit: Math.round(netProfit),
            drawings: Math.round(drawingsGharKharch),
            closingCapital: Math.round(closingCapital)
          },
          nonCurrentLiabilities: {
            unsecuredLoans: Math.round(totalUnsecuredLoans),
            total: Math.round(totalNonCurrentLiabilities)
          },
          currentLiabilities: {
            sundryCreditors: Math.round(totalCreditors),
            creditorsCount: creditors.length,
            topCreditors: creditors.sort((a, b) => Math.abs(b.currentBalance || 0) - Math.abs(a.currentBalance || 0)).slice(0, 10).map(c => ({
              name: c.name,
              balance: Math.abs(Number(c.currentBalance || c.balance || 0))
            })),
            total: Math.round(totalCurrentLiabilities)
          },
          totalLiabilities: Math.round(totalLiabilities),
          totalLiabilitiesAndCapital: Math.round(totalLiabilitiesAndCapital)
        },
        balanceCheck: {
          isBalanced: Math.abs(difference) < 1,
          difference: difference
        }
      }
    });
  } catch (error) {
    console.error("[getBalanceSheet] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Trial Balance (तलपट रिपोर्ट) - Full Double Entry Balancing
 * @route   GET /api/reports/trialbalance & /api/reports/trial-balance
 * @access  Private
 */
export const getTrialBalance = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { startDate, endDate, fy } = req.query;

    const coIdStr = String(req.companyId || "");
    const validMongoCoIds = [];
    if (mongoose.Types.ObjectId.isValid(coIdStr)) {
      validMongoCoIds.push(new mongoose.Types.ObjectId(coIdStr));
    } else {
      try {
        const allCompanies = await Company.find({}, { _id: 1 }).lean();
        for (const c of allCompanies) {
          if (mongoIdToUuid(c._id) === coIdStr) {
            validMongoCoIds.push(c._id);
            break;
          }
        }
      } catch (cErr) {}
    }

    const coFilter = validMongoCoIds.length > 0 ? { $in: validMongoCoIds } : req.companyId;

    // Optional date filter for nominal accounts (Sales, Purchases, Expenses)
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    } else if (fy) {
      const [startYear, endYear] = fy.split("-").map(y => parseInt(y.trim()));
      if (startYear && endYear) {
        dateFilter = {
          date: {
            $gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
            $lte: new Date(`${endYear}-03-31T23:59:59.999Z`)
          }
        };
      }
    }

    // 1. Bank Accounts
    let bankAccountsList = [];
    try {
      bankAccountsList = await BankAccount.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const totalBankBalance = bankAccountsList.reduce((acc, b) => acc + (Number(b.balance ?? b.currentBalance ?? 0) || 0), 0);

    // 2. Sundry Debtors & Sundry Creditors (Parties)
    let partiesList = [];
    try {
      partiesList = await Party.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    if (partiesList.length === 0 && supabase) {
      try {
        const sbCoUuid = mongoIdToUuid(req.companyId);
        const { data: sbP } = await supabase.from("parties").select("*").eq("company_id", sbCoUuid).eq("is_active", true);
        if (Array.isArray(sbP)) {
          partiesList = sbP.map(p => ({
            name: p.name,
            currentBalance: Number(p.current_balance || 0),
            partyType: p.party_type
          }));
        }
      } catch (e) {}
    }

    const debtors = partiesList.filter(p => Number(p.currentBalance || p.balance || 0) > 0);
    const totalDebtors = debtors.reduce((sum, p) => sum + (Number(p.currentBalance || p.balance || 0)), 0);

    const creditors = partiesList.filter(p => Number(p.currentBalance || p.balance || 0) < 0 || p.partyType === 'supplier');
    const totalCreditors = creditors.reduce((sum, p) => {
      const bal = Number(p.currentBalance || p.balance || 0);
      return sum + (bal < 0 ? Math.abs(bal) : (p.partyType === 'supplier' && bal > 0 ? bal : 0));
    }, 0);

    // 3. Inventory / Stock
    let productsList = [];
    try {
      productsList = await Product.find({
        companyId: coFilter,
        isActive: { $ne: false },
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const inventoryValue = productsList.reduce((sum, p) => {
      const stock = Number(p.stock ?? p.currentStock ?? 0);
      const rate = Number(p.purchasePrice ?? p.costPrice ?? p.price ?? 0);
      return sum + (stock > 0 ? stock * rate : 0);
    }, 0);

    // 4. Fixed Assets
    let fixedAssetsList = [];
    try {
      fixedAssetsList = await FixedAsset.find({
        companyId: coFilter,
        isDeleted: { $ne: true },
        status: { $ne: 'scrapped' }
      }).lean();
    } catch (e) {}

    const totalFixedAssets = fixedAssetsList.reduce((sum, a) => sum + (Number(a.currentValue ?? a.purchaseCost ?? 0) || 0), 0);

    // 5. Sales (Bills)
    const billMatch = { companyId: coFilter, isDeleted: { $ne: true }, ...(dateFilter.date ? { date: dateFilter.date } : {}) };
    let bills = [];
    try {
      bills = await Bill.find(billMatch, { total: 1, finalAmount: 1, paymentMethod: 1, paymentMode: 1, paidAmount: 1 }).lean();
    } catch (e) {}

    let totalSales = 0;
    let cashSales = 0;
    bills.forEach(b => {
      const amt = Number(b.finalAmount ?? b.total ?? 0);
      totalSales += amt;
      const pMode = String(b.paymentMethod || b.paymentMode || "CASH").toUpperCase();
      if (pMode === "CASH") {
        cashSales += Number(b.paidAmount ?? b.finalAmount ?? b.total ?? 0);
      }
    });

    // 6. Purchases
    const purchaseMatch = { companyId: coFilter, isDeleted: { $ne: true }, ...(dateFilter.date ? { date: dateFilter.date } : {}) };
    let purchases = [];
    try {
      purchases = await Purchase.find(purchaseMatch, { totalAmount: 1, total: 1 }).lean();
    } catch (e) {}

    const totalPurchases = purchases.reduce((s, p) => s + (Number(p.totalAmount ?? p.total ?? 0)), 0);

    // 7. Expenses & Drawings
    const expMatch = { companyId: coFilter, isDeleted: { $ne: true }, ...(dateFilter.date ? { date: dateFilter.date } : {}) };
    let expenses = [];
    try {
      expenses = await Expance.find(expMatch).lean();
    } catch (e) {}

    let cashExpenses = 0;
    let operatingExpenses = 0;
    let drawingsGharKharch = 0;
    const expenseCategoryMap = {};

    expenses.forEach(exp => {
      const isPersonal = exp.expenseType === 'drawings' || exp.expenseType === 'personal' || (exp.familyMember && exp.familyMember.trim() !== '');
      const amt = Number(exp.amount || 0);
      const m = String(exp.paymentMethod || "cash").toLowerCase();
      if (m === "cash") {
        cashExpenses += amt;
      }
      if (isPersonal) {
        drawingsGharKharch += amt;
      } else {
        operatingExpenses += amt;
        const cat = exp.category || 'अन्य व्यापारिक व्यय (General Expenses)';
        expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
      }
    });

    const estimatedCashInHand = Math.max(0, cashSales - cashExpenses);

    // 8. Capital & Loans
    let capitalEntries = [];
    try {
      capitalEntries = await Capital.find({
        companyId: coFilter,
        isDeleted: { $ne: true }
      }).lean();
    } catch (e) {}

    const totalUnsecuredLoans = capitalEntries
      .filter(e => e.entryType === 'unsecured_loan')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const ownerInvestedCapital = capitalEntries
      .filter(e => e.entryType === 'owner_capital' || e.entryType === 'partner_capital' || e.entryType === 'additional_capital')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalAssets = estimatedCashInHand + totalBankBalance + totalDebtors + inventoryValue + totalFixedAssets;
    const netProfit = totalSales - totalPurchases - operatingExpenses;
    const effectiveOpeningCapital = ownerInvestedCapital > 0
      ? ownerInvestedCapital
      : Math.max(0, totalAssets - totalCreditors - totalUnsecuredLoans - netProfit + drawingsGharKharch);

    // Construct Ledger Accounts List (तलपट खाते)
    const ledgers = [];

    // --- DEBIT ACCOUNTS ---
    // 1. Cash in Hand
    if (estimatedCashInHand > 0) {
      ledgers.push({
        id: "cash-account",
        code: "1010",
        name: "रोकड़ खाता (दुकान गल्ला / Cash-in-Hand)",
        group: "Current Assets (चालू परिसंपत्ति)",
        type: "Asset",
        debit: Math.round(estimatedCashInHand),
        credit: 0
      });
    }

    // 2. Bank Accounts
    if (bankAccountsList.length > 0) {
      bankAccountsList.forEach((b, idx) => {
        const bal = Number(b.balance ?? b.currentBalance ?? 0);
        if (bal >= 0) {
          ledgers.push({
            id: `bank-${b._id || idx}`,
            code: `102${idx + 1}`,
            name: `${b.bankName || "बैंक"} खाता - ${b.accountName || b.accountNumber || "मुख्य खाता"}`,
            group: "Bank Accounts (बैंक खाते)",
            type: "Asset",
            debit: Math.round(bal),
            credit: 0
          });
        } else {
          ledgers.push({
            id: `bank-od-${b._id || idx}`,
            code: `202${idx + 1}`,
            name: `${b.bankName || "बैंक"} ओवरड्राफ्ट (OD Account)`,
            group: "Bank OD A/c (बैंक ओवरड्राफ्ट)",
            type: "Liability",
            debit: 0,
            credit: Math.round(Math.abs(bal))
          });
        }
      });
    } else if (totalBankBalance > 0) {
      ledgers.push({
        id: "bank-summary",
        code: "1020",
        name: "बैंक खाता (Bank Accounts)",
        group: "Bank Accounts (बैंक खाते)",
        type: "Asset",
        debit: Math.round(totalBankBalance),
        credit: 0
      });
    }

    // 3. Sundry Debtors (कुल देनदार ग्राहक)
    ledgers.push({
      id: "sundry-debtors",
      code: "1030",
      name: `विविध देनदार ग्राहक (Sundry Debtors - ${debtors.length} पार्टियां)`,
      group: "Sundry Debtors (देनदार ग्राहक)",
      type: "Asset",
      debit: Math.round(totalDebtors),
      credit: 0,
      breakdown: debtors.map(d => ({
        id: d._id,
        name: d.name,
        mobile: d.mobile || d.phone,
        balance: Number(d.currentBalance || d.balance || 0)
      }))
    });

    // 4. Closing Stock
    if (inventoryValue > 0) {
      ledgers.push({
        id: "closing-stock",
        code: "1040",
        name: "स्टॉक खाता / इन्वेंटरी (Closing Inventory)",
        group: "Current Assets (चालू परिसंपत्ति)",
        type: "Asset",
        debit: Math.round(inventoryValue),
        credit: 0
      });
    }

    // 5. Fixed Assets
    if (fixedAssetsList.length > 0) {
      fixedAssetsList.forEach((a, idx) => {
        ledgers.push({
          id: `fixed-asset-${a._id || idx}`,
          code: `110${idx + 1}`,
          name: `${a.assetName || "स्थिर संपत्ति"} (Fixed Asset)`,
          group: "Fixed Assets (स्थिर परिसंपत्ति)",
          type: "Asset",
          debit: Math.round(Number(a.currentValue ?? a.purchaseCost ?? 0)),
          credit: 0
        });
      });
    } else if (totalFixedAssets > 0) {
      ledgers.push({
        id: "fixed-assets-summary",
        code: "1100",
        name: "स्थिर परिसंपत्तियां (Fixed Assets)",
        group: "Fixed Assets (स्थिर परिसंपत्ति)",
        type: "Asset",
        debit: Math.round(totalFixedAssets),
        credit: 0
      });
    }

    // 6. Purchase Account
    ledgers.push({
      id: "purchase-account",
      code: "5010",
      name: "माल खरीद खाता (Purchase Account)",
      group: "Purchase Accounts (खरीद खाते)",
      type: "Expense",
      debit: Math.round(totalPurchases),
      credit: 0
    });

    // 7. Operating Expense Category Ledgers
    Object.entries(expenseCategoryMap).forEach(([catName, amt], idx) => {
      ledgers.push({
        id: `exp-${idx}`,
        code: `60${idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1)}`,
        name: `${catName} खाता`,
        group: "Indirect Expenses (अप्रत्यक्ष व्यापारिक खर्च)",
        type: "Expense",
        debit: Math.round(amt),
        credit: 0
      });
    });

    // 8. Drawings (घर खर्च / आहरण खाता)
    if (drawingsGharKharch > 0) {
      ledgers.push({
        id: "drawings-account",
        code: "3020",
        name: "आहरण खाता (Drawings / निजी व घर खर्च)",
        group: "Capital Account (पूंजी समायोजन)",
        type: "Drawings",
        debit: Math.round(drawingsGharKharch),
        credit: 0
      });
    }

    // --- CREDIT ACCOUNTS ---
    // 9. Sales Account
    ledgers.push({
      id: "sales-account",
      code: "4010",
      name: "बिक्री खाता (Sales Account / कुल राजस्व)",
      group: "Sales Accounts (बिक्री खाते)",
      type: "Income",
      debit: 0,
      credit: Math.round(totalSales)
    });

    // 10. Sundry Creditors (कुल लेनदार सप्लायर)
    ledgers.push({
      id: "sundry-creditors",
      code: "2010",
      name: `विविध लेनदार सप्लायर (Sundry Creditors - ${creditors.length} पार्टियां)`,
      group: "Sundry Creditors (लेनदार सप्लायर)",
      type: "Liability",
      debit: 0,
      credit: Math.round(totalCreditors),
      breakdown: creditors.map(c => ({
        id: c._id,
        name: c.name,
        mobile: c.mobile || c.phone,
        balance: Math.abs(Number(c.currentBalance || c.balance || 0))
      }))
    });

    // 11. Loans & Borrowings
    if (totalUnsecuredLoans > 0) {
      ledgers.push({
        id: "loans-account",
        code: "2030",
        name: "ऋण व लोन खाता (Loans & Borrowings)",
        group: "Loans (Liabilities)",
        type: "Liability",
        debit: 0,
        credit: Math.round(totalUnsecuredLoans)
      });
    }

    // 12. Capital Account
    ledgers.push({
      id: "capital-account",
      code: "3010",
      name: "मालिक पूंजी खाता (Proprietor / Partners Capital)",
      group: "Capital Account (पूंजी खाता)",
      type: "Equity",
      debit: 0,
      credit: Math.round(effectiveOpeningCapital)
    });

    // Calculate totals
    const totalDebit = ledgers.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = ledgers.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

    // Group-wise summary for group toggle
    const groupSummary = {};
    ledgers.forEach(l => {
      if (!groupSummary[l.group]) {
        groupSummary[l.group] = { group: l.group, debit: 0, credit: 0, count: 0 };
      }
      groupSummary[l.group].debit += l.debit;
      groupSummary[l.group].credit += l.credit;
      groupSummary[l.group].count += 1;
    });

    res.json({
      success: true,
      data: {
        asOnDate: new Date().toISOString(),
        filters: { startDate, endDate, fy },
        summary: {
          totalDebit,
          totalCredit,
          difference,
          isBalanced: Math.abs(difference) < 1,
          ledgerCount: ledgers.length
        },
        ledgers,
        groups: Object.values(groupSummary)
      }
    });
  } catch (error) {
    console.error("[getTrialBalance] Error:", error);
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

export const getPartyWiseReport = async (req, res) => {
  try {
    const coFilter = req.companyId 
      ? (mongoose.Types.ObjectId.isValid(req.companyId)
        ? { $in: [req.companyId, new mongoose.Types.ObjectId(req.companyId)] }
        : req.companyId)
      : null;

    const partyQuery = { isDeleted: { $ne: true }, isActive: { $ne: false } };
    const billQuery = { isDeleted: { $ne: true } };
    const purchaseQuery = { isDeleted: { $ne: true } };

    if (coFilter) {
      partyQuery.companyId = coFilter;
      billQuery.companyId = coFilter;
      purchaseQuery.companyId = coFilter;
    }

    const [parties, bills, purchases] = await Promise.all([
      Party.find(partyQuery).lean(),
      Bill.find(billQuery).lean(),
      Purchase.find(purchaseQuery).lean()
    ]);

    const report = parties.map(p => {
      const pIdStr = String(p._id);
      const pNameNorm = String(p.name || p.partyName || "").trim().toLowerCase();

      const partyBills = bills.filter(b => {
        const bPartyId = String(b.partyId || b.customer || "");
        const bPartyName = String(b.customerName || b.partyName || "").trim().toLowerCase();
        return (bPartyId && bPartyId === pIdStr) || (bPartyName && bPartyName === pNameNorm);
      });
      const totalSales = partyBills.reduce((s, b) => s + (Number(b.finalAmount || b.total || 0) || 0), 0);

      const partyPurchases = purchases.filter(pr => {
        const prSuppId = String(pr.supplierId || pr.supplier || "");
        const prSuppName = String(pr.supplierName || pr.supplier || "").trim().toLowerCase();
        return (prSuppId && prSuppId === pIdStr) || (prSuppName && prSuppName === pNameNorm);
      });
      const totalPurchase = partyPurchases.reduce((s, pr) => s + (Number(pr.totalAmount || pr.total || 0) || 0), 0);

      const balance = Number(p.balance !== undefined ? p.balance : (p.currentBalance !== undefined ? p.currentBalance : (p.openingBalance || 0)));

      return {
        _id: p._id,
        partyName: p.name || p.partyName || "Unnamed Party",
        phone: p.mobileNumber || p.phone || "",
        partyType: p.partyType || p.type || "customer",
        address: p.address || "",
        totalPurchase,
        totalSales,
        balance
      };
    });

    res.status(200).json({ success: true, data: report, reports: report });
  } catch (error) {
    console.error("Error in getPartyWiseReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};