import Company from "../model/company.js";

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
    const { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, customQrCode, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications } = req.body;
    const updateData = { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, customQrCode, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications };
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // Security ke liye user ID check
      { $set: updateData }, // Frontend se bheji gayi naye details (website, bank, etc.)
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
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