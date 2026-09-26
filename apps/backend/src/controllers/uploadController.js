import { uploadBillImage } from "../services/storageService.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import mongoose from "mongoose";

/**
 * @desc    Upload bill/receipt photo to Cloudinary (or fallback) and optionally link to a bill/transaction
 * @route   POST /api/upload/bill-image
 * @access  Private
 */
export const uploadBillPhoto = async (req, res) => {
  try {
    const { fileData, fileName, targetId, targetType } = req.body;
    const companyId = req.companyId ? req.companyId.toString() : "common";

    if (!fileData) {
      return res.status(400).json({ success: false, message: "कृपया फोटो चुनें (fileData is required)" });
    }

    // 1. Upload to Cloudinary / Storage
    const uploadResult = await uploadBillImage({
      fileData,
      fileName: fileName || `bill_${Date.now()}.jpg`,
      companyId
    });

    const imageUrl = uploadResult.url;

    // 2. If targetId is provided, link directly to database document
    let updatedRecord = null;
    if (targetId) {
      const isValidOid = mongoose.Types.ObjectId.isValid(targetId);
      const query = isValidOid ? { _id: targetId } : { $or: [{ billNumber: targetId }, { purchaseNumber: targetId }] };

      if (targetType === "purchase") {
        updatedRecord = await Purchase.findOneAndUpdate(query, { billImageUrl: imageUrl }, { new: true });
      } else if (targetType === "party_tx") {
        updatedRecord = await PartyTransaction.findOneAndUpdate(query, { billImageUrl: imageUrl }, { new: true });
      } else {
        // Default try Bill first, then PartyTransaction, then Purchase
        updatedRecord = await Bill.findOneAndUpdate(query, { billImageUrl: imageUrl }, { new: true });
        if (!updatedRecord) {
          updatedRecord = await PartyTransaction.findOneAndUpdate(query, { billImageUrl: imageUrl }, { new: true });
        }
        if (!updatedRecord) {
          updatedRecord = await Purchase.findOneAndUpdate(query, { billImageUrl: imageUrl }, { new: true });
        }
      }
    }

    res.status(200).json({
      success: true,
      url: imageUrl,
      provider: uploadResult.provider,
      updatedRecord,
      message: "बिल फोटो सफलतापूर्वक सुरक्षित व लिंक हो गया!"
    });
  } catch (error) {
    console.error("Upload bill photo error:", error);
    res.status(500).json({ success: false, message: error.message || "फोटो अपलोड करने में विफल" });
  }
};
