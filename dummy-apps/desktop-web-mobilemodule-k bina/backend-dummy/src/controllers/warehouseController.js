import Warehouse from "../model/warehouse.js";

export const addWarehouse = async (req, res) => {
  try {
    const { companyId } = req;
    const { branchId, name, location, capacity, isDefault } = req.body;
    if (!companyId || !branchId) return res.status(400).json({ success: false, message: "Company ID and Branch ID are required" });

    const warehouse = new Warehouse({ companyId, branchId, name, location, capacity, isDefault });
    await warehouse.save();
    res.status(201).json({ success: true, message: "Warehouse created successfully", warehouse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listWarehouses = async (req, res) => {
  try {
    const filter = { companyId: req.companyId, isActive: true };
    if (req.query.branchId) filter.branchId = req.query.branchId;

    const warehouses = await Warehouse.find(filter).populate("branchId", "name");
    res.status(200).json({ success: true, warehouses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};