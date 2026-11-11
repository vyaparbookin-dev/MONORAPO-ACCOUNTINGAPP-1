import express from "express";
import Bill from "../model/bill.js";
import Company from "../model/company.js";
import {
  initWhatsAppSession,
  getWhatsAppStatus,
  disconnectWhatsApp,
  sendDirectWhatsAppMessage
} from "../services/whatsappQrService.js";

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Get live WhatsApp connection status & QR code for the current company
 */
router.get("/status", async (req, res) => {
  try {
    const status = getWhatsAppStatus(req.companyId);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/start-session
 * Initialize session and generate QR Code for scanning
 */
router.post("/start-session", async (req, res) => {
  try {
    const forceNew = Boolean(req.body.forceNew);
    const result = await initWhatsAppSession(req.companyId, forceNew);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect and logout current company's WhatsApp session
 */
router.post("/disconnect", async (req, res) => {
  try {
    const result = await disconnectWhatsApp(req.companyId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/send-direct
 * Send any custom message directly to customer's WhatsApp in background
 */
router.post("/send-direct", async (req, res) => {
  try {
    const { toMobile, messageText } = req.body;
    if (!toMobile || !messageText) {
      return res.status(400).json({ success: false, message: "मोबाइल नंबर और संदेश आवश्यक हैं!" });
    }

    const sendRes = await sendDirectWhatsAppMessage(req.companyId, toMobile, messageText);
    if (!sendRes.success) {
      return res.status(sendRes.isQrRequired ? 428 : 400).json(sendRes);
    }

    res.json(sendRes);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/send-invoice
 * Send invoice & payment link to customer
 * Automatically sends via background QR engine if connected!
 */
router.post("/send-invoice", async (req, res) => {
  try {
    const { billId, mobileNumber, customText } = req.body;
    
    const bill = await Bill.findById(billId);
    const company = await Company.findById(req.companyId);
    
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    const targetMobile = mobileNumber || bill.customerMobile || bill.customerPhone || bill.phone;

    // Generate Payment Link (Format: upi://pay?pa=...)
    const paymentLink = company?.upiId ? `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.name)}&am=${bill.finalAmount}&cu=INR` : '';

    let message = customText || `नमस्ते ${bill.customerName || 'ग्राहक जी'},\n\n${company?.name || 'हमारी दुकान'} से आपका इनवॉइस #${bill.billNumber || bill.invoiceNumber} तैयार है।\nकुल देय राशि: ₹${bill.finalAmount}\n\n${paymentLink ? `💳 इस लिंक से तुरंत भुगतान करें:\n${paymentLink}\n\n` : ''}`;

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

    message += `हमारे साथ व्यापार करने के लिए धन्यवाद!\n-${company?.name || 'दुकानदार'}`;

    // Check if WhatsApp Engine is connected for background sending
    const status = getWhatsAppStatus(req.companyId);
    let sentDirectly = false;

    if (status.isConnected && targetMobile) {
      const sendRes = await sendDirectWhatsAppMessage(req.companyId, targetMobile, message);
      if (sendRes.success) {
        sentDirectly = true;
      }
    }

    res.json({
      success: true,
      sentDirectly,
      message: sentDirectly 
        ? `✅ बिल बैकग्राउंड में WhatsApp पर सफलतापूर्वक भेज दिया गया!`
        : "WhatsApp संदेश तैयार है!",
      preview: message,
      targetMobile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
