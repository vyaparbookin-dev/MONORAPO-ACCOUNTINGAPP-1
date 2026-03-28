import Report from "../model/report.js";
import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Expance from "../model/expance.js";
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

export const getProfitLoss = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const bills = await Bill.find({ companyId: req.companyId, isDeleted: false });
    const expenses = await Expance.find({ companyId: req.companyId, isDeleted: false });
    
    const totalSales = bills.reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const totalPurchase = 0; // Future purchase logic can be added here
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const netProfit = totalSales - totalPurchase - totalExpenses;
    
    res.json({ success: true, data: { totalSales, totalPurchase, totalExpenses, netProfit } });
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

    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);

    // 1. Sales Trend (Last 7 Days) - Line/Bar Chart ke liye
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesTrend = await Bill.aggregate([
      { $match: { companyId: companyObjectId, isDeleted: false, date: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: { $ifNull: ["$finalAmount", "$total"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Top 5 Selling Products - Pie Chart/Donut Chart ke liye
    const topProducts = await Bill.aggregate([
      { $match: { companyId: companyObjectId, isDeleted: false } },
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
      { $match: { companyId: companyObjectId, isDeleted: false, siteName: { $exists: true, $ne: "" } } },
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