import Razorpay from "razorpay";
import crypto from "crypto";
import Bill from "../model/bill.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";
import fs from "fs";
import Company from "../model/company.js"; // Import Company model
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payments will not work.");
}

// Create a payment order
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!razorpay) {
      return res.status(500).json({ success: false, error: "Razorpay is not configured on the server." });
    }

    const options = { amount: amount * 100, currency, receipt }; // amount in smallest currency unit
    const order = await razorpay.orders.create(options);

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
    const { partyId, amount, type, date, notes, paymentMethod } = req.body;
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const party = await Party.findOne({ _id: partyId, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });

    let debit = 0, credit = 0;
    if (type === 'received') {
      credit = amount;
      party.currentBalance -= amount; // Customer paid us, their outstanding balance decreases
    } else if (type === 'paid') {
      debit = amount;
      party.currentBalance += amount; // We gave udhar/paid supplier, balance increases
    }

    const transaction = new PartyTransaction({
      partyId,
      companyId: req.companyId,
      date: date ? new Date(date) : new Date(),
      details: notes || (type === 'received' ? 'Payment Received' : 'Payment Given'),
      debit,
      credit,
      type: 'manual'
    });

    await transaction.save();
    await party.save();

    res.status(201).json({ success: true, transaction, message: "Payment entry recorded successfully" });
  } catch (error) {
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
