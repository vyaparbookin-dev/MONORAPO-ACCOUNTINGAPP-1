import SubCategory from "../model/subCategory.js";

export const createSubCategory = async (req, res) => {
  try {
    const existingSub = await SubCategory.findOne({ name: req.body.name, companyId: req.companyId });
    if (existingSub) return res.status(400).json({ success: false, error: "SubCategory already exists" });

    const subCategory = new SubCategory({ ...req.body, companyId: req.companyId });
    await subCategory.save();
    res.status(201).json({ success: true, subCategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({ isActive: true, companyId: req.companyId });
    res.json({ success: true, subCategories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, req.body, { new: true });
    if (!subCategory) return res.status(404).json({ success: false, error: "SubCategory not found" });
    res.json({ success: true, subCategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, { isActive: false }, { new: true });
    if (!subCategory) return res.status(404).json({ success: false, error: "SubCategory not found" });
    res.json({ success: true, message: "SubCategory deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};