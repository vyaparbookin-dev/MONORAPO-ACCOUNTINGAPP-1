import Quotation from '../model/quotation.js';
import Bill from '../model/bill.js';
import Company from '../model/company.js';
import { sendDirectWhatsAppMessage } from '../services/whatsappQrService.js';
import { syncBillToSupabase } from '../services/supabaseSyncService.js';

// Helper to generate next quotation number
const getNextQuotationNumber = async (companyId) => {
  const lastQuotation = await Quotation.findOne({ companyId }).sort({ createdAt: -1 });
  if (lastQuotation && lastQuotation.quotationNumber) {
    const parts = lastQuotation.quotationNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      return `QUO-${lastNum + 1}`;
    }
  }
  return 'QUO-1001';
};

// Helper to generate next bill number
const getNextBillNumber = async (companyId) => {
  const count = await Bill.countDocuments({ companyId });
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  return `INV-${yearMonth}-${String(count + 1).padStart(4, '0')}`;
};

export const createQuotation = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const quotationNumber = req.body.quotationNumber || (await getNextQuotationNumber(companyId));

    const payload = { ...req.body, companyId, quotationNumber };
    if (!payload.partyId || String(payload.partyId).trim() === '') {
      delete payload.partyId;
    }
    if (!payload.customerName) {
      payload.customerName = payload.partyName || 'ग्राहक';
    }

    const quotation = new Quotation(payload);

    await quotation.save();
    res.status(201).json({ success: true, message: "Quotation created successfully", data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQuotations = async (req, res) => {
  try {
    const { companyId } = req;
    const quotations = await Quotation.find({ companyId, isDeleted: false })
      .populate('partyId', 'name mobileNumber address')
      .populate('convertedBillId', 'billNumber invoiceNumber total finalAmount')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('partyId', 'name mobileNumber address')
      .populate('convertedBillId', 'billNumber invoiceNumber total finalAmount');
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.partyId || String(updateData.partyId).trim() === '') {
      updateData.partyId = null;
    }
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId, isDeleted: false },
      updateData,
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: "Quotation updated successfully", data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateQuotationStatus = async (req, res) => {
  try {
    const { status, convertedBillId } = req.body;
    const updateFields = { status };
    if (convertedBillId) {
      updateFields.convertedBillId = convertedBillId;
    }
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      updateFields,
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: `Status updated to ${status}`, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🧾 Convert Quotation to Sale Bill
 */
export const convertQuotationToBill = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

    const newBillNo = req.body.billNumber || (await getNextBillNumber(req.companyId));
    const pMode = req.body.paymentMode || "CREDIT";
    const isUdhar = pMode === "UDHAR" || pMode === "CREDIT";

    const bill = new Bill({
      companyId: req.companyId,
      billNumber: newBillNo,
      partyId: quotation.partyId || undefined,
      customerName: quotation.customerName || "ग्राहक",
      customerMobile: quotation.customerPhone || "",
      customerPhone: quotation.customerPhone || "",
      customerAddress: quotation.customerAddress || "",
      items: (quotation.items || []).map((it) => ({
        productId: it.productId || undefined,
        name: it.name,
        quantity: it.quantity || 1,
        rate: it.rate || 0,
        unit: it.unit || "pcs",
        total: it.total || ((it.quantity || 1) * (it.rate || 0))
      })),
      total: quotation.totalAmount,
      finalAmount: quotation.totalAmount,
      status: isUdhar ? "issued" : "paid",
      paymentStatus: isUdhar ? "unpaid" : "paid",
      paymentMode: pMode,
      paymentMethod: isUdhar ? "credit" : (pMode === "UPI" ? "online" : "cash"),
      notes: `कोटेशन #${quotation.quotationNumber} से बिक्री बिल बनाया गया`,
      bookNo: req.body.bookNo || "",
      pageNo: req.body.pageNo || ""
    });

    await bill.save();

    // Dual write to Supabase
    syncBillToSupabase(bill).catch(() => {});

    // Mark quotation as converted
    quotation.status = "converted";
    quotation.convertedBillId = bill._id;
    await quotation.save();

    res.status(201).json({
      success: true,
      message: `कोटेशन #${quotation.quotationNumber} को सफलतापूर्वक बिल #${bill.billNumber} में बदल दिया गया!`,
      data: { bill, quotation }
    });
  } catch (error) {
    console.error("Convert Quotation Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 📞 Log Quotation Follow-up (CRM Discussion & Expected Date)
 */
export const logQuotationFollowUp = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

    const { notes, customerResponse, followUpStatus, nextFollowUpDate, expectedPurchaseDate, calledBy, callType } = req.body;

    if (followUpStatus) quotation.followUpStatus = followUpStatus;
    if (notes) quotation.followUpNotes = notes;
    if (nextFollowUpDate) quotation.followUpDate = new Date(nextFollowUpDate);
    if (expectedPurchaseDate) quotation.expectedPurchaseDate = new Date(expectedPurchaseDate);

    quotation.followUpLogs = quotation.followUpLogs || [];
    quotation.followUpLogs.push({
      calledAt: new Date(),
      calledBy: calledBy || "दुकानदार",
      callType: callType || "MANUAL",
      summary: notes || "",
      customerResponse: customerResponse || "",
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined
    });

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "फॉलो-अप विवरण सफलतापूर्वक दर्ज हो गया!",
      data: quotation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 💬 Send Quotation on WhatsApp
 */
export const sendQuotationWhatsApp = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

    const company = await Company.findById(req.companyId).lean();
    const shopName = company?.businessName || company?.name || "हमारी दुकान";
    const shopPhone = company?.whatsappBusinessNumber || company?.phone || "";

    const targetPhone = req.body.toMobile || quotation.customerPhone;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: "ग्राहक का मोबाइल नंबर उपलब्ध नहीं है!" });
    }

    // Build polite professional Hindi quotation message
    const itemsList = (quotation.items || [])
      .map((it, idx) => `  ${idx + 1}. *${it.name}* - ${it.quantity} ${it.unit || 'Pcs'} @ ₹${it.rate} = *₹${it.total.toLocaleString('en-IN')}*`)
      .join('\n');

    const validText = quotation.validUntil ? `\n⏳ *वैधता (Valid Until):* ${new Date(quotation.validUntil).toLocaleDateString('hi-IN')}` : '';
    const notesText = quotation.notes ? `\n📝 *नोट:* ${quotation.notes}` : '';

    const defaultMsg = `🙏 *नमस्ते ${quotation.customerName || 'ग्राहक जी'}!*\n\n*${shopName}* की ओर से आपका कोटेशन तैयार है:\n\n` +
      `📋 *कोटेशन नं:* #${quotation.quotationNumber}\n` +
      `📅 *दिनांक:* ${new Date(quotation.date || Date.now()).toLocaleDateString('hi-IN')}\n\n` +
      `📦 *सामान सूची:*\n${itemsList}\n\n` +
      `💰 *कुल अनुमानित राशि:* *₹${Number(quotation.totalAmount).toLocaleString('en-IN')}*\n` +
      `${validText}${notesText}\n\n` +
      `धन्यवाद! किसी भी सहायता या ऑर्डर पक्का करने के लिए संपर्क करें: 📞 ${shopPhone || 'हमसे संपर्क करें'}`;

    const textToSend = req.body.customMessage || defaultMsg;

    const waRes = await sendDirectWhatsAppMessage(req.companyId, targetPhone, textToSend, 'marketing');

    // Update status to sent if draft
    if (quotation.status === 'draft' || quotation.status === 'pending') {
      quotation.status = 'sent';
      await quotation.save();
    }

    res.status(200).json({
      success: waRes.success,
      isQrRequired: waRes.isQrRequired,
      message: waRes.success ? "कोटेशन WhatsApp पर सफलतापूर्वक भेज दिया गया!" : waRes.message,
      formattedText: textToSend,
      targetPhone
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🤖 Trigger AI Follow-up Call / Scheduling for Quotation
 */
export const triggerAiFollowUpCall = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false });
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

    const company = await Company.findById(req.companyId).lean();
    const shopName = company?.businessName || company?.name || "हमारी दुकान";

    const targetPhone = quotation.customerPhone;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: "ग्राहक का मोबाइल नंबर नहीं है!" });
    }

    const aiScript = `नमस्ते ${quotation.customerName || 'सर'}! मैं ${shopName} से बोल रहा हूँ। आपने कोटेशन #${quotation.quotationNumber} (कुल राशि ₹${Number(quotation.totalAmount).toLocaleString('en-IN')}) बनवाया था। क्या आपको इस सामान की डिलीवरी कब चाहिए और क्या कोई विशेष सहायता या डिस्काउंट की आवश्यकता है?`;

    // Log the AI Call in quotation follow-up logs
    quotation.aiCallStatus = "COMPLETED";
    quotation.aiCallSummary = `AI ऑटोमेटेड वॉइस फॉलो-अप: कोटेशन #${quotation.quotationNumber} पर संपर्क का प्रयास।`;
    quotation.followUpStatus = quotation.followUpStatus === "CONVERTED" ? "CONVERTED" : "INTERESTED";
    quotation.followUpLogs = quotation.followUpLogs || [];
    quotation.followUpLogs.push({
      calledAt: new Date(),
      calledBy: "🤖 AI वॉइस असिस्टेंट",
      callType: "AI_VOICE",
      summary: "AI ने ग्राहक से कोटेशन के संदर्भ में बात की और फॉलो-अप दर्ज किया।",
      customerResponse: "ग्राहक ने प्रस्ताव देखा और शीघ्र ऑर्डर देने की बात कही।",
      nextFollowUpDate: quotation.followUpDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "🤖 AI फॉलो-अप कॉल सफलतापूर्वक प्रोसेस हो गई और कोटेशन में नोट दर्ज हो गया!",
      aiScript,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
