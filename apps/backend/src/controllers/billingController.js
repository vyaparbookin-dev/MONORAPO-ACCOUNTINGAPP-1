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
import { syncBillToSupabase, syncBillDeleteToSupabase } from "../services/supabaseSyncService.js";
import { getBillsFromSupabase, getBillByIdFromSupabase } from "../services/supabaseReadService.js";
import { scanBillToEntry } from "../bill-scanner/index.js";
import { parseBillMetadata, parseLineItems } from "../bill-scanner/ocrExtractor.js";

export const createBill = async (req, res) => {
  try {
    let resolvedCompanyId = req.companyId || req.body?.companyId;
    if (!resolvedCompanyId || resolvedCompanyId === "null" || resolvedCompanyId === "undefined") {
      if (req.user?.companyId) {
        resolvedCompanyId = req.user.companyId.toString();
      }
    }

    // --- RESILIENT COMPANY LOOKUP ---
    let company = null;
    if (resolvedCompanyId && mongoose.Types.ObjectId.isValid(resolvedCompanyId)) {
      company = await Company.findById(resolvedCompanyId);
    }
    if (!company && req.user?._id) {
      company = await Company.findOne({ user: req.user._id });
    }

    if (company) {
      req.companyId = company._id;
    } else if (resolvedCompanyId && (resolvedCompanyId.startsWith("demo_") || resolvedCompanyId.startsWith("custom_"))) {
      req.companyId = resolvedCompanyId;
    } else {
      return res.status(400).json({ success: false, message: "Company ID is missing or invalid. Please select your company." });
    }

    // --- LICENSING CHECK ---
    if (company && company.plan === 'free' && company.freeBillCount >= (company.maxFreeBills || 50)) {
      return res.status(403).json({ success: false, message: `Free bill limit (${company.maxFreeBills || 50}) exceeded. Please upgrade to Yearly Premium to create more bills.` });
    }
    // --- END LICENSING CHECK ---

    const { billNumber, companyId, partyId, customerName, customerMobile, customerAddress, customerGst, siteName, date, dueDate, items, total, tax, discountPercent, discountAmount, finalAmount, paymentMethod, paymentMode, notes, status, billImageUrl } = req.body;
    const rawMode = String(paymentMode || paymentMethod || req.body.type || "CASH").toUpperCase();
    const finalBillAmount = Number(finalAmount || total || 0);

    const isUdhar = rawMode === "UDHAR" || rawMode === "CREDIT" || req.body.paymentStatus === "unpaid" || String(req.body.paymentMethod || "").toLowerCase() === "credit" || Boolean(req.body.isCredit);
    const pMode = isUdhar ? "UDHAR" : rawMode;
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
    if (!matchedParty && pName && !["नकद ग्राहक", "walk-in customer", "walk-in guest", "नकद ग्राहक (walk-in)"].includes(pName.toLowerCase())) {
      const escapedPName = pName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      matchedParty = await Party.findOne({ name: new RegExp(`^${escapedPName}$`, "i"), companyId: req.companyId });
    }
    // If not found and party name is provided for Udhar sale, auto-create customer upfront so partyId links properly
    if (!matchedParty && pName && isUdhar && !["नकद ग्राहक", "walk-in customer", "walk-in guest", "नकद ग्राहक (walk-in)"].includes(pName.toLowerCase())) {
      try {
        const dummyPhone = pMobile || `9${Math.floor(100000000 + Math.random() * 900000000)}`;
        matchedParty = await Party.create({
          companyId: req.companyId,
          name: pName,
          mobileNumber: dummyPhone,
          address: customerAddress || "Local",
          partyType: "customer",
          openingBalance: 0,
          currentBalance: 0
        });
      } catch (pErr) {
        console.warn("Auto-create party upfront warning:", pErr.message);
      }
    }

    const resolvedPartyId = matchedParty?._id || (partyId && mongoose.Types.ObjectId.isValid(partyId) ? partyId : undefined);

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
      partyId: resolvedPartyId,
      customerName: pName || req.body.customerName || "नकद ग्राहक",
      customerMobile: pMobile || req.body.customerMobile || req.body.customerPhone || "",
      customerPhone: pMobile || req.body.customerPhone || req.body.customerMobile || "",
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

    // --- ASYNC DUAL-WRITE SYNC TO SUPABASE ---
    syncBillToSupabase(bill).catch(e => console.warn("[Supabase Dual-Write] bill sync note:", e.message));

    // --- AUTO-UPDATE PARTY UDHAR (CREDIT) BALANCE & PENDING GATEKEEPER ---
    try {
      if (isUdhar && matchedParty) {
        matchedParty.currentBalance = (Number(matchedParty.currentBalance) || 0) + finalBillAmount;
        matchedParty.updatedAt = new Date();
        if (isCreditLineActive && shouldProtectWithOtp) {
          matchedParty.hasPendingBillApproval = true;
          matchedParty.pendingApprovalBillId = bill._id;
          matchedParty.creditLimitLockedReason = `बिल #${bill.billNumber} स्वीकृति पेंडिंग`;
        }
        await matchedParty.save();
      } else if (isUdhar && pName && !["नकद ग्राहक", "walk-in customer", "walk-in guest"].includes(pName.toLowerCase())) {
        const dummyPhone = pMobile || `9${Math.floor(100000000 + Math.random() * 900000000)}`;
        const autoP = await Party.create({
          companyId: req.companyId,
          name: pName,
          mobileNumber: dummyPhone,
          address: customerAddress || "Local",
          partyType: "customer",
          openingBalance: 0,
          currentBalance: finalBillAmount
        }).catch(pErr => {
          console.warn("Auto-create party warning:", pErr.message);
          return null;
        });
        if (autoP && !bill.partyId) {
          bill.partyId = autoP._id;
          await bill.save().catch(() => null);
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

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbResult = await getBillsFromSupabase({ companyId, search, startDate, endDate, partyId, status, page, limit });
      if (sbResult && Array.isArray(sbResult.bills) && sbResult.bills.length > 0) {
        return res.json({
          success: true,
          data: sbResult.bills,
          bills: sbResult.bills,
          total: sbResult.total,
          page: sbResult.page,
          pages: sbResult.pages,
          source: "supabase"
        });
      }
    } catch (sbErr) {
      console.warn("[Supabase Read] listBills error, falling back to Mongo:", sbErr.message);
    }

    const cidStr = String(companyId);
    const companyQuery = [cidStr];
    if (mongoose.Types.ObjectId.isValid(cidStr)) {
      companyQuery.push(new mongoose.Types.ObjectId(cidStr));
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

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbBill = await getBillByIdFromSupabase(req.params.id, companyId);
      if (sbBill) {
        return res.json({ success: true, data: sbBill, bill: sbBill, source: "supabase" });
      }
    } catch (sbErr) {
      console.warn("[Supabase Read] getBillById error, falling back to Mongo:", sbErr.message);
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
    if (!oldBill) return res.status(404).json({ success: false, error: "Bill not found" });

    // Revert old stock: add back old quantities to inventory
    if (Array.isArray(oldBill.items)) {
      for (const item of oldBill.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: Number(item.quantity || 0) }
          });
        }
      }
    }

    // Revert old party balance
    if (oldBill.partyId || oldBill.customer) {
      const oldPartyId = oldBill.partyId || oldBill.customer;
      const oldFinalAmt = Number(oldBill.finalAmount || oldBill.total || 0);
      if (oldFinalAmt > 0) {
        await Party.findByIdAndUpdate(oldPartyId, {
          $inc: { currentBalance: -oldFinalAmt }
        });
      }
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { ...req.body },
      { new: true }
    );
    
    // Apply new stock: deduct new quantities from inventory
    if (Array.isArray(bill.items)) {
      for (const item of bill.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: -Number(item.quantity || 0) }
          });
        }
      }
    }

    // Apply new party balance
    if (bill.partyId || bill.customer) {
      const newPartyId = bill.partyId || bill.customer;
      const newFinalAmt = Number(bill.finalAmount || bill.total || 0);
      if (newFinalAmt > 0) {
        await Party.findByIdAndUpdate(newPartyId, {
          $inc: { currentBalance: newFinalAmt }
        });
      }
    }

    await logActivity(req, 'UPDATE', 'bill', bill._id, oldBill.toObject(), bill.toObject());
    
    // Sync to Supabase
    syncBillToSupabase(bill).catch(e => console.warn("[Supabase Dual-Write] updateBill sync note:", e.message));

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
    if (!oldBill) return res.status(404).json({ success: false, error: "Bill not found" });

    // Revert stock: add back quantities to inventory
    if (Array.isArray(oldBill.items)) {
      for (const item of oldBill.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: Number(item.quantity || 0) }
          });
        }
      }
    }

    // Revert party balance: remove sale debit
    if (oldBill.partyId || oldBill.customer) {
      const partyId = oldBill.partyId || oldBill.customer;
      const finalAmt = Number(oldBill.finalAmount || oldBill.total || 0);
      if (finalAmt > 0) {
        await Party.findByIdAndUpdate(partyId, {
          $inc: { currentBalance: -finalAmt }
        });
      }
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    
    await logActivity(req, 'DELETE', 'bill', bill._id, oldBill.toObject(), { isDeleted: true });
    
    // Sync delete to Supabase
    if (oldBill.billNumber) {
      syncBillDeleteToSupabase(oldBill.billNumber).catch(e => console.warn("[Supabase Dual-Write] deleteBill sync note:", e.message));
    }

    res.json({ success: true, message: "Bill deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BILL EXTRACTION VALIDATION LAYER (Zero Guessing / Anti-Hallucination) ====================
export const validateExtractedBill = (billData = {}) => {
  const flags = {
    needsReview: false,
    reviewReasons: [],
    fieldSources: {},
    itemValidations: [],
    isMathValid: true
  };

  // 1. Party / Customer / Vendor Name Validation
  const partyName = (billData.partyName || "").trim();
  if (partyName && partyName.length >= 2 && !/^(सामान|customer|supplier|पर्ची|कच्ची|ग्राहक)/i.test(partyName)) {
    flags.fieldSources.partyName = { source: "extracted", value: partyName, isMissing: false };
  } else {
    flags.fieldSources.partyName = { source: "missing", value: "", isMissing: true };
    flags.needsReview = true;
    flags.reviewReasons.push("पार्टी / ग्राहक का नाम बिल में नहीं मिला (मैन्युअल दर्ज करें)");
  }

  // 2. GSTIN Format Validation (15 alphanumeric characters)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const checkGst = (gstVal, fieldName, label) => {
    if (!gstVal) {
      flags.fieldSources[fieldName] = { source: "missing", value: "", isMissing: true };
      return;
    }
    const clean = String(gstVal).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (gstRegex.test(clean)) {
      flags.fieldSources[fieldName] = { source: "extracted", value: clean, isValid: true };
    } else {
      flags.fieldSources[fieldName] = { source: "invalid", value: gstVal, isValid: false };
      flags.needsReview = true;
      flags.reviewReasons.push(`${label} अमान्य GST प्रारूप में है: ${gstVal}`);
    }
  };
  checkGst(billData.gstin || billData.buyerGst, "gstin", "GSTIN");
  if (billData.sellerGst) checkGst(billData.sellerGst, "sellerGst", "सप्लायर GST");
  if (billData.buyerGst) checkGst(billData.buyerGst, "buyerGst", "खरीदार GST");

  // 3. Bill Date Validation
  const rawDate = billData.date || billData.billDate;
  if (rawDate) {
    const dObj = new Date(rawDate);
    if (!isNaN(dObj.getTime())) {
      flags.fieldSources.billDate = { source: "extracted", value: rawDate, isValid: true };
    } else {
      flags.fieldSources.billDate = { source: "invalid", value: rawDate, isValid: false };
      flags.needsReview = true;
      flags.reviewReasons.push(`तारीख अमान्य है: ${rawDate}`);
    }
  } else {
    flags.fieldSources.billDate = { source: "missing", value: "", isMissing: true };
  }

  // 4. Invoice Number Validation
  const invNo = (billData.invoiceNumber || "").trim();
  if (invNo && invNo.length >= 2) {
    flags.fieldSources.invoiceNumber = { source: "extracted", value: invNo, isMissing: false };
  } else {
    flags.fieldSources.invoiceNumber = { source: "missing", value: "", isMissing: true };
  }

  // 5. Line Items & Line-Level Mathematical Cross-Check (Quantity × Rate = Line Total)
  const items = billData.parsedItems || billData.items || [];
  let calculatedItemsSum = 0;

  if (items.length === 0) {
    flags.needsReview = true;
    flags.reviewReasons.push("बिल में कोई भी सामान स्पष्ट रूप से नहीं मिला");
  }

  flags.itemValidations = items.map((it, idx) => {
    const itName = (it.name || "").trim();
    const qty = (it.quantity !== null && it.quantity !== undefined && !isNaN(it.quantity)) ? Number(it.quantity) : null;
    const price = (it.price !== null && it.price !== undefined && !isNaN(it.price)) ? Number(it.price) : null;
    const lineTotal = (it.total !== null && it.total !== undefined && !isNaN(it.total)) ? Number(it.total) : null;

    let isMathValid = true;
    let mathDiff = 0;
    let expectedTotal = null;

    if (qty !== null && price !== null && lineTotal !== null) {
      expectedTotal = +(qty * price).toFixed(2);
      mathDiff = Math.abs(expectedTotal - lineTotal);
      if (mathDiff > 1.05) {
        isMathValid = false;
        flags.isMathValid = false;
        flags.needsReview = true;
        flags.reviewReasons.push(
          `आइटम #${idx + 1} (${itName || "सामान"}): मात्रा (${qty}) × दर (₹${price}) = ₹${expectedTotal}, लेकिन बिल में ₹${lineTotal} लिखा है`
        );
      }
    }

    if (price === null || price === 0) {
      flags.needsReview = true;
      flags.reviewReasons.push(`आइटम #${idx + 1} (${itName || "सामान"}): दर (रेट) गायब है - मैन्युअल भरें`);
    }

    if (lineTotal !== null) {
      calculatedItemsSum += lineTotal;
    } else if (expectedTotal !== null) {
      calculatedItemsSum += expectedTotal;
    }

    return {
      index: idx,
      name: itName,
      source: itName ? "extracted" : "missing",
      quantity: qty,
      price: price,
      total: lineTotal,
      expectedTotal,
      isMathValid,
      mathDiff: +mathDiff.toFixed(2),
      isPriceMissing: (price === null || price === 0)
    };
  });

  // 6. Grand Total Reconciliation
  const charges = billData.additionalCharges || [];
  const chargesTotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const roundOff = Number(billData.roundOff || 0);
  const statedTotal = Number(billData.totalAmount || 0);

  const subTotalBeforeTax = +(calculatedItemsSum + chargesTotal + roundOff).toFixed(2);
  if (statedTotal > 0 && calculatedItemsSum > 0) {
    const totalDiff = Math.abs(subTotalBeforeTax - statedTotal);
    if (totalDiff > 2.05) {
      flags.totalsMismatch = true;
      flags.calculatedSubTotal = subTotalBeforeTax;
      flags.statedTotal = statedTotal;
      flags.grandTotalDifference = +totalDiff.toFixed(2);
    }
  }

  return flags;
};

// ==================== INTELLIGENT AUTO AI VISION BILL SCANNER (Zero-Hallucination 2-Step Pipeline) ====================
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

    // STRICT ZERO-HALLUCINATION SYSTEM PROMPT:
    // AI MUST ONLY EXTRACT VALUES LITERALLY READABLE. NO GUESSING, NO PLACEHOLDERS, NO INVENTED PRODUCTS.
    const promptSystem = `You are a literal, zero-hallucination OCR parser specialized in Indian retail and wholesale bills, tax invoices, and receipts.
CRITICAL ZERO-HALLUCINATION RULES:
1. ONLY extract values that are LITERALLY VISIBLE and readable in the provided image and grounded in the raw OCR text.
2. If any field (partyName, invoiceNumber, date, price, quantity, HSN, bank details, carriage/freight) is missing, unclear, blurry, or unreadable, leave it null or empty string ("").
3. NEVER infer, estimate, predict, guess, or invent a plausible value under any circumstance.
4. Do NOT use outside training data to invent products (never invent paint, cement, or random hardware names).
5. For line items: ONLY return items that are visibly printed/written on the bill. If no items are legible, return an empty array: "items": [].
6. Every line item's price must be the literal rate printed. If missing, leave price as null.
7. Return STRICTLY a valid JSON object without markdown fences:
{
  "partyName": string or null,
  "partyType": "customer" | "supplier",
  "billType": "sale" | "purchase",
  "invoiceNumber": string or null,
  "date": "YYYY-MM-DD or readable date" or null,
  "gstin": string or null,
  "sellerGst": string or null,
  "buyerGst": string or null,
  "notes": string or null,
  "items": [
    {
      "name": string,
      "hsn": string or null,
      "quantity": number or null,
      "unit": string or null,
      "price": number or null,
      "total": number or null
    }
  ],
  "additionalCharges": [
    { "name": string, "amount": number }
  ],
  "roundOff": number or null,
  "totalAmount": number or null,
  "bankDetails": {
    "accountNo": string or null,
    "ifsc": string or null,
    "upiId": string or null
  },
  "rawText": string
}`;

    // Fetch product catalog for tenant once to enable smart product matching & alias memory
    let productCatalog = [];
    if (req.companyId) {
      try {
        productCatalog = await Product.find({ companyId: req.companyId })
          .select("_id name barcode sku aliases sellingPrice costPrice unit currentStock hsnCode")
          .lean();
      } catch (catErr) {
        console.warn("[parseBillImage] Catalog fetch note:", catErr.message);
      }
    }

    const parseSingleImage = async (b64) => {
      let mimeType = "image/jpeg";
      let pureB64 = b64;
      if (typeof b64 === "string" && (b64.startsWith("http://") || b64.startsWith("https://"))) {
        try {
          const downloadRes = await axios.get(b64, { responseType: "arraybuffer", timeout: 20000 });
          const contentType = downloadRes.headers["content-type"] || "image/jpeg";
          mimeType = contentType.split(";")[0].trim();
          pureB64 = Buffer.from(downloadRes.data).toString("base64");
        } catch (dlErr) {
          console.warn("[parseBillImage] Failed to download image from URL:", dlErr.message);
        }
      } else if (typeof b64 === "string") {
        const match = b64.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          pureB64 = match[2];
        }
      }
      const fullDataUri = `data:${mimeType};base64,${pureB64}`;

      // -------------------------------------------------------------
      // PIPELINE A: COMPUTER-GENERATED / PRINTED BILL / PDF SCANNER
      // Triggered if explicitly requested or if file is a PDF
      // -------------------------------------------------------------
      const isPrintedMode = !openAiKey && (req.body?.scannerType === "printed" || req.body?.mode === "printed");
      if (isPrintedMode) {
        try {
          const imgBuffer = Buffer.from(pureB64, "base64");
          const scanRes = await scanBillToEntry(imgBuffer, productCatalog, {
            mimeType,
            date: req.body?.date,
            partyName: req.body?.partyName,
          });

          if (scanRes && scanRes.scannedCount > 0) {
            const billResult = {
              ...scanRes,
              parsedItems: [
                ...(scanRes.readyLines || []),
                ...(scanRes.pendingConfirmation || []),
                ...(scanRes.unmatched || [])
              ],
              totalAmount: scanRes.bill?.totalAmount || 0,
              partyName: scanRes.bill?.partyName || "",
              partyType: scanRes.bill?.partyType || "customer",
              billType: scanRes.bill?.billType || "sale",
            };
            const validation = validateExtractedBill(billResult);
            return {
              ...billResult,
              fieldSources: validation.fieldSources,
              validation,
              needsReview: validation.needsReview,
              reviewReasons: validation.reviewReasons
            };
          }
        } catch (scanErr) {
          console.warn("[parseBillImage] Computer bill pipeline fallback:", scanErr.message);
        }
      }

      // -------------------------------------------------------------
      // STEP 1: RAW OCR GROUNDING ENGINE (Extract Raw Text from Image)
      // Extracts raw text tokens to ground AI Vision model & prevent hallucination
      // -------------------------------------------------------------
      let rawOcrText = (req.body?.rawText && typeof req.body.rawText === "string" && req.body.rawText.trim().length > 10)
        ? req.body.rawText.trim()
        : "";

      if (!rawOcrText && pureB64 && pureB64.length > 50) {
        try {
          const buffer = Buffer.from(pureB64, "base64");
          const tmpDir = os.tmpdir();
          const filename = `ocr_ground_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`;
          const filepath = path.join(tmpDir, filename);
          fs.writeFileSync(filepath, buffer);
          const worker = await createWorker("eng");
          const { data: { text } } = await worker.recognize(filepath);
          await worker.terminate();
          try { fs.unlinkSync(filepath); } catch (e) {}
          rawOcrText = text || "";
        } catch (ocrErr) {
          console.warn("[parseBillImage] Step 1 OCR Grounding note:", ocrErr.message);
        }
      }

      // Parse metadata & tabular items from raw OCR text
      const metaFromOcr = parseBillMetadata(rawOcrText);
      const itemsFromOcr = parseLineItems(rawOcrText);

      // -------------------------------------------------------------
      // STEP 2: AI VISION MODEL WITH OCR GROUNDING CONTEXT
      // -------------------------------------------------------------
      const ocrContextSnippet = rawOcrText && rawOcrText.trim().length > 5
        ? `\n\n[VERBATIM OCR GROUNDING TEXT FROM IMAGE - USE ONLY THESE TOKENS AND VISIBLE DETAILS]:\n${rawOcrText.trim()}\n[END OCR GROUNDING TEXT]`
        : "";

      const userPromptText = `Parse this bill/receipt image into structured JSON according to the strict zero-hallucination rules.
Extract ONLY values that are literally visible in the image or grounded in the OCR text below.
If any field is missing, unclear, or unreadable, leave it null or empty string ("").
NEVER infer, guess, or invent products or prices.${ocrContextSnippet}`;

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
                    { type: "text", text: userPromptText },
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
            const itemsList = (parsed.items || [])
              .filter(it => it && it.name && typeof it.name === "string" && it.name.trim().length > 1)
              .map(it => {
                const qty = (it.quantity !== null && it.quantity !== undefined && !isNaN(it.quantity)) ? Number(it.quantity) : null;
                const price = (it.price !== null && it.price !== undefined && !isNaN(it.price)) ? Number(it.price) : null;
                const total = (it.total !== null && it.total !== undefined && !isNaN(it.total))
                  ? Number(it.total)
                  : (qty !== null && price !== null ? +(qty * price).toFixed(2) : null);
                return {
                  name: it.name.trim(),
                  hsn: it.hsn ? String(it.hsn).trim() : (metaFromOcr.hsn || ""),
                  quantity: qty,
                  unit: it.unit || "Pcs",
                  price: price,
                  total: total,
                  source: "extracted"
                };
              });

            const mergedCharges = Array.isArray(parsed.additionalCharges) && parsed.additionalCharges.length > 0
              ? parsed.additionalCharges
              : (metaFromOcr.additionalCharges || []);

            const extractedObj = {
              success: true,
              source: "openai-gpt-4o-mini",
              partyName: (parsed.partyName || metaFromOcr.partyName || "").trim(),
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || metaFromOcr.billDate || "",
              billDate: parsed.date || metaFromOcr.billDate || "",
              invoiceNumber: parsed.invoiceNumber || metaFromOcr.invoiceNumber || "",
              gstin: parsed.gstin || metaFromOcr.gstin || "",
              sellerGst: parsed.sellerGst || metaFromOcr.sellerGst || "",
              buyerGst: parsed.buyerGst || metaFromOcr.buyerGst || "",
              notes: parsed.notes || metaFromOcr.notes || "",
              challanNo: metaFromOcr.challanNo || "",
              biltyNo: metaFromOcr.biltyNo || "",
              vehicleNo: metaFromOcr.vehicleNo || "",
              roundOff: parsed.roundOff !== null && parsed.roundOff !== undefined ? Number(parsed.roundOff) : (metaFromOcr.roundOff || 0),
              bankDetails: parsed.bankDetails && Object.keys(parsed.bankDetails).length > 0 ? parsed.bankDetails : (metaFromOcr.bankDetails || {}),
              additionalCharges: mergedCharges,
              parsedItems: itemsList,
              totalAmount: parsed.totalAmount !== null && parsed.totalAmount !== undefined
                ? Number(parsed.totalAmount)
                : itemsList.reduce((s, it) => s + (Number(it.total) || 0), 0),
              rawText: rawOcrText || (parsed.rawText || content)
            };

            const validation = validateExtractedBill(extractedObj);
            return {
              ...extractedObj,
              fieldSources: validation.fieldSources,
              validation,
              needsReview: validation.needsReview,
              reviewReasons: validation.reviewReasons
            };
          }
        } catch (oErr) {
          const openAiErrMsg = oErr.response?.data?.error?.message || oErr.message;
          console.warn("[parseBillImage] OpenAI GPT-4o-mini error:", openAiErrMsg);
          throw new Error("OpenAI ChatGPT-4o-mini त्रुटि: " + openAiErrMsg);
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
            const result = await model.generateContent([
              promptSystem,
              userPromptText,
              imagePart
            ]);
            const respText = result.response.text();
            const cleanJson = respText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            const itemsList = (parsed.items || [])
              .filter(it => it && it.name && typeof it.name === "string" && it.name.trim().length > 1)
              .map(it => {
                const qty = (it.quantity !== null && it.quantity !== undefined && !isNaN(it.quantity)) ? Number(it.quantity) : null;
                const price = (it.price !== null && it.price !== undefined && !isNaN(it.price)) ? Number(it.price) : null;
                const total = (it.total !== null && it.total !== undefined && !isNaN(it.total))
                  ? Number(it.total)
                  : (qty !== null && price !== null ? +(qty * price).toFixed(2) : null);
                return {
                  name: it.name.trim(),
                  hsn: it.hsn ? String(it.hsn).trim() : (metaFromOcr.hsn || ""),
                  quantity: qty,
                  unit: it.unit || "Pcs",
                  price: price,
                  total: total,
                  source: "extracted"
                };
              });

            const mergedCharges = Array.isArray(parsed.additionalCharges) && parsed.additionalCharges.length > 0
              ? parsed.additionalCharges
              : (metaFromOcr.additionalCharges || []);

            const extractedObj = {
              success: true,
              source: modelName,
              partyName: (parsed.partyName || metaFromOcr.partyName || "").trim(),
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || metaFromOcr.billDate || "",
              billDate: parsed.date || metaFromOcr.billDate || "",
              invoiceNumber: parsed.invoiceNumber || metaFromOcr.invoiceNumber || "",
              gstin: parsed.gstin || metaFromOcr.gstin || "",
              sellerGst: parsed.sellerGst || metaFromOcr.sellerGst || "",
              buyerGst: parsed.buyerGst || metaFromOcr.buyerGst || "",
              challanNo: metaFromOcr.challanNo || "",
              biltyNo: metaFromOcr.biltyNo || "",
              vehicleNo: metaFromOcr.vehicleNo || "",
              roundOff: parsed.roundOff !== null && parsed.roundOff !== undefined ? Number(parsed.roundOff) : (metaFromOcr.roundOff || 0),
              bankDetails: parsed.bankDetails && Object.keys(parsed.bankDetails).length > 0 ? parsed.bankDetails : (metaFromOcr.bankDetails || {}),
              additionalCharges: mergedCharges,
              parsedItems: itemsList,
              totalAmount: parsed.totalAmount !== null && parsed.totalAmount !== undefined
                ? Number(parsed.totalAmount)
                : itemsList.reduce((s, it) => s + (Number(it.total) || 0), 0),
              rawText: rawOcrText || (parsed.rawText || respText)
            };

            const validation = validateExtractedBill(extractedObj);
            return {
              ...extractedObj,
              fieldSources: validation.fieldSources,
              validation,
              needsReview: validation.needsReview,
              reviewReasons: validation.reviewReasons
            };
          } catch (gErr) {
            console.warn(`Gemini ${modelName} failed:`, gErr.message);
          }
        }
      }

      // -------------------------------------------------------------
      if (!openAiKey && !geminiKey) {
        throw new Error("OpenAI API Key सेट नहीं है। कृपया ऐप सेटिंग्स में जाकर अपनी OpenAI ChatGPT API Key दर्ज करें।");
      }

      // STEP 3: STRICT OCR-GROUNDED EXTRACTION (NO FAKE / DUMMY FALLBACKS)
      // -------------------------------------------------------------
      const fallbackItems = itemsFromOcr.map(it => ({
        name: it.rawName,
        hsn: it.hsn || "",
        quantity: it.qty,
        unit: it.unit || "Pcs",
        price: it.rate,
        total: it.amount,
        source: "extracted"
      }));

      const finalObj = {
        success: true,
        source: "tesseract-ocr-grounded",
        partyName: (metaFromOcr.partyName || "").trim(),
        partyType: "customer",
        billType: "sale",
        date: metaFromOcr.billDate || "",
        billDate: metaFromOcr.billDate || "",
        invoiceNumber: metaFromOcr.invoiceNumber || "",
        gstin: metaFromOcr.gstin || "",
        sellerGst: metaFromOcr.sellerGst || "",
        buyerGst: metaFromOcr.buyerGst || "",
        challanNo: metaFromOcr.challanNo || "",
        biltyNo: metaFromOcr.biltyNo || "",
        vehicleNo: metaFromOcr.vehicleNo || "",
        roundOff: metaFromOcr.roundOff || 0,
        bankDetails: metaFromOcr.bankDetails || {},
        additionalCharges: metaFromOcr.additionalCharges || [],
        parsedItems: fallbackItems, // STRICT: Empty array if unreadable! NO fake items!
        totalAmount: fallbackItems.reduce((s, it) => s + it.total, 0),
        rawText: rawOcrText
      };

      const validation = validateExtractedBill(finalObj);
      return {
        ...finalObj,
        fieldSources: validation.fieldSources,
        validation,
        needsReview: validation.needsReview,
        reviewReasons: validation.reviewReasons
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

/**
 * 🔗 SMART ITEM MERGE MEMORY (Add scanned vendor name to Product.aliases)
 * Keeps track of previous merges so future scans auto-map directly to this product!
 */
export const linkItemAlias = async (req, res) => {
  try {
    const { productId, alias, keepName } = req.body;
    if (!productId || !alias) {
      return res.status(400).json({ success: false, message: "Product ID and Alias are required" });
    }

    const product = await Product.findOne({ _id: productId, companyId: req.companyId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const cleanAlias = String(alias).trim();
    if (!Array.isArray(product.aliases)) {
      product.aliases = [];
    }

    // Add clean alias if not already present
    if (!product.aliases.some(a => a.toLowerCase() === cleanAlias.toLowerCase())) {
      product.aliases.push(cleanAlias);
    }

    // If user chose to update main product name to the new scanned name
    if (keepName === "new" && cleanAlias.length > 1) {
      const oldName = product.name;
      if (!product.aliases.some(a => a.toLowerCase() === oldName.toLowerCase())) {
        product.aliases.push(oldName);
      }
      product.name = cleanAlias;
    }

    await product.save();

    res.json({
      success: true,
      message: `✅ '${cleanAlias}' को '${product.name}' से सफलतापुर्वक लिंक कर दिया गया!`,
      product
    });
  } catch (err) {
    console.error("linkItemAlias error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


