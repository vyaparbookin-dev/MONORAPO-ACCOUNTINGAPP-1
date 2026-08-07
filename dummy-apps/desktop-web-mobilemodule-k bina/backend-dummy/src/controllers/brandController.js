import Brand from "../model/brand.js";

export const createBrand = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Brand name is required" });

    const existing = await Brand.findOne({ name, companyId: req.companyId });
    if (existing) return res.status(400).json({ success: false, error: "Brand with this name already exists" });

    const brand = new Brand({ ...req.body, companyId: req.companyId });
    await brand.save();
    res.status(201).json({ success: true, brand, message: `Brand '${name}' created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBrands = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    const brands = await Brand.find({ companyId: req.companyId, isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, req.body, { new: true });
    if (!brand) return res.status(404).json({ success: false, error: "Brand not found" });
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, { isActive: false }, { new: true });
    if (!brand) return res.status(404).json({ success: false, error: "Brand not found" });
    res.json({ success: true, message: "Brand deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};