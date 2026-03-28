import Unit from "../model/unit.js";

export const getUnits = async (req, res) => {
  try {
    // Company specific aur common dono units bhejenge
    const query = req.companyId ? { $or: [{ companyId: req.companyId }, { companyId: { $exists: false } }] } : {};
    const units = await Unit.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, units });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createUnit = async (req, res) => {
  try {
    const { name, shortCode } = req.body;
    
    // Check if already exists
    let unit = await Unit.findOne({ name: name.toLowerCase() });
    if (!unit) {
      unit = new Unit({ name, shortCode, companyId: req.companyId });
      await unit.save();
    }
    res.status(201).json({ success: true, unit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};