import Company from "../model/company.js";
import Product from "../model/product.js";

export const addCompany = async (req, res) => {
  try {
    const companyData = { ...req.body, user: req.user.id };
    const company = new Company(companyData);
    await company.save();
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ user: req.user.id });
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    // Explicitly define which fields can be updated for security and clarity.
    const { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications, enableGst, gstActionPreference } = req.body;
    const updateData = { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications, enableGst };
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // Security ke liye user ID check
      { $set: updateData }, // Frontend se bheji gayi naye details (website, bank, etc.)
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // 🚀 GST AUTOMATIC PRICING ENGINE 🚀
    if (enableGst === false && gstActionPreference) {
      if (gstActionPreference === 'keep_final') {
        // Pipeline approach: Calculate the new base price directly in database (Base = Base + (Base * GST / 100))
        await Product.updateMany(
          { companyId: req.params.id },
          [
            {
              $set: {
                sellingPrice: { $add: ["$sellingPrice", { $divide: [{ $multiply: ["$sellingPrice", { $ifNull: ["$gstRate", 0] }] }, 100] }] },
                costPrice: { $add: ["$costPrice", { $divide: [{ $multiply: ["$costPrice", { $ifNull: ["$gstRate", 0] }] }, 100] }] },
                wholesalePrice: { $add: ["$wholesalePrice", { $divide: [{ $multiply: ["$wholesalePrice", { $ifNull: ["$gstRate", 0] }] }, 100] }] },
                dealerPrice: { $add: ["$dealerPrice", { $divide: [{ $multiply: ["$dealerPrice", { $ifNull: ["$gstRate", 0] }] }, 100] }] },
                gstRate: 0
              }
            }
          ]
        );
      } else if (gstActionPreference === 'keep_base') {
        // Sirf GST hata do, rates chhedne ki zarurat nahi hai
        await Product.updateMany({ companyId: req.params.id }, { $set: { gstRate: 0 } });
      }
    }

    res.json({ success: true, company, message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};