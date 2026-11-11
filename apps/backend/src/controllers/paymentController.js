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

    const match = b64.match(/^data:(image\/.+);base64,(.+)$/);
    const dataPart = match ? match[2] : b64;
    const buffer = Buffer.from(dataPart, "base64");

    const tmpDir = os.tmpdir();
    const filepath = path.join(tmpDir, `statement_${Date.now()}.png`);
    fs.writeFileSync(filepath, buffer);

    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const { data: { text } } = await worker.recognize(filepath);
    await worker.terminate();

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedTransactions = [];
    
    for (const line of lines) {
      const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
      const nums = line.match(/\d+[.,]?\d*/g) || [];
      
      if (dateMatch && nums.length >= 1) {
        const date = dateMatch[0];
        const amount = parseFloat(nums[nums.length - 1].replace(/,/g, "")) || 0;
        const details = line.replace(date, "").replace(nums[nums.length - 1], "").trim() || "Parsed Entry";
        
        // Hum by default ise Udhar (debit) me daalenge. User app me review karke theek kar sakta hai.
        parsedTransactions.push({ date, details, debit: amount, credit: 0 });
      }
    }

    try { fs.unlinkSync(filepath); } catch (e) {}
    return res.json({ success: true, text, parsedTransactions });
  } catch (error) {
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
    const { partyId, transactions } = req.body;
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });

    let netBalanceChange = 0;
    const docsToInsert = transactions.map(t => {
      const deb = parseFloat(t.debit) || 0;
      const cred = parseFloat(t.credit) || 0;
      netBalanceChange += (deb - cred);
      return { partyId, companyId: req.companyId, date: t.date ? new Date(t.date) : new Date(), details: t.details || 'Parsed Entry', debit: deb, credit: cred, type: 'manual' };
    });

    await PartyTransaction.insertMany(docsToInsert);
    party.currentBalance += netBalanceChange;
    await party.save();

    res.status(201).json({ success: true, message: "Bulk entries recorded successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
