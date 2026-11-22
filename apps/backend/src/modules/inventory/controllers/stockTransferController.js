import StockTransfer from "../models/stockTransfer.js";
import Product from "../models/product.js";
import Warehouse from "../models/warehouse.js";
import Company from "../../../model/company.js";
import { mongoIdToUuid } from "../../../services/supabaseSyncService.js";
import mongoose from "mongoose";

const getCompanyObjectId = async (coId) => {
  const coIdStr = String(coId || "");
  if (mongoose.Types.ObjectId.isValid(coIdStr)) {
    return new mongoose.Types.ObjectId(coIdStr);
  }
  try {
    const allCompanies = await Company.find({}, { _id: 1 }).lean();
    for (const c of allCompanies) {
      if (mongoIdToUuid(c._id) === coIdStr) {
        return c._id;
      }
    }
  } catch (e) {}
  return coId;
};

// Auto-generate sequential Challan number (e.g. STC-2026-0001)
const generateChallanNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `STC-${year}-`;
  
  const lastTransfer = await StockTransfer.findOne({
    companyId,
    transferNumber: { $regex: `^${prefix}` }
  }).sort({ createdAt: -1 }).lean();

  let nextSeq = 1;
  if (lastTransfer && lastTransfer.transferNumber) {
    const parts = lastTransfer.transferNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
};

export const initiateTransfer = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    const {
      fromWarehouseId,
      toWarehouseId,
      fromBranchId,
      toBranchId,
      fromLocationName,
      toLocationName,
      vehicleNumber,
      driverName,
      driverPhone,
      ewayBillNumber,
      items,
      notes,
      date,
      status = "completed"
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "कृपया ट्रांसफर करने के लिए कम से कम एक उत्पाद जोड़ें" });
    }

    if (fromWarehouseId && toWarehouseId && String(fromWarehouseId) === String(toWarehouseId)) {
      return res.status(400).json({ success: false, message: "भेजने वाला गोदाम और प्राप्तकर्ता गोदाम अलग-अलग होने चाहिए" });
    }

    // Resolve Location Names
    let resolvedFromName = fromLocationName || "";
    let resolvedToName = toLocationName || "";

    if (fromWarehouseId && mongoose.Types.ObjectId.isValid(fromWarehouseId)) {
      const whFrom = await Warehouse.findById(fromWarehouseId).lean();
      if (whFrom) resolvedFromName = whFrom.name;
    }
    if (toWarehouseId && mongoose.Types.ObjectId.isValid(toWarehouseId)) {
      const whTo = await Warehouse.findById(toWarehouseId).lean();
      if (whTo) resolvedToName = whTo.name;
    }

    const challanNumber = await generateChallanNumber(companyId);

    // Calculate totals and enrich item data
    let totalQty = 0;
    let totalAmt = 0;
    const enrichedItems = [];

    for (const item of items) {
      const qty = Math.max(0, Number(item.quantity || 0));
      if (qty <= 0) continue;

      let pName = item.name || "Unknown Product";
      let pRate = Number(item.rate || item.purchasePrice || item.sellingPrice || 0);
      let pUnit = item.unit || "Pcs";

      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const prod = await Product.findOne({ _id: item.productId, companyId }).lean();
        if (prod) {
          pName = prod.name;
          pRate = pRate || Number(prod.purchasePrice ?? prod.costPrice ?? prod.sellingPrice ?? 0);
          pUnit = prod.unit || pUnit;
        }
      }

      const itemTotal = Math.round(qty * pRate * 100) / 100;
      totalQty += qty;
      totalAmt += itemTotal;

      enrichedItems.push({
        productId: item.productId,
        name: pName,
        quantity: qty,
        unit: pUnit,
        rate: pRate,
        total: itemTotal,
        notes: item.notes || ""
      });
    }

    if (enrichedItems.length === 0) {
      return res.status(400).json({ success: false, message: "कोई मान्य उत्पाद मात्रा नहीं मिली" });
    }

    // Create Stock Transfer Challan
    const transfer = new StockTransfer({
      transferNumber: challanNumber,
      companyId,
      fromBranchId: fromBranchId && mongoose.Types.ObjectId.isValid(fromBranchId) ? fromBranchId : undefined,
      toBranchId: toBranchId && mongoose.Types.ObjectId.isValid(toBranchId) ? toBranchId : undefined,
      fromWarehouseId: fromWarehouseId && mongoose.Types.ObjectId.isValid(fromWarehouseId) ? fromWarehouseId : undefined,
      toWarehouseId: toWarehouseId && mongoose.Types.ObjectId.isValid(toWarehouseId) ? toWarehouseId : undefined,
      fromLocationName: resolvedFromName || "मुख्य दुकान",
      toLocationName: resolvedToName || "अन्य गोदाम",
      vehicleNumber: vehicleNumber || "",
      driverName: driverName || "",
      driverPhone: driverPhone || "",
      ewayBillNumber: ewayBillNumber || "",
      items: enrichedItems,
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
      status: status || "completed",
      isDeleted: false
    });

    await transfer.save();

    // LIVE STOCK ADJUSTMENT: Update Product stockLocations
    // (If transfer status is completed or dispatched, move stock)
    if (status === "completed" || status === "dispatched" || status === "received") {
      for (const item of enrichedItems) {
        if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) continue;

        try {
          const product = await Product.findOne({ _id: item.productId, companyId });
          if (!product) continue;

          if (!Array.isArray(product.stockLocations)) {
            product.stockLocations = [];
          }

          const curTotalStock = Number(product.currentStock ?? product.stock ?? 0);

          // Update Source Warehouse Stock
          if (fromWarehouseId) {
            const fromIdx = product.stockLocations.findIndex(l => String(l.warehouseId) === String(fromWarehouseId));
            if (fromIdx >= 0) {
              product.stockLocations[fromIdx].quantity = Math.max(0, (product.stockLocations[fromIdx].quantity || 0) - item.quantity);
            } else {
              // Initialize source warehouse with existing balance minus transferred
              const remainingInSource = Math.max(0, curTotalStock - item.quantity);
              product.stockLocations.push({
                warehouseId: fromWarehouseId,
                quantity: remainingInSource
              });
            }
          }

          // Update Destination Warehouse Stock
          if (toWarehouseId) {
            const toIdx = product.stockLocations.findIndex(l => String(l.warehouseId) === String(toWarehouseId));
            if (toIdx >= 0) {
              product.stockLocations[toIdx].quantity = (product.stockLocations[toIdx].quantity || 0) + item.quantity;
            } else {
              product.stockLocations.push({
                warehouseId: toWarehouseId,
                quantity: item.quantity
              });
            }
          }

          await product.save();
        } catch (stockErr) {
          console.error(`[StockTransfer] Error updating stock for item ${item.name}:`, stockErr);
        }
      }
    }

    const populated = await StockTransfer.findById(transfer._id)
      .populate("fromWarehouseId", "name location address")
      .populate("toWarehouseId", "name location address")
      .lean();

    res.status(201).json({
      success: true,
      message: `स्टॉक ट्रांसफर चालान #${challanNumber} सफलतापूर्वक जनरेट हुआ`,
      data: populated || transfer
    });
  } catch (error) {
    console.error("[initiateTransfer] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransfers = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    const { status, search, startDate, endDate } = req.query;

    const filter = { companyId, isDeleted: { $ne: true } };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    let transfers = await StockTransfer.find(filter)
      .populate("fromWarehouseId", "name location address managerName phone")
      .populate("toWarehouseId", "name location address managerName phone")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      transfers = transfers.filter(t => 
        (t.transferNumber && t.transferNumber.toLowerCase().includes(q)) ||
        (t.fromLocationName && t.fromLocationName.toLowerCase().includes(q)) ||
        (t.toLocationName && t.toLocationName.toLowerCase().includes(q)) ||
        (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q)) ||
        (t.driverName && t.driverName.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      data: transfers,
      count: transfers.length
    });
  } catch (error) {
    console.error("[getTransfers] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransferById = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const { id } = req.params;
    const companyId = await getCompanyObjectId(rawCoId);

    const transfer = await StockTransfer.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate("fromWarehouseId", "name location address managerName phone")
      .populate("toWarehouseId", "name location address managerName phone")
      .populate("items.productId", "name sku unit barcode")
      .lean();

    if (!transfer) {
      return res.status(404).json({ success: false, message: "चालान नहीं मिला" });
    }

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTransferStatus = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const { id } = req.params;
    const { status, receivedBy, notes } = req.body;
    const companyId = await getCompanyObjectId(rawCoId);

    const transfer = await StockTransfer.findOne({ _id: id, companyId });
    if (!transfer) {
      return res.status(404).json({ success: false, message: "चालान नहीं मिला" });
    }

    // If cancelling an active transfer, reverse stock movement
    if (status === 'cancelled' && transfer.status !== 'cancelled') {
      for (const item of transfer.items) {
        if (!item.productId) continue;
        try {
          const product = await Product.findOne({ _id: item.productId, companyId });
          if (product && Array.isArray(product.stockLocations)) {
            // Add back to fromWarehouse
            if (transfer.fromWarehouseId) {
              const fIdx = product.stockLocations.findIndex(l => String(l.warehouseId) === String(transfer.fromWarehouseId));
              if (fIdx >= 0) product.stockLocations[fIdx].quantity += item.quantity;
            }
            // Deduct from toWarehouse
            if (transfer.toWarehouseId) {
              const tIdx = product.stockLocations.findIndex(l => String(l.warehouseId) === String(transfer.toWarehouseId));
              if (tIdx >= 0) product.stockLocations[tIdx].quantity = Math.max(0, product.stockLocations[tIdx].quantity - item.quantity);
            }
            await product.save();
          }
        } catch (e) {}
      }
    }

    transfer.status = status || transfer.status;
    if (status === 'received' || status === 'completed') {
      transfer.receivedDate = new Date();
      if (receivedBy) transfer.receivedBy = receivedBy;
    }
    if (notes) transfer.notes = notes;

    await transfer.save();
    res.status(200).json({ success: true, message: "चालान स्थिति अपडेट हो गई", data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const { id } = req.params;
    const companyId = await getCompanyObjectId(rawCoId);

    await StockTransfer.findOneAndUpdate({ _id: id, companyId }, { isDeleted: true, status: 'cancelled' });
    res.status(200).json({ success: true, message: "चालान हटा दिया गया" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
