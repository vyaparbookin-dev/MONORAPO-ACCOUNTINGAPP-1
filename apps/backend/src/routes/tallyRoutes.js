import express from "express";
import Bill from "../model/bill.js";
import Company from "../model/company.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Generate Tally XML for a specific date
router.get("/export", protect, async (req, res) => {
  try {
    const { date } = req.query;
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Abhi ke liye hum sirf Sales (Bills) export kar rahe hain, aage isme Purchases aur Expenses bhi add kar sakte hain
    const bills = await Bill.find({
      companyId: req.companyId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    const company = await Company.findById(req.companyId);

    // Standard Tally XML Envelope
    let xml = `<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n        <STATICVARIABLES>\n          <SVCURRENTCOMPANY>${company?.name || 'My Company'}</SVCURRENTCOMPANY>\n        </STATICVARIABLES>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

    bills.forEach((bill) => {
      // Format date as YYYYMMDD for Tally
      const formattedDate = new Date(bill.date || bill.createdAt).toISOString().split('T')[0].replace(/-/g, '');
      
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${bill.billNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${bill.customerName || 'Cash'}</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${bill.customerName || 'Cash'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${bill.finalAmount || bill.totalAmount || 0}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales A/c</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${bill.finalAmount || bill.totalAmount || 0}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>\n`;
    });

    xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;

    res.header('Content-Type', 'application/xml');
    res.attachment(`Tally_Daybook_${date}.xml`);
    return res.send(xml);
  } catch (error) {
    console.error("Tally Export Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;