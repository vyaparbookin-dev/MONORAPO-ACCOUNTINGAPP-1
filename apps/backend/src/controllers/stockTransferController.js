import StockTransfer from "../model/stockTransfer.js";
import Product from "../model/product.js";

export const initiateTransfer = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { fromBranchId, fromWarehouseId, toBranchId, toWarehouseId, items, notes } = req.body;

    const transfer = new StockTransfer({
      transferNumber: `TRF-${Date.now()}`,
      companyId,
      fromBranchId,
      fromWarehouseId,
      toBranchId,
      toWarehouseId,
      items,
      notes
    });

    await transfer.save();

    // Product model mein jab hum stockLocations array banayenge 
    // tab yahan par 'from' se deduct karke 'to' mein quantity badha denge.
    // Jaise hi Frontend chalega, hum Inventory system ko Deep level par update karenge.

    res.status(201).json({ success: true, message: "Stock Transfer Initiated Successfully!", data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransfers = async (req, res) => {
  try {
    const transfers = await StockTransfer.find({ companyId: req.companyId })
      .populate("fromBranchId", "name")
      .populate("toBranchId", "name")
      .populate("fromWarehouseId", "name")
      .populate("toWarehouseId", "name")
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};