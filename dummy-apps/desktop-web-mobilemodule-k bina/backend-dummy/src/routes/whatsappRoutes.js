import express from "express";
import Bill from "../model/bill.js";
import Company from "../model/company.js";

const router = express.Router();

// Send WhatsApp Message (Invoice & Payment Link)
router.post("/send-invoice", async (req, res) => {
  try {
    const { billId, mobileNumber } = req.body;
    
    const bill = await Bill.findById(billId);
    const company = await Company.findById(req.companyId);
    
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Generate Payment Link (Format: upi://pay?pa=...)
    const paymentLink = company?.upiId ? `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.name)}&am=${bill.finalAmount}&cu=INR` : '';

    const message = `Hello ${bill.customerName},\n\nHere is your invoice #${bill.billNumber} from ${company.name}.\nTotal Amount: ₹${bill.finalAmount}\n\n${paymentLink ? `Pay exactly ₹${bill.finalAmount} using this link: ${paymentLink}\n\n` : ''}Thank you for your business!`;

    // FUTURE: Yahan par Cloud API (Wati / Twilio / Meta) call aayega real message bhejne ke liye
    console.log(`📲 [WHATSAPP PREVIEW] To: ${mobileNumber}\nMessage:\n${message}`);
    
    res.json({ success: true, message: "WhatsApp message triggered successfully!", preview: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;