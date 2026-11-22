import Warehouse from "../models/warehouse.js";
import Product from "../models/product.js";
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

export const addWarehouse = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID is required" });

    const companyId = await getCompanyObjectId(rawCoId);
    const { branchId, name, location, address, managerName, phone, capacity, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "गोदाम का नाम आवश्यक है" });
    }

    if (isDefault) {
      await Warehouse.updateMany({ companyId }, { isDefault: false });
    }

    // Check if this is first warehouse
    const count = await Warehouse.countDocuments({ companyId, isActive: true });
    const shouldBeDefault = count === 0 ? true : Boolean(isDefault);

    const warehouse = new Warehouse({
      companyId,
      branchId: branchId && mongoose.Types.ObjectId.isValid(branchId) ? branchId : undefined,
      name: name.trim(),
      location: location || "",
      address: address || "",
      managerName: managerName || "",
      phone: phone || "",
      capacity: Number(capacity) || 0,
      isDefault: shouldBeDefault,
      isActive: true
    });

    await warehouse.save();
    res.status(201).json({ success: true, message: "गोदाम सफलतापूर्वक जोड़ा गया", warehouse });
  } catch (error) {
    console.error("[addWarehouse] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listWarehouses = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    let warehouses = await Warehouse.find({ companyId, isActive: true })
      .populate("branchId", "name")
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    // Auto-initialize primary godown if none exist
    if (warehouses.length === 0) {
      try {
        const defaultWh = new Warehouse({
          companyId,
          name: "मुख्य दुकान / प्राथमिक गोदाम (Main Shop & Godown)",
          location: "मुख्य परिसर (Main Premises)",
          address: "दुकान परिसर",
          isDefault: true,
          isActive: true
        });
        await defaultWh.save();
        warehouses = [defaultWh.toObject()];
      } catch (seedErr) {
        console.error("Auto default warehouse error:", seedErr);
      }
    }

    // Get stock breakdown for each warehouse from Product.stockLocations
    const products = await Product.find({ companyId, isActive: { $ne: false }, isDeleted: { $ne: true } }, { stockLocations: 1, currentStock: 1, stock: 1 }).lean();
    
    const warehouseStockMap = {};
    let totalCompanyStock = 0;

    products.forEach(p => {
      const pStock = Number(p.currentStock ?? p.stock ?? 0);
      totalCompanyStock += pStock;

      if (Array.isArray(p.stockLocations) && p.stockLocations.length > 0) {
        p.stockLocations.forEach(loc => {
          const whIdStr = String(loc.warehouseId || "");
          if (whIdStr) {
            warehouseStockMap[whIdStr] = (warehouseStockMap[whIdStr] || 0) + Number(loc.quantity || 0);
          }
        });
      }
    });

    const enrichedWarehouses = warehouses.map(w => {
      const wIdStr = String(w._id);
      let stockInWh = warehouseStockMap[wIdStr];
      // If default warehouse and no explicit location mapped yet, show general inventory stock
      if (stockInWh === undefined && w.isDefault) {
        stockInWh = totalCompanyStock;
      }
      return {
        ...w,
        itemCount: products.length,
        totalStock: Math.max(0, stockInWh || 0)
      };
    });

    res.status(200).json({ 
      success: true, 
      warehouses: enrichedWarehouses,
      totalWarehouses: enrichedWarehouses.length 
    });
  } catch (error) {
    console.error("[listWarehouses] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const { id } = req.params;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    const { name, location, address, managerName, phone, capacity, isDefault } = req.body;

    if (isDefault) {
      await Warehouse.updateMany({ companyId, _id: { $ne: id } }, { isDefault: false });
    }

    const updated = await Warehouse.findOneAndUpdate(
      { _id: id, companyId },
      {
        ...(name ? { name: name.trim() } : {}),
        location: location || "",
        address: address || "",
        managerName: managerName || "",
        phone: phone || "",
        capacity: Number(capacity) || 0,
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {})
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "गोदाम नहीं मिला" });
    }

    res.status(200).json({ success: true, message: "गोदाम विवरण अपडेट हो गया", warehouse: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const { id } = req.params;
    const companyId = await getCompanyObjectId(rawCoId);

    const wh = await Warehouse.findOne({ _id: id, companyId });
    if (!wh) {
      return res.status(404).json({ success: false, message: "गोदाम नहीं मिला" });
    }

    if (wh.isDefault) {
      return res.status(400).json({ success: false, message: "प्राथमिक (Default) गोदाम को हटाया नहीं जा सकता" });
    }

    await Warehouse.findByIdAndUpdate(id, { isActive: false });
    res.status(200).json({ success: true, message: "गोदाम हटा दिया गया" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
