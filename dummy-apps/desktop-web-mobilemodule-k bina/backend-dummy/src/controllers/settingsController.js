import Company from '../model/company.js';

// Get current WhatsApp settings for the logged-in company
export const getWhatsappSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select('settings.whatsapp');
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    res.status(200).json({ success: true, settings: company.settings?.whatsapp || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update WhatsApp settings for the logged-in company
export const updateWhatsappSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, message: "Settings object is required." });
    }

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      { $set: { 'settings.whatsapp': settings } },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    res.status(200).json({ success: true, message: "WhatsApp settings updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};