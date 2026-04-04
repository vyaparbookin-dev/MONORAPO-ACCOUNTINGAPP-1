import Brand from "../model/brand.js";

export const createBrand = async (req, res) => {
  try {
    const existingBrand = await Brand.findOne({ name: req.body.name, companyId: req.companyId });
    if (existingBrand) return res.status(400).json({ success: false, error: "Brand already exists" });

    const brand = new Brand({ ...req.body, companyId: req.companyId });
    await brand.save();
    res.status(201).json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true, companyId: req.companyId });
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
    res.json({ success: true, message: "Brand deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};