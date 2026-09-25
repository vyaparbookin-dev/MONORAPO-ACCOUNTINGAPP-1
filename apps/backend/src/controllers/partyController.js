import Party from "../model/party.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import mongoose from "mongoose";

export const createParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { name, mobileNumber, address } = req.body;
    if (!name || !mobileNumber || !address) {
      return res.status(400).json({ success: false, error: "Name, Mobile, and Address are required" });
    }

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Duplicate check: Same name and same address
    const duplicateByNameAndAddr = await Party.findOne({
      companyId: req.companyId,
      isActive: true,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
      address: { $regex: new RegExp(`^${escapeRegex(trimmedAddress)}$`, "i") }
    });
    if (duplicateByNameAndAddr) {
      return res.status(400).json({
        success: false,
        error: `पार्टी '${trimmedName}' (पता: '${trimmedAddress}') पहले से मौजूद है! एक ही नाम और पते से दोबारा खाता नहीं बनाया जा सकता।`
      });
    }

    // 2. Duplicate check: Same mobile number
    const existingParty = await Party.findOne({ mobileNumber, companyId: req.companyId, isActive: true });
    if (existingParty) {
      return res.status(400).json({ success: false, error: "Party with this mobile already exists" });
    }

    const party = new Party({ ...req.body, companyId: req.companyId });
    await party.save();
    res.status(201).json({ success: true, party, message: `Party ${name} created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Bulk create parties from Excel / JSON import
 * @route   POST /api/party/bulk-create
 * @access  Private
 */
export const bulkCreateParties = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { parties } = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ success: false, error: "No parties array provided" });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdParties = [];

    // Fetch existing active parties to avoid duplicates
    const existing = await Party.find({ companyId: req.companyId, isActive: true }).select("name mobileNumber address");
    const existingNames = new Set(existing.map(p => (p.name || "").trim().toLowerCase()));
    const existingMobiles = new Set(existing.filter(p => p.mobileNumber).map(p => (p.mobileNumber || "").trim()));

    for (const p of parties) {
      const name = (p.name || p.PartyName || "").trim();
      if (!name) {
        skippedCount++;
        continue;
      }

      const mobile = (p.mobileNumber || p.phone || p.MobileNumber || "").trim();
      const addr = (p.address || p.Address || "Local").trim();
      const lowerName = name.toLowerCase();

      // Skip duplicate name
      if (existingNames.has(lowerName)) {
        skippedCount++;
        continue;
      }
      if (mobile && existingMobiles.has(mobile)) {
        skippedCount++;
        continue;
      }

      const rawType = (p.partyType || p.type || p.PartyType || "customer").toLowerCase();
      const isSupplier = rawType.includes("sup") || rawType.includes("लेनदार") || rawType.includes("vendor");
      const isPersonal = rawType.includes("per") || rawType.includes("पर्सनल");
      const partyType = isSupplier ? "supplier" : isPersonal ? "personal" : "customer";

      const rawBal = parseFloat(p.openingBalance || p.OpeningBalance || p.balance || 0) || 0;
      const balanceType = (p.balanceType || p.BalanceType || "").toUpperCase();
      
      // If balanceType is 'PAY' or 'देने हैं' -> negative balance
      // If balanceType is 'RECEIVE' or 'लेने हैं' -> positive balance
      // If not specified: customer is positive (to receive), supplier is negative (to pay)
      let finalBalance = rawBal;
      if (balanceType.includes("PAY") || balanceType.includes("देने")) {
        finalBalance = -Math.abs(rawBal);
      } else if (balanceType.includes("REC") || balanceType.includes("लेने")) {
        finalBalance = Math.abs(rawBal);
      } else {
        finalBalance = isSupplier ? -Math.abs(rawBal) : Math.abs(rawBal);
      }

      const newPartyDoc = new Party({
        name,
        mobileNumber: mobile || `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: addr,
        partyType,
        priceLevel: p.priceLevel || "retail",
        openingBalance: Math.abs(finalBalance),
        currentBalance: finalBalance,
        balance: finalBalance,
        creditLimit: parseFloat(p.creditLimit || p.CreditLimit || 0) || 0,
        gstin: (p.gstin || p.GSTIN || "").trim(),
        companyId: req.companyId,
        isActive: true
      });

      await newPartyDoc.save();
      createdParties.push(newPartyDoc);
      existingNames.add(lowerName);
      if (mobile) existingMobiles.add(mobile);
      createdCount++;
    }

    res.status(200).json({
      success: true,
      count: createdCount,
      skippedCount,
      parties: createdParties,
      message: `✅ कुल ${createdCount} पार्टियां सफलतापूर्वक जोड़ी गईं! (${skippedCount} डुप्लीकेट छोड़ी गईं)`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get quick summary for a party (last purchase date and amount)
 * @route   GET /api/parties/:id/quick-summary
 * @access  Private
 */
export const getPartyQuickSummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;

    // Find the last bill for this party
    const lastBill = await Bill.findOne({
      partyId: mongoose.Types.ObjectId.isValid(id) ? { $in: [id, new mongoose.Types.ObjectId(id)] } : id,
      companyId: req.companyId,
      isDeleted: false,
    })
    .sort({ date: -1 }) // Sort by date descending to get the latest
    .select('date finalAmount total billNumber') // Select only necessary fields
    .lean();

    res.json({
      success: true,
      summary: lastBill ? {
        lastPurchaseDate: lastBill.date,
        lastPurchaseAmount: lastBill.finalAmount || lastBill.total,
        lastBillNumber: lastBill.billNumber,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartySummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;
    const party = await Party.findOne({ _id: id, companyId: req.companyId }).lean();    
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const bills = await Bill.find({ partyId: id, companyId: req.companyId, isDeleted: false }).sort({ date: 1 }).lean();
    const Return = mongoose.models.Return || mongoose.model('Return'); // Prevent OverwriteModelError

    if (bills.length === 0) {
      return res.json({ success: true, summary: { ...party, lifetimeValue: 0, visitCount: 0, topProducts: [] } });
    }

    const lifetimeValue = bills.reduce((sum, bill) => sum + (bill.finalAmount || bill.total || 0), 0);
    const firstVisit = bills[0].date;
    const lastVisit = bills[bills.length - 1].date;

    const productFrequency = new Map();
    bills.forEach(bill => {
      if (Array.isArray(bill.items)) {
        bill.items.forEach(item => {
          const name = item.name || "Unknown Product";
          productFrequency.set(name, (productFrequency.get(name) || 0) + (item.quantity || 1));
        });
      }
    });

    const topProducts = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // --- NEW: Calculate Return History & Recent Transactions ---
    const returns = await Return.find({ partyId: id, companyId: req.companyId, type: 'sales_return', isDeleted: { $ne: true } }).sort({ date: -1 }).lean();
    const totalReturnValue = returns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const returnCount = returns.length;

    const billHistory = bills.map(b => ({
        type: 'Sale',
        date: b.date,
        details: `Invoice #${b.billNumber || b._id.toString().slice(-4)}`,
        amount: b.finalAmount || b.total || 0
    }));
    const returnHistory = returns.map(r => ({
        type: 'Return',
        date: r.date,
        details: `Return #${r.returnNumber || r._id.toString().slice(-4)}`,
        amount: -(r.totalAmount || 0) // Negative amount for returns
    }));
    const transactionHistory = [...billHistory, ...returnHistory]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // Send last 5 transactions

    res.json({
      success: true,
      summary: {
        ...party,
        lifetimeValue,
        visitCount: bills.length,
        firstVisit,
        lastVisit,
        topProducts,
        totalReturnValue,
        returnCount,
        transactionHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyStatement = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`^${escapeRegex(party.name)}$`, "i");

    const coIdStr = String(req.companyId);
    const coQuery = [coIdStr];
    if (mongoose.Types.ObjectId.isValid(coIdStr)) {
      coQuery.push(new mongoose.Types.ObjectId(coIdStr));
    }

    const pIdStr = String(party._id);
    const pIdQuery = [pIdStr];
    if (mongoose.Types.ObjectId.isValid(pIdStr)) {
      pIdQuery.push(new mongoose.Types.ObjectId(pIdStr));
    }

    // 1. Direct Party Transactions (Cash/Bank Payments & Receipts)
    const txRecords = await PartyTransaction.find({
      partyId: { $in: pIdQuery },
      companyId: { $in: coQuery },
      isDeleted: { $ne: true }
    }).lean();

    // 2. Sales Bills for this party
    const billFilter = {
      companyId: { $in: coQuery },
      isDeleted: { $ne: true },
      $or: [
        { partyId: { $in: pIdQuery } },
        { customerName: nameRegex },
        { partyName: nameRegex },
        { customer: nameRegex }
      ]
    };
    if (party.mobileNumber && party.mobileNumber.length >= 10) {
      billFilter.$or.push({ customerMobile: party.mobileNumber }, { customerPhone: party.mobileNumber });
    }
    const billRecords = await Bill.find(billFilter).lean();

    // 3. Purchase Bills for this party (if supplier)
    const purchaseFilter = {
      companyId: { $in: coQuery },
      isDeleted: { $ne: true },
      $or: [
        { partyId: { $in: pIdQuery } },
        { supplierName: nameRegex },
        { supplier: nameRegex },
        { partyName: nameRegex }
      ]
    };
    const purchaseRecords = await Purchase.find(purchaseFilter).lean();

    // Track existing bill IDs and refNos to prevent double-counting
    const existingRefBillIds = new Set();
    txRecords.forEach(t => {
      if (t.referenceBillId) existingRefBillIds.add(String(t.referenceBillId));
      if (t.billNumber) existingRefBillIds.add(String(t.billNumber));
      if (t.refNo) existingRefBillIds.add(String(t.refNo));
    });

    const ledgerEntries = [];

    // Process manual / direct payments
    for (const tx of txRecords) {
      ledgerEntries.push({
        _id: tx._id,
        date: tx.date || tx.createdAt,
        type: tx.type || (tx.credit > 0 ? "receipt" : "payment"),
        refNo: tx.refNo || tx.billNumber || "PAY",
        details: tx.details || (tx.credit > 0 ? "मुझे मिले (जमा)" : "मैंने दिए (भुगतान)"),
        siteName: tx.siteName || "",
        debit: Number(tx.debit || 0),
        credit: Number(tx.credit || 0),
        billImageUrl: tx.billImageUrl || "",
        source: "PartyTransaction"
      });
    }

    // Process sales bills
    for (const b of billRecords) {
      const bNum = String(b.billNumber || "");
      const bId = String(b._id || "");
      const refNum = String(b.refBillNo || "");
      if (existingRefBillIds.has(bNum) || existingRefBillIds.has(bId) || (refNum && existingRefBillIds.has(refNum))) continue;

      const finalAmt = Number(b.finalAmount ?? b.total ?? 0);
      const isPaid = String(b.paymentStatus || b.status || "").toLowerCase() === "paid";
      const paidAmt = isPaid ? finalAmt : Number(b.amountPaid || b.advanceAmount || b.receivedAmount || 0);

      const itemsSummary = (b.items && b.items.length > 0)
        ? `: ${b.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || 'pcs'})` : ''}`).slice(0, 3).join(', ')}${b.items.length > 3 ? '...' : ''}`
        : '';

      // 1. Bill Entry (Debit to customer)
      ledgerEntries.push({
        _id: b._id,
        date: b.date || b.createdAt,
        type: "sale",
        refNo: bNum || "BILL",
        billNumber: bNum,
        billAmount: finalAmt,
        paidAmount: paidAmt,
        items: b.items || [],
        details: `बिक्री बिल #${bNum} (${(b.items || []).length} सामान)${itemsSummary}`,
        siteName: b.siteName || "",
        debit: finalAmt,
        credit: 0,
        billImageUrl: b.billImageUrl || "",
        paymentMethod: b.paymentMode || b.paymentMethod || "CASH",
        source: "Bill"
      });

      // 2. If any amount was paid/jama at bill time or if bill was paid, record Payment (Credit)
      if (paidAmt > 0) {
        ledgerEntries.push({
          _id: `pay_${b._id}`,
          date: b.date || b.createdAt,
          type: "payment",
          refNo: bNum ? `REC-${bNum}` : "REC",
          billNumber: bNum,
          details: `बिल #${bNum} पर नकद/UPI जमा (Payment Received)`,
          siteName: b.siteName || "",
          debit: 0,
          credit: paidAmt,
          billImageUrl: b.billImageUrl || "",
          paymentMethod: b.paymentMode || b.paymentMethod || "CASH",
          source: "BillPayment"
        });
      }
    }

    // Process purchase bills
    for (const p of purchaseRecords) {
      const pNum = String(p.billNumber || p.invoiceNo || p.purchaseNumber || "PUR");
      const pId = String(p._id || "");
      if (existingRefBillIds.has(pNum) || existingRefBillIds.has(pId)) continue;

      const totalAmt = Number(p.totalAmount ?? p.total ?? 0);
      ledgerEntries.push({
        _id: p._id,
        date: p.date || p.createdAt,
        type: "purchase",
        refNo: pNum,
        details: `खरीद इनवॉइस #${pNum}`,
        debit: 0,
        credit: totalAmt,
        billImageUrl: p.billImageUrl || p.receiptUrl || "",
        source: "Purchase"
      });
    }

    // Sort chronologically ascending (oldest first) to compute running balance accurately
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBal = Number(party.openingBalance || 0);
    const openingBal = runningBal;

    const formattedTransactions = [];

    // --- INCLUDE OPENING BALANCE AS THE VERY FIRST LINE ITEM ---
    if (openingBal !== 0) {
      const isSupplier = (party.partyType === "supplier");
      const isPayable = openingBal < 0 || isSupplier;
      const absOpening = Math.abs(openingBal);
      formattedTransactions.push({
        _id: `open_${party._id}`,
        date: party.createdAt || new Date(2026, 0, 1),
        type: isPayable ? "purchase" : "sale",
        refNo: "OPENING",
        billNumber: "OPENING-BILL",
        details: isPayable 
          ? `प्रारंभिक शेष / बिल (Opening Balance / Bill)` 
          : `प्रारंभिक शेष / बिल (Opening Balance / Bill)`,
        debit: isPayable ? 0 : absOpening,
        credit: isPayable ? absOpening : 0,
        runningBalance: openingBal,
        source: "OpeningBalance"
      });
    }

    ledgerEntries.forEach(entry => {
      const isSupplier = (party.partyType === "supplier");
      if (isSupplier) {
        runningBal += (entry.debit - entry.credit);
      } else {
        runningBal += (entry.debit - entry.credit);
      }
      formattedTransactions.push({
        ...entry,
        runningBalance: runningBal
      });
    });

    // Reverse to descending (latest on top) for convenient display
    formattedTransactions.reverse();

    const totalDebit = ledgerEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = ledgerEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);

    res.json({
      success: true,
      party,
      openingBalance: openingBal,
      currentBalance: party.currentBalance ?? runningBal,
      totalDebit,
      totalCredit,
      transactions: formattedTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const attachPartyTransactionImage = async (req, res) => {
  try {
    const { txId, imageUrl } = req.body;
    if (!txId || !imageUrl) {
      return res.status(400).json({ success: false, error: "Transaction ID and Image URL are required" });
    }
    let updated = await PartyTransaction.findByIdAndUpdate(txId, { billImageUrl: imageUrl }, { new: true });
    if (!updated) {
      updated = await Bill.findByIdAndUpdate(txId, { billImageUrl: imageUrl }, { new: true });
    }
    res.json({ success: true, message: "बिल फोटो सफलतापूर्वक सेव हो गया!", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listParties = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { type } = req.query;
    const filter = { isActive: true, companyId: req.companyId };

    // FIXED: When filtering by type, don't exclude personal parties via this filter.
    // Personal parties should always be fetchable. Type filter is applied only for
    // "customer"/"supplier" - personal parties have their own dedicated filter on frontend.
    if (type && type !== "all" && type !== "personal") {
      filter.partyType = { $in: [type, "both"] };
    } else if (type === "personal") {
      filter.partyType = "personal";
    }
    // If type === "all" or no type, fetch everything (all party types including personal)

    // FIXED: Include openingBalance, currentBalance so balance shows up properly in list
    const parties = await Party.find(filter).select(
      "_id name mobileNumber phone address gstNumber partyType openingBalance currentBalance creditLimit notes"
    );
    res.json({ success: true, parties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (req.body.name && req.body.address) {
      const trimmedName = req.body.name.trim();
      const trimmedAddress = req.body.address.trim();
      const duplicateParty = await Party.findOne({
        _id: { $ne: req.params.id },
        companyId: req.companyId,
        isActive: true,
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
        address: { $regex: new RegExp(`^${escapeRegex(trimmedAddress)}$`, "i") }
      });
      if (duplicateParty) {
        return res.status(400).json({
          success: false,
          error: `पार्टी '${trimmedName}' (पता: '${trimmedAddress}') पहले से मौजूद है! एक ही नाम और पते से डुप्लीकेट नहीं बनाया जा सकता।`
        });
      }
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party, message: "Party updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isActive: false },
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    // Cascade soft-delete party transactions so they do not show up as ghost duplicates
    await PartyTransaction.updateMany(
      { partyId: req.params.id, companyId: req.companyId },
      { $set: { isDeleted: true } }
    );

    res.json({ success: true, message: "Party deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
