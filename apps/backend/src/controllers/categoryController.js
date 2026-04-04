import Category from "../model/category.js";

export const createCategory = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name, companyId: req.companyId });
    if (existingCategory) {
      return res.status(400).json({ success: false, error: "Category with this name already exists" });
    }

    const category = new Category({ ...req.body, companyId: req.companyId });
    await category.save();
    res.status(201).json({ success: true, category, message: `Category ${name} created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCategories = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    
    const categories = await Category.find({ isActive: true, companyId: req.companyId });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const category = await Category.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });
    res.json({ success: true, category, message: "Category updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const category = await Category.findOneAndUpdate({ _id: req.params.id, companyId: req.companyId }, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });
    res.json({ success: true, message: "Category deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
