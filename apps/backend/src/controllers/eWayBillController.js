import EWayBill from "../model/eWayBill.js";
import Bill from "../model/bill.js";
import { logActivity } from "../utils/logger.js";

export const generateEWayBill = async (req, res) => {
  try {
    const { companyId } = req;
    const { billId, vehicleNumber, isEInvoice = false } = req.body;

    if (!companyId || !billId) return res.status(400).json({ success: false, message: "Missing required fields" });

    const bill = await Bill.findOne({ _id: billId, companyId });
    if (!bill) return res.status(404).json({ success: false, message: "Invoice not found" });

    // Mocking Government API Call Delay & Response
    // Real integration me yahan ClearTax ya NIC API ka HTTP call hoga
    const mockEwbNo = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 12 digit format
    const mockIrn = isEInvoice ? "IRN" + Date.now().toString(16).toUpperCase() + Math.random().toString(16).toUpperCase().substring(2) : null;
    
    const validUpto = new Date();
    validUpto.setDate(validUpto.getDate() + 1); // Mock 1 day validity

    const ewayDoc = new EWayBill({
      companyId,
      billId,
      invoiceNumber: bill.billNumber || bill.billNo,
      ewayBillNumber: mockEwbNo,
      irn: mockIrn,
      validUpto,
      vehicleNumber
    });

    await ewayDoc.save();
    
    // Update status in actual bill (optional)
    await Bill.findByIdAndUpdate(billId, { status: 'issued' });
    await logActivity(req, `Generated E-Way Bill #${mockEwbNo} for Invoice ${bill.billNumber || bill.billNo}`);

    res.status(201).json({ success: true, message: "Successfully generated with Govt Portal!", data: ewayDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEWayBills = async (req, res) => {
  try {
    const docs = await EWayBill.find({ companyId: req.companyId })
      .populate("billId", "customerName totalAmount date")
      .sort({ generatedDate: -1 });
      
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};