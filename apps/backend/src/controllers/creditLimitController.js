import Party from "../model/party.js";
import Bill from "../model/bill.js";
import Company from "../model/company.js";
import { logActivity } from "../utils/activityLogger.js";

// Helper to format Indian currency
const fmtRs = (num) => Number(num || 0).toLocaleString("en-IN");

/**
 * 1. Sanction a Credit Limit line for a party and issue confirmation OTP
 */
export const sanctionCreditLimit = async (req, res) => {
  try {
    const { partyId, creditLimit } = req.body;
    const limitNum = Number(creditLimit);

    if (!partyId) {
      return res.status(400).json({ success: false, message: "कृपया ग्राहक/पार्टी चुनें!" });
    }
    if (!limitNum || limitNum <= 0) {
      return res.status(400).json({ success: false, message: "कृपया ₹0 से अधिक की मान्य क्रेडिट लिमिट दर्ज करें!" });
    }

    const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    if (!party) {
      return res.status(404).json({ success: false, message: "पार्टी नहीं मिली!" });
    }

    const company = await Company.findById(req.companyId);
    const shopName = company?.name || "हमारी फर्म";
    const custPhone = (party.mobileNumber || party.phone || "").replace(/\D/g, "");

    // 4-digit OTP for sanctioning mandate
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    const mandateText = 
`📜 *क्रेडिट लिमिट स्वीकृति वचनपत्र (Credit Line Mandate)*
नमस्ते *${party.name}*,
फर्म: *${shopName}*
स्वीकृत कुल उधारी सीमा: *₹${fmtRs(limitNum)}*

• यह क्रेडिट लाइन आपको नियमित सामान/सेवाएं उधारी पर प्राप्त करने हेतु अधिकृत करती है।
• इस लिमिट को सक्रिय करने हेतु कृपया यह OTP दुकानदार को बताएं:

🔐 *स्वीकृति OTP:* 👉 *[ ${otpCode} ]*

_(नोट: यह OTP दुकानदार को बताना आपकी कानूनी स्वीकृति मानी जाएगी।)_`;

    party.creditLimit = limitNum;
    party.creditLimitOtp = otpCode;
    party.creditLimitOtpExpiresAt = expiresAt;
    party.creditLimitStatus = "PENDING_OTP";
    party.creditLimitAgreementText = mandateText;
    await party.save();

    await logActivity(req, `Generated Credit Limit Sanction OTP for Party ${party.name} (Limit: ₹${limitNum})`);

    // Normal WhatsApp link (works for any merchant without Meta Cloud API)
    const waLink = custPhone 
      ? `https://wa.me/${custPhone.slice(-10)}?text=${encodeURIComponent(mandateText)}`
      : "";

    res.json({
      success: true,
      message: `पार्टी ${party.name} के लिए ₹${fmtRs(limitNum)} की लिमिट का OTP तैयार है।`,
      partyId: party._id,
      partyName: party.name,
      creditLimit: limitNum,
      creditLimitStatus: "PENDING_OTP",
      waLink,
      mandateText,
      customerPhone: custPhone
    });
  } catch (err) {
    console.error("sanctionCreditLimit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Verify Sanction OTP and Activate Credit Limit Line
 */
export const verifyCreditLimitSanction = async (req, res) => {
  try {
    const { partyId, otpCode } = req.body;

    if (!partyId || !otpCode || !String(otpCode).trim()) {
      return res.status(400).json({ success: false, message: "कृपया पार्टी और 4-अंकों का OTP दर्ज करें!" });
    }

    const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    if (!party) {
      return res.status(404).json({ success: false, message: "पार्टी नहीं मिली!" });
    }

    if (!party.creditLimitOtp) {
      return res.status(400).json({ success: false, message: "इस पार्टी के लिए कोई OTP सक्रिय नहीं है।" });
    }

    if (party.creditLimitOtpExpiresAt && new Date() > new Date(party.creditLimitOtpExpiresAt)) {
      return res.status(400).json({ success: false, message: "OTP की समय सीमा समाप्त हो गई है! कृपया नया OTP भेजें।" });
    }

    if (String(party.creditLimitOtp).trim() !== String(otpCode).trim()) {
      return res.status(400).json({ success: false, message: "⚠️ गलत OTP! कृपया ग्राहक द्वारा बताया गया सही 4-अंकों का OTP दर्ज करें।" });
    }

    party.isCreditLimitActive = true;
    party.creditLimitStatus = "ACTIVE";
    party.creditLimitSanctionedAt = new Date();
    party.creditLimitOtp = "";
    party.creditLimitOtpExpiresAt = null;
    party.hasPendingBillApproval = false;
    party.creditLimitLockedReason = "";
    await party.save();

    await logActivity(req, `Activated Credit Limit Line for Party ${party.name} (Limit: ₹${party.creditLimit})`);

    res.json({
      success: true,
      message: `🎉 बधाई! ${party.name} की ₹${fmtRs(party.creditLimit)} की डिजिटल क्रेडिट लाइन सफलतापूर्वक सक्रिय हो गई!`,
      party
    });
  } catch (err) {
    console.error("verifyCreditLimitSanction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Resend Daily Bill Approval WhatsApp Message & OTP
 * Re-uses same valid OTP if within 30 min, or refreshes OTP if expired.
 */
export const resendBillApprovalOtp = async (req, res) => {
  try {
    const { billId, partyId } = req.body;

    let bill = null;
    if (billId) {
      bill = await Bill.findOne({ _id: billId, companyId: req.companyId });
    } else if (partyId) {
      const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
      if (party?.pendingApprovalBillId) {
        bill = await Bill.findOne({ _id: party.pendingApprovalBillId, companyId: req.companyId });
      }
    }

    if (!bill) {
      return res.status(404).json({ success: false, message: "संबंधित पेंडिंग बिल नहीं मिला!" });
    }

    const company = await Company.findById(req.companyId);
    const shopName = company?.name || "हमारी फर्म";

    const party = await Party.findOne({ 
      $or: [
        { _id: bill.partyId },
        { mobileNumber: bill.customerMobile },
        { name: bill.customerName }
      ],
      companyId: req.companyId 
    });

    const isOtpStillValid = bill.otpExpiresAt && new Date() < new Date(bill.otpExpiresAt) && bill.otpCode;
    const effectiveOtp = isOtpStillValid 
      ? bill.otpCode 
      : Math.floor(1000 + Math.random() * 9000).toString();

    if (!isOtpStillValid) {
      bill.otpCode = effectiveOtp;
      bill.otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes fresh
    }

    const curBal = Number(party?.currentBalance || 0);
    const billAmt = Number(bill.finalAmount || bill.total || 0);
    const limit = Number(party?.creditLimit || 0);
    const remaining = Math.max(0, limit - curBal);
    const prevBal = Math.max(0, curBal - billAmt);

    const custName = (bill.customerName || party?.name || "ग्राहक").trim();
    const custPhone = (bill.customerMobile || party?.mobileNumber || "").replace(/\D/g, "");

    const dailyBreakdownText = 
`📋 *दैनिक उधारी बिल व खाता स्वीकृति (Credit Line Statement)*
नमस्ते *${custName}*,
फर्म: *${shopName}*
बिल संख्या: *${bill.billNumber}*

• आज का बिल: *₹${fmtRs(billAmt)}*
• पिछला बकाया: *₹${fmtRs(prevBal)}*
• अब तक कुल बकाया: *₹${fmtRs(curBal)}*
• स्वीकृत क्रेडिट लिमिट: *₹${fmtRs(limit)}*
• बची हुई उपलब्ध लिमिट: *₹${fmtRs(remaining)}*

🔐 *बिल स्वीकृति एवं डिलीवरी OTP:*
👉 *[ ${effectiveOtp} ]*

_(कृपया यह OTP दुकानदार को बताकर बिल स्वीकृत करें। स्वीकृति के बाद ही आपकी शेष ₹${fmtRs(remaining)} की लिमिट सक्रिय रहेगी।)_`;

    bill.legalAgreementText = dailyBreakdownText;
    await bill.save();

    // Normal WhatsApp link
    const waLink = custPhone 
      ? `https://wa.me/${custPhone.slice(-10)}?text=${encodeURIComponent(dailyBreakdownText)}`
      : "";

    res.json({
      success: true,
      message: isOtpStillValid 
        ? "मौजूदा मान्य OTP व दैनिक हिसाब पुनः तैयार है।" 
        : "नया ताज़ा OTP व दैनिक हिसाब तैयार है।",
      billNumber: bill.billNumber,
      customerName: custName,
      customerPhone: custPhone,
      waLink,
      statementText: dailyBreakdownText,
      otpReused: isOtpStillValid
    });
  } catch (err) {
    console.error("resendBillApprovalOtp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Manual Unlock / Emergency Bypass by Shopkeeper ("काम न रुके")
 */
export const unlockCreditLimit = async (req, res) => {
  try {
    const { partyId, billId, reason } = req.body;

    const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    if (!party) {
      return res.status(404).json({ success: false, message: "पार्टी नहीं मिली!" });
    }

    party.hasPendingBillApproval = false;
    party.creditLimitStatus = "ACTIVE";
    party.creditLimitLockedReason = reason || "दुकानदार द्वारा मैन्युअल अनलॉक (काम न रुके)";
    await party.save();

    if (billId) {
      await Bill.findOneAndUpdate(
        { _id: billId, companyId: req.companyId },
        { 
          handoverStatus: "BYPASSED", 
          isOwnerBypassed: true,
          updatedAt: new Date() 
        }
      );
    }

    await logActivity(req, `Manually Unlocked Credit Limit for Party ${party.name} (Reason: ${reason || 'Owner Override'})`);

    res.json({
      success: true,
      message: `🔓 पार्टी ${party.name} की क्रेडिट लाइन सफलतापूर्वक अनलॉक कर दी गई है! आगे का बिल तुरंत बनाया जा सकता है।`,
      party
    });
  } catch (err) {
    console.error("unlockCreditLimit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Get List of all Credit Limit Accounts with Live Stats
 */
export const getCreditLimitParties = async (req, res) => {
  try {
    const parties = await Party.find({
      companyId: req.companyId,
      $or: [
        { isCreditLimitActive: true },
        { creditLimit: { $gt: 0 } },
        { creditLimitStatus: { $in: ["ACTIVE", "PENDING_OTP", "LOCKED"] } }
      ]
    }).populate("pendingApprovalBillId", "billNumber finalAmount total createdAt handoverStatus").sort({ updatedAt: -1 });

    const enriched = parties.map(p => {
      const limit = Number(p.creditLimit || 0);
      const used = Number(p.currentBalance || 0);
      const available = Math.max(0, limit - used);
      const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

      return {
        _id: p._id,
        id: p._id,
        name: p.name,
        mobileNumber: p.mobileNumber || p.phone,
        address: p.address,
        creditLimit: limit,
        usedBalance: used,
        availableLimit: available,
        usagePercent,
        creditLimitStatus: p.creditLimitStatus || (p.isCreditLimitActive ? "ACTIVE" : "INACTIVE"),
        isCreditLimitActive: Boolean(p.isCreditLimitActive),
        hasPendingBillApproval: Boolean(p.hasPendingBillApproval),
        pendingApprovalBill: p.pendingApprovalBillId || null,
        creditLimitLockedReason: p.creditLimitLockedReason || "",
        sanctionedAt: p.creditLimitSanctionedAt
      };
    });

    res.json({
      success: true,
      totalCreditLineParties: enriched.length,
      parties: enriched
    });
  } catch (err) {
    console.error("getCreditLimitParties error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
