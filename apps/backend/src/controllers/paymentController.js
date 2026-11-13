import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Bill from "../model/bill.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";
import BankAccount from "../model/bankAccount.js";
import fs from "fs";
import Company from "../model/company.js"; // Import Company model
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseStatementRows } from "../bill-scanner/ocrExtractor.js";
import { syncPartyTxToSupabase, syncPartyToSupabase } from "../services/supabaseSyncService.js";
import { getPartyByIdFromSupabase } from "../services/supabaseReadService.js";

let razorpay;
const getRazorpayInstance = () => {
  if (!razorpay) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      console.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payments will not work.");
    }
  }
  return razorpay;
};

// Create a payment order
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const rzp = getRazorpayInstance();
    if (!rzp) {
      return res.status(500).json({ success: false, error: "Razorpay is not configured on the server." });
    }

    const options = { amount: amount * 100, currency, receipt }; // amount in smallest currency unit
    const order = await rzp.orders.create(options);

    if (!order) return res.status(500).send("Error creating order");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Parse uploaded statement/ledger image, run OCR and extract transactions
export const parseStatementImage = async (req, res) => {
  try {
    const b64 = req.body?.image;
    if (!b64) return res.status(400).json({ success: false, error: "No image provided" });

    const openAiKey = req.body?.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = req.body?.geminiApiKey || process.env.GEMINI_API_KEY;

    let mimeType = "image/png";
    let dataPart = b64;
    const match = b64.match(/^data:(image\/[a-zA-Z0-9.+/-]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      dataPart = match[2];
    }

    // 1. Try Gemini Vision for Multimodal Statement Parsing
    if (geminiKey) {
      const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
      const genAI = new GoogleGenerativeAI(geminiKey);
      const statementPrompt = `You are an expert Indian accounting ledger and party statement parser.
Read this statement/passbook/khata image carefully.
Extract the party name, and all transaction rows.
For each transaction row:
- date: formatted as YYYY-MM-DD or DD/MM/YYYY
- details: particulars / bill no / payment method / narration
- debit: amount in debit/Dr column (goods purchased or payment given) as a number, or 0
- credit: amount in credit/Cr column (goods returned or payment received/jama) as a number, or 0
- balance: running balance amount as a number, or 0

Return strictly valid JSON without markdown fences:
{
  "partyName": string or null,
  "openingBalance": number or null,
  "closingBalance": number or null,
  "transactions": [
    { "date": "YYYY-MM-DD", "details": string, "debit": number, "credit": number, "balance": number }
  ]
}`;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const imagePart = { inlineData: { data: dataPart, mimeType } };
          const result = await model.generateContent([statementPrompt, imagePart]);
          const respText = result.response.text();
          const cleanJson = respText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
            return res.json({
              success: true,
              source: `ai-vision-${modelName}`,
              partyName: (parsed.partyName || "").trim(),
              openingBalance: parsed.openingBalance || 0,
              closingBalance: parsed.closingBalance || 0,
              parsedTransactions: parsed.transactions.map(t => ({
                date: t.date || new Date().toISOString().split("T")[0],
                details: t.details || "खाता प्रविष्टि",
                debit: Number(t.debit) || 0,
                credit: Number(t.credit) || 0,
                balance: Number(t.balance) || 0
              })),
              text: respText
            });
          }
        } catch (gErr) {
          console.warn(`[parseStatementImage] Gemini ${modelName} note:`, gErr.message);
        }
      }
    }

    // 2. System Engine Fallback with Tesseract v5 & Smart Statement Parser
    const buffer = Buffer.from(dataPart, "base64");
    const tmpDir = os.tmpdir();
    const filepath = path.join(tmpDir, `statement_${Date.now()}.png`);
    fs.writeFileSync(filepath, buffer);

    let text = "";
    try {
      const worker = await createWorker("eng");
      const result = await worker.recognize(filepath);
      await worker.terminate();
      text = result?.data?.text || "";
    } catch (tessErr) {
      console.warn("[parseStatementImage] Tesseract note:", tessErr.message);
    } finally {
      try { fs.unlinkSync(filepath); } catch (e) {}
    }

    const parsedTransactions = parseStatementRows(text);

    return res.json({
      success: true,
      source: "system-engine",
      partyName: "",
      text,
      parsedTransactions
    });
  } catch (error) {
    console.error("[parseStatementImage] error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Add manual payment entry (Udhar/Jama from Mobile App)
export const addPaymentEntry = async (req, res) => {
  try {
    const { partyId, amount, type, date, notes, paymentMethod, bankAccountId } = req.body;
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    let party = null;
    if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
      party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    }
    if (!party) {
      party = await Party.findOne({
        companyId: req.companyId,
        $or: [
          { id: partyId },
          { name: partyId }
        ]
      });
    }
    if (!party) {
      try {
        const sbParty = await getPartyByIdFromSupabase(partyId, req.companyId);
        if (sbParty) party = sbParty;
      } catch (sbErr) {
        console.warn("[addPaymentEntry] Supabase fallback search warning:", sbErr.message);
      }
    }
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });

    const numAmount = parseFloat(amount) || 0;
    let debit = 0, credit = 0;

    // Resolve matching MongoDB party so partyId is always valid
    let mongoParty = null;
    if (party._id && mongoose.Types.ObjectId.isValid(party._id)) {
      mongoParty = party;
    } else if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
      mongoParty = await Party.findOne({ _id: partyId, companyId: req.companyId });
    }
    if (!mongoParty) {
      mongoParty = await Party.findOne({
        companyId: req.companyId,
        $or: [
          ...(party.name ? [{ name: party.name }, { name: { $regex: new RegExp(`^${party.name.trim()}$`, 'i') } }] : []),
          ...((party.mobile_number || party.mobileNumber) ? [{ mobileNumber: party.mobile_number || party.mobileNumber }] : [])
        ]
      });
    }

    if (!mongoParty) {
      // Create matching party in MongoDB to maintain 100% database parity
      mongoParty = new Party({
        companyId: req.companyId,
        name: party.name,
        mobileNumber: party.mobile_number || party.mobileNumber || "0000000000",
        address: party.billing_address || party.address || "Local",
        partyType: party.party_type || party.partyType || (type === 'paid' ? 'supplier' : 'customer'),
        openingBalance: Number(party.opening_balance || party.openingBalance || 0),
        currentBalance: Number(party.current_balance || party.currentBalance || 0)
      });
      await mongoParty.save();
    }

    const isSupplier = (party.partyType === 'supplier' || party.party_type === 'supplier' || party.type === 'supplier' || mongoParty?.partyType === 'supplier');
    let newPartyBal = 0;

    if (type === 'received') {
      credit = numAmount;
      const curBal = Number(mongoParty ? mongoParty.currentBalance : party.currentBalance) || 0;
      newPartyBal = curBal - numAmount; // Customer paid us, outstanding balance decreases

      if (mongoParty && (mongoParty.isCreditLimitActive || (mongoParty.creditLimit && mongoParty.creditLimit > 0))) {
        if (newPartyBal <= (mongoParty.creditLimit || 0)) {
          mongoParty.creditLimitStatus = "ACTIVE";
          mongoParty.creditLimitLockedReason = "";
        }
      }
    } else if (type === 'paid') {
      debit = numAmount;
      let curBal = Number(mongoParty ? mongoParty.currentBalance : (party.current_balance ?? party.currentBalance)) || 0;
      const opBal = Math.abs(Number(mongoParty ? mongoParty.openingBalance : (party.opening_balance ?? party.openingBalance ?? 0)));

      if (isSupplier) {
        // Supplier debt owed is negative. If balance was mistakenly saved as positive opening balance, normalize to -opBal
        if (curBal > 0 && curBal === opBal) {
          curBal = -opBal;
        }
        // Paying supplier increases negative balance towards 0 (-23572 + 23572 = 0)
        newPartyBal = curBal + numAmount;
      } else {
        // We gave credit/udhar to customer: balance increases
        newPartyBal = curBal + numAmount;
      }
    }

    if (mongoParty) {
      mongoParty.currentBalance = newPartyBal;
      mongoParty.balance = newPartyBal;
      mongoParty.updatedAt = new Date();
      await mongoParty.save();
    }

    party.currentBalance = newPartyBal;
    party.balance = newPartyBal;

    const safePartyId = mongoParty._id;
    const safeCompanyId = mongoose.Types.ObjectId.isValid(req.companyId)
      ? req.companyId
      : new mongoose.Types.ObjectId();

    const transaction = new PartyTransaction({
      partyId: safePartyId,
      companyId: safeCompanyId,
      date: date ? new Date(date) : new Date(),
      details: notes || (type === 'received' ? 'Payment Received' : 'Payment Given'),
      debit,
      credit,
      type: 'manual',
      paymentMethod: paymentMethod || 'cash'
    });

    try {
      await transaction.save();
    } catch (saveTxErr) {
      console.warn("[addPaymentEntry] transaction save note:", saveTxErr.message);
    }

    // 🏦 AUTO-SYNC WITH BANK ACCOUNT IF BANK OR UPI PAYMENT
    let bankUpdated = null;
    const normPayMethod = String(paymentMethod || '').toUpperCase();
    if (normPayMethod === 'BANK' || normPayMethod === 'UPI' || bankAccountId) {
      try {
        let bQuery = { companyId: req.companyId, isDeleted: { $ne: true } };
        if (bankAccountId) {
          bQuery = mongoose.Types.ObjectId.isValid(bankAccountId)
            ? { _id: bankAccountId }
            : { $or: [{ _id: bankAccountId }, { clientTempId: bankAccountId }] };
        } else {
          const defaultAcc = await BankAccount.findOne({ ...bQuery, isDefaultUPI: true }) || await BankAccount.findOne(bQuery);
          if (defaultAcc) bQuery = { _id: defaultAcc._id };
        }

        const bankAcc = await BankAccount.findOne(bQuery);
        if (bankAcc) {
          const pName = party.name || "व्यापारी";
          const txDate = date ? new Date(date) : new Date();
          if (type === 'paid') {
            bankAcc.transactions.push({
              date: txDate,
              type: 'party_payment',
              amount: numAmount,
              note: notes || `व्यापारी भुगतान: ${pName} (${normPayMethod || 'BANK'})`,
              referenceNo: `PAY-${Date.now().toString().slice(-6)}`
            });
            if (bankAcc.accountType === 'CC_OVERDRAFT') {
              bankAcc.currentOutstanding = (Number(bankAcc.currentOutstanding) || 0) + numAmount;
            } else {
              const newBal = (Number(bankAcc.currentBalance) || 0) - numAmount;
              bankAcc.currentBalance = newBal;
              bankAcc.balance = newBal;
            }
          } else if (type === 'received') {
            bankAcc.transactions.push({
              date: txDate,
              type: 'party_collection',
              amount: numAmount,
              note: notes || `व्यापारी से वसूली: ${pName} (${normPayMethod || 'BANK'})`,
              referenceNo: `REC-${Date.now().toString().slice(-6)}`
            });
            if (bankAcc.accountType === 'CC_OVERDRAFT') {
              bankAcc.currentOutstanding = Math.max(0, (Number(bankAcc.currentOutstanding) || 0) - numAmount);
            } else {
              const newBal = (Number(bankAcc.currentBalance) || 0) + numAmount;
              bankAcc.currentBalance = newBal;
              bankAcc.balance = newBal;
            }
          }
          await bankAcc.save();
          bankUpdated = bankAcc;
        }
      } catch (bankErr) {
        console.warn("[addPaymentEntry] Bank update error:", bankErr.message);
      }
    }

    // Async Supabase Dual-Write
    const sbPartyUuid = (party.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(party.id)))
      ? party.id
      : mongoIdToUuid(safePartyId);

    syncPartyTxToSupabase(transaction, sbPartyUuid).catch(e => console.warn("[Supabase Sync] Party Tx dual-write note:", e.message));
    syncPartyToSupabase(mongoParty || party).catch(e => console.warn("[Supabase Sync] Party dual-write note:", e.message));

    const availableLimit = party.creditLimit ? Math.max(0, party.creditLimit - (party.currentBalance || 0)) : 0;

    res.status(201).json({ 
      success: true, 
      transaction, 
      party,
      bankAccount: bankUpdated,
      availableLimit,
      message: type === 'received' 
        ? `भुगतान दर्ज हुआ! शेष बकाया: ₹${(party.currentBalance || 0).toLocaleString('en-IN')}${party.creditLimit ? ` | बची क्रेडिट लिमिट: ₹${availableLimit.toLocaleString('en-IN')}` : ''}`
        : "Payment entry recorded successfully" 
    });
  } catch (error) {
    console.error("[addPaymentEntry] error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk entry from OCR Statement Parser
export const addBulkPaymentEntry = async (req, res) => {
  try {
    const { partyId, partyName, partyType, transactions } = req.body;
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    if (!partyId && !partyName) return res.status(400).json({ success: false, message: "पार्टी चुनना आवश्यक है।" });
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: "कोई खाता प्रविष्टि नहीं मिली।" });
    }

    // 1. Resilient party lookup across MongoDB & Supabase
    let party = null;

    // Check MongoDB by ObjectId
    if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
      party = await Party.findOne({ _id: partyId, companyId: req.companyId }) || await Party.findById(partyId);
    }

    // Check Supabase by partyId
    if (!party && partyId) {
      try {
        const sbParty = await getPartyByIdFromSupabase(partyId, req.companyId);
        if (sbParty) party = sbParty;
      } catch (sbErr) {
        console.warn("[addBulkPaymentEntry] Supabase fallback search warning:", sbErr.message);
      }
    }

    // Search by name (either partyName passed or partyId passed as name)
    const searchName = (partyName && partyName.trim()) || (partyId && typeof partyId === 'string' && !mongoose.Types.ObjectId.isValid(partyId) && !partyId.includes('-') ? partyId.trim() : null);
    if (!party && searchName) {
      party = await Party.findOne({
        name: new RegExp(`^${searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        companyId: req.companyId
      });
    }

    // Search Supabase by name if still not found
    if (!party && searchName) {
      try {
        const { supabase } = await import("../config/supabase.js");
        if (supabase) {
          const { data: sbP } = await supabase
            .from("parties")
            .select("*")
            .eq("company_id", req.companyId)
            .ilike("name", searchName)
            .maybeSingle();
          if (sbP) party = sbP;
        }
      } catch (sbErr2) {
        console.warn("[addBulkPaymentEntry] Supabase name search warning:", sbErr2.message);
      }
    }

    // If partyId might be string match on id field
    if (!party && partyId) {
      party = await Party.findOne({ id: partyId, companyId: req.companyId });
    }

    // Resolve or create matching MongoDB party so partyId is ALWAYS a valid MongoDB ObjectId
    let mongoParty = null;
    if (party && party._id && mongoose.Types.ObjectId.isValid(party._id)) {
      mongoParty = party;
    } else if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
      mongoParty = await Party.findOne({ _id: partyId, companyId: req.companyId });
    }

    const effectiveName = (party?.name || searchName || partyName || "").trim();
    if (!mongoParty && effectiveName) {
      mongoParty = await Party.findOne({
        companyId: req.companyId,
        name: new RegExp(`^${effectiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
    }

    if (!mongoParty && (party || effectiveName)) {
      // Create matching party in MongoDB to maintain 100% database parity
      mongoParty = new Party({
        companyId: req.companyId,
        name: effectiveName || "अज्ञात पार्टी",
        mobileNumber: party?.mobile_number || party?.mobileNumber || "0000000000",
        address: party?.billing_address || party?.address || "Local",
        partyType: party?.party_type || party?.partyType || partyType || 'customer',
        openingBalance: Number(party?.opening_balance || party?.openingBalance || 0),
        currentBalance: Number(party?.current_balance || party?.currentBalance || 0)
      });
      await mongoParty.save();
    }

    if (!mongoParty) {
      return res.status(404).json({ success: false, message: "पार्टी नहीं मिली।" });
    }

    // Helper to safely parse Indian dates (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const parseSafeDate = (dStr) => {
      if (!dStr) return new Date();
      if (dStr instanceof Date && !isNaN(dStr.getTime())) return dStr;
      if (typeof dStr === 'string') {
        const trimmed = dStr.trim();
        const dmy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmy) {
          const day = parseInt(dmy[1], 10);
          const month = parseInt(dmy[2], 10) - 1;
          let year = parseInt(dmy[3], 10);
          if (year < 100) year += 2000;
          const dt = new Date(year, month, day);
          if (!isNaN(dt.getTime())) return dt;
        }
        const dt = new Date(trimmed);
        if (!isNaN(dt.getTime())) return dt;
      }
      return new Date();
    };

    const isSupplier = (mongoParty.partyType === 'supplier' || mongoParty.type === 'supplier' || party?.party_type === 'supplier');
    let netBalanceChange = 0;

    const docsToInsert = transactions.map(t => {
      const deb = parseFloat(t.debit) || 0;
      const cred = parseFloat(t.credit) || 0;
      if (isSupplier) {
        netBalanceChange += (cred - deb);
      } else {
        netBalanceChange += (deb - cred);
      }
      return {
        partyId: mongoParty._id,
        companyId: req.companyId,
        date: parseSafeDate(t.date),
        details: (t.details && String(t.details).trim()) || 'खाता प्रविष्टि',
        debit: deb,
        credit: cred,
        type: 'manual'
      };
    });

    const insertedDocs = await PartyTransaction.insertMany(docsToInsert);
    mongoParty.currentBalance = (Number(mongoParty.currentBalance) || 0) + netBalanceChange;
    mongoParty.updatedAt = new Date();
    await mongoParty.save();

    // Async sync to Supabase
    const sbPartyUuid = (party && party.id && String(party.id).includes('-')) ? party.id : null;
    syncPartyToSupabase(mongoParty).catch(e => console.warn("[Supabase Sync] Bulk party note:", e.message));
    insertedDocs.forEach(doc => {
      syncPartyTxToSupabase(doc, sbPartyUuid).catch(e => console.warn("[Supabase Sync] Bulk tx note:", e.message));
    });

    res.status(201).json({
      success: true,
      message: "Bulk entries recorded successfully",
      count: insertedDocs.length,
      partyId: mongoParty._id,
      partyName: mongoParty.name,
      currentBalance: mongoParty.currentBalance
    });
  } catch (error) {
    console.error("[addBulkPaymentEntry] Error:", error);
    res.status(500).json({ success: false, error: error.message, message: error.message });
  }
};

// Verify payment signature
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature, billId } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay is not configured on the server." });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (generated_signature === signature) {
      // Payment is successful.
      // If this payment is for a subscription upgrade, update company plan.
      // Assuming `billId` can also be used to identify a subscription payment (e.g., a dummy bill for subscription)
      // Or, better, pass a `subscriptionPlan` field in req.body for clarity.
      const company = await Company.findById(req.companyId); // Assuming req.companyId is available
      if (company) {
        company.plan = 'premium';
        company.subscriptionExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year subscription
        await company.save();
      }
      // If it's a regular bill payment, update bill status
      if (billId) await Bill.findByIdAndUpdate(billId, { status: "paid", paymentMethod: "online", notes: `Paid via Razorpay. Payment ID: ${payment_id}` });
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
