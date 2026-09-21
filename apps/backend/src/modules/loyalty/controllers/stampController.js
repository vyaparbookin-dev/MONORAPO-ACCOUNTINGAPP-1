import mongoose from "mongoose";
import StampProgram from "../models/stampProgram.js";
import CustomerStampCard from "../models/customerStampCard.js";
import Coupon from "../models/coupon.js";

/**
 * Generate Visual Emoji Stamp String
 * e.g. 4/6 stamps -> "⭐⭐⭐⭐⚪⚪ (4/6)"
 */
export const formatVisualStamps = (current, total) => {
  const filled = Math.min(Math.max(0, current), total);
  const empty = Math.max(0, total - filled);
  return `${"⭐".repeat(filled)}${"⚪".repeat(empty)} (${filled}/${total})`;
};

/**
 * Helper to build readable reward text
 */
export const getRewardDescription = (program) => {
  if (!program) return "";
  if (program.rewardType === "free_item") {
    return program.rewardItemName ? `1 फ्री ${program.rewardItemName}` : "1 फ्री आइटम";
  }
  if (program.rewardType === "percentage") {
    const cap = program.maxDiscountAmount ? ` (अधिकतम ₹${program.maxDiscountAmount} तक)` : "";
    return `${program.discountPercentage}% छूट${cap}`;
  }
  if (program.rewardType === "flat_discount") {
    return `फ्लैट ₹${program.discountAmount} की छूट`;
  }
  return "लॉयल्टी रिवॉर्ड";
};

// ==========================================
// 1. STAMP PROGRAM MANAGEMENT (CRUD)
// ==========================================

export const createProgram = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.companyId) data.companyId = req.companyId;

    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ success: false, message: "प्रोग्राम का शीर्षक (Title) अनिवार्य है!" });
    }

    data.totalStamps = Math.max(2, Math.min(20, Number(data.totalStamps || 6)));
    data.minBillAmount = Math.max(0, Number(data.minBillAmount || 0));

    const program = await StampProgram.create(data);
    res.status(201).json({ success: true, program, message: "डिजिटल स्टैंप कार्ड सफलतापूर्वक बनाया गया!" });
  } catch (err) {
    console.error("createProgram error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listPrograms = async (req, res) => {
  try {
    const query = {};
    if (req.companyId) query.companyId = req.companyId;
    if (req.query.businessModule && req.query.businessModule !== "all") {
      query.$or = [{ businessModule: req.query.businessModule }, { businessModule: "all" }];
    }

    const programs = await StampProgram.find(query).sort({ createdAt: -1 });
    res.json({ success: true, programs });
  } catch (err) {
    console.error("listPrograms error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await StampProgram.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "स्टैंप प्रोग्राम नहीं मिला!" });
    }
    res.json({ success: true, program: updated, message: "स्टैंप प्रोग्राम अपडेट हो गया!" });
  } catch (err) {
    console.error("updateProgram error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StampProgram.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "स्टैंप प्रोग्राम नहीं मिला!" });
    }
    res.json({ success: true, message: "स्टैंप प्रोग्राम हटा दिया गया।" });
  } catch (err) {
    console.error("deleteProgram error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 2. CUSTOMER STAMP TRACKING & REWARDS
// ==========================================

/**
 * Get Customer Stamp Status for Billing Screen
 * When cashier types phone number, returns active stamp cards & unlocked rewards
 */
export const getCustomerStampStatus = async (req, res) => {
  try {
    const phone = String(req.query.phone || "").trim().replace(/\D/g, "").slice(-10);
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: "मान्य 10 अंकों का फोन नंबर दें!" });
    }

    const query = { isActive: true };
    if (req.companyId) query.companyId = req.companyId;
    if (req.query.businessModule && req.query.businessModule !== "all") {
      query.$or = [{ businessModule: req.query.businessModule }, { businessModule: "all" }];
    }

    const programs = await StampProgram.find(query);
    if (!programs || programs.length === 0) {
      return res.json({ success: true, hasActivePrograms: false, cards: [] });
    }

    const cardsResult = [];

    for (const prog of programs) {
      // Find active or ready card for this customer
      let card = await CustomerStampCard.findOne({
        companyId: prog.companyId,
        programId: prog._id,
        customerPhone: phone,
        status: { $in: ["ACTIVE", "REWARD_READY"] }
      });

      if (!card) {
        // Return blank potential card
        cardsResult.push({
          programId: prog._id,
          programTitle: prog.title,
          businessModule: prog.businessModule,
          currentStamps: 0,
          totalStamps: prog.totalStamps,
          stampsRemaining: prog.totalStamps,
          visualStamps: formatVisualStamps(0, prog.totalStamps),
          minBillAmount: prog.minBillAmount,
          rewardDescription: getRewardDescription(prog),
          isRewardReady: false,
          cardStatus: "NEW"
        });
      } else {
        const isReady = card.status === "REWARD_READY" && !card.unlockedReward?.isRedeemed;
        cardsResult.push({
          cardId: card._id,
          programId: prog._id,
          programTitle: prog.title,
          businessModule: prog.businessModule,
          currentStamps: card.currentStamps,
          totalStamps: card.totalStamps,
          stampsRemaining: Math.max(0, card.totalStamps - card.currentStamps),
          visualStamps: formatVisualStamps(card.currentStamps, card.totalStamps),
          minBillAmount: prog.minBillAmount,
          rewardDescription: getRewardDescription(prog),
          isRewardReady: isReady,
          unlockedReward: isReady ? card.unlockedReward : null,
          cardStatus: card.status,
          cycle: card.cycle
        });
      }
    }

    res.json({
      success: true,
      hasActivePrograms: true,
      customerPhone: phone,
      cards: cardsResult
    });
  } catch (err) {
    console.error("getCustomerStampStatus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Award 1 Stamp on completed bill
 */
export const awardStamp = async (req, res) => {
  try {
    const { customerPhone, customerName = "", billAmount = 0, billNumber = "", billId, businessModule = "all" } = req.body;
    const phone = String(customerPhone || "").trim().replace(/\D/g, "").slice(-10);

    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: "मान्य 10 अंकों का फोन नंबर दें!" });
    }

    const companyId = req.companyId;
    const result = await processStampAwardOnBill(companyId, {
      customerMobile: phone,
      customerName,
      finalAmount: Number(billAmount || 0),
      billNumber: String(billNumber || ""),
      _id: billId,
      businessModule
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("awardStamp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Redeem an Unlocked Reward
 */
export const redeemReward = async (req, res) => {
  try {
    const { cardId, couponCode, billNumber = "" } = req.body;
    if (!cardId && !couponCode) {
      return res.status(400).json({ success: false, message: "Card ID या Coupon Code आवश्यक है!" });
    }

    let card = null;
    if (cardId) {
      card = await CustomerStampCard.findById(cardId);
    } else if (couponCode) {
      card = await CustomerStampCard.findOne({ "unlockedReward.code": String(couponCode).toUpperCase().trim() });
    }

    if (!card) {
      return res.status(404).json({ success: false, message: "रिवॉर्ड कार्ड नहीं मिला!" });
    }

    if (card.unlockedReward?.isRedeemed) {
      return res.status(400).json({ success: false, message: "यह रिवॉर्ड पहले ही उपयोग (Redeem) हो चुका है!" });
    }

    // Mark reward as redeemed
    card.status = "REDEEMED";
    card.unlockedReward.isRedeemed = true;
    card.unlockedReward.redeemedAt = new Date();
    card.unlockedReward.redeemedInBillNumber = billNumber;
    card.updatedAt = new Date();
    await card.save();

    // Also mark Coupon collection entry as used
    if (card.unlockedReward.code) {
      await Coupon.findOneAndUpdate(
        { code: card.unlockedReward.code },
        { used: true, timesUsed: 1, usedAt: new Date(), usedInBillNumber: billNumber }
      ).catch(() => {});
    }

    // Automatically create a new fresh card for next cycle!
    const newCycleCard = await CustomerStampCard.create({
      companyId: card.companyId,
      programId: card.programId,
      customerPhone: card.customerPhone,
      customerName: card.customerName,
      currentStamps: 0,
      totalStamps: card.totalStamps,
      cycle: (card.cycle || 1) + 1,
      status: "ACTIVE"
    });

    res.json({
      success: true,
      message: `🎉 रिवॉर्ड सफलतापूर्वक रिडीम हो गया! नया चक्र (#${newCycleCard.cycle}) शुरू हुआ।`,
      nextCard: newCycleCard
    });
  } catch (err) {
    console.error("redeemReward error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List all Customer Stamp Cards for Dashboard / CRM Report
 */
export const listCustomerStampCards = async (req, res) => {
  try {
    const query = {};
    if (req.companyId) query.companyId = req.companyId;
    if (req.query.status) query.status = req.query.status;

    const cards = await CustomerStampCard.find(query)
      .populate("programId", "title businessModule totalStamps minBillAmount rewardType rewardItemName discountPercentage discountAmount")
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ success: true, cards });
  } catch (err) {
    console.error("listCustomerStampCards error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 3. CORE BUSINESS LOGIC (Used by Controller & Auto-Billing)
// ==========================================

export const processStampAwardOnBill = async (companyId, bill) => {
  const phone = String(bill.customerMobile || bill.customerPhone || bill.phone || "").trim().replace(/\D/g, "").slice(-10);
  if (!phone || phone.length < 10) {
    return { awarded: false, reason: "NO_CUSTOMER_PHONE" };
  }

  const amt = Number(bill.finalAmount || bill.total || 0);

  // Find active program matching business module or all
  const progQuery = { isActive: true };
  if (companyId) progQuery.companyId = companyId;

  const bModule = bill.businessModule || "all";
  if (bModule !== "all") {
    progQuery.$or = [{ businessModule: bModule }, { businessModule: "all" }];
  }

  const program = await StampProgram.findOne(progQuery).sort({ createdAt: -1 });
  if (!program) {
    return { awarded: false, reason: "NO_ACTIVE_PROGRAM" };
  }

  // 1. Min Bill Amount Rule
  if (amt < (program.minBillAmount || 0)) {
    return {
      awarded: false,
      reason: "MIN_AMOUNT_NOT_MET",
      minRequired: program.minBillAmount,
      billAmount: amt,
      message: `न्यूनतम बिल राशि ₹${program.minBillAmount} होनी चाहिए।`
    };
  }

  // 2. Find or Create Active Card
  let card = await CustomerStampCard.findOne({
    companyId,
    programId: program._id,
    customerPhone: phone,
    status: "ACTIVE"
  });

  if (!card) {
    card = new CustomerStampCard({
      companyId,
      programId: program._id,
      customerPhone: phone,
      customerName: bill.customerName || "ग्राहक",
      currentStamps: 0,
      totalStamps: program.totalStamps,
      status: "ACTIVE"
    });
  }

  // 3. Anti-Fraud: One Stamp Per Day Check
  if (program.oneStampPerDay && card.lastStampDate) {
    const lastDateStr = new Date(card.lastStampDate).toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    if (lastDateStr === todayStr) {
      return {
        awarded: false,
        reason: "ALREADY_STAMPED_TODAY",
        currentStamps: card.currentStamps,
        totalStamps: card.totalStamps,
        visualStamps: formatVisualStamps(card.currentStamps, card.totalStamps),
        message: "आज का स्टैंप पहले ही दर्ज हो चुका है (1 दिन में 1 स्टैंप नियम)।"
      };
    }
  }

  // 4. Increment Stamp
  card.currentStamps += 1;
  card.lastStampDate = new Date();
  card.updatedAt = new Date();
  card.stampsHistory.push({
    stampNumber: card.currentStamps,
    earnedAt: new Date(),
    billNumber: bill.billNumber || "",
    billAmount: amt,
    billId: bill._id
  });

  let rewardUnlocked = false;
  let rewardData = null;

  // 5. Check if Target Reached!
  if (card.currentStamps >= program.totalStamps) {
    card.status = "REWARD_READY";
    const uniqueCode = `STAMP-${phone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const validityDays = program.rewardValidityDays || 30;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + validityDays);

    rewardData = {
      code: uniqueCode,
      rewardType: program.rewardType,
      rewardItemName: program.rewardItemName,
      discountPercentage: program.discountPercentage,
      discountAmount: program.discountAmount,
      unlockedAt: new Date(),
      expiresAt: expDate,
      isRedeemed: false
    };
    card.unlockedReward = rewardData;
    rewardUnlocked = true;

    // Create a corresponding Coupon in Coupon collection so billing engine recognizes it seamlessly!
    try {
      await Coupon.create({
        companyId,
        code: uniqueCode,
        businessModule: program.businessModule || "all",
        couponType: program.rewardType === "free_item" ? "buy_x_get_y" : (program.rewardType === "percentage" ? "percentage" : "flat_discount"),
        freeItemName: program.rewardItemName || "",
        discountPercentage: program.discountPercentage || 0,
        discountAmount: program.discountAmount || 0,
        maxDiscountAmount: program.maxDiscountAmount || 0,
        customerPhone: phone,
        customerName: card.customerName,
        isSingleUse: true,
        maxUses: 1,
        validFrom: new Date(),
        validTo: expDate,
        expiryDate: expDate,
        isActive: true
      });
    } catch (cErr) {
      console.warn("Auto-create coupon from stamp reward warning:", cErr.message);
    }
  }

  await card.save();

  // 6. Generate WhatsApp message preview
  const visual = formatVisualStamps(card.currentStamps, program.totalStamps);
  const remaining = Math.max(0, program.totalStamps - card.currentStamps);
  const rewardDesc = getRewardDescription(program);

  let waText = "";
  if (rewardUnlocked) {
    waText = `🎉 बधाई हो ${card.customerName}! आपके ${program.totalStamps} स्टैंप पूरे हुए!\n\n` +
      `🎁 आपका रिवॉर्ड अनलॉक हो गया: *${rewardDesc}*\n` +
      `कूपन कोड: *${rewardData.code}*\n` +
      `अगली विज़िट पर इस कोड से रिवॉर्ड रिडीम करें।`;
  } else {
    waText = `नमस्ते ${card.customerName}! आज का स्टैंप जुड़ गया है: ${visual}\n\n` +
      `सिर्फ ${remaining} विज़िट और करें और पाएं *${rewardDesc}*!`;
  }

  return {
    awarded: true,
    currentStamps: card.currentStamps,
    totalStamps: program.totalStamps,
    stampsRemaining: remaining,
    visualStamps: visual,
    rewardUnlocked,
    rewardData,
    rewardDescription: rewardDesc,
    whatsappMessage: waText,
    cardId: card._id
  };
};
