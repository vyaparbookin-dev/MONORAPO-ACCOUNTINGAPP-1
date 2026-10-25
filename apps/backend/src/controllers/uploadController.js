import { uploadBillImage } from "../services/storageService.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import PartyTransaction from "../model/PartyTransaction.js";
import mongoose from "mongoose";
import { syncBillPhotoToSupabase, syncPartyTxToSupabase } from "../services/supabaseSyncService.js";
import { supabase } from "../config/supabase.js";

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
      const cleanId = String(targetId).replace(/^(pay_|open_)/, "").trim();
      const isValidOid = mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24;

      const orConditions = [
        { billNumber: cleanId },
        { invoiceNumber: cleanId },
        { purchaseNumber: cleanId },
        { refNo: cleanId },
        { refNo: targetId }
      ];
      if (isValidOid) {
        orConditions.push({ _id: cleanId });
      }
      if (targetId !== cleanId && mongoose.Types.ObjectId.isValid(targetId) && targetId.length === 24) {
        orConditions.push({ _id: targetId });
      }

      const query = { $or: orConditions };
      const updateData = {
        billImageUrl: imageUrl,
        $addToSet: { billImageUrls: imageUrl }
      };

      if (targetType === "purchase") {
        updatedRecord = await Purchase.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) updatedRecord = await Bill.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) updatedRecord = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
      } else if (targetType === "party_tx" || targetType === "payment" || targetType === "receipt") {
        updatedRecord = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) updatedRecord = await Bill.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) updatedRecord = await Purchase.findOneAndUpdate(query, updateData, { new: true });
      } else {
        // Default: try Bill first, then PartyTransaction, then Purchase
        updatedRecord = await Bill.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedRecord) {
          updatedRecord = await PartyTransaction.findOneAndUpdate(query, updateData, { new: true });
        }
        if (!updatedRecord) {
          updatedRecord = await Purchase.findOneAndUpdate(query, updateData, { new: true });
        }
      }

      // Sync with Supabase (Sales and Purchases) - Await to ensure persistence before statement refetch
      const allUrls = updatedRecord?.billImageUrls && updatedRecord.billImageUrls.length > 0 
        ? updatedRecord.billImageUrls 
        : [imageUrl];

      const refToSync = updatedRecord?.billNumber || updatedRecord?.invoiceNumber || updatedRecord?.purchaseNumber || cleanId;
      try {
        if (refToSync) await syncBillPhotoToSupabase(refToSync, imageUrl);
        if (cleanId && cleanId !== refToSync) await syncBillPhotoToSupabase(cleanId, imageUrl);
        if (targetId && targetId !== cleanId && targetId !== refToSync) await syncBillPhotoToSupabase(targetId, imageUrl);
      } catch (syncErr) {
        console.warn("[uploadBillPhoto] Supabase syncBillPhoto warning:", syncErr.message);
      }

      if (supabase) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
          if (isUuid) {
            await supabase.from("sales").update({ bill_image_url: imageUrl }).eq("id", cleanId);
            await supabase.from("purchases").update({ bill_image_url: imageUrl }).eq("id", cleanId);
          }
          await supabase.from("sales").update({ bill_image_url: imageUrl }).eq("bill_number", cleanId);
          await supabase.from("purchases").update({ bill_image_url: imageUrl }).eq("purchase_number", cleanId);
        } catch (dirSbErr) {
          console.warn("[uploadBillPhoto] Direct Supabase update note:", dirSbErr.message);
        }
      }

      if (updatedRecord && (targetType === "party_tx" || updatedRecord.partyId)) {
        syncPartyTxToSupabase(updatedRecord).catch(() => {});
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

    const cleanId = String(targetId).replace(/^(pay_|open_)/, "").trim();
    const isValidOid = mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24;

    const orConditions = [
      { billNumber: cleanId },
      { invoiceNumber: cleanId },
      { purchaseNumber: cleanId },
      { refNo: cleanId },
      { refNo: targetId }
    ];
    if (isValidOid) {
      orConditions.push({ _id: cleanId });
    }
    if (targetId !== cleanId && mongoose.Types.ObjectId.isValid(targetId) && targetId.length === 24) {
      orConditions.push({ _id: targetId });
    }

    const query = { $or: orConditions };

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
    if (!updatedRecord) {
      updatedRecord = await Purchase.findOneAndUpdate(
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

      const remainingUrls = updatedRecord.billImageUrls || [];
      const primUrl = updatedRecord.billImageUrl || (remainingUrls[0] || "");
      const refToSync = updatedRecord.billNumber || updatedRecord.invoiceNumber || updatedRecord.purchaseNumber || cleanId;
      syncBillPhotoToSupabase(refToSync, primUrl).catch(() => {});
      if (cleanId !== refToSync) {
        syncBillPhotoToSupabase(cleanId, primUrl).catch(() => {});
      }

      if (targetType === "party_tx" || updatedRecord.partyId) {
        syncPartyTxToSupabase(updatedRecord).catch(() => {});
      }
    } else {
      syncBillPhotoToSupabase(cleanId, "").catch(() => {});
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
