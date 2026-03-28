import FixedAsset from "../model/fixedAsset.js";
import { logActivity } from "../utils/logger.js";

export const addAsset = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    // Jab asset kharida jata hai, toh initial Current Value = Purchase Cost hoti hai
    const asset = new FixedAsset({ ...req.body, companyId, currentValue: req.body.purchaseCost });
    await asset.save();

    await logActivity(req, `Added Fixed Asset: ${asset.assetName} worth ₹${asset.purchaseCost}`);
    res.status(201).json({ success: true, message: "Asset added successfully", asset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAssets = async (req, res) => {
  try {
    const assets = await FixedAsset.find({ companyId: req.companyId, isDeleted: false }).sort({ purchaseDate: -1 });
    res.json({ success: true, assets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Saal me ek baar ise call karke sabhi assets par ghisawat (depreciation) lagayi jayegi
export const calculateDepreciation = async (req, res) => {
  try {
    const assets = await FixedAsset.find({ companyId: req.companyId, status: 'active', isDeleted: false });
    let updatedAssets = [];

    for (let asset of assets) {
      let depAmount = 0;
      // WDV: Current value par ghisawat, SLM: Original cost par ghisawat
      depAmount = (asset.depreciationMethod === 'WDV' ? asset.currentValue : asset.purchaseCost) * (asset.depreciationRate / 100);
      
      asset.currentValue = Math.max(asset.currentValue - depAmount, 0); // Value 0 se kam na ho
      await asset.save();
      updatedAssets.push(asset);
    }
    res.json({ success: true, message: "Depreciation applied to all active assets", assets: updatedAssets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};