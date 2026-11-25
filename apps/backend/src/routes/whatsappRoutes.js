import express from "express";
import Bill from "../model/bill.js";
import Company from "../model/company.js";
import WhatsAppMessageLog from "../model/whatsappMessageLog.js";
import {
  initWhatsAppSession,
  getWhatsAppStatus,
  disconnectWhatsApp,
  sendDirectWhatsAppMessage
} from "../services/whatsappQrService.js";

const router = express.Router();

// 🏢 Resolve companyId from header x-company-id, query, or body
router.use((req, res, next) => {
  let cid = req.headers['x-company-id'] || req.query.companyId || req.body?.companyId;
  if (cid && typeof cid === 'string' && cid.trim() && cid !== 'undefined' && cid !== 'null') {
    req.companyId = cid.trim();
  }
  next();
});

/**
 * GET /api/whatsapp/status
 * Get live WhatsApp connection status & QR code for the current company
 * Optional query param: ?channel=billing|recovery|marketing
 */
router.get("/status", async (req, res) => {
  try {
    const channel = req.query.channel || null;
    const status = getWhatsAppStatus(req.companyId, channel);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/start-session
 * Initialize session and generate QR Code for scanning
 * Body: { channel?: 'billing'|'recovery'|'marketing', forceNew?: boolean }
 */
router.post("/start-session", async (req, res) => {
  try {
    const channel = req.body.channel || 'billing';
    const forceNew = Boolean(req.body.forceNew);
    const result = await initWhatsAppSession(req.companyId, channel, forceNew);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect and logout company's WhatsApp session for a specific channel
 * Body: { channel?: 'billing'|'recovery'|'marketing' }
 */
router.post("/disconnect", async (req, res) => {
  try {
    const channel = req.body.channel || 'billing';
    const result = await disconnectWhatsApp(req.companyId, channel);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/send-direct
 * Send any custom message directly to customer's WhatsApp in background with complete audit trail
 * Body: { toMobile, messageText, channel, recipientName, messageType, documentId, documentNumber, sentByUserId, sentByUserName }
 */
router.post("/send-direct", async (req, res) => {
  try {
    const { 
      toMobile, 
      messageText, 
      channel = 'billing',
      recipientName,
      messageType,
      documentId,
      documentNumber,
      sentByUserId,
      sentByUserName
    } = req.body;

    if (!toMobile || !messageText) {
      return res.status(400).json({ success: false, message: "मोबाइल नंबर और संदेश आवश्यक हैं!" });
    }

    const metadata = {
      recipientName: recipientName || req.body.customerName || 'ग्राहक',
      messageType: messageType || (channel === 'marketing' ? 'marketing' : channel === 'recovery' ? 'recovery' : 'direct'),
      documentId: documentId || '',
      documentNumber: documentNumber || '',
      sentByUserId: sentByUserId || req.user?._id || '',
      sentByUserName: sentByUserName || req.user?.name || req.user?.email || 'व्यापारी'
    };

    const sendRes = await sendDirectWhatsAppMessage(req.companyId, toMobile, messageText, channel, metadata);
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
 * Send invoice & payment link to customer via billing channel
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

    // Check if WhatsApp Billing Engine is connected for background sending
    const status = getWhatsAppStatus(req.companyId, 'billing');
    let sentDirectly = false;

    if (status.isConnected && targetMobile) {
      const invoiceMetadata = {
        recipientName: bill.customerName || 'ग्राहक',
        messageType: 'invoice',
        documentId: String(bill._id || bill.id || ''),
        documentNumber: String(bill.billNumber || bill.invoiceNumber || ''),
        sentByUserId: req.user?._id || '',
        sentByUserName: req.user?.name || req.user?.email || 'व्यापारी'
      };
      const sendRes = await sendDirectWhatsAppMessage(req.companyId, targetMobile, message, 'billing', invoiceMetadata);
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


/**
 * GET /api/whatsapp/logs
 * Retrieve paginated WhatsApp audit trail & message history for company
 */
router.get("/logs", async (req, res) => {
  try {
    const { 
      channel, 
      messageType, 
      status, 
      search, 
      phone, 
      page = 1, 
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const query = { companyId: String(req.companyId || "default_shop").trim() };

    if (channel && channel !== 'all') {
      query.channel = channel.toLowerCase();
    }
    if (messageType && messageType !== 'all') {
      query.messageType = messageType.toLowerCase();
    }
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone) query.recipientPhone = cleanPhone;
    }
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { recipientName: { $regex: s, $options: 'i' } },
        { recipientPhone: { $regex: s, $options: 'i' } },
        { documentNumber: { $regex: s, $options: 'i' } },
        { sentByUserName: { $regex: s, $options: 'i' } },
        { messageText: { $regex: s, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.sentAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, logs] = await Promise.all([
      WhatsAppMessageLog.countDocuments(query),
      WhatsAppMessageLog.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      logs,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/whatsapp/logs/stats
 * Aggregate overview of messages sent, failure rate, and category distribution
 */
router.get("/logs/stats", async (req, res) => {
  try {
    const coId = String(req.companyId || "default_shop").trim();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalSent, totalFailed, todaySent, typeStats] = await Promise.all([
      WhatsAppMessageLog.countDocuments({ companyId: coId, status: 'SENT' }),
      WhatsAppMessageLog.countDocuments({ companyId: coId, status: 'FAILED' }),
      WhatsAppMessageLog.countDocuments({ companyId: coId, status: 'SENT', sentAt: { $gte: todayStart } }),
      WhatsAppMessageLog.aggregate([
        { $match: { companyId: coId } },
        { $group: { _id: "$messageType", count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalSent,
        totalFailed,
        todaySent,
        byType: typeStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
