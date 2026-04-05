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
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company settings
router.post("/update", protect, async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    const { upiId, name, gstNumber, enableGst } = req.body;
    
    const company = await Company.findByIdAndUpdate(
      req.companyId,
      { $set: { upiId, name, gstNumber, enableGst } }, // Update these fields in MongoDB
      { new: true }
    );
    
    res.json({ success: true, data: company, message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;