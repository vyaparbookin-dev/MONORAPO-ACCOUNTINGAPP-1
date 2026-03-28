import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import Party from "../model/party.js";
import axios from "axios";

export const getGstReport = async (req, res) => {
  try {
    const { companyId } = req;
    const { month, year } = req.query; // Client can pass specific month/year

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const filterDate = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filterDate.date = { $gte: startDate, $lte: endDate };
    }

    // 1. Fetch Sales (For GSTR-1)
    const sales = await Bill.find({ companyId, ...filterDate, isDeleted: false }).populate("partyId", "gstNumber");
    
    let gstr1 = { b2b: [], b2c: [], totalTaxable: 0, totalGst: 0 };
    
    sales.forEach(bill => {
      const isB2B = bill.partyId && bill.partyId.gstNumber && bill.partyId.gstNumber.trim() !== "";
      const taxable = bill.totalAmount || 0;
      const gst = (bill.finalAmount || 0) - taxable;
      
      gstr1.totalTaxable += taxable;
      gstr1.totalGst += gst;

      const record = {
        invoiceNo: bill.billNumber,
        date: bill.date,
        customer: bill.customerName,
        gstin: isB2B ? bill.partyId.gstNumber : "N/A",
        taxableValue: taxable,
        gstAmount: gst,
        totalValue: bill.finalAmount
      };

      if (isB2B) gstr1.b2b.push(record);
      else gstr1.b2c.push(record);
    });

    // 2. Fetch Purchases (For GSTR-2)
    const purchases = await Purchase.find({ companyId, ...filterDate, isDeleted: false }).populate("partyId", "name gstNumber");
    
    let gstr2 = { b2b: [], totalTaxable: 0, totalGst: 0 };

    purchases.forEach(pur => {
      const taxable = pur.totalAmount || 0;
      const gst = (pur.finalAmount || 0) - taxable;
      
      gstr2.totalTaxable += taxable;
      gstr2.totalGst += gst;

      gstr2.b2b.push({
        invoiceNo: pur.purchaseNumber,
        date: pur.date,
        supplier: pur.supplierName,
        gstin: pur.partyId?.gstNumber || "N/A",
        taxableValue: taxable,
        gstAmount: gst,
        totalValue: pur.finalAmount
      });
    });

    // 3. GSTR-3B Summary
    const gstr3b = {
      outwardTaxable: gstr1.totalTaxable,
      outwardGst: gstr1.totalGst, // Liability
      inwardTaxable: gstr2.totalTaxable,
      inwardGst: gstr2.totalGst, // ITC (Input Tax Credit)
      netGstPayable: gstr1.totalGst - gstr2.totalGst
    };

    res.status(200).json({ success: true, data: { gstr1, gstr2, gstr3b } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyGstin = async (req, res) => {
  try {
    const { gstin } = req.body;
    // Note: To make this work, you need to buy an API key from Sandbox API or ClearTax
    // const response = await axios.get(`https://api.sandbox.co.in/gsp/gstin/${gstin}`, { headers: { "Authorization": "YOUR_API_KEY" }});
    res.status(200).json({ success: true, message: "GST Verification API is ready. Requires Sandbox/ClearTax API Key to fetch real data.", mockStatus: "Active" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};