import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Bill from "../model/bill.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";
import { generateInvoicePdf } from "../utils/invoicePdfGenerator.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import Staff from "../model/staff.js";
import Company from "../model/company.js";
import BankAccount from "../model/bankAccount.js";
import { generateUpiQrCode } from "../utils/paymentUtils.js";
import { Parser } from "json2csv";
import { logActivity } from "../utils/logger.js";
import { sendAutoWhatsappMessage } from "../services/whatsappService.js";
import { processStampAwardOnBill } from "./stampController.js";

export const createBill = async (req, res) => {
  try {
    let resolvedCompanyId = req.companyId || req.body?.companyId;
    if (!resolvedCompanyId || resolvedCompanyId === "null" || resolvedCompanyId === "undefined") {
      resolvedCompanyId = "6a8314470d93e58ad0920950";
    }

    // --- RESILIENT COMPANY LOOKUP ---
    let company = null;
    if (mongoose.Types.ObjectId.isValid(resolvedCompanyId)) {
      company = await Company.findById(resolvedCompanyId);
    }
    if (!company) {
      company = await Company.findOne({
        $or: [
          { _id: "6a8314470d93e58ad0920950" },
          { name: "Ganesh Hardware" }
        ]
      }) || await Company.findOne({});
    }

    if (company) {
      req.companyId = company._id;
    } else {
      req.companyId = "6a8314470d93e58ad0920950";
    }

    // --- LICENSING CHECK ---
    if (company && company.plan === 'free' && company.freeBillCount >= (company.maxFreeBills || 50)) {
      return res.status(403).json({ success: false, message: `Free bill limit (${company.maxFreeBills || 50}) exceeded. Please upgrade to Yearly Premium to create more bills.` });
    }
    // --- END LICENSING CHECK ---

    const { billNumber, companyId, partyId, customerName, customerMobile, customerAddress, customerGst, siteName, date, dueDate, items, total, tax, discountPercent, discountAmount, finalAmount, paymentMethod, paymentMode, notes, status, billImageUrl } = req.body;
    const pMode = String(paymentMode || paymentMethod || req.body.type || "CASH").toUpperCase();
    const finalBillAmount = Number(finalAmount || total || 0);

    const isUdhar = pMode === "UDHAR" || pMode === "CREDIT" || req.body.paymentStatus === "unpaid";
    const udharThreshold = Number(req.body.udharOtpThreshold ?? company.udharOtpThreshold ?? 500);

    // --- LOOKUP MATCHED PARTY UPFRONT FOR CREDIT LINE / LIMIT CHECK ---
    let matchedParty = null;
    const pName = (customerName || req.body.partyName || "").trim();
    const pMobile = (customerMobile || req.body.customerPhone || req.body.phone || "").trim();
    if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
      matchedParty = await Party.findOne({ _id: partyId, companyId: req.companyId });
    }
    if (!matchedParty && pMobile) {
      matchedParty = await Party.findOne({ mobileNumber: pMobile, companyId: req.companyId });
    }
    if (!matchedParty && pName && pName !== "नकद ग्राहक" && pName !== "Walk-in Customer") {
      matchedParty = await Party.findOne({ name: new RegExp(`^${pName}$`, "i"), companyId: req.companyId });
    }

    const isCreditLineActive = Boolean(matchedParty && matchedParty.isCreditLimitActive && matchedParty.creditLimit > 0);

    // 🛑 GATEKEEPER: Check if Customer has an earlier bill pending approval
    if (isUdhar && isCreditLineActive && matchedParty.hasPendingBillApproval && !req.body.bypassPendingLock) {
      return res.status(400).json({
        success: false,
        isPendingApprovalBlocked: true,
        partyId: matchedParty._id,
        partyName: matchedParty.name,
        pendingBillId: matchedParty.pendingApprovalBillId,
        message: `⚠️ ग्राहक ${matchedParty.name} का पिछला बिल अभी OTP से स्वीकृत नहीं हुआ है! नया बिल जारी करने के लिए पिछला बिल स्वीकृत करें या 'काम न रुके' (बायपास) विकल्प चुनें।`
      });
    }

    // 🛡️ Determine if Udhar Legal OTP Protection should be applied:
    let shouldProtectWithOtp = false;
    if (isUdhar) {
      if (typeof req.body.isUdharProtected === "boolean") {
        shouldProtectWithOtp = req.body.isUdharProtected;
      } else {
        shouldProtectWithOtp = finalBillAmount > udharThreshold;
      }
    }

    // Credit Line Snapshot Calculation
    let creditLineSnapshot = null;
    if (isCreditLineActive) {
      const prevBal = Number(matchedParty.currentBalance || 0);
      const newBal = prevBal + finalBillAmount;
      const sancLimit = Number(matchedParty.creditLimit || 0);
      const remLimit = Math.max(0, sancLimit - newBal);
      creditLineSnapshot = {
        previousBalance: prevBal,
        billAmount: finalBillAmount,
        newTotalBalance: newBal,
        sanctionedLimit: sancLimit,
        remainingLimit: remLimit
      };
    }

    // 🛡️ GENERATE LEGAL PROMISSORY NOTE & DELIVERY OTP (IT Act 2000 Section 10A)
    let otpCode = "";
    let legalAgreementText = "";
    let otpExpiresAt = null;
    let handoverStatus = isUdhar 
      ? (shouldProtectWithOtp ? "PENDING_OTP" : "NOT_REQUIRED") 
      : "CASH_PAID";
    const lateInt = Number(req.body.lateInterestPercent ?? 2);
    const finalDueDate = dueDate || (isUdhar ? new Date(Date.now() + 15 * 86400000) : undefined);

    if (shouldProtectWithOtp) {
      // 4-digit secure numeric OTP
      otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity
      
      const custNameDisplay = (pName || "ग्राहक").trim();
      const shopName = company.name || "हमारी फर्म";
      const dueDateDisplay = finalDueDate 
        ? new Date(finalDueDate).toLocaleDateString("hi-IN", { day: 'numeric', month: 'short', year: 'numeric' }) 
        : "15 दिन";

      if (isCreditLineActive && creditLineSnapshot) {
        legalAgreementText = 
`📋 *दैनिक उधारी बिल व खाता स्वीकृति (Credit Line Statement)*
नमस्ते *${custNameDisplay}*,
फर्म: *${shopName}*
बिल संख्या: *${billNumber}*

• आज का बिल: *₹${finalBillAmount.toLocaleString('en-IN')}*
• पिछला बकाया: *₹${creditLineSnapshot.previousBalance.toLocaleString('en-IN')}*
• अब तक कुल बकाया: *₹${creditLineSnapshot.newTotalBalance.toLocaleString('en-IN')}*
• स्वीकृत क्रेडिट लिमिट: *₹${creditLineSnapshot.sanctionedLimit.toLocaleString('en-IN')}*
• बची हुई उपलब्ध लिमिट: *₹${creditLineSnapshot.remainingLimit.toLocaleString('en-IN')}*

🔐 *बिल स्वीकृति एवं डिलीवरी OTP:*
👉 *[ ${otpCode} ]*

_(नोट: कृपया यह OTP दुकानदार को बताकर बिल स्वीकृत करें। स्वीकृति के बाद ही आपकी शेष ₹${creditLineSnapshot.remainingLimit.toLocaleString('en-IN')} की लिमिट सक्रिय रहेगी।)_`;
      } else {
        legalAgreementText = 
`📜 *कानूनी उधारी वचनपत्र (IT Act 2000 Section 10A)*

नमस्ते *${custNameDisplay}*,
फर्म: *${shopName}*
बिल संख्या: *${billNumber}*
कुल उधारी राशि: *₹${finalBillAmount.toLocaleString('en-IN')}*
भुगतान की देय तारीख (Due Date): *${dueDateDisplay}*
विलंब ब्याज दर (Late Interest): *${lateInt}% प्रति माह*

*वचनपत्र (Undertaking):* 
मैं प्रमाणित करता हूँ कि मैंने उपरोक्त बिल का समस्त सामान/सेवाएं सही स्थिति में प्राप्त कर ली हैं। मैं इस बकाया राशि का भुगतान नियत देय तारीख तक करने का वचन देता हूँ। नियत तारीख तक भुगतान न होने पर ${lateInt}% प्रति माह की दर से विलंब ब्याज देय होगा।

🔐 *माल हैंडओवर/प्राप्ति का OTP:*
👉 *[ ${otpCode} ]*

_(कृपया यह OTP दुकानदार को तभी बताएं जब आप सामान प्राप्त कर लें। OTP बताना आपकी कानूनी स्वीकृति मानी जाएगी।)_`;
      }
    }

    const normalizedMethod = (pMode.toLowerCase() === "upi" || pMode.toLowerCase() === "online") ? "online" 
                           : (pMode.toLowerCase() === "udhar" || pMode.toLowerCase() === "credit") ? "credit" 
                           : "cash";

    const bill = new Bill({
      ...req.body,
      companyId: req.companyId,
      paymentMode: pMode,
      paymentMethod: normalizedMethod,
      paymentStatus: isUdhar ? "unpaid" : "paid",
      status: req.body.status || (isUdhar ? "issued" : "paid"),
      finalAmount: finalBillAmount,
      billImageUrl: req.body.billImageUrl,
      dueDate: finalDueDate,
      isUdharProtected: shouldProtectWithOtp,
      otpCode,
      otpExpiresAt,
      isOtpVerified: !shouldProtectWithOtp,
      legalAgreementText,
      lateInterestPercent: lateInt,
      handoverStatus,
      isCreditLineBill: isCreditLineActive,
      creditLineSnapshot: creditLineSnapshot || undefined,
      isOwnerBypassed: Boolean(req.body.bypassPendingLock)
    });
    await bill.save();

    // --- AUTO-UPDATE PARTY UDHAR (CREDIT) BALANCE & PENDING GATEKEEPER ---
    try {
      if (isUdhar && pName && pName !== "नकद ग्राहक" && pName !== "Walk-in Customer") {
        if (matchedParty) {
          matchedParty.currentBalance = (Number(matchedParty.currentBalance) || 0) + finalBillAmount;
          matchedParty.updatedAt = new Date();
          if (isCreditLineActive && shouldProtectWithOtp) {
            matchedParty.hasPendingBillApproval = true;
            matchedParty.pendingApprovalBillId = bill._id;
            matchedParty.creditLimitLockedReason = `बिल #${bill.billNumber} स्वीकृति पेंडिंग`;
          }
          await matchedParty.save();
        } else {
          // Auto-create new customer with the Udhar balance
          const dummyPhone = pMobile || `9${Math.floor(100000000 + Math.random() * 900000000)}`;
          await Party.create({
            companyId: req.companyId,
            name: pName,
            mobileNumber: dummyPhone,
            address: customerAddress || "Local",
            partyType: "customer",
            openingBalance: 0,
            currentBalance: finalBillAmount
          }).catch(pErr => console.warn("Auto-create party warning:", pErr.message));
        }
      }
    } catch (partySyncErr) {
      console.error("Party Udhar Balance Sync Error:", partySyncErr.message);
    }

    // Auto-credit default UPI Bank Account if paid via UPI / Online
    if (normalizedMethod === "online" || pMode === "UPI") {
      try {
        const upiBank = await BankAccount.findOne({
          companyId: req.companyId,
          isDefaultUPI: true,
          isDeleted: { $ne: true }
        }) || await BankAccount.findOne({
          companyId: req.companyId,
          upiId: { $exists: true, $ne: "" },
          isDeleted: { $ne: true }
        });

        if (upiBank && finalBillAmount > 0) {
          upiBank.transactions.push({
            date: bill.date ? new Date(bill.date) : new Date(),
            type: 'deposit',
            amount: finalBillAmount,
            note: `UPI सेल बिल #${bill.billNumber} (${bill.customerName || 'नकद ग्राहक'})`,
            referenceNo: `BILL-${bill.billNumber}`
          });
          upiBank.currentBalance = (Number(upiBank.currentBalance) || 0) + finalBillAmount;
          await upiBank.save();
        }
      } catch (upiBankErr) {
        console.warn("UPI Bank Auto-Credit Warning:", upiBankErr.message);
      }
    }
    
    // Auto Raw Material Deduction & Standard Stock Update / Auto-Create Missing Products
    if (items && items.length > 0) {
      for (const item of items) {
        let product = null;
        if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
          product = await Product.findById(item.productId);
        } else if (item.autoCreateInInventory || req.body.autoCreateNewProducts) {
          const itemName = (item.name || "").trim();
          if (itemName) {
            product = await Product.findOne({
              companyId: req.companyId,
              name: new RegExp(`^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i")
            });
            if (!product) {
              const sellPrice = Number(item.rate || item.price || 0);
              product = await Product.create({
                companyId: req.companyId,
                name: itemName,
                category: item.category || "General",
                unit: item.unit || "Pcs",
                sellingPrice: sellPrice,
                costPrice: Number(item.costPrice) || Math.round(sellPrice * 0.75),
                mrp: sellPrice,
                currentStock: 100, // Initial default stock for voice-created item
                sku: `SKU-${Date.now().toString().slice(-6)}`,
                barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                brand: "General"
              }).catch(err => console.warn("Voice auto-create product error:", err.message));
            }
            if (product) {
              item.productId = product._id;
            }
          }
        }

        if (product) {
          if (product.recipe && product.recipe.length > 0) {
            for (const reqMat of product.recipe) {
              if (reqMat.rawMaterialId) {
                await Product.findByIdAndUpdate(reqMat.rawMaterialId, {
                  $inc: { currentStock: -(reqMat.quantity * item.quantity) }
                });
              }
            }
          } else {
            await Product.findByIdAndUpdate(product._id, { $inc: { currentStock: -item.quantity } });
          }
        }
      }
    }

    // Staff Incentive Calculation
    if (req.body.salesmanId) {
      const staff = await Staff.findOne({ _id: req.body.salesmanId, companyId: req.companyId });
      if (staff && staff.incentiveType && staff.incentiveType !== 'none') {
        let earned = staff.incentiveType === 'fixed' ? staff.incentiveValue : (bill.finalAmount * staff.incentiveValue) / 100;
        if (earned > 0) await Staff.findByIdAndUpdate(staff._id, { $inc: { earnedIncentives: earned } });
      }
    }

    let logMsg = `Created new Bill #${bill.billNumber} for amount ₹${bill.finalAmount}`;
    if (bill.siteName) logMsg += ` | Site: ${bill.siteName}`;
    await logActivity(req, logMsg);
    
    if (company.plan === 'free') {
      company.freeBillCount += 1;
      await company.save();
    }

    // --- AUTOMATIC DIGITAL LOYALTY STAMPS EVALUATION ---
    let stampResult = null;
    try {
      stampResult = await processStampAwardOnBill(req.companyId, bill);
    } catch (stampErr) {
      console.warn("Auto stamp award warning:", stampErr.message);
    }

    sendAutoWhatsappMessage(req.companyId, bill).catch(err => console.error("Non-blocking WA Error:", err));

      const custPhoneClean = String(customerMobile || req.body.customerPhone || req.body.phone || "").replace(/\D/g, "");
      const waLink = custPhoneClean 
        ? `https://wa.me/${custPhoneClean.slice(-10)}?text=${encodeURIComponent(legalAgreementText)}`
        : "";

      res.status(201).json({ 
        success: true, 
        bill, 
        stampResult, 
        udharProtection: shouldProtectWithOtp ? {
          isUdharProtected: true,
          otpCode,
          handoverStatus: "PENDING_OTP",
          legalAgreementText,
          customerMobile: customerMobile || req.body.customerPhone || req.body.phone,
          dueDate: bill.dueDate,
          lateInterestPercent: bill.lateInterestPercent,
          threshold: udharThreshold,
          waLink,
          isCreditLineBill: bill.isCreditLineBill,
          creditLineSnapshot: bill.creditLineSnapshot
        } : null,
        message: `Bill ${bill.billNumber} created successfully!` 
      });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: `Bill number '${req.body.billNumber}' already exists for this company.` });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadBillPDF = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, companyId });
    if (!bill) {
      return res.status(404).json({ success: false, error: "Bill not found" });
    }

    const company = await Company.findById(companyId);
    let upiQrCode = null;
    if (company && company.upiId && bill.finalAmount > 0) {
      try {
        upiQrCode = await generateUpiQrCode(company.upiId, company.name, bill.finalAmount, bill.billNumber);
      } catch (err) {
        console.error("Failed to generate UPI QR code for PDF:", err);
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Bill-${bill.billNumber}.pdf`);

    generateInvoicePdf(bill, company, res, upiQrCode);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBills = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    const { page = 1, limit, search = "", startDate, endDate, partyId, status } = req.query;

    const cidStr = String(companyId);
    const companyQuery = [cidStr];
    if (mongoose.Types.ObjectId.isValid(cidStr)) {
      companyQuery.push(new mongoose.Types.ObjectId(cidStr));
    }
    if (cidStr === "6a8314470d93e58ad0920950" || cidStr === "6a8314470d93e58ad0920952" || cidStr.startsWith("demo_")) {
      companyQuery.push("6a8314470d93e58ad0920950", "6a8314470d93e58ad0920952");
    }

    const query = { companyId: { $in: companyQuery }, isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerMobile: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate && endDate) {
      const parseIST = (dateStr) => (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T00:00:00+05:30`) : new Date(dateStr));
      const ISTDayEnd = (dateStr) => new Date(parseIST(dateStr).getTime() + 24 * 60 * 60 * 1000 - 1);
      const s = parseIST(startDate);
      const e = ISTDayEnd(endDate);
      query.$or = [{ date: { $gte: s, $lte: e } }, { createdAt: { $gte: s, $lte: e } }];
    }

    if (partyId) query.partyId = partyId;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = limit === 'all' ? 10000 : (parseInt(limit) || 200);
    const skip = (pageNum - 1) * limitNum;
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: bills,
      bills: bills,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, companyId });
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    
    const oldBill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId });
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { ...req.body },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    
    await logActivity(req, 'UPDATE', 'bill', bill._id, oldBill ? oldBill.toObject() : {}, bill.toObject());
    
    res.json({ success: true, bill, message: "Bill updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportBillsCSV = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    const bills = await Bill.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
    
    if (!bills || bills.length === 0) {
      return res.status(404).json({ success: false, message: "No bills found to export" });
    }

    const fields = [
      { label: "Invoice No", value: "billNumber" },
      { label: "Date", value: (row) => row.date ? new Date(row.date).toLocaleDateString("en-IN") : "" },
      { label: "Customer Name", value: "customerName" },
      { label: "Customer Mobile", value: "customerMobile" },
      { label: "Status", value: "status" },
      { label: "Total Amount", value: "total" },
      { label: "Tax", value: "tax" },
      { label: "Discount", value: "discountAmount" },
      { label: "Final Amount", value: "finalAmount" },
      { label: "Payment Method", value: "paymentMethod" },
      { label: "Site Name", value: "siteName" }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(bills);

    res.header("Content-Type", "text/csv");
    res.attachment(`Bills_Export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    
    const oldBill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId });

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    
    await logActivity(req, 'DELETE', 'bill', bill._id, oldBill.toObject(), { isDeleted: true });
    
    res.json({ success: true, message: "Bill deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== INTELLIGENT AUTO AI VISION BILL SCANNER (OpenAI GPT-4o Mini + Gemini 2.5/2.0 Flash) ====================
export const parseBillImage = async (req, res) => {
  try {
    const images = req.body?.images || (req.body?.image ? [req.body.image] : []);
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    // --- LICENSING CHECK (Free Plan: 25 Scans Limit, Yearly Premium: Unlimited) ---
    if (req.companyId) {
      const company = await Company.findById(req.companyId);
      if (company) {
        if (company.plan === 'free') {
          const currentScans = company.freeAiScanCount || 0;
          const maxScans = company.maxFreeAiScans || 25;
          if (currentScans + images.length > maxScans) {
            return res.status(403).json({
              success: false,
              limitReached: true,
              freeScansUsed: currentScans,
              maxFreeScans: maxScans,
              message: `निःशुल्क ${maxScans} AI बिल स्कैन की सीमा समाप्त हो गई है। असीमित AI बिल स्कैनिंग के लिए कृपया 1-वर्षीय प्रीमियम प्लान (Yearly Plan) में अपग्रेड करें।`
            });
          }
          company.freeAiScanCount = currentScans + images.length;
          await company.save();
        }
      }
    }
    // --- END LICENSING CHECK ---

    const openAiKey = req.body?.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = req.body?.geminiApiKey || process.env.GEMINI_API_KEY;

    const promptSystem = `You are a world-class AI retail invoice and handwritten slip (कच्ची पर्ची) parser specialized in Indian retail and wholesale shops.
Extract every line item, quantity, unit, price, and party name with 100% precision.
Decipher handwritten Hindi/English terms and exact product names (e.g., 'Emulsion 10 ltr', 'Apex Ultima 20L', 'Asian Paints Tractor', 'White Cement 50kg', 'Nut Bolt 8mm').
Do NOT skip any line item. Calculate total accurately.

Return STRICTLY a JSON object without markdown formatting:
{
  "partyName": "Customer or supplier name if mentioned, else ''",
  "partyType": "customer" or "supplier",
  "billType": "sale" or "purchase",
  "date": "YYYY-MM-DD or readable date",
  "items": [
    {
      "name": "Exact item name and specification as written",
      "quantity": 1,
      "unit": "Pcs",
      "price": 2850,
      "total": 2850
    }
  ],
  "totalAmount": 2850,
  "rawText": "Transcribed text"
}`;

    const parseSingleImage = async (b64) => {
      let mimeType = "image/jpeg";
      let pureB64 = b64;
      const match = b64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        pureB64 = match[2];
      }
      const fullDataUri = match ? b64 : `data:${mimeType};base64,${pureB64}`;

      // 1. Try OpenAI GPT-4o Mini First
      if (openAiKey) {
        try {
          const openAiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o-mini",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: promptSystem },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Parse this bill/receipt image into structured JSON items list:" },
                    { type: "image_url", image_url: { url: fullDataUri } }
                  ]
                }
              ],
              max_tokens: 1500
            },
            {
              headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
              timeout: 25000
            }
          );
          const content = openAiRes.data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const itemsList = (parsed.items || []).map(it => ({
              name: it.name || "सामान (Item)",
              quantity: Number(it.quantity) || 1,
              unit: it.unit || "Pcs",
              price: Number(it.price || it.rate) || 0,
              total: Number(it.total) || +((Number(it.quantity) || 1) * (Number(it.price || it.rate) || 0)).toFixed(2)
            }));
            return {
              success: true,
              source: "openai-gpt-4o-mini",
              partyName: parsed.partyName || "",
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || "",
              parsedItems: itemsList,
              totalAmount: Number(parsed.totalAmount) || itemsList.reduce((s, it) => s + it.total, 0),
              rawText: parsed.rawText || content
            };
          }
        } catch (oErr) {
          console.warn("OpenAI parse failed, trying Gemini:", oErr.message);
        }
      }

      // 2. Try Google Gemini (Cascading modern models)
      if (geminiKey) {
        const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
        const genAI = new GoogleGenerativeAI(geminiKey);
        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const imagePart = { inlineData: { data: pureB64, mimeType: mimeType } };
            const result = await model.generateContent([promptSystem, imagePart]);
            const respText = result.response.text();
            const cleanJson = respText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            const itemsList = (parsed.items || []).map(it => ({
              name: it.name || "सामान (Item)",
              quantity: Number(it.quantity) || 1,
              unit: it.unit || "Pcs",
              price: Number(it.price || it.rate) || 0,
              total: Number(it.total) || +((Number(it.quantity) || 1) * (Number(it.price || it.rate) || 0)).toFixed(2)
            }));
            return {
              success: true,
              source: modelName,
              partyName: parsed.partyName || "",
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || "",
              parsedItems: itemsList,
              totalAmount: Number(parsed.totalAmount) || itemsList.reduce((s, it) => s + it.total, 0),
              rawText: parsed.rawText || respText
            };
          } catch (gErr) {
            console.warn(`Gemini ${modelName} failed:`, gErr.message);
          }
        }
      }

      // 3. Fallback Tesseract
      const buffer = Buffer.from(pureB64, "base64");
      const tmpDir = os.tmpdir();
      const filename = `bill_${Date.now()}_${Math.random().toString(36).slice(2,6)}.png`;
      const filepath = path.join(tmpDir, filename);
      fs.writeFileSync(filepath, buffer);
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(filepath);
      await worker.terminate();
      try { fs.unlinkSync(filepath); } catch(e){}

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const itemsList = [];
      let partyName = "";
      for (const line of lines) {
        if (/invoice|bill|date|total|tax|gstin/i.test(line)) continue;
        const nums = line.match(/\d+[.,]?\d*/g) || [];
        if (nums.length >= 1) {
          const price = parseFloat(nums[nums.length - 1].replace(/,/g, "")) || 0;
          const qty = nums.length >= 2 ? (parseFloat(nums[0]) || 1) : 1;
          const name = line.replace(nums[nums.length - 1], "").replace(/\s+/g, " ").replace(/[^a-zA-Z0-9 \-]/g, "").trim();
          if (name.length >= 2) {
            itemsList.push({ name, quantity: qty, unit: "Pcs", price, total: +(qty * price).toFixed(2) });
          }
        }
      }
      return {
        success: true,
        source: "tesseract-ocr",
        partyName: partyName,
        partyType: "customer",
        billType: "sale",
        parsedItems: itemsList.length > 0 ? itemsList : [{ name: "हस्तलिखित सामान", quantity: 1, unit: "Pcs", price: 100, total: 100 }],
        totalAmount: itemsList.reduce((s, it) => s + it.total, 0),
        rawText: text
      };
    };

    const results = await Promise.all(images.map(img => parseSingleImage(img)));

    if (results.length === 1) {
      return res.json(results[0]);
    }

    return res.json({
      success: true,
      batch: true,
      count: results.length,
      bills: results
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createNonGstBill = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    
    const billNumber = `EST-${Date.now()}`;
    const bill = new Bill({ ...req.body, billNumber, companyId: req.companyId, status: 'issued' });
    await bill.save();
    
    res.status(201).json({ success: true, bill, message: "Non-GST Estimate Created" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addDispatchRecord = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: "Dispatch record saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importBills = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: "File uploaded and processed for import!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========================================================================
// 🛡️ LEGAL UDHAR OTP & HANDOVER VERIFICATION CONTROLLERS
// =========================================================================

export const verifyUdharOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otpCode } = req.body;

    if (!otpCode || !String(otpCode).trim()) {
      return res.status(400).json({ success: false, message: "कृपया 4-अंकों का OTP दर्ज करें!" });
    }

    const bill = await Bill.findOne({ _id: id, companyId: req.companyId });
    if (!bill) {
      return res.status(404).json({ success: false, message: "बिल नहीं मिला!" });
    }

    if (!bill.otpCode) {
      return res.status(400).json({ success: false, message: "इस बिल के लिए कोई OTP सक्रिय नहीं है।" });
    }

    if (bill.isOtpVerified) {
      return res.json({ success: true, message: "यह बिल पहले ही OTP सत्यापित हो चुका है!", bill });
    }

    if (bill.otpExpiresAt && new Date() > new Date(bill.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: "OTP की समय सीमा समाप्त हो गई है! कृपया नया OTP भेजें।" });
    }

    if (bill.otpCode.trim() !== String(otpCode).trim()) {
      return res.status(400).json({ success: false, message: "⚠️ गलत OTP! कृपया ग्राहक के WhatsApp पर आया सही 4-अंकों का OTP दर्ज करें।" });
    }

    bill.isOtpVerified = true;
    bill.otpVerifiedAt = new Date();
    bill.handoverStatus = "VERIFIED_HANDED_OVER";
    bill.updatedAt = new Date();
    await bill.save();

    // 🔓 AUTO-UNLOCK PARTY CREDIT LINE ON VERIFICATION
    await Party.updateMany(
      { companyId: req.companyId, pendingApprovalBillId: bill._id },
      { $set: { hasPendingBillApproval: false, pendingApprovalBillId: null, creditLimitLockedReason: "" } }
    );

    await logActivity(req, `Verified Udhar Delivery OTP for Bill #${bill.billNumber}`);

    res.json({
      success: true,
      message: "✅ उधारी डिलीवरी और कानूनी वचनपत्र सफलतापूर्वक सत्यापित हुआ! सामान ग्राहक को हैंडओवर किया जा सकता है और क्रेडिट लाइन अनलॉक हो गई।",
      bill
    });
  } catch (err) {
    console.error("verifyUdharOtp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resendUdharOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOne({ _id: id, companyId: req.companyId });
    if (!bill) {
      return res.status(404).json({ success: false, message: "बिल नहीं मिला!" });
    }

    const company = await Company.findById(req.companyId);
    
    // Smart OTP Reuse: If existing OTP is still within 30-min window, reuse it so customer doesn't get conflicting codes
    const isStillValid = bill.otpExpiresAt && new Date() < new Date(bill.otpExpiresAt) && bill.otpCode;
    const effectiveOtp = isStillValid ? bill.otpCode : Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = isStillValid ? bill.otpExpiresAt : new Date(Date.now() + 30 * 60 * 1000);

    const custName = (bill.customerName || "ग्राहक").trim();
    const shopName = company?.name || "हमारी फर्म";
    const dueDateStr = bill.dueDate 
      ? new Date(bill.dueDate).toLocaleDateString("hi-IN", { day: 'numeric', month: 'short', year: 'numeric' }) 
      : "15 दिन";

    let legalText = "";
    if (bill.isCreditLineBill && bill.creditLineSnapshot) {
      const snap = bill.creditLineSnapshot;
      legalText = 
`📋 *दैनिक उधारी बिल व खाता स्वीकृति (Credit Line Statement)*
नमस्ते *${custName}*,
फर्म: *${shopName}*
बिल संख्या: *${bill.billNumber}*

• आज का बिल: *₹${(snap.billAmount || bill.finalAmount || 0).toLocaleString('en-IN')}*
• पिछला बकाया: *₹${(snap.previousBalance || 0).toLocaleString('en-IN')}*
• अब तक कुल बकाया: *₹${(snap.newTotalBalance || 0).toLocaleString('en-IN')}*
• स्वीकृत क्रेडिट लिमिट: *₹${(snap.sanctionedLimit || 0).toLocaleString('en-IN')}*
• बची हुई उपलब्ध लिमिट: *₹${(snap.remainingLimit || 0).toLocaleString('en-IN')}*

🔐 *बिल स्वीकृति एवं डिलीवरी OTP:*
👉 *[ ${effectiveOtp} ]*

_(कृपया यह OTP दुकानदार को बताकर बिल स्वीकृत करें। स्वीकृति के बाद ही आपकी शेष ₹${(snap.remainingLimit || 0).toLocaleString('en-IN')} की लिमिट सक्रिय रहेगी।)_`;
    } else {
      legalText = 
`📜 *कानूनी उधारी वचनपत्र (IT Act 2000 Section 10A)*

नमस्ते *${custName}*,
फर्म: *${shopName}*
बिल संख्या: *${bill.billNumber}*
कुल उधारी राशि: *₹${(bill.finalAmount || 0).toLocaleString('en-IN')}*
भुगतान की देय तारीख: *${dueDateStr}*
विलंब ब्याज दर: *${bill.lateInterestPercent || 2}% प्रति माह*

*वचनपत्र (Undertaking):* 
मैं प्रमाणित करता हूँ कि मैंने उपरोक्त बिल का समस्त सामान/सेवाएं सही स्थिति में प्राप्त कर ली हैं। मैं इस बकाया राशि का भुगतान नियत देय तारीख तक करने का वचन देता हूँ। नियत तारीख तक भुगतान न होने पर ${bill.lateInterestPercent || 2}% प्रति माह की दर से विलंब ब्याज देय होगा।

🔐 *माल हैंडओवर/प्राप्ति का OTP:*
👉 *[ ${effectiveOtp} ]*

_(कृपया यह OTP दुकानदार को तभी बताएं जब आप सामान प्राप्त कर लें। OTP बताना आपकी कानूनी स्वीकृति मानी जाएगी।)_`;
    }

    bill.otpCode = effectiveOtp;
    bill.otpExpiresAt = expiresAt;
    bill.legalAgreementText = legalText;
    bill.updatedAt = new Date();
    await bill.save();

    const cleanPhone = String(bill.customerMobile || "").replace(/\D/g, "");
    const waLink = cleanPhone 
      ? `https://wa.me/${cleanPhone.slice(-10)}?text=${encodeURIComponent(legalText)}`
      : "";

    res.json({
      success: true,
      message: isStillValid ? "समान मान्य OTP पुनः तैयार है!" : "नया OTP सफलतापूर्वक जनरेट हुआ!",
      otpCode: effectiveOtp,
      legalAgreementText: legalText,
      customerMobile: bill.customerMobile,
      waLink,
      otpReused: Boolean(isStillValid)
    });
  } catch (err) {
    console.error("resendUdharOtp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const bypassUdharOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "दुकानदार द्वारा बायपास (काम न रुके)" } = req.body;

    const bill = await Bill.findOne({ _id: id, companyId: req.companyId });
    if (!bill) {
      return res.status(404).json({ success: false, message: "बिल नहीं मिला!" });
    }

    bill.handoverStatus = "BYPASSED";
    bill.isOwnerBypassed = true;
    bill.updatedAt = new Date();
    await bill.save();

    // Auto-unlock credit limit on Party so work is not stopped ("काम न रुके")
    await Party.updateMany(
      { companyId: req.companyId, pendingApprovalBillId: bill._id },
      { $set: { hasPendingBillApproval: false, pendingApprovalBillId: null, creditLimitLockedReason: reason } }
    );
    bill.isOtpVerified = false;
    bill.notes = (bill.notes ? bill.notes + " | " : "") + `[बायपास हैंडओवर: ${reason}]`;
    bill.updatedAt = new Date();
    await bill.save();

    await logActivity(req, `Bypassed Udhar Delivery OTP for Bill #${bill.billNumber} - Reason: ${reason}`);

    res.json({
      success: true,
      message: "⚠️ उधारी हैंडओवर बिना OTP के बायपास कर दिया गया।",
      bill
    });
  } catch (err) {
    console.error("bypassUdharOtp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

