import Company from "../model/company.js";
import { supabase } from "../config/supabase.js";

export const addCompany = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const companyData = { ...req.body, user: userId };
    const company = new Company(companyData);
    await company.save();

    // Sync to Supabase
    try {
      await supabase.from("companies").insert([{
        name: company.name,
        email: company.email || null,
        phone_number: company.phone || null,
        gst_number: company.gstNumber || null,
        address: company.address || null,
        upi_id: company.upiId || null,
        is_active: true
      }]);
    } catch (sbErr) {
      console.error("[Supabase Sync] addCompany error:", sbErr.message);
    }

    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCompanies = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();
    
    console.log("[Company Debug] listCompanies for userId:", userId?.toString?.() || userId, "email:", userEmail);

    const queryConditions = [];
    if (userId) {
      queryConditions.push({ user: userId });
    }
    if (userEmail) {
      queryConditions.push({ ownerEmail: userEmail });
      queryConditions.push({ email: userEmail });
    }

    const companies = await Company.find(
      queryConditions.length > 0 ? { $or: queryConditions } : {}
    ).lean();

    console.log("[Company Debug] Found companies count:", companies.length);
    res.json({ success: true, companies });
  } catch (error) {
    console.error("🔴 listCompanies Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();
    
    const queryConditions = [];
    if (userId) queryConditions.push({ user: userId });
    if (userEmail) {
      queryConditions.push({ ownerEmail: userEmail });
      queryConditions.push({ email: userEmail });
    }

    const company = await Company.findOne({
      _id: req.params.id,
      ...(queryConditions.length > 0 ? { $or: queryConditions } : {})
    }).lean();

    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, customQrCode, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications, enableGst } = req.body;
    
    let finalEnableGst = enableGst;
    if (gstType === 'unregistered') finalEnableGst = false;

    const updateData = { name, email, phone, gstType, industryType, ownershipType, gstNumber, address, upiId, customQrCode, businessType, website, panNumber, bankName, accountName, accountNumber, ifscCode, caName, caPhone, invoiceThemeColor, invoiceTemplateType, logo, theme, notifications };
    if (finalEnableGst !== undefined) updateData.enableGst = finalEnableGst;

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    try {
      await supabase.from("companies").update({
        name: company.name,
        email: company.email || null,
        phone_number: company.phone || null,
        gst_number: company.gstNumber || null,
        address: company.address || null,
        upi_id: company.upiId || null,
        updated_at: new Date().toISOString()
      }).ilike("name", `%${company.name}%`);
    } catch (sbErr) {
      console.error("[Supabase Sync] updateCompany error:", sbErr.message);
    }

    res.json({ success: true, company, message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const company = await Company.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
