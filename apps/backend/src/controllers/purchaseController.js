import mongoose from "mongoose";
import Purchase from "../model/purchase.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";
import { Parser } from "json2csv";
import { logActivity } from "../utils/logger.js";
import { syncPurchaseToSupabase, syncPurchaseDeleteToSupabase, mongoIdToUuid } from "../services/supabaseSyncService.js";
import { supabase } from "../config/supabase.js";
import { getPurchasesFromSupabase, getPurchaseByIdFromSupabase } from "../services/supabaseReadService.js";

// Create a new Purchase Bill (Stock Inward)
export const createPurchase = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { partyId, items = [], finalAmount, amountPaid = 0, paymentMethod } = req.body;

    // Resilient party resolution: handle Mongo ObjectId, Supabase UUID, or local offline party ID
    let matchedParty = null;
    const isMongoId = partyId && mongoose.Types.ObjectId.isValid(partyId);
    if (isMongoId) {
      matchedParty = await Party.findOne({ _id: partyId, companyId });
    }
    if (!matchedParty && partyId && supabase) {
      try {
        const pUuid = mongoIdToUuid(partyId);
        const { data: sbParty } = await supabase
          .from("parties")
          .select("*")
          .or(`id.eq.${pUuid},mongo_id.eq.${partyId}`)
          .maybeSingle();
        if (sbParty) {
          matchedParty = await Party.findOne({
            companyId,
            $or: [
              { name: new RegExp(`^${sbParty.name?.trim()}$`, "i") },
              ...(sbParty.phone ? [{ mobileNumber: sbParty.phone }] : [])
            ]
          });
        }
      } catch (e) {}
    }
    if (!matchedParty && (req.body.supplierName || req.body.supplier)) {
      const sName = (req.body.supplierName || req.body.supplier || "").trim();
      const escapedName = sName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchedParty = await Party.findOne({ companyId, name: { $regex: new RegExp("^" + escapedName + "$", "i") } });
    }
    if (!matchedParty) {
      const sName = (req.body.supplierName || req.body.supplier || "Supplier").trim();
      matchedParty = await Party.create({
        companyId,
        name: sName,
        mobileNumber: req.body.phone || req.body.mobileNumber || "9999999999",
        partyType: "supplier",
        currentBalance: 0,
        openingBalance: 0
      });
    }

    const resolvedPartyId = matchedParty._id;
    const supplierName = matchedParty.name || req.body.supplierName || req.body.supplier || "Supplier";
    const purNum = (req.body.purchaseNumber || req.body.billNumber || req.body.invoiceNo || req.body.invoiceNumber || `PUR-${Date.now().toString().slice(-6)}`).trim();
    const finalAmt = Number(finalAmount ?? req.body.totalAmount ?? req.body.total ?? 0);
    const amtPaid = Number(amountPaid ?? 0);
    const pendingAmount = finalAmt - amtPaid;

    const cleanItems = (Array.isArray(items) ? items : []).map(it => {
      const qty = Number(it.quantity || it.qty || 1);
      const rate = Number(it.rate || it.price || it.unitPrice || 0);
      const tot = Number(it.total || it.totalPrice || (qty * rate));
      return {
        productId: it.productId && mongoose.Types.ObjectId.isValid(it.productId) ? it.productId : undefined,
        name: it.name || "माल",
        quantity: qty,
        rate: rate,
        unit: it.unit || "Pcs",
        total: tot
      };
    });

    // 1. Create Purchase Bill Record
    const purchase = new Purchase({
      ...req.body,
      companyId,
      partyId: resolvedPartyId,
      supplierName,
      purchaseNumber: purNum,
      items: cleanItems,
      finalAmount: finalAmt,
      totalAmount: Number(req.body.totalAmount ?? finalAmt),
      amountPaid: amtPaid,
      paymentStatus: amtPaid >= finalAmt ? "paid" : amtPaid > 0 ? "partial" : "unpaid",
      paymentMethod: paymentMethod || (amtPaid > 0 ? "cash" : "credit")
    });

    await purchase.save();

    // 2. UPDATE INVENTORY (Increase Stock & update latest purchase cost price)
    for (const item of cleanItems) {
      const itemRate = Number(item.rate || 0);
      const qty = Number(item.quantity || 1);
      if (item.productId) {
        const updateFields = { $inc: { currentStock: qty } };
        if (itemRate > 0) updateFields.$set = { costPrice: itemRate };
        await Product.findByIdAndUpdate(item.productId, updateFields);
      } else if (item.name && item.name.trim()) {
        const trimmedName = item.name.trim();
        const updateFields = { $inc: { currentStock: qty } };
        if (itemRate > 0) updateFields.$set = { costPrice: itemRate };
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        await Product.findOneAndUpdate(
          { companyId, name: { $regex: new RegExp("^" + escapedName + "$", "i") } },
          updateFields
        );
      }
    }

    // 3. UPDATE SUPPLIER LEDGER (Accounts Payable)
    await Party.findByIdAndUpdate(
      resolvedPartyId,
      { $inc: { currentBalance: -pendingAmount } } 
    );

    // Transaction entry for full purchase
    await PartyTransaction.create({
      partyId: resolvedPartyId,
      companyId,
      date: req.body.date || new Date(),
      details: `Purchase Bill #${purchase.purchaseNumber}`,
      debit: 0,
      credit: finalAmt,
      type: 'bill',
      billImageUrl: req.body.billImageUrl || "",
      billNumber: purchase.purchaseNumber,
      referenceBillId: purchase._id
    });

    // If immediate partial/full payment was made at time of purchase
    if (amtPaid > 0) {
      await PartyTransaction.create({
        partyId: resolvedPartyId,
        companyId,
        date: req.body.date || new Date(),
        details: `Advance Payment for Purchase Bill #${purchase.purchaseNumber}`,
        debit: amtPaid,
        credit: 0,
        type: 'manual',
        billImageUrl: req.body.billImageUrl || "",
        referenceBillId: purchase._id
      });
    }

    // Audit Trail: Log this action
    await logActivity(req, `Recorded new Purchase #${purchase.purchaseNumber || purchase._id} for amount ₹${finalAmt}`);

    // Async Supabase Dual-Write
    syncPurchaseToSupabase(purchase).catch(sbErr => console.warn("[Supabase Dual-Write] Purchase sync note:", sbErr.message));

    res.status(201).json({ success: true, message: "Purchase recorded and stock updated successfully!", purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export all purchases to CSV format
export const exportPurchasesCSV = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    // Fetch all non-deleted purchases for this company
    const purchases = await Purchase.find({ companyId: req.companyId, isDeleted: false })
                                    .populate("partyId", "name")
                                    .sort({ date: -1 });

    // Define columns for CSV
    const fields = ['Purchase Number', 'Date', 'Supplier Name', 'Payment Status', 'Payment Method', 'Total Amount', 'Amount Paid'];
    
    // Map database data to CSV columns
    const csvData = purchases.map(p => ({
      'Purchase Number': p.purchaseNumber || 'N/A',
      'Date': new Date(p.date || p.createdAt).toLocaleDateString(),
      'Supplier Name': p.partyId ? p.partyId.name : 'Unknown',
      'Payment Status': p.paymentStatus?.toUpperCase() || 'N/A',
      'Payment Method': p.paymentMethod || 'N/A',
      'Total Amount': p.finalAmount || 0,
      'Amount Paid': p.amountPaid || 0
    }));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Send file to client
    res.header('Content-Type', 'text/csv');
    res.attachment(`Purchases_Export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Soft Delete a Purchase (with Stock & Supplier Ledger Revert)
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    let oldPurchase = null;
    if (isMongoId) {
      oldPurchase = await Purchase.findOne({ 
        _id: id, 
        companyId: req.companyId, 
        isDeleted: { $ne: true } 
      });
    } else {
      oldPurchase = await getPurchaseByIdFromSupabase(id, req.companyId);
    }
    if (!oldPurchase) return res.status(404).json({ success: false, error: "Purchase not found or already deleted" });

    if (isMongoId) {
      await Purchase.findOneAndUpdate(
        { _id: id, companyId: req.companyId },
        { isDeleted: true },
        { new: true }
      );
    }

    // 1. REVERT INVENTORY (Reduce the stock that was added on purchase)
    if (Array.isArray(oldPurchase.items)) {
      for (const item of oldPurchase.items) {
        if (item.productId && /^[0-9a-fA-F]{24}$/.test(String(item.productId))) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { currentStock: -Number(item.quantity || 1) } }
          );
        }
      }
    }

    // 2. REVERT SUPPLIER BALANCE & LEDGER
    if (oldPurchase.partyId && /^[0-9a-fA-F]{24}$/.test(String(oldPurchase.partyId))) {
      const finalAmt = Number(oldPurchase.finalAmount || 0);
      const paidAmt = Number(oldPurchase.amountPaid || 0);
      const pendingAmt = finalAmt - paidAmt;

      if (pendingAmt !== 0) {
        await Party.findByIdAndUpdate(
          oldPurchase.partyId,
          { $inc: { currentBalance: pendingAmt } }
        );
      }

      await PartyTransaction.updateMany(
        { referenceBillId: oldPurchase._id, companyId: req.companyId },
        { $set: { isDeleted: true } }
      );
    }

    // Supabase Dual-Write Deletion
    syncPurchaseDeleteToSupabase(id).catch(e => console.warn("[Supabase Dual-Write] Purchase delete note:", e.message));

    await logActivity(req, `Deleted Purchase #${oldPurchase.purchaseNumber || id} | Supplier: ${oldPurchase?.supplierName || 'Unknown'}, Amount was: ₹${oldPurchase?.finalAmount || 0}`);

    res.json({ success: true, message: "Purchase deleted and inventory/supplier ledger reverted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all Purchases for a company
export const getPurchases = async (req, res) => {
  try {
    // Pagination parameters URL query se nikalenge (e.g., ?page=1&limit=50)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbPurchases = await getPurchasesFromSupabase({ companyId: req.companyId, limit: req.query.limit || 100 });
      if (sbPurchases && sbPurchases.length > 0) {
        const total = sbPurchases.length;
        const paged = limit === 'all' ? sbPurchases : sbPurchases.slice(skip, skip + limit);
        return res.status(200).json({ 
          success: true, 
          purchases: paged,
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
          source: "supabase"
        });
      }
    } catch (sbErr) {
      console.warn("[Purchase Controller] getPurchases fallback to Mongo:", sbErr.message);
    }

    const filter = { companyId: req.companyId, isDeleted: false };

    // Promise.all se data aur count dono ek saath fetch honge (Speed double ho jayegi)
    const [purchases, totalPurchases] = await Promise.all([
      Purchase.find(filter)
        .populate("partyId", "name mobileNumber")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(filter)
    ]);

    res.status(200).json({ 
      success: true, 
      purchases,
      pagination: { total: totalPurchases, page, limit, totalPages: Math.ceil(totalPurchases / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single Purchase details
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    // --- PHASE 2: SUPABASE PRIMARY READ ---
    try {
      const sbPurchase = await getPurchaseByIdFromSupabase(id, req.companyId);
      if (sbPurchase) {
        return res.status(200).json({ success: true, purchase: sbPurchase, source: "supabase" });
      }
    } catch (sbErr) {
      console.warn("[Purchase Controller] getPurchaseById fallback to Mongo:", sbErr.message);
    }

    if (!isMongoId) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    const purchase = await Purchase.findOne({ _id: id, companyId: req.companyId })
                                   .populate("partyId", "name address gstNumber");
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
    res.status(200).json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};