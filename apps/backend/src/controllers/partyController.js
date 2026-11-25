import Party from "../model/party.js";
import Company from "../model/company.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import Product from "../model/product.js";
import mongoose from "mongoose";
import { syncPartyToSupabase, syncPartyTxToSupabase, syncPartyDeleteToSupabase, syncBillPhotoToSupabase, syncBillDeleteToSupabase, mongoIdToUuid } from "../services/supabaseSyncService.js";
import { uploadBillImage } from "../services/storageService.js";
import { getPartiesFromSupabase, getPartyByIdFromSupabase, getPartyTransactionsFromSupabase, getBillsFromSupabase, getPurchasesFromSupabase, mapSupabaseSalesToBill, mapSupabasePurchaseToPurchase } from "../services/supabaseReadService.js";
export { getPartyByIdFromSupabase };
import { supabase } from "../config/supabase.js";

export const createParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { name, mobileNumber, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "पार्टी का नाम अनिवार्य है (Party Name is required)" });
    }

    const trimmedName = name.trim();
    const trimmedAddress = (address || "").trim() || "Local";
    const trimmedMobile = (mobileNumber || "").trim();
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

    // 2. Duplicate check: Same mobile number among ACTIVE parties (ONLY if mobile number is provided)
    if (trimmedMobile && trimmedMobile.length >= 10 && !trimmedMobile.startsWith("dummy_")) {
      const existingParty = await Party.findOne({ mobileNumber: trimmedMobile, companyId: req.companyId, isActive: true });
      if (existingParty) {
        return res.status(400).json({ success: false, error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!" });
      }
    }

    // 3. Check if a previously deleted / inactive party exists with this mobile number or name
    const inactiveConditions = [
      { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") } }
    ];
    if (trimmedMobile && trimmedMobile.length >= 10) {
      inactiveConditions.push({ mobileNumber: trimmedMobile });
    }
    const inactiveParty = await Party.findOne({
      companyId: req.companyId,
      isActive: false,
      $or: inactiveConditions
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
      inactiveParty.mobileNumber = trimmedMobile;
      inactiveParty.partyType = finalPartyType;
      inactiveParty.contactPerson = req.body.contactPerson || "";
      inactiveParty.email = req.body.email || "";
      inactiveParty.alternatePhone = req.body.alternatePhone || "";
      inactiveParty.gstNumber = req.body.gstNumber || undefined;
      inactiveParty.panNumber = req.body.panNumber || "";
      inactiveParty.creditLimit = Number(req.body.creditLimit || 0);
      const opDate = req.body.openingBalanceDate || req.body.asOfDate || (req.body.date ? new Date(req.body.date) : undefined);
      inactiveParty.openingBalance = Math.abs(rawBal);
      if (opDate) {
        inactiveParty.openingBalanceDate = new Date(opDate);
        inactiveParty.createdAt = new Date(opDate);
      }
      inactiveParty.currentBalance = finalBalance;
      inactiveParty.notes = req.body.notes || "";
      inactiveParty.isActive = true;
      inactiveParty.updatedAt = new Date();
      await inactiveParty.save();
      syncPartyToSupabase(inactiveParty).catch(e => console.warn("[Supabase Sync] Party dual-write note:", e.message));
      return res.status(201).json({ success: true, party: inactiveParty, message: `Party ${name} created successfully!` });
    }

    const opDate = req.body.openingBalanceDate || req.body.asOfDate || (req.body.date ? new Date(req.body.date) : undefined);
    const party = new Party({
      ...req.body,
      name: trimmedName,
      address: trimmedAddress,
      mobileNumber: trimmedMobile,
      companyId: req.companyId,
      partyType: finalPartyType,
      openingBalance: Math.abs(rawBal),
      ...(opDate ? { openingBalanceDate: new Date(opDate), createdAt: new Date(opDate) } : {}),
      currentBalance: finalBalance
    });
    await party.save();
    syncPartyToSupabase(party).catch(e => console.warn("[Supabase Sync] Party dual-write note:", e.message));
    res.status(201).json({ success: true, party, message: `Party ${name} created successfully!` });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
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
        mobileNumber: mobile || "",
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyStatement = async (req, res) => {
  try {
    let party = req.preloadedParty || null;
    if (!req.companyId && party?.companyId) {
      req.companyId = party.companyId;
    }
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const coIdStr = String(req.companyId || "");
    const validMongoCoIds = [];
    if (mongoose.Types.ObjectId.isValid(coIdStr)) {
      validMongoCoIds.push(new mongoose.Types.ObjectId(coIdStr));
    } else {
      try {
        const allCompanies = await Company.find({}, { _id: 1 }).lean();
        for (const c of allCompanies) {
          if (mongoIdToUuid(c._id) === coIdStr) {
            validMongoCoIds.push(c._id);
            break;
          }
        }
      } catch (cErr) {
        console.warn("[getPartyStatement] Company UUID to Mongo error:", cErr.message);
      }
    }

    if (!party) {
      const isReqMongoId = mongoose.Types.ObjectId.isValid(req.params.id);
      if (validMongoCoIds.length > 0) {
        if (isReqMongoId) {
          party = await Party.findOne({ _id: req.params.id, companyId: { $in: validMongoCoIds } });
        }
        if (!party) {
          party = await Party.findOne({
            companyId: { $in: validMongoCoIds },
            name: req.params.id
          });
        }
      }
      // Check if req.params.id is a UUID matching mongoIdToUuid
      if (!party && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id) && validMongoCoIds.length > 0) {
        try {
          const allParties = await Party.find({ companyId: { $in: validMongoCoIds } }, { _id: 1 }).lean();
          for (const p of allParties) {
            if (mongoIdToUuid(p._id) === req.params.id) {
              party = await Party.findById(p._id);
              break;
            }
          }
        } catch (me) {}
      }
      // Fallback: Check Supabase for party if not found in MongoDB
      if (!party) {
        try {
          const sbParty = await getPartyByIdFromSupabase(req.params.id, req.companyId);
          if (sbParty) party = sbParty;
        } catch (sbErr) {
          console.warn("[getPartyStatement] Supabase party lookup error:", sbErr.message);
        }
      }
    }
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const isSupplier = (party.partyType === "supplier" || party.type === "supplier");

    const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`^${escapeRegex(party.name)}$`, "i");

    const pIdStr = String(party._id || party.id || "");
    const validMongoPartyIds = [];
    if (mongoose.Types.ObjectId.isValid(pIdStr)) {
      validMongoPartyIds.push(new mongoose.Types.ObjectId(pIdStr));
    } else {
      try {
        const mParty = await Party.findOne({
          companyId: { $in: validMongoCoIds },
          $or: [
            { name: party.name },
            { mobileNumber: party.mobileNumber || party.phone || "---" }
          ]
        }).lean();
        if (mParty?._id) {
          validMongoPartyIds.push(mParty._id);
        }
      } catch (me) {}
    }

    // 1. Direct Party Transactions (Cash/Bank Payments & Receipts from Mongo + Supabase)
    let txRecords = [];
    const deletedMongoTxIds = new Set();
    const seenTxKeys = new Set();

    if (validMongoPartyIds.length > 0 && validMongoCoIds.length > 0) {
      try {
        txRecords = await PartyTransaction.find({
          partyId: { $in: validMongoPartyIds },
          companyId: { $in: validMongoCoIds },
          isDeleted: { $ne: true }
        }).lean();

        // Also fetch deleted transaction IDs and fingerprint keys so Supabase never resurrects deleted records
        const delTxs = await PartyTransaction.find({
          partyId: { $in: validMongoPartyIds },
          companyId: { $in: validMongoCoIds },
          isDeleted: true
        }, { _id: 1, date: 1, debit: 1, credit: 1, details: 1 }).lean();

        delTxs.forEach(dt => {
          deletedMongoTxIds.add(String(dt._id));
          const dtDate = dt.date ? new Date(dt.date).toISOString().slice(0, 10) : '';
          const dtDeb = Number(dt.debit || 0);
          const dtCred = Number(dt.credit || 0);
          const dtDet = (dt.details || '').trim().toLowerCase();
          deletedMongoTxIds.add(`${dtDate}_${dtDeb}_${dtCred}_${dtDet}`);
        });

        txRecords.forEach(t => {
          const tId = String(t._id || t.id || '');
          if (tId) seenTxKeys.add(tId);
          const tDate = t.date ? new Date(t.date).toISOString().slice(0, 10) : '';
          const tDeb = Number(t.debit || 0);
          const tCred = Number(t.credit || 0);
          const tDet = (t.details || '').trim().toLowerCase();
          seenTxKeys.add(`${tDate}_${tDeb}_${tCred}_${tDet}`);
        });
      } catch (e) {
        console.warn("[getPartyStatement] Mongo txRecords error:", e.message);
      }
    }

    try {
      const sbTxs = await getPartyTransactionsFromSupabase({
        partyId: party._id || party.id,
        companyId: req.companyId
      });
      if (Array.isArray(sbTxs) && sbTxs.length > 0) {
        for (const st of sbTxs) {
          const sbId = String(st._id || st.id || "");
          const sbDate = st.date ? new Date(st.date).toISOString().slice(0, 10) : '';
          const sbDeb = Number(st.debit || 0);
          const sbCred = Number(st.credit || 0);
          const sbDet = (st.details || '').trim().toLowerCase();
          const sbKey = `${sbDate}_${sbDeb}_${sbCred}_${sbDet}`;

          // Skip if deleted in Mongo or already seen (in Mongo or earlier Supabase row)
          if (deletedMongoTxIds.has(sbId) || deletedMongoTxIds.has(sbKey)) {
            continue;
          }
          if (seenTxKeys.has(sbId) || seenTxKeys.has(sbKey)) {
            continue;
          }

          // If a Mongo transaction already exists with matching amount and details (e.g. date was edited in Mongo), do not duplicate
          const matchesExistingMongoTx = txRecords.some(mt => {
            const mDeb = Number(mt.debit || 0);
            const mCred = Number(mt.credit || 0);
            const mDet = (mt.details || '').trim().toLowerCase();
            if (mDeb > 0 && sbDeb > 0 && Math.abs(mDeb - sbDeb) < 0.01) {
              return mDet === sbDet || (mDet && sbDet && (mDet.includes(sbDet) || sbDet.includes(mDet)));
            }
            if (mCred > 0 && sbCred > 0 && Math.abs(mCred - sbCred) < 0.01) {
              return mDet === sbDet || (mDet && sbDet && (mDet.includes(sbDet) || sbDet.includes(mDet)));
            }
            return false;
          });
          if (matchesExistingMongoTx) {
            continue;
          }

          seenTxKeys.add(sbId);
          seenTxKeys.add(sbKey);
          txRecords.push(st);
        }
      }
    } catch (sbTxErr) {
      console.warn("[getPartyStatement] Supabase getPartyTransactions error:", sbTxErr.message);
    }

    // 2. Sales Bills for this party (from Mongo + Supabase)
    let billRecords = [];
    if (validMongoCoIds.length > 0) {
      try {
        const orClauses = [
          { customerName: nameRegex },
          { partyName: nameRegex },
          { customer: nameRegex }
        ];
        if (validMongoPartyIds.length > 0) {
          orClauses.push({ partyId: { $in: validMongoPartyIds } });
        }
        const billFilter = {
          companyId: { $in: validMongoCoIds },
          isDeleted: { $ne: true },
          $or: orClauses
        };
        if (party.mobileNumber && party.mobileNumber.length >= 10) {
          billFilter.$or.push({ customerMobile: party.mobileNumber }, { customerPhone: party.mobileNumber });
        }
        billRecords = await Bill.find(billFilter).lean();
      } catch (e) {
        console.warn("[getPartyStatement] Mongo billRecords error:", e.message);
      }
    }

    // Merge Supabase sales bills
    if (supabase) {
      try {
        const sbPartyUuid = mongoIdToUuid(party._id || party.id);
        const sbCoUuid = mongoIdToUuid(req.companyId);
        
        let q = supabase
          .from("sales")
          .select("*")
          .eq("company_id", sbCoUuid)
          .eq("is_deleted", false);

        if (party.name) {
          q = q.or(`party_id.eq.${sbPartyUuid},customer_name.ilike.%${party.name}%`);
        } else {
          q = q.eq("party_id", sbPartyUuid);
        }

        const { data: sbSales, error: sbSalesErr } = await q.order("created_at", { ascending: false }).limit(200);

        if (!sbSalesErr && Array.isArray(sbSales)) {
          const existingBillNos = new Set(billRecords.map(b => String(b.billNumber || b.invoiceNumber || b._id || b.id).toLowerCase()));
          for (const s of sbSales) {
            const bMapped = mapSupabaseSalesToBill(s);
            const bKey = String(bMapped.billNumber || bMapped.invoiceNumber || bMapped._id || bMapped.id).toLowerCase();
            if (!existingBillNos.has(bKey)) {
              billRecords.push(bMapped);
              existingBillNos.add(bKey);
            }
          }
        }
      } catch (sbSalesException) {
        console.warn("[getPartyStatement] Supabase sales fetch error:", sbSalesException.message);
      }
    }

    // 3. Purchase Bills for this party (from Mongo + Supabase)
    let purchaseRecords = [];
    if (validMongoCoIds.length > 0) {
      try {
        const orClauses = [
          { supplierName: nameRegex },
          { supplier: nameRegex },
          { partyName: nameRegex }
        ];
        if (validMongoPartyIds.length > 0) {
          orClauses.push({ partyId: { $in: validMongoPartyIds } });
        }
        const purchaseFilter = {
          companyId: { $in: validMongoCoIds },
          isDeleted: { $ne: true },
          $or: orClauses
        };
        purchaseRecords = await Purchase.find(purchaseFilter).lean();
      } catch (e) {
        console.warn("[getPartyStatement] Mongo purchaseRecords error:", e.message);
      }
    }

    if (supabase) {
      try {
        const sbCoUuid = mongoIdToUuid(req.companyId);
        const sbPartyUuid = mongoIdToUuid(party._id || party.id);

        let pq = supabase
          .from("purchases")
          .select("*")
          .eq("company_id", sbCoUuid)
          .eq("is_deleted", false);

        if (party.name) {
          pq = pq.or(`supplier_name.ilike.%${party.name}%,party_id.eq.${sbPartyUuid}`);
        } else {
          pq = pq.eq("party_id", sbPartyUuid);
        }

        const { data: sbPurs, error: sbPurErr } = await pq.order("created_at", { ascending: false }).limit(200);

        if (!sbPurErr && Array.isArray(sbPurs)) {
          const existingPurNos = new Set(purchaseRecords.map(p => String(p.billNumber || p.invoiceNo || p._id || p.id).toLowerCase()));
          for (const p of sbPurs) {
            const pMapped = mapSupabasePurchaseToPurchase(p);
            const pKey = String(pMapped.billNumber || pMapped.invoiceNo || pMapped._id || pMapped.id).toLowerCase();
            if (!existingPurNos.has(pKey)) {
              purchaseRecords.push(pMapped);
              existingPurNos.add(pKey);
            }
          }
        }
      } catch (sbPurException) {
        console.warn("[getPartyStatement] Supabase purchase fetch error:", sbPurException.message);
      }
    }

    // Track existing bill IDs and refNos to prevent double-counting
    const existingRefBillIds = new Set();
    txRecords.forEach(t => {
      if (t.referenceBillId) existingRefBillIds.add(String(t.referenceBillId));
      if (t.billNumber) existingRefBillIds.add(String(t.billNumber));
      if (t.refNo) existingRefBillIds.add(String(t.refNo));
      const hashMatch = (t.details || '').match(/#([A-Za-z0-9_-]+)/);
      if (hashMatch) {
        existingRefBillIds.add(hashMatch[1]);
      }
      const numMatch = (t.details || '').match(/(?:bill|invoice|inv|pur|खरीद|बिल)\s*[:#\- ]*([A-Za-z0-9_-]+)/i);
      if (numMatch) {
        existingRefBillIds.add(numMatch[1]);
      }
    });

    const ledgerEntries = [];

    // Process manual / direct payments
    for (const tx of txRecords) {
      const isDebit = Number(tx.debit || 0) > 0;
      const derivedBillNum = tx.billNumber || tx.referenceBillId || (String(tx.details || '').match(/#(RA-\d+|[A-Za-z0-9_-]+)/i)?.[1]) || "";
      ledgerEntries.push({
        _id: tx._id,
        date: tx.date || tx.createdAt,
        type: tx.type || (isDebit ? "payment" : (isSupplier ? "purchase" : "receipt")),
        refNo: tx.refNo || tx.billNumber || (isDebit ? `PAY-${String(tx._id).slice(-4)}` : (isSupplier ? `PUR-${String(tx._id).slice(-4)}` : `REC-${String(tx._id).slice(-4)}`)),
        billNumber: derivedBillNum,
        bookNo: tx.bookNo || "",
        pageNo: tx.pageNo || "",
        referenceBillId: tx.referenceBillId || tx.billNumber || "",
        details: tx.details && tx.details !== "मुझे मिले" && tx.details !== "मैंने दिए"
          ? tx.details
          : (isSupplier 
              ? (isDebit ? "भुगतान दिया (Payment)" : "खरीद बिल (Purchase)")
              : (isDebit ? "मैंने दिए (उधार)" : "मुझे मिले (जमा)")
            ),
        siteName: tx.siteName || "",
        debit: Number(tx.debit || 0),
        credit: Number(tx.credit || 0),
        billImageUrl: tx.billImageUrl || (tx.billImageUrls && tx.billImageUrls[0]) || "",
        billImageUrls: (tx.billImageUrls && tx.billImageUrls.length > 0) ? tx.billImageUrls : (tx.billImageUrl ? [tx.billImageUrl] : []),
        source: "PartyTransaction"
      });
    }

    // Process sales bills
    for (const b of billRecords) {
      const bNum = String(b.billNumber || b.invoiceNumber || b.id || b._id || "BILL");
      const bId = String(b._id || "");
      const invNo = String(b.invoiceNumber || "");

      const finalAmt = Number(b.finalAmount ?? b.total ?? 0);
      const isPaid = String(b.paymentStatus || b.status || "").toLowerCase() === "paid";
      const paidAmt = isPaid ? finalAmt : Number(b.amountPaid || b.advanceAmount || b.receivedAmount || 0);

      // If this bill was already recorded in party transactions, synchronize date and skip duplicate debit entry
      const bDateStr = b.date ? new Date(b.date).toISOString().slice(0, 10) : "";
      const matchedEntry = ledgerEntries.find(t => {
        const tId = String(t._id || t.id || '');
        const tRef = String(t.refNo || t.billNumber || t.referenceBillId || '').toLowerCase();
        const tDet = String(t.details || '').toLowerCase();
        const bNumLower = bNum.toLowerCase();
        const invNoLower = invNo.toLowerCase();

        // 1. Exact ID or Sale ID match
        if (t.sale_id && String(t.sale_id) === String(b._id || b.id)) return true;
        if (tId && (tId === bId || tId === String(b.id || ''))) return true;

        // 2. Bill number or Invoice number match
        if (bNumLower && bNumLower !== 'bill' && (tRef === bNumLower || tDet.includes(`#${bNumLower}`))) return true;
        if (invNoLower && (tRef === invNoLower || tDet.includes(`#${invNoLower}`))) return true;

        // 3. Exact amount & sale details match
        const tDeb = Number(t.debit || 0);
        if (Math.abs(tDeb - finalAmt) < 0.01 && (t.type === 'sale' || tDet.includes('बिक्री') || tDet.includes('बिल'))) {
          const tDateStr = t.date ? new Date(t.date).toISOString().slice(0, 10) : "";
          if (bDateStr && tDateStr && bDateStr === tDateStr) return true;
          if (bNum && bNumLower !== 'bill' && tDet.includes(bNumLower)) return true;
        }
        return false;
      });

      const alreadyInTx = Boolean(matchedEntry) || existingRefBillIds.has(bNum) || existingRefBillIds.has(bId) || (invNo && existingRefBillIds.has(invNo));

      // 🛡️ If matched existing transaction, synchronize date, amount & details so date/amount edits replace rather than duplicate
      if (matchedEntry) {
        if (b.date) matchedEntry.date = b.date;
        if (finalAmt > 0) {
          matchedEntry.debit = finalAmt;
          matchedEntry.billAmount = finalAmt;
        }
        if (bNum && (!matchedEntry.billNumber || matchedEntry.billNumber === 'BILL')) matchedEntry.billNumber = bNum;
        if (b.bookNo) matchedEntry.bookNo = b.bookNo;
        if (b.pageNo) matchedEntry.pageNo = b.pageNo;
        if (b.items && b.items.length > 0 && (!matchedEntry.items || matchedEntry.items.length === 0)) matchedEntry.items = b.items;
        if (b.siteName && !matchedEntry.siteName) matchedEntry.siteName = b.siteName;
        // 📷 Merge multiple bill photos cleanly so they never disappear on statement reload
        const bImgs = (b.billImageUrls && b.billImageUrls.length > 0) ? b.billImageUrls : (b.billImageUrl ? [b.billImageUrl] : []);
        const mImgs = (matchedEntry.billImageUrls && matchedEntry.billImageUrls.length > 0) ? matchedEntry.billImageUrls : (matchedEntry.billImageUrl ? [matchedEntry.billImageUrl] : []);
        const mergedImgs = Array.from(new Set([...mImgs, ...bImgs].filter(Boolean)));
        if (mergedImgs.length > 0) {
          matchedEntry.billImageUrls = mergedImgs;
          matchedEntry.billImageUrl = mergedImgs[0];
        }
      }

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
          bookNo: b.bookNo || "",
          pageNo: b.pageNo || "",
          billAmount: finalAmt,
          paidAmount: paidAmt,
          items: b.items || [],
          details: `बिक्री बिल #${bNum}${b.bookNo ? ` (बुक #${b.bookNo}${b.pageNo ? `, पेज #${b.pageNo}` : ''})` : ''} (${isCreditBill ? 'उधार' : 'नकद'})${itemsSummary}`,
          siteName: b.siteName || "",
          debit: finalAmt,
          credit: 0,
          billImageUrl: b.billImageUrl || (b.billImageUrls && b.billImageUrls[0]) || "",
          billImageUrls: (b.billImageUrls && b.billImageUrls.length > 0) ? b.billImageUrls : (b.billImageUrl ? [b.billImageUrl] : []),
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
          billImageUrl: b.billImageUrl || (b.billImageUrls && b.billImageUrls[0]) || "",
          billImageUrls: (b.billImageUrls && b.billImageUrls.length > 0) ? b.billImageUrls : (b.billImageUrl ? [b.billImageUrl] : []),
          paymentMethod: b.paymentMode || b.paymentMethod || "CASH",
          source: "BillPayment"
        });
      }
    }

    // Process purchase bills
    for (const p of purchaseRecords) {
      const pNum = String(p.billNumber || p.invoiceNo || p.purchaseNumber || "PUR");
      const pId = String(p._id || "");
      const totalAmt = Number(p.totalAmount ?? p.total ?? 0);

      const pDateStr = p.date ? new Date(p.date).toISOString().slice(0, 10) : "";
      const matchesExistingPurTx = txRecords.some(t => {
        if (t.purchase_id && String(t.purchase_id) === String(p._id || p.id)) return true;
        const tDateStr = t.date ? new Date(t.date).toISOString().slice(0, 10) : "";
        const tCred = Number(t.credit || 0);
        return (t.type === 'purchase' || String(t.details || '').includes('खरीद')) &&
               pDateStr && tDateStr && pDateStr === tDateStr &&
               Math.abs(tCred - totalAmt) < 0.01;
      });
      if (existingRefBillIds.has(pNum) || existingRefBillIds.has(pId) || matchesExistingPurTx) continue;

      ledgerEntries.push({
        _id: p._id,
        date: p.date || p.createdAt,
        type: "purchase",
        refNo: pNum,
        billNumber: pNum,
        bookNo: p.bookNo || "",
        pageNo: p.pageNo || "",
        details: `खरीद इनवॉइस #${pNum}${p.bookNo ? ` (बुक #${p.bookNo}${p.pageNo ? `, पेज #${p.pageNo}` : ''})` : ''}`,
        debit: 0,
        credit: totalAmt,
        billImageUrl: p.billImageUrl || p.receiptUrl || (p.billImageUrls && p.billImageUrls[0]) || "",
        billImageUrls: (p.billImageUrls && p.billImageUrls.length > 0) ? p.billImageUrls : (p.billImageUrl ? [p.billImageUrl] : (p.receiptUrl ? [p.receiptUrl] : [])),
        source: "Purchase"
      });
    }

    // Sort chronologically ascending (oldest first) to compute running balance accurately
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    const rawOpening = Number(party.openingBalance || 0);
    // Opening balance for supplier is payable (negative / credit)
    const openingBal = isSupplier ? -Math.abs(rawOpening) : Math.abs(rawOpening);
    let runningBal = openingBal;

    const formattedTransactions = [];

    // --- INCLUDE OPENING BALANCE AS THE VERY FIRST LINE ITEM ---
    if (rawOpening !== 0) {
      const isPayable = openingBal < 0 || isSupplier;
      const absOpening = Math.abs(rawOpening);
      const openingImg = party.billImageUrl || (party.billImageUrls && party.billImageUrls[0]) || "";
      const openingImgs = (party.billImageUrls && party.billImageUrls.length > 0) ? party.billImageUrls : (openingImg ? [openingImg] : []);
      formattedTransactions.push({
        _id: `open_${party._id}`,
        date: party.openingBalanceDate || party.createdAt || new Date(),
        type: isPayable ? "purchase" : "sale",
        refNo: "OPENING",
        billNumber: "OPENING-BILL",
        details: isPayable 
          ? `प्रारंभिक शेष / बिल (Opening Balance: देने हैं)` 
          : `प्रारंभिक शेष / बिल (Opening Balance: लेने हैं)`,
        debit: isPayable ? 0 : absOpening,
        credit: isPayable ? absOpening : 0,
        runningBalance: isPayable ? -absOpening : absOpening,
        source: "OpeningBalance",
        billImageUrl: openingImg,
        billImageUrls: openingImgs
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

    // Auto-sync party currentBalance — BUT skip if a settlement tx exists (clearPartyBalance
    // intentionally zeroed the balance; the recalculated runningBal should already be 0 if
    // bills were properly marked paid.  If it isn't, we trust the settlement, not the recount).
    const hasSettlement = txRecords.some(t => t.type === 'settlement');
    if (!hasSettlement && party.currentBalance !== runningBal) {
      if (party.save && typeof party.save === 'function') {
        party.currentBalance = runningBal;
        party.updatedAt = new Date();
        party.save().catch(e => console.warn("Failed to auto-sync party balance:", e));
      } else if (party._id && mongoose.Types.ObjectId.isValid(party._id)) {
        Party.updateOne({ _id: party._id }, { $set: { currentBalance: runningBal, updatedAt: new Date() } }).exec().catch(() => {});
      }
      if (supabase) {
        supabase.from("parties").update({ current_balance: runningBal, updated_at: new Date().toISOString() }).eq("id", mongoIdToUuid(party._id || party.id)).then(() => {}, () => {});
      }
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPublicPartyStatement = async (req, res) => {
  try {
    const rawPartyId = req.params.partyId;
    if (!rawPartyId) {
      return res.status(400).json({ success: false, message: "Party ID is required" });
    }
    const partyId = decodeURIComponent(String(rawPartyId)).trim();

    let party = null;
    const isMongoId = mongoose.Types.ObjectId.isValid(partyId);
    if (isMongoId) {
      party = await Party.findById(partyId);
    }
    if (!party) {
      const orClauses = [
        { mobileNumber: partyId }
      ];
      if (isMongoId) {
        orClauses.push({ _id: partyId });
      }
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(partyId)) {
        orClauses.push({ uuid: partyId });
      }
      try {
        party = await Party.findOne({ $or: orClauses });
      } catch (me) {}
    }
    if (!party && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(partyId)) {
      try {
        const allParties = await Party.find({}, { _id: 1, companyId: 1, name: 1, mobileNumber: 1 }).lean();
        for (const p of allParties) {
          if (mongoIdToUuid(p._id) === partyId) {
            party = await Party.findById(p._id);
            break;
          }
        }
      } catch (me) {}
    }
    if (!party) {
      try {
        const sbParty = await getPartyByIdFromSupabase(partyId);
        if (sbParty) party = sbParty;
      } catch (e) {}
    }

    if (!party) {
      return res.status(404).json({ success: false, error: "पार्टी का खाता नहीं मिला (Party not found)" });
    }

    const companyId = party.companyId || (party.company_id ? String(party.company_id) : "");
    let company = null;
    if (companyId) {
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        company = await Company.findById(companyId).lean();
      }
      if (!company) {
        try {
          const compOr = [];
          if (mongoose.Types.ObjectId.isValid(companyId)) {
            compOr.push({ _id: companyId });
          }
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId)) {
            const allComps = await Company.find({}, { _id: 1 }).lean();
            for (const c of allComps) {
              if (mongoIdToUuid(c._id) === companyId) {
                company = c;
                break;
              }
            }
          }
          if (!company && compOr.length > 0) {
            company = await Company.findOne({ $or: compOr }).lean();
          }
        } catch (ce) {}
      }
    }

    // Attach req.companyId, req.params.id, and preloadedParty for getPartyStatement
    req.companyId = company?._id ? String(company._id) : (companyId || party.companyId || party.company_id);
    req.params.id = party._id ? String(party._id) : (party.id || partyId);
    req.preloadedParty = party;

    // Use a custom response interceptor to add company details to the statement
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data && data.success) {
        const compPhone = company?.whatsappBusinessNumber || company?.phone || company?.mobile || "";
        const callingPhone = company?.callingContactNumber || company?.phone || compPhone;
        // 🔒 Only use UPI ID if explicitly set in business profile (no invented fallbacks)
        const compUpi = company?.upiId ? String(company.upiId).trim() : "";
        data.company = {
          name: company?.businessName || company?.name || "व्यापार खाता",
          phone: compPhone,
          whatsappBusinessNumber: company?.whatsappBusinessNumber || compPhone,
          callingContactNumber: callingPhone,
          alternatePhone: company?.alternatePhone || "",
          alternatePhone2: company?.alternatePhone2 || "",
          address: company?.address || "",
          mapLocationUrl: company?.mapLocationUrl || "",
          upiId: compUpi,
          upiNumber: compUpi ? (company?.phone || compPhone) : ""
        };
      }
      return originalJson(data);
    };

    return getPartyStatement(req, res);
  } catch (error) {
    console.error("[getPublicPartyStatement] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const attachPartyTransactionImage = async (req, res) => {
  try {
    const { txId, imageUrl } = req.body;
    if (!txId || !imageUrl) {
      return res.status(400).json({ success: false, error: "Transaction ID and Image URL are required" });
    }

    let finalUrl = imageUrl;
    // If it's a raw base64 string, upload to Cloudinary/Supabase CDN first
    if (imageUrl.startsWith("data:image/")) {
      const uploadRes = await uploadBillImage({
        fileData: imageUrl,
        fileName: `tx_${Date.now()}.jpg`,
        companyId: req.companyId ? req.companyId.toString() : "common"
      });
      finalUrl = uploadRes.url || imageUrl;
    }

    const cleanId = String(txId).replace(/^(pay_|open_)/, "").trim();
    const isValidOid = mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24;

    const orConditions = [
      { billNumber: cleanId },
      { invoiceNumber: cleanId },
      { purchaseNumber: cleanId },
      { refNo: cleanId },
      { refNo: txId }
    ];
    if (isValidOid) orConditions.push({ _id: cleanId });
    if (txId !== cleanId && mongoose.Types.ObjectId.isValid(txId) && txId.length === 24) {
      orConditions.push({ _id: txId });
    }

    const query = { $or: orConditions };
    const updateData = {
      billImageUrl: finalUrl,
      $addToSet: { billImageUrls: finalUrl }
    };

    let updated = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
    if (!updated) {
      updated = await Bill.findOneAndUpdate(query, updateData, { new: true });
    }
    if (!updated) {
      updated = await Purchase.findOneAndUpdate(query, updateData, { new: true });
    }
    if (!updated && (String(txId).startsWith("open_") || isValidOid)) {
      try {
        const pQuery = isValidOid ? { _id: cleanId } : { id: cleanId };
        updated = await Party.findOneAndUpdate(pQuery, updateData, { new: true });
      } catch (pe) {
        console.warn("[attachPartyTransactionImage] Party update warning:", pe.message);
      }
    }

    // Sync to Supabase sales / purchases
    const refToSync = updated?.billNumber || updated?.invoiceNumber || updated?.purchaseNumber || cleanId;
    syncBillPhotoToSupabase(refToSync, finalUrl).catch(() => {});
    if (cleanId !== refToSync) {
      syncBillPhotoToSupabase(cleanId, finalUrl).catch(() => {});
    }

    res.json({
      success: true,
      message: "बिल फोटो सफलतापूर्वक सेव हो गया!",
      data: updated,
      url: finalUrl,
      urls: updated?.billImageUrls || [finalUrl]
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
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

    let deletedTxData = null;
    let targetPartyId = null;

    // 2. Check PartyTransaction in MongoDB
    if (mongoose.Types.ObjectId.isValid(id)) {
      const tx = await PartyTransaction.findOne({ _id: id, companyId: req.companyId });
      if (tx) {
        tx.isDeleted = true;
        tx.updatedAt = new Date();
        await tx.save();
        deletedTxData = tx;
        targetPartyId = tx.partyId;

        // Also delete matching from Supabase so it does NOT reappear
        if (supabase) {
          try {
            const pUuid = mongoIdToUuid(tx.partyId);
            const tDate = tx.date ? new Date(tx.date).getTime() : Date.now();
            const startWindow = new Date(tDate - 86400000).toISOString();
            const endWindow = new Date(tDate + 86400000).toISOString();
            await supabase.from("party_transactions")
              .delete()
              .eq("party_id", pUuid)
              .eq("debit", Number(tx.debit || 0))
              .eq("credit", Number(tx.credit || 0))
              .gte("date", startWindow)
              .lte("date", endWindow);
          } catch (sbDelErr) {
            console.warn("[deletePartyTransaction] Supabase mirror delete warning:", sbDelErr.message);
          }
        }

        // CASCADE: If this transaction was linked to a Purchase, revert stock too
        if (tx.referenceBillId || tx.purchase_id) {
          try {
            const refVal = tx.referenceBillId || tx.purchase_id;
            const pOr = [
              { billNumber: refVal },
              { invoiceNo: refVal },
              { purchaseNumber: refVal }
            ];
            if (mongoose.Types.ObjectId.isValid(refVal)) {
              pOr.push({ _id: refVal });
            }
            const linkedPurchase = await Purchase.findOne({ 
              companyId: req.companyId,
              isDeleted: { $ne: true },
              $or: pOr
            });
            if (linkedPurchase) {
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
              linkedPurchase.isDeleted = true;
              linkedPurchase.updatedAt = new Date();
              await linkedPurchase.save();
              await PartyTransaction.updateMany(
                { 
                  referenceBillId: linkedPurchase._id, 
                  companyId: req.companyId,
                  _id: { $ne: tx._id }
                },
                { $set: { isDeleted: true } }
              );
            }
          } catch (cascadeErr) {
            console.warn("Purchase cascade deletion warning:", cascadeErr.message);
          }
        }

        // CASCADE: If this transaction was linked to a Sale/Bill, mark bill deleted too
        const bRef = tx.referenceBillId || tx.billNumber || tx.sale_id;
        if (bRef) {
          try {
            const bQuery = {
              companyId: req.companyId,
              isDeleted: { $ne: true },
              $or: [
                { billNumber: bRef },
                { invoiceNumber: bRef },
                ...(mongoose.Types.ObjectId.isValid(bRef) && String(bRef).length === 24 ? [{ _id: bRef }] : [])
              ]
            };
            const linkedBill = await Bill.findOne(bQuery);
            if (linkedBill) {
              linkedBill.isDeleted = true;
              linkedBill.updatedAt = new Date();
              await linkedBill.save();
              syncBillDeleteToSupabase(linkedBill.billNumber, linkedBill._id).catch(() => {});
            }
          } catch (bCascErr) {
            console.warn("[deletePartyTransaction] Bill cascade deletion warning:", bCascErr.message);
          }
        }
      }
    }

    // 3. If not found in MongoDB, check if it's a Supabase transaction (ID is integer or UUID)
    const isNumeric = /^\d+$/.test(String(id));
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));

    if (!deletedTxData && supabase && (isNumeric || isUuid)) {
      try {
        const { data: sbTx } = await supabase.from("party_transactions").select("*").eq("id", id).maybeSingle();
        if (sbTx) {
          await supabase.from("party_transactions").delete().eq("id", id);
          deletedTxData = sbTx;
          targetPartyId = sbTx.party_id;

          // Also soft-delete matching transaction in MongoDB!
          let matchingMongoParty = null;
          if (mongoose.Types.ObjectId.isValid(targetPartyId)) {
            matchingMongoParty = { _id: targetPartyId };
          } else {
            const { data: sbP } = await supabase.from("parties").select("name, mobile_number").eq("id", targetPartyId).maybeSingle();
            if (sbP) {
              matchingMongoParty = await Party.findOne({
                companyId: req.companyId,
                $or: [
                  ...(sbP.name ? [{ name: sbP.name }] : []),
                  ...(sbP.mobile_number ? [{ mobileNumber: sbP.mobile_number }] : [])
                ]
              });
            }
          }

          const sbTime = sbTx.date ? new Date(sbTx.date).getTime() : Date.now();
          const mongoFilter = {
            companyId: req.companyId,
            debit: Number(sbTx.debit || 0),
            credit: Number(sbTx.credit || 0),
            ...(matchingMongoParty ? { partyId: matchingMongoParty._id } : {}),
            date: {
              $gte: new Date(sbTime - 86400000),
              $lte: new Date(sbTime + 86400000)
            }
          };
          await PartyTransaction.updateMany(mongoFilter, { $set: { isDeleted: true, updatedAt: new Date() } });
        }
      } catch (sbErr) {
        console.warn("[deletePartyTransaction] Supabase delete error:", sbErr.message);
      }
    }

    // Revert party balance in both MongoDB and Supabase
    if (deletedTxData && targetPartyId) {
      const deb = Number(deletedTxData.debit) || 0;
      const cred = Number(deletedTxData.credit) || 0;
      const netDiff = deb - cred;

      let finalBal = undefined;
      // Revert in MongoDB
      if (mongoose.Types.ObjectId.isValid(targetPartyId)) {
        const party = await Party.findOne({ _id: targetPartyId, companyId: req.companyId });
        if (party) {
          party.currentBalance = (Number(party.currentBalance) || 0) - netDiff;
          party.balance = party.currentBalance;
          party.updatedAt = new Date();
          await party.save();
          finalBal = party.currentBalance;
          syncPartyToSupabase(party).catch(() => {});
        }
      }

      // Revert in Supabase
      if (supabase) {
        try {
          const pUuid = mongoIdToUuid(targetPartyId);
          const { data: curP } = await supabase.from("parties").select("current_balance").eq("id", pUuid).maybeSingle();
          if (curP) {
            const newBal = (Number(curP.current_balance) || 0) - netDiff;
            await supabase.from("parties").update({ current_balance: newBal, updated_at: new Date().toISOString() }).eq("id", pUuid);
            if (finalBal === undefined) finalBal = newBal;
          }
        } catch (e) {}
      }

      return res.json({
        success: true,
        message: "लेनदेन सफलतापूर्वक हटा दिया गया!",
        newBalance: finalBal
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePartyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { amount, type, details, date, paymentMethod, siteName, site, partyId: targetPartyId, bookNo, pageNo, billCode } = req.body;
    let resolvedBookNo = bookNo;
    let resolvedPageNo = pageNo;
    if (billCode && typeof billCode === 'string' && billCode.trim()) {
      const parts = billCode.trim().split('/');
      resolvedBookNo = parts[0]?.trim() || '';
      resolvedPageNo = parts[1]?.trim() || '';
    }
    const cleanId = String(id).replace(/^(pay_|tx_|ptx_)/, '').trim();
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id) || /^[0-9a-fA-F]{24}$/.test(cleanId);
    const targetId = /^[0-9a-fA-F]{24}$/.test(id) ? id : cleanId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanId);
    const targetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : cleanId;
    const isNumeric = /^\d+$/.test(id) || /^\d+$/.test(cleanId);
    const targetNumeric = /^\d+$/.test(id) ? id : cleanId;

    // 1. If opening balance (open_partyId)
    if (String(id).startsWith("open_")) {
      const pId = String(id).replace("open_", "");
      const isMongoParty = /^[0-9a-fA-F]{24}$/.test(pId);
      let party = null;
      if (isMongoParty) {
        party = await Party.findOne({ _id: pId, companyId: req.companyId });
      } else {
        party = await Party.findOne({ companyId: req.companyId, $or: [{ id: pId }, { name: pId }] });
      }
      if (!party) {
        try {
          party = await getPartyByIdFromSupabase(pId, req.companyId);
        } catch (e) {}
      }

      if (party) {
        const isSupplier = (party.partyType === "supplier" || party.type === "supplier");
        const oldOpening = isSupplier ? -Math.abs(party.openingBalance || 0) : Math.abs(party.openingBalance || 0);
        const newOpeningVal = Number(amount || 0);
        const newOpening = isSupplier ? -Math.abs(newOpeningVal) : Math.abs(newOpeningVal);

        const currentBal = Number(party.currentBalance ?? party.balance ?? 0);
        const updatedBalance = currentBal - oldOpening + newOpening;

        party.openingBalance = Math.abs(newOpeningVal);
        party.currentBalance = updatedBalance;
        party.balance = updatedBalance;
        if (date) {
          party.openingBalanceDate = new Date(date);
          party.createdAt = new Date(date);
        }
        party.updatedAt = new Date();

        if (isMongoParty && typeof party.save === 'function') {
          await party.save();
        } else if (party._id && isMongoParty) {
          await Party.findOneAndUpdate(
            { _id: party._id, companyId: req.companyId },
            { 
              openingBalance: Math.abs(newOpeningVal), 
              currentBalance: updatedBalance, 
              balance: updatedBalance, 
              ...(date ? { openingBalanceDate: new Date(date), createdAt: new Date(date) } : {}),
              updatedAt: new Date() 
            }
          );
        }

        if (supabase) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const { error: sbErr } = await supabase.from("parties").update({
              opening_balance: Math.abs(newOpeningVal),
              current_balance: updatedBalance,
              ...(date ? { created_at: new Date(date).toISOString() } : {}),
              updated_at: new Date().toISOString()
            }).eq("id", mongoIdToUuid(pId));

            if (sbErr && (sbErr.message.includes('JWT') || sbErr.message.includes('future'))) {
              await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
              continue;
            }
            break;
          }
        }

        syncPartyToSupabase(party).catch(e => console.warn(e));

        return res.json({
          success: true,
          message: "प्रारंभिक शेष (Opening Balance) सफलतापूर्वक अपडेट हो गया!",
          newBalance: updatedBalance
        });
      }
    }

    // 2. Check PartyTransaction in MongoDB (if valid ObjectId)
    if (isMongoId) {
      const tx = await PartyTransaction.findOne({ _id: targetId, companyId: req.companyId });
      if (tx) {
        const oldDeb = Number(tx.debit || 0);
        const oldCred = Number(tx.credit || 0);

        const amt = Number(amount !== undefined ? amount : (oldDeb > 0 ? oldDeb : oldCred));
        const isPaid = type ? (type === 'paid' || type === 'payment' || type === 'debit') : (oldDeb > 0);

        const newDeb = isPaid ? amt : 0;
        const newCred = isPaid ? 0 : amt;

        const oldDate = tx.date;
        const updateDoc = {
          debit: newDeb,
          credit: newCred,
          updatedAt: new Date()
        };
        if (details !== undefined) updateDoc.details = details;
        if (date) updateDoc.date = new Date(date);
        if (paymentMethod) updateDoc.paymentMethod = paymentMethod;
        if (siteName !== undefined || site !== undefined) updateDoc.siteName = (siteName ?? site ?? '').trim();
        if (resolvedBookNo !== undefined) updateDoc.bookNo = resolvedBookNo;
        if (resolvedPageNo !== undefined) updateDoc.pageNo = resolvedPageNo;

        await PartyTransaction.updateOne({ _id: tx._id }, { $set: updateDoc });
        Object.assign(tx, updateDoc);

        // Also update linked Bill if this tx has a billNumber or referenceBillId or #billNumber in details
        const linkedBillNum = tx.referenceBillId || tx.billNumber || tx.refNo || (String(tx.details || '').match(/#([A-Za-z0-9_-]+)/)?.[1]);
        if (linkedBillNum && linkedBillNum !== 'PAY' && linkedBillNum !== 'REC' && linkedBillNum !== 'PUR' && linkedBillNum !== 'BILL') {
          const updateBillDoc = { updatedAt: new Date() };
          if (date) updateBillDoc.date = new Date(date);
          if (newDeb > 0) {
            updateBillDoc.finalAmount = newDeb;
            updateBillDoc.total = newDeb;
          }
          if (resolvedBookNo !== undefined) updateBillDoc.bookNo = resolvedBookNo;
          if (resolvedPageNo !== undefined) updateBillDoc.pageNo = resolvedPageNo;
          await Bill.updateMany(
            { companyId: req.companyId, $or: [{ billNumber: linkedBillNum }, { refBillNo: linkedBillNum }, { invoiceNumber: linkedBillNum }] },
            { $set: updateBillDoc }
          ).catch(() => {});

          if (supabase) {
            const sbCoUuid = mongoIdToUuid(req.companyId);
            const sbUpdateDoc = {};
            if (date) sbUpdateDoc.date = new Date(date).toISOString();
            if (newDeb > 0) sbUpdateDoc.final_amount = newDeb;
            supabase.from("sales").update(sbUpdateDoc)
              .eq("company_id", sbCoUuid)
              .or(`bill_number.eq.${linkedBillNum}`)
              .then(() => {})
              .catch(() => {});
          }
        }

        // Update party currentBalance: revert old net, add new net
        let updatedPartyBal = undefined;
        const party = await Party.findOne({ _id: tx.partyId, companyId: req.companyId });
        if (party) {
          const netDiff = (newDeb - newCred) - (oldDeb - oldCred);
          party.currentBalance = (Number(party.currentBalance) || 0) + netDiff;
          party.balance = party.currentBalance;
          party.updatedAt = new Date();
          await party.save();
          updatedPartyBal = party.currentBalance;
          syncPartyToSupabase(party).catch(e => console.warn(e));
        }

        // Dual-write to Supabase with previousDate and previous amounts so Supabase updates in-place without duplicating
        syncPartyTxToSupabase(tx, null, oldDate, oldDeb, oldCred).catch(e => console.warn(e));

        return res.json({
          success: true,
          message: "लेनदेन सफलतापूर्वक संपादित (Update) हो गया!",
          transaction: tx,
          newBalance: updatedPartyBal
        });
      }

      // Check if it's a Bill
      const bill = await Bill.findOne({ _id: targetId, companyId: req.companyId });
      if (bill) {
        const oldAmt = Number(bill.finalAmount || bill.total || 0);
        const newAmt = Number(amount !== undefined ? amount : oldAmt);
        const diff = newAmt - oldAmt;

        bill.finalAmount = newAmt;
        bill.total = newAmt;
        if (details) bill.notes = details;
        if (date) bill.date = new Date(date);
        if (resolvedBookNo !== undefined) bill.bookNo = resolvedBookNo;
        if (resolvedPageNo !== undefined) bill.pageNo = resolvedPageNo;
        bill.updatedAt = new Date();
        await bill.save();

        // Also update any linked PartyTransactions
        const bNum = bill.billNumber || bill.refBillNo;
        if (bNum) {
          const updateTxDoc = { updatedAt: new Date() };
          if (date) updateTxDoc.date = new Date(date);
          if (newAmt > 0) updateTxDoc.debit = newAmt;
          if (details) updateTxDoc.details = details;
          if (resolvedBookNo !== undefined) updateTxDoc.bookNo = resolvedBookNo;
          if (resolvedPageNo !== undefined) updateTxDoc.pageNo = resolvedPageNo;
          await PartyTransaction.updateMany(
            { companyId: req.companyId, $or: [{ referenceBillId: bNum }, { billNumber: bNum }, { refNo: bNum }] },
            { $set: updateTxDoc }
          ).catch(() => {});

          if (supabase) {
            const sbCoUuid = mongoIdToUuid(req.companyId);
            const sbTxUpdate = {};
            if (date) sbTxUpdate.date = new Date(date).toISOString();
            if (newAmt > 0) sbTxUpdate.debit = newAmt;
            if (details) sbTxUpdate.details = details;
            supabase.from("party_transactions").update(sbTxUpdate)
              .eq("company_id", sbCoUuid)
              .or(`details.ilike.%${bNum}%`)
              .then(() => {})
              .catch(() => {});
          }
        }

        if (bill.partyId) {
          const party = await Party.findOne({ _id: bill.partyId, companyId: req.companyId });
          if (party) {
            party.currentBalance = (Number(party.currentBalance) || 0) + diff;
            party.balance = party.currentBalance;
            party.updatedAt = new Date();
            await party.save();
            syncPartyToSupabase(party).catch(e => console.warn(e));
          }
        }

        return res.json({
          success: true,
          message: "बिल सफलतापूर्वक अपडेट हो गया!",
          bill,
          transaction: bill
        });
      }

      // Check if it's a Purchase
      const purchase = await Purchase.findOne({ _id: targetId, companyId: req.companyId });
      if (purchase) {
        if (details) purchase.notes = details;
        if (date) purchase.date = new Date(date);
        if (resolvedBookNo !== undefined) purchase.bookNo = resolvedBookNo;
        if (resolvedPageNo !== undefined) purchase.pageNo = resolvedPageNo;
        purchase.updatedAt = new Date();
        await purchase.save();
        return res.json({
          success: true,
          message: "खरीद बिल सफलतापूर्वक अपडेट हो गया!",
          purchase,
          transaction: purchase
        });
      }
    }

    // 3. If Supabase UUID or offline transaction
    if ((isUuid || isNumeric) && supabase) {
      const isPaid = type ? (type === 'paid' || type === 'payment' || type === 'debit') : false;
      const amt = Number(amount || 0);
      const newDeb = isPaid ? amt : 0;
      const newCred = isPaid ? 0 : amt;
      const queryId = isNumeric ? Number(targetNumeric) : targetUuid;

      let updatedTx = null;
      let sbErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await supabase
          .from("party_transactions")
          .update({
            debit: newDeb,
            credit: newCred,
            details: details || "संपादित लेनदेन",
            ...((siteName !== undefined || site !== undefined) ? { site_name: (siteName ?? site ?? '').trim() } : {}),
            date: date ? new Date(date).toISOString() : new Date().toISOString()
          })
          .eq("id", queryId)
          .select()
          .maybeSingle();

        if (res.error && (res.error.message.includes('JWT') || res.error.message.includes('future') || res.error.message.includes('clock'))) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        updatedTx = res.data;
        sbErr = res.error;
        break;
      }

      // If linked to a sale/bill, also sync sale date
      if (updatedTx?.sale_id && date && supabase) {
        await supabase.from("sales").update({
          date: new Date(date).toISOString()
        }).eq("id", updatedTx.sale_id).catch(() => {});
      }

      if (sbErr) {
        console.warn("[updatePartyTransaction] Supabase update error:", sbErr.message);
      }

      // Rebalance party balance in Supabase & Mongo so party ledger stays 100% accurate
      let updatedPartyBal = undefined;
      const effectivePartyId = targetPartyId || updatedTx?.party_id;
      if (effectivePartyId && supabase) {
        try {
          const { data: partyRow } = await supabase.from("parties").select("*").eq("id", effectivePartyId).maybeSingle();
          if (partyRow) {
            const isSup = (partyRow.party_type === "supplier");
            const op = Number(partyRow.opening_balance || 0);
            const openBal = isSup ? -Math.abs(op) : Math.abs(op);
            const { data: allTxs } = await supabase.from("party_transactions").select("debit, credit").eq("party_id", effectivePartyId);
            let running = openBal;
            if (Array.isArray(allTxs)) {
              allTxs.forEach(t => {
                running += (Number(t.debit || 0) - Number(t.credit || 0));
              });
            }
            await supabase.from("parties").update({ current_balance: running, updated_at: new Date().toISOString() }).eq("id", effectivePartyId);
            updatedPartyBal = running;

            // Also update Mongo party if exists
            await Party.updateMany(
              { companyId: req.companyId, $or: [{ name: partyRow.name }, { _id: effectivePartyId }] },
              { $set: { currentBalance: running, balance: running, updatedAt: new Date() } }
            );
          }
        } catch (rebalErr) {
          console.warn("[updatePartyTransaction] Rebalance error:", rebalErr.message);
        }
      }

      return res.json({
        success: true,
        message: "लेनदेन सफलतापूर्वक संपादित (Update) हो गया!",
        transaction: updatedTx || { id, debit: newDeb, credit: newCred, details },
        newBalance: updatedPartyBal
      });
    }

    // Local-only IDs (e.g. tx_..., ptx_...)
    return res.json({
      success: true,
      message: "स्थानीय लेनदेन अपडेट हुआ!",
      isLocalOnly: true
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const setPartyOpeningBalance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    let party = null;
    if (isMongoId) {
      party = await Party.findOne({ _id: id, companyId: req.companyId });
    } else {
      party = await Party.findOne({ companyId: req.companyId, $or: [{ id }, { name: id }] });
    }

    if (!party) {
      try {
        party = await getPartyByIdFromSupabase(id, req.companyId);
      } catch (sbErr) {}
    }
    if (!party) return res.status(404).json({ success: false, error: "पार्टी नहीं मिली" });

    const { amount, direction, date, notes } = req.body;
    const isSupplier = (party.partyType === "supplier" || party.type === "supplier");

    // Old opening balance previously recorded
    const oldOpeningRaw = Number(party.openingBalance || 0);
    const oldOpeningSigned = isSupplier ? -Math.abs(oldOpeningRaw) : Math.abs(oldOpeningRaw);

    const newOpeningVal = Number(amount || 0);
    let newOpeningSigned = 0;
    if (newOpeningVal > 0) {
      if (direction === "negative" || (!direction && isSupplier) || (direction !== "positive" && isSupplier)) {
        newOpeningSigned = -Math.abs(newOpeningVal);
      } else {
        newOpeningSigned = Math.abs(newOpeningVal);
      }
    }

    let currentBal = Number(party.currentBalance ?? party.balance ?? 0);
    // Auto-heal: if supplier currentBalance was previously stored as positive opening balance, normalize to negative debt
    if (isSupplier && currentBal > 0 && Math.abs(currentBal) === oldOpeningRaw) {
      currentBal = -oldOpeningRaw;
    }
    const updatedBalance = currentBal - oldOpeningSigned + newOpeningSigned;

    party.openingBalance = Math.abs(newOpeningVal);
    party.currentBalance = updatedBalance;
    party.balance = updatedBalance;
    if (notes !== undefined) party.notes = notes;
    if (date) {
      party.openingBalanceDate = new Date(date);
      party.createdAt = new Date(date);
    }
    party.updatedAt = new Date();

    if (isMongoId && typeof party.save === 'function') {
      await party.save();
    } else if (party._id && mongoose.Types.ObjectId.isValid(party._id)) {
      await Party.findOneAndUpdate(
        { _id: party._id, companyId: req.companyId },
        { 
          openingBalance: Math.abs(newOpeningVal), 
          currentBalance: updatedBalance, 
          balance: updatedBalance, 
          ...(date ? { openingBalanceDate: new Date(date), createdAt: new Date(date) } : {}),
          updatedAt: new Date() 
        }
      );
    } else {
      // Find matching Mongo party by name
      const mP = await Party.findOne({ companyId: req.companyId, name: party.name });
      if (mP) {
        mP.openingBalance = Math.abs(newOpeningVal);
        mP.currentBalance = updatedBalance;
        mP.balance = updatedBalance;
        if (date) {
          mP.openingBalanceDate = new Date(date);
          mP.createdAt = new Date(date);
        }
        mP.updatedAt = new Date();
        await mP.save();
      }
    }

    // Direct update to Supabase
    if (supabase) {
      const sbId = (isMongoId ? mongoIdToUuid(id) : id);
      await supabase.from("parties").update({
        opening_balance: Math.abs(newOpeningVal),
        current_balance: updatedBalance,
        ...(date ? { created_at: new Date(date).toISOString() } : {}),
        updated_at: new Date().toISOString()
      }).eq("id", sbId);
    }

    syncPartyToSupabase(party).catch(e => console.warn(e));

    res.json({
      success: true,
      message: newOpeningVal > 0 
        ? `📦 पुराना हिसाब (₹${newOpeningVal.toLocaleString('en-IN')}) सफलतापूर्वक सुरक्षित हो गया!`
        : "📦 पुराना हिसाब हटा दिया गया (₹0)!",
      party,
      newBalance: updatedBalance
    });
  } catch (error) {
    console.error("setPartyOpeningBalance error:", error);
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

    // Compute ground-truth ledger running balance across all transactions, bills & purchases
    const txRecords = await PartyTransaction.find({
      partyId: party._id,
      companyId: req.companyId,
      isDeleted: { $ne: true }
    });

    const isSupplier = (party.partyType === "supplier");
    const rawOpening = Number(party.openingBalance || 0);
    const openingBal = isSupplier ? -Math.abs(rawOpening) : Math.abs(rawOpening);
    let trueNetBalance = openingBal;

    txRecords.forEach(t => {
      trueNetBalance += (Number(t.debit || 0) - Number(t.credit || 0));
    });

    const existingRefBillIds = new Set();
    txRecords.forEach(t => {
      if (t.referenceBillId) existingRefBillIds.add(String(t.referenceBillId));
      if (t.billNumber) existingRefBillIds.add(String(t.billNumber));
      if (t.refNo) existingRefBillIds.add(String(t.refNo));
    });

    const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`^${escapeRegex(party.name)}$`, "i");
    const billQuery = {
      companyId: req.companyId,
      isDeleted: { $ne: true },
      status: { $ne: "cancelled" },
      $or: [
        { partyId: party._id },
        { customerName: nameRegex },
        { partyName: nameRegex },
        { customer: nameRegex }
      ]
    };
    if (party.mobileNumber && party.mobileNumber.length >= 10) {
      billQuery.$or.push({ customerMobile: party.mobileNumber }, { customerPhone: party.mobileNumber });
    }
    const billRecords = await Bill.find(billQuery);

    for (const b of billRecords) {
      const bNum = String(b.billNumber || b.invoiceNumber || b.id || b._id || "BILL");
      const bId = String(b._id || "");
      const invNo = String(b.invoiceNumber || "");
      const alreadyInTx = existingRefBillIds.has(bNum) || existingRefBillIds.has(bId) || (invNo && existingRefBillIds.has(invNo));
      if (!alreadyInTx) {
        const finalAmt = Number(b.finalAmount ?? b.total ?? 0);
        const isPaid = String(b.paymentStatus || b.status || "").toLowerCase() === "paid";
        const paidAmt = isPaid ? finalAmt : Number(b.amountPaid || b.advanceAmount || b.receivedAmount || 0);
        trueNetBalance += (finalAmt - paidAmt);
      }
    }

    const purchaseRecords = await Purchase.find({
      partyId: party._id,
      companyId: req.companyId,
      isDeleted: { $ne: true }
    });

    for (const p of purchaseRecords) {
      const pNum = String(p.billNumber || p.invoiceNo || p.purchaseNumber || "PUR");
      const pId = String(p._id || "");
      if (!existingRefBillIds.has(pNum) && !existingRefBillIds.has(pId)) {
        const totalAmt = Number(p.totalAmount ?? p.total ?? 0);
        trueNetBalance -= totalAmt;
      }
    }

    // If true net balance is non-zero, record exact settlement entry to bring running ledger to ₹0
    if (Math.abs(trueNetBalance) > 0.001) {
      const settleTx = new PartyTransaction({
        partyId: party._id,
        companyId: req.companyId,
        date: new Date(),
        details: "खाता चुकता / सेटलमेंट (Account Settled to ₹0)",
        debit: trueNetBalance < 0 ? Math.abs(trueNetBalance) : 0,
        credit: trueNetBalance > 0 ? Math.abs(trueNetBalance) : 0,
        type: "settlement"
      });
      await settleTx.save();
      syncPartyTxToSupabase(settleTx).catch(e => console.warn("[Supabase Sync] Party Tx dual-write note:", e.message));
      syncPartyToSupabase(party).catch(e => console.warn("[Supabase Sync] Party dual-write note:", e.message));
    }

    // Mark any pending credit bills as settled — use same broad filter as the bill fetch above
    const paidBillFilter = { ...billQuery };
    delete paidBillFilter.status; // remove status filter, keep isDeleted filter
    paidBillFilter.paymentStatus = { $in: ["unpaid", "partial"] };
    await Bill.updateMany(paidBillFilter, { $set: { paymentStatus: "paid" } }).catch(() => {});

    party.currentBalance = 0;
    party.openingBalance = 0;
    party.balance = 0;
    party.updatedAt = new Date();
    await party.save();

    // Dual-write zeroed balance to Supabase
    syncPartyToSupabase(party).catch(e => console.warn("[Supabase Sync] Party clear-balance dual-write note:", e.message));
    if (supabase) {
      const pUuid = (party.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(party.id)))
        ? party.id
        : mongoIdToUuid(party._id);
      supabase.from("parties").update({ current_balance: 0, opening_balance: 0, updated_at: new Date().toISOString() }).eq("id", pUuid).then(() => {}, () => {});
    }

    res.json({
      success: true,
      message: `पार्टी '${party.name}' का हिसाब सफलतापूर्वक चुकता (₹0) कर दिया गया!`,
      currentBalance: 0,
      party
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};


export const listParties = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { type } = req.query;

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbParties = await getPartiesFromSupabase({ companyId: req.companyId, partyType: type });
      if (sbParties && sbParties.length > 0) {
        // Auto-heal suppliers whose openingBalance was saved with positive currentBalance
        const normalizedSbParties = sbParties.map(pDoc => {
          const isSupplier = (pDoc.partyType === "supplier" || pDoc.type === "supplier");
          let curBal = Number(pDoc.currentBalance ?? pDoc.balance ?? 0);
          const opBal = Math.abs(Number(pDoc.openingBalance || 0));

          if (isSupplier && opBal > 0) {
            if (curBal > 0 && Math.abs(curBal) === opBal) {
              curBal = -opBal;
              pDoc.currentBalance = curBal;
              pDoc.balance = curBal;
              if (supabase) {
                supabase.from("parties").update({ current_balance: curBal }).eq("id", pDoc.id).then(() => {}, () => {});
              }
            }
          }
          pDoc.balance = curBal;
          return pDoc;
        });
        return res.json({ success: true, parties: normalizedSbParties, source: "supabase" });
      }
    } catch (sbErr) {
      console.warn("[Supabase Read] listParties error, falling back to Mongo:", sbErr.message);
    }
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

      // Auto-heal suppliers whose openingBalance was saved with positive currentBalance
      // Do NOT revert if curBal is 0 (which means it's settled/cleared)
      if (isSupplier && opBal > 0) {
        if (curBal > 0 && Math.abs(curBal) === opBal) {
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
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyById = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbParty = await getPartyByIdFromSupabase(id, req.companyId);
      if (sbParty) {
        return res.json({ success: true, party: sbParty, source: "supabase" });
      }
    } catch (sbErr) {
      console.warn("[Supabase Read] getPartyById error, falling back to Mongo:", sbErr.message);
    }

    let party = null;
    if (isMongoId) {
      party = await Party.findOne({ _id: id, companyId: req.companyId });
    }
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (req.body.name && req.body.address) {
      const trimmedName = req.body.name.trim();
      const trimmedAddress = req.body.address.trim();
      const duplicateQuery = {
        companyId: req.companyId,
        isActive: true,
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
        address: { $regex: new RegExp(`^${escapeRegex(trimmedAddress)}$`, "i") }
      };
      if (isMongoId) {
        duplicateQuery._id = { $ne: id };
      }
      const duplicateParty = await Party.findOne(duplicateQuery);
      if (duplicateParty && (isMongoId ? String(duplicateParty._id) !== id : mongoIdToUuid(duplicateParty._id) !== id)) {
        return res.status(400).json({
          success: false,
          error: `पार्टी '${trimmedName}' (पता: '${trimmedAddress}') पहले से मौजूद है! एक ही नाम और पते से डुप्लीकेट नहीं बनाया जा सकता।`
        });
      }
    }

    // Find existing party first to accurately calculate balances if opening balance is updated
    let existingParty = null;
    if (isMongoId) {
      existingParty = await Party.findOne({ _id: id, companyId: req.companyId });
    } else {
      existingParty = await Party.findOne({
        companyId: req.companyId,
        $or: [
          { id },
          ...(req.body.name ? [{ name: req.body.name }] : []),
          ...(req.body.mobileNumber ? [{ mobileNumber: req.body.mobileNumber }] : [])
        ]
      });
    }

    const isSupplier = (req.body.partyType || existingParty?.partyType || existingParty?.type) === 'supplier';
    const bType = String(req.body.balanceType || req.body.balanceDir || (isSupplier ? 'PAY' : 'RECEIVE')).toUpperCase();
    const isNegative = bType.includes("PAY") || bType.includes("देने") || bType.includes("NEG");

    if (req.body.openingBalance !== undefined) {
      const newOpVal = Math.abs(Number(req.body.openingBalance || 0));
      const oldOpVal = Math.abs(Number(existingParty?.openingBalance || 0));

      const oldIsSupplier = (existingParty?.partyType || existingParty?.type) === 'supplier';
      const oldIsNegative = String(existingParty?.balanceType || existingParty?.balanceDir || (oldIsSupplier ? 'PAY' : 'RECEIVE')).toUpperCase().includes("PAY") || oldIsSupplier;
      const oldOpSigned = oldIsNegative ? -oldOpVal : oldOpVal;
      const newOpSigned = isNegative ? -newOpVal : newOpVal;

      req.body.openingBalance = newOpVal;

      // If currentBalance was not explicitly passed, compute new currentBalance from delta
      if (req.body.currentBalance === undefined || req.body.currentBalance === null) {
        const curBal = Number(existingParty?.currentBalance ?? existingParty?.balance ?? 0);
        const updatedBal = curBal - oldOpSigned + newOpSigned;
        req.body.currentBalance = updatedBal;
        req.body.balance = updatedBal;
      } else {
        req.body.currentBalance = Number(req.body.currentBalance);
        req.body.balance = req.body.currentBalance;
      }

      if (req.body.openingBalanceDate) {
        req.body.openingBalanceDate = new Date(req.body.openingBalanceDate);
      } else if (!existingParty?.openingBalanceDate && newOpVal > 0) {
        req.body.openingBalanceDate = new Date();
      }
    } else if (isSupplier && isNegative) {
      if (req.body.currentBalance !== undefined && req.body.currentBalance !== null) {
        req.body.currentBalance = -Math.abs(Number(req.body.currentBalance));
        req.body.balance = req.body.currentBalance;
      }
    }

    let party = null;
    if (isMongoId) {
      party = await Party.findOneAndUpdate(
        { _id: id, companyId: req.companyId },
        req.body,
        { new: true }
      );
    } else {
      const nameOrPhone = req.body.name || req.body.mobileNumber;
      if (nameOrPhone) {
        party = await Party.findOneAndUpdate(
          {
            companyId: req.companyId,
            $or: [
              ...(req.body.mobileNumber ? [{ mobileNumber: req.body.mobileNumber }] : []),
              ...(req.body.name ? [{ name: req.body.name }] : [])
            ]
          },
          req.body,
          { new: true }
        );
      }
    }

    const partyToSync = party ? party.toObject() : { ...req.body, _id: id, id, companyId: req.companyId };
    syncPartyToSupabase(partyToSync).catch(e => console.warn("[Supabase Sync] Party dual-write note:", e.message));

    res.json({ success: true, party: partyToSync, message: "Party updated successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { id } = req.params;
    const isMongoId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);

    // 1. Find party in MongoDB (by _id, id string, or name)
    let mongoParty = null;
    if (isMongoId) {
      mongoParty = await Party.findOne({ _id: id, companyId: req.companyId }) || await Party.findById(id);
    }
    if (!mongoParty) {
      mongoParty = await Party.findOne({ companyId: req.companyId, $or: [{ id: id }, { name: id }] });
    }

    // 2. Find party in Supabase
    let sbParty = null;
    try {
      sbParty = await getPartyByIdFromSupabase(id, req.companyId);
    } catch (e) {}

    // Match counterpart across DBs if one was found
    if (!mongoParty && sbParty?.name) {
      mongoParty = await Party.findOne({ companyId: req.companyId, name: sbParty.name });
    }

    const partyName = mongoParty?.name || sbParty?.name || id;

    // 3. Delete or deactivate in MongoDB
    if (mongoParty) {
      const mId = mongoParty._id;
      const txCount = await PartyTransaction.countDocuments({ partyId: mId, isDeleted: { $ne: true } });
      const billCount = await Bill.countDocuments({ partyId: mId, isDeleted: { $ne: true } });

      if (txCount === 0 && billCount === 0) {
        await Party.deleteOne({ _id: mId });
      } else {
        mongoParty.isActive = false;
        mongoParty.mobileNumber = `${mongoParty.mobileNumber}_del_${Date.now()}`;
        await mongoParty.save();
        await PartyTransaction.updateMany(
          { partyId: mId, companyId: req.companyId },
          { $set: { isDeleted: true } }
        );
      }
    }

    // 4. Delete or deactivate in Supabase
    try {
      const sbId = sbParty?.id || (mongoParty ? mongoIdToUuid(mongoParty._id) : (isMongoId ? mongoIdToUuid(id) : id));
      if (supabase && sbId) {
        const { error: delErr } = await supabase.from("parties").delete().eq("id", sbId);
        if (delErr) {
          await supabase.from("parties").update({
            is_active: false,
            updated_at: new Date().toISOString()
          }).eq("id", sbId);
        }
      }
    } catch (sbDelErr) {
      console.warn("[Supabase Sync] deleteParty error:", sbDelErr.message);
    }

    res.json({ success: true, message: `पार्टी '${partyName}' सफलतापूर्वक हटा दी गई!` });
  } catch (error) {
    if (error.code === 11000) {
      if (error.message && error.message.includes("mobileNumber")) {
        return res.status(400).json({
          success: false,
          error: "इस मोबाइल नंबर से पार्टी पहले से सक्रिय है!"
        });
      }
      return res.status(400).json({
        success: false,
        error: "इस नाम या विवरण से पार्टी पहले से मौजूद है!"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
