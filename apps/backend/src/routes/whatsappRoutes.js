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

    let message = `नमस्ते ${bill.customerName},\n\n${company.name} से आपका इनवॉइस #${bill.billNumber} तैयार है।\nकुल देय राशि: ₹${bill.finalAmount}\n\n${paymentLink ? `💳 इस लिंक से तुरंत भुगतान करें:\n${paymentLink}\n\n` : ''}`;

    // 🌐 Social Media, Google Review & Reward Coupon Links
    const socialLines = [];
    if (company?.googleReviewUrl) {
      socialLines.push(`⭐ हमें Google पर 5-स्टार रेटिंग दें:\n${company.googleReviewUrl}`);
    }
    if (company?.instagramUrl) {
      socialLines.push(`📸 Instagram पर फॉलो करें: ${company.instagramUrl}`);
    }
    if (company?.facebookUrl) {
      socialLines.push(`📘 Facebook पर लाइक करें: ${company.facebookUrl}`);
    }
    if (company?.youtubeUrl) {
      socialLines.push(`▶️ YouTube सब्सक्राइब करें: ${company.youtubeUrl}`);
    }
    if (company?.reviewRewardCouponCode) {
      socialLines.push(`🎁 5⭐ रिव्यू देने पर अगले बिल के लिए कूपन: *${company.reviewRewardCouponCode}* (${company.reviewRewardCouponDiscount || 10}% OFF)`);
    }

    if (socialLines.length > 0) {
      message += `-----------------------------\n${socialLines.join('\n\n')}\n-----------------------------\n\n`;
    }

    message += `हमारे साथ व्यापार करने के लिए धन्यवाद!\n-${company.name}`;

    console.log(`📲 [WHATSAPP PREVIEW] To: ${mobileNumber}\nMessage:\n${message}`);
    
    res.json({ success: true, message: "WhatsApp message triggered successfully!", preview: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;