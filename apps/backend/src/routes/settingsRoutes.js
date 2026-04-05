import express from "express";
import Company from "../model/company.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Get company settings (Including UPI ID)
router.get("/", protect, async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    const company = await Company.findById(req.companyId);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    
    const data = company.toJSON();
    // If company is unregistered, force GST off
    if (data.gstType === 'unregistered') {
      data.enableGst = false;
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company settings
router.post("/update", protect, async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    const { upiId, name, gstNumber, enableGst, gstType } = req.body;
    
    const updateFields = { upiId, name, gstNumber };
    if (enableGst !== undefined) updateFields.enableGst = enableGst;
    if (gstType !== undefined) {
      updateFields.gstType = gstType;
      if (gstType === 'unregistered') updateFields.enableGst = false;
    }

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({ success: true, data: company, message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;