import Party from "../model/party.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import Product from "../model/product.js";
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

    // 1. Duplicate check: Same name and same address among ACTIVE parties
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

    // 2. Duplicate check: Same mobile number among ACTIVE parties
    const existingParty = await Party.findOne({ mobileNumber, companyId: req.companyId, isActive: true });
    if (existingParty) {
      return res.status(400).json({ success: false, error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!" });
    }

    // 3. Check if a previously deleted / inactive party exists with this mobile number or name
    const inactiveParty = await Party.findOne({
      companyId: req.companyId,
      isActive: false,
      $or: [
        { mobileNumber },
        { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") } }
      ]
    });

    const rawType = (req.body.partyType || req.body.type || "customer").toLowerCase();
    const isSupplier = rawType === "supplier" || rawType.includes("sup") || rawType.includes("vendor") || rawType.includes("लेनदार");
    const isPersonal = rawType === "personal" || rawType.includes("पर्सनल");
    const finalPartyType = isSupplier ? "supplier" : isPersonal ? "personal" : (rawType === "both" ? "both" : "customer");

    const rawBal = parseFloat(req.body.openingBalance ?? req.body.balance ?? 0) || 0;
    const bType = String(req.body.balanceType || req.body.balanceDir || "").toUpperCase();

    let finalBalance = rawBal;
    if (bType.includes("PAY") || bType.includes("देने") || bType.includes("NEG")) {
      finalBalance = -Math.abs(rawBal);
    } else if (bType.includes("REC") || bType.includes("लेने") || bType.includes("POS")) {
      finalBalance = Math.abs(rawBal);
    } else if (req.body.currentBalance !== undefined && req.body.currentBalance !== null && !isNaN(Number(req.body.currentBalance))) {
      const cb = Number(req.body.currentBalance);
      finalBalance = (isSupplier && cb > 0) ? -Math.abs(cb) : cb;
    } else {
      finalBalance = isSupplier ? -Math.abs(rawBal) : Math.abs(rawBal);
    }

    if (inactiveParty) {
      // Re-activate and update the deleted party slot with new details
      inactiveParty.name = trimmedName;
      inactiveParty.address = trimmedAddress;
      inactiveParty.mobileNumber = mobileNumber;
      inactiveParty.partyType = finalPartyType;
      inactiveParty.contactPerson = req.body.contactPerson || "";
      inactiveParty.email = req.body.email || "";
      inactiveParty.alternatePhone = req.body.alternatePhone || "";
      inactiveParty.gstNumber = req.body.gstNumber || undefined;
      inactiveParty.panNumber = req.body.panNumber || "";
      inactiveParty.creditLimit = Number(req.body.creditLimit || 0);
      inactiveParty.openingBalance = Math.abs(rawBal);
      inactiveParty.currentBalance = finalBalance;
      inactiveParty.notes = req.body.notes || "";
      inactiveParty.isActive = true;
      inactiveParty.updatedAt = new Date();
      await inactiveParty.save();
      return res.status(201).json({ success: true, party: inactiveParty, message: `Party ${name} created successfully!` });
    }

    const party = new Party({
      ...req.body,
      companyId: req.companyId,
      partyType: finalPartyType,
      openingBalance: Math.abs(rawBal),
      currentBalance: finalBalance
    });
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
      const bNum = String(b.billNumber || b.invoiceNumber || b.id || b._id || "BILL");
      const bId = String(b._id || "");
      const invNo = String(b.invoiceNumber || "");

      // If this bill was already recorded in party transactions, skip adding duplicate debit entry
      const alreadyInTx = existingRefBillIds.has(bNum) || existingRefBillIds.has(bId) || (invNo && existingRefBillIds.has(invNo));

      const finalAmt = Number(b.finalAmount ?? b.total ?? 0);
      const isPaid = String(b.paymentStatus || b.status || "").toLowerCase() === "paid";
      const paidAmt = isPaid ? finalAmt : Number(b.amountPaid || b.advanceAmount || b.receivedAmount || 0);

      const itemsSummary = (b.items && b.items.length > 0)
        ? `: ${b.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || 'pcs'})` : ''}`).slice(0, 3).join(', ')}${b.items.length > 3 ? '...' : ''}`
        : '';

      const isCreditBill = b.paymentMethod === 'credit' || b.paymentMode === 'UDHAR' || b.paymentMode === 'CREDIT' || b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial';

      // 1. Bill Entry (Debit to customer) - only add if not already in PartyTransaction
      if (!alreadyInTx) {
        ledgerEntries.push({
          _id: b._id,
          date: b.date || b.createdAt,
          type: "sale",
          refNo: bNum,
          billNumber: bNum,
          billAmount: finalAmt,
          paidAmount: paidAmt,
          items: b.items || [],
          details: `बिक्री बिल #${bNum} (${isCreditBill ? 'उधार' : 'नकद'})${itemsSummary}`,
          siteName: b.siteName || "",
          debit: finalAmt,
          credit: 0,
          billImageUrl: b.billImageUrl || "",
          paymentMethod: isCreditBill ? "UDHAR" : (b.paymentMode || b.paymentMethod || "CASH"),
          source: "Bill"
        });
      }

      // 2. If any amount was paid/jama at bill time or if bill was paid, record Payment (Credit) IF NOT already in txRecords
      const payRef = `REC-${bNum}`;
      if (paidAmt > 0 && !existingRefBillIds.has(payRef) && !existingRefBillIds.has(`pay_${bId}`)) {
        ledgerEntries.push({
          _id: `pay_${b._id}`,
          date: b.date || b.createdAt,
          type: "payment",
          refNo: payRef,
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

    const isSupplier = (party.partyType === "supplier");
    const rawOpening = Number(party.openingBalance || 0);
    // Opening balance for supplier is payable (negative / credit)
    const openingBal = isSupplier ? -Math.abs(rawOpening) : Math.abs(rawOpening);
    let runningBal = openingBal;

    const formattedTransactions = [];

    // --- INCLUDE OPENING BALANCE AS THE VERY FIRST LINE ITEM ---
    if (rawOpening !== 0) {
      const isPayable = openingBal < 0 || isSupplier;
      const absOpening = Math.abs(rawOpening);
      formattedTransactions.push({
        _id: `open_${party._id}`,
        date: party.createdAt || new Date(2026, 0, 1),
        type: isPayable ? "purchase" : "sale",
        refNo: "OPENING",
        billNumber: "OPENING-BILL",
        details: isPayable 
          ? `प्रारंभिक शेष / बिल (Opening Balance: देने हैं)` 
          : `प्रारंभिक शेष / बिल (Opening Balance: लेने हैं)`,
        debit: isPayable ? 0 : absOpening,
        credit: isPayable ? absOpening : 0,
        runningBalance: isPayable ? -absOpening : absOpening,
        source: "OpeningBalance"
      });
    }

    ledgerEntries.forEach(entry => {
      runningBal += (entry.debit - entry.credit);
      formattedTransactions.push({
        ...entry,
        runningBalance: runningBal
      });
    });

    // Reverse to descending (latest on top) for convenient display
    formattedTransactions.reverse();

    const totalDebit = ledgerEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = ledgerEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);

    // Ground truth balance of the party is the actual running balance of all active transactions!
    // Auto-sync party currentBalance in DB so it NEVER gets stuck on stale / out-of-sync values
    if (party.currentBalance !== runningBal) {
      party.currentBalance = runningBal;
      party.updatedAt = new Date();
      party.save().catch(e => console.warn("Failed to auto-sync party balance:", e));
    }

    res.json({
      success: true,
      party: {
        ...(party.toObject ? party.toObject() : party),
        currentBalance: runningBal
      },
      openingBalance: openingBal,
      currentBalance: runningBal,
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

export const deletePartyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    // 1. Check if it's an opening balance row (open_partyId)
    if (String(id).startsWith("open_")) {
      const pId = String(id).replace("open_", "");
      const party = await Party.findOne({ _id: pId, companyId: req.companyId });
      if (party) {
        const isSupplier = (party.partyType === "supplier");
        const rawOpening = Number(party.openingBalance || 0);
        const openingBal = isSupplier ? -Math.abs(rawOpening) : Math.abs(rawOpening);
        party.openingBalance = 0;
        party.currentBalance = (Number(party.currentBalance) || 0) - openingBal;
        party.updatedAt = new Date();
        await party.save();
        return res.json({
          success: true,
          message: "प्रारंभिक शेष (Opening Balance) हटा दिया गया!",
          newBalance: party.currentBalance
        });
      }
    }

    // 2. Check PartyTransaction
    const tx = await PartyTransaction.findOne({ _id: id, companyId: req.companyId });
    if (tx) {
      // Soft delete transaction
      tx.isDeleted = true;
      tx.updatedAt = new Date();
      await tx.save();

      // Revert party balance
      const party = await Party.findOne({ _id: tx.partyId, companyId: req.companyId });
      if (party) {
        const deb = Number(tx.debit) || 0;
        const cred = Number(tx.credit) || 0;
        // Revert: subtract debit, add credit
        party.currentBalance = (Number(party.currentBalance) || 0) - (deb - cred);
        party.updatedAt = new Date();
        await party.save();
      }

      // CASCADE: If this transaction was linked to a Purchase, revert stock too
      if (tx.referenceBillId) {
        try {
          const linkedPurchase = await Purchase.findOne({ 
            _id: tx.referenceBillId, 
            companyId: req.companyId,
            isDeleted: { $ne: true }
          });
          if (linkedPurchase) {
            // Revert inventory stock
            if (Array.isArray(linkedPurchase.items)) {
              for (const item of linkedPurchase.items) {
                if (item.productId && Number(item.quantity) > 0) {
                  await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { currentStock: -Number(item.quantity) } }
                  );
                }
              }
            }
            // Mark purchase as deleted
            linkedPurchase.isDeleted = true;
            linkedPurchase.updatedAt = new Date();
            await linkedPurchase.save();
            
            // Also soft-delete any other PartyTransactions linked to this purchase
            await PartyTransaction.updateMany(
              { 
                referenceBillId: linkedPurchase._id, 
                companyId: req.companyId,
                _id: { $ne: tx._id } // Don't re-process current tx
              },
              { $set: { isDeleted: true } }
            );
          }
        } catch (cascadeErr) {
          console.warn("Purchase cascade deletion warning:", cascadeErr.message);
        }
      }

      return res.json({
        success: true,
        message: "लेनदेन सफलतापूर्वक हटा दिया गया!",
        newBalance: party?.currentBalance
      });
    }

    // 3. Check if it's a Bill
    const bill = await Bill.findOne({ _id: id, companyId: req.companyId });
    if (bill) {
      bill.isDeleted = true;
      bill.status = "cancelled";
      bill.updatedAt = new Date();
      await bill.save();

      if (bill.partyId) {
        const party = await Party.findOne({ _id: bill.partyId, companyId: req.companyId });
        if (party) {
          const finalAmt = Number(bill.finalAmount || bill.total || 0);
          party.currentBalance = (Number(party.currentBalance) || 0) - finalAmt;
          party.updatedAt = new Date();
          await party.save();
        }
      }

      return res.json({
        success: true,
        message: "बिल प्रविष्टि सफलतापूर्वक हटा दी गई!"
      });
    }

    return res.status(404).json({ success: false, error: "लेनदेन (Transaction) नहीं मिला" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePartyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { amount, type, details, date, paymentMethod } = req.body;

    // 1. If opening balance (open_partyId)
    if (String(id).startsWith("open_")) {
      const pId = String(id).replace("open_", "");
      const party = await Party.findOne({ _id: pId, companyId: req.companyId });
      if (party) {
        const isSupplier = (party.partyType === "supplier");
        const oldOpening = isSupplier ? -Math.abs(party.openingBalance || 0) : Math.abs(party.openingBalance || 0);
        const newOpeningVal = Number(amount || 0);
        const newOpening = isSupplier ? -Math.abs(newOpeningVal) : Math.abs(newOpeningVal);

        party.openingBalance = Math.abs(newOpeningVal);
        party.currentBalance = (Number(party.currentBalance) || 0) - oldOpening + newOpening;
        party.updatedAt = new Date();
        await party.save();
        return res.json({
          success: true,
          message: "प्रारंभिक शेष (Opening Balance) सफलतापूर्वक अपडेट हो गया!",
          newBalance: party.currentBalance
        });
      }
    }

    // 2. Check PartyTransaction
    const tx = await PartyTransaction.findOne({ _id: id, companyId: req.companyId });
    if (tx) {
      const oldDeb = Number(tx.debit || 0);
      const oldCred = Number(tx.credit || 0);

      const amt = Number(amount !== undefined ? amount : (oldDeb > 0 ? oldDeb : oldCred));
      const isPaid = type ? (type === 'paid' || type === 'payment' || type === 'debit') : (oldDeb > 0);

      const newDeb = isPaid ? amt : 0;
      const newCred = isPaid ? 0 : amt;

      tx.debit = newDeb;
      tx.credit = newCred;
      if (details !== undefined) tx.details = details;
      if (date) tx.date = new Date(date);
      if (paymentMethod) tx.paymentMethod = paymentMethod;
      tx.updatedAt = new Date();
      await tx.save();

      // Update party currentBalance: revert old net, add new net
      const party = await Party.findOne({ _id: tx.partyId, companyId: req.companyId });
      if (party) {
        const netDiff = (newDeb - newCred) - (oldDeb - oldCred);
        party.currentBalance = (Number(party.currentBalance) || 0) + netDiff;
        party.updatedAt = new Date();
        await party.save();
      }

      return res.json({
        success: true,
        message: "लेनदेन सफलतापूर्वक संपादित (Update) हो गया!",
        transaction: tx,
        newBalance: party?.currentBalance
      });
    }

    // 3. Check if it's a Bill
    const bill = await Bill.findOne({ _id: id, companyId: req.companyId });
    if (bill) {
      const oldAmt = Number(bill.finalAmount || bill.total || 0);
      const newAmt = Number(amount !== undefined ? amount : oldAmt);
      const diff = newAmt - oldAmt;

      bill.finalAmount = newAmt;
      bill.total = newAmt;
      if (details) bill.notes = details;
      if (date) bill.date = new Date(date);
      bill.updatedAt = new Date();
      await bill.save();

      if (bill.partyId) {
        const party = await Party.findOne({ _id: bill.partyId, companyId: req.companyId });
        if (party) {
          party.currentBalance = (Number(party.currentBalance) || 0) + diff;
          party.updatedAt = new Date();
          await party.save();
        }
      }

      return res.json({
        success: true,
        message: "बिल सफलतापूर्वक अपडेट हो गया!",
        bill
      });
    }

    return res.status(404).json({ success: false, error: "लेनदेन (Transaction) नहीं मिला" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearPartyBalance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "पार्टी नहीं मिली" });

    const currentBal = Number(party.currentBalance || 0);
    if (currentBal !== 0) {
      // Record a settlement transaction so ledger mathematically balances to ₹0
      const settleTx = new PartyTransaction({
        partyId: party._id,
        companyId: req.companyId,
        date: new Date(),
        details: "खाता चुकता / सेटलमेंट (Account Settled to ₹0)",
        debit: currentBal < 0 ? Math.abs(currentBal) : 0,
        credit: currentBal > 0 ? Math.abs(currentBal) : 0,
        type: "settlement"
      });
      await settleTx.save();
    }

    party.currentBalance = 0;
    party.openingBalance = 0;
    party.updatedAt = new Date();
    await party.save();

    res.json({
      success: true,
      message: `पार्टी '${party.name}' का हिसाब सफलतापूर्वक चुकता (₹0) कर दिया गया!`,
      party
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const syncPartyBalance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "पार्टी नहीं मिली" });

    const txRecords = await PartyTransaction.find({
      partyId: party._id,
      companyId: req.companyId,
      isDeleted: { $ne: true }
    });

    const isSupplier = (party.partyType === "supplier");
    const rawOpening = Number(party.openingBalance || 0);
    const openingBal = isSupplier ? -Math.abs(rawOpening) : Math.abs(rawOpening);

    let actualNet = openingBal;
    txRecords.forEach(t => {
      actualNet += (Number(t.debit || 0) - Number(t.credit || 0));
    });

    party.currentBalance = actualNet;
    party.updatedAt = new Date();
    await party.save();

    res.json({
      success: true,
      message: "बैलेंस सफलतापूर्वक सिंक्रोनाइज़ हो गया!",
      currentBalance: actualNet,
      party
    });
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

    // Auto-heal suppliers whose openingBalance was saved with 0 or positive currentBalance
    const normalizedParties = parties.map(p => {
      const pDoc = p.toObject ? p.toObject() : { ...p };
      const isSupplier = (pDoc.partyType === "supplier");
      let curBal = Number(pDoc.currentBalance || 0);
      const opBal = Math.abs(Number(pDoc.openingBalance || 0));

      if (isSupplier && opBal > 0) {
        if (curBal === 0 || (curBal > 0 && Math.abs(curBal) === opBal)) {
          curBal = -opBal;
          pDoc.currentBalance = curBal;
          // Background update to persist correct negative balance in DB
          Party.updateOne({ _id: pDoc._id }, { $set: { currentBalance: curBal } }).exec().catch(() => {});
        }
      }
      pDoc.balance = curBal;
      return pDoc;
    });

    res.json({ success: true, parties: normalizedParties });
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

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    // Check if the party has any bills or transactions
    const txCount = await PartyTransaction.countDocuments({ partyId: req.params.id, isDeleted: { $ne: true } });
    const billCount = await Bill.countDocuments({ partyId: req.params.id, isDeleted: { $ne: true } });

    if (txCount === 0 && billCount === 0) {
      // Clean permanent delete so mobile number is immediately freed with 0 conflicts!
      await Party.deleteOne({ _id: req.params.id, companyId: req.companyId });
      return res.json({ success: true, message: "पार्टी सफलतापूर्वक हटा दी गई!" });
    }

    // If it has financial history, soft-delete and release mobileNumber to prevent duplicate index conflicts
    party.isActive = false;
    party.mobileNumber = `${party.mobileNumber}_del_${Date.now()}`;
    await party.save();

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
