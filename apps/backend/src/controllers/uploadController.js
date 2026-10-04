import { uploadBillImage } from "../services/storageService.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import mongoose from "mongoose";
import { syncBillPhotoToSupabase, syncPartyTxToSupabase } from "../services/supabaseSyncService.js";

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
      const query = isValidOid ? { _id: targetId } : { $or: [{ billNumber: targetId }, { purchaseNumber: targetId }, { refNo: targetId }] };
      const updateData = {
        billImageUrl: imageUrl,
        $addToSet: { billImageUrls: imageUrl }
      };

      if (targetType === "purchase") {
        updatedRecord = await Purchase.findOneAndUpdate(query, updateData, { new: true });
      } else if (targetType === "party_tx") {
        updatedRecord = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
      } else {
        // Default try PartyTransaction first if it's party tx or Bill
        updatedRecord = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) {
          updatedRecord = await Bill.findOneAndUpdate(query, updateData, { new: true });
        }
        if (!updatedRecord) {
          updatedRecord = await Purchase.findOneAndUpdate(query, updateData, { new: true });
        }
      }

      if (updatedRecord) {
        if (updatedRecord.billNumber) {
          syncBillPhotoToSupabase(updatedRecord.billNumber, imageUrl, updatedRecord.billImageUrls).catch(() => {});
        } else if (targetType === "party_tx") {
          syncPartyTxToSupabase(updatedRecord).catch(() => {});
        }
      }
    }

    res.status(200).json({
      success: true,
      url: imageUrl,
      urls: updatedRecord?.billImageUrls || [imageUrl],
      provider: uploadResult.provider,
      updatedRecord,
      message: "बिल फोटो सफलतापूर्वक सुरक्षित व लिंक हो गया!"
    });
  } catch (error) {
    console.error("Upload bill photo error:", error);
    res.status(500).json({ success: false, message: error.message || "फोटो अपलोड करने में विफल" });
  }
};

/**
 * @desc    Delete/Remove a specific bill photo from a bill/transaction
 * @route   POST /api/upload/delete-bill-image
 * @access  Private
 */
export const deleteBillPhoto = async (req, res) => {
  try {
    const { targetId, targetType, imageUrl } = req.body;
    if (!targetId || !imageUrl) {
      return res.status(400).json({ success: false, message: "targetId and imageUrl are required" });
    }

    const isValidOid = mongoose.Types.ObjectId.isValid(targetId);
    const query = isValidOid ? { _id: targetId } : { $or: [{ billNumber: targetId }, { purchaseNumber: targetId }, { refNo: targetId }] };

    let updatedRecord = null;
    const ModelToUse = targetType === "purchase" ? Purchase : (targetType === "bill" ? Bill : PartyTransaction);

    updatedRecord = await ModelToUse.findOneAndUpdate(
      query,
      { $pull: { billImageUrls: imageUrl } },
      { new: true }
    );

    if (!updatedRecord && targetType !== "purchase") {
      // Try Bill if PartyTransaction didn't match
      updatedRecord = await Bill.findOneAndUpdate(
        query,
        { $pull: { billImageUrls: imageUrl } },
        { new: true }
      );
    }

    if (updatedRecord) {
      // If the primary billImageUrl was the deleted one, fallback to remaining or empty
      if (updatedRecord.billImageUrl === imageUrl) {
        const remainingUrl = (updatedRecord.billImageUrls && updatedRecord.billImageUrls.length > 0) ? updatedRecord.billImageUrls[0] : "";
        updatedRecord.billImageUrl = remainingUrl;
        await updatedRecord.save();
      }

      if (updatedRecord.billNumber) {
        const remainingUrls = updatedRecord.billImageUrls || [];
        const primUrl = updatedRecord.billImageUrl || "";
        syncBillPhotoToSupabase(updatedRecord.billNumber, primUrl, remainingUrls).catch(() => {});
      } else if (targetType === "party_tx") {
        syncPartyTxToSupabase(updatedRecord).catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      message: "फोटो सफलतापूर्वक हटा दी गई",
      urls: updatedRecord?.billImageUrls || [],
      primaryUrl: updatedRecord?.billImageUrl || ""
    });
  } catch (error) {
    console.error("Delete bill photo error:", error);
    res.status(500).json({ success: false, message: error.message || "फोटो हटाने में विफल" });
  }
};
