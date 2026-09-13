import Coupon from "../model/coupon.js";

/**
 * 1. Create a new coupon (Multi-Industry)
 */
export const addCoupon = async (req, res) => {
  try {
    const couponData = { ...req.body };
    if (req.companyId) couponData.companyId = req.companyId;
    if (couponData.code) couponData.code = String(couponData.code).toUpperCase().trim();
    
    // Normalize expiry
    if (couponData.validTill && !couponData.validTo) {
      couponData.validTo = new Date(couponData.validTill);
      couponData.expiryDate = new Date(couponData.validTill);
    }
    if (couponData.discount && !couponData.discountPercentage && couponData.couponType === "percentage") {
      couponData.discountPercentage = Number(couponData.discount);
    }

    const coupon = await Coupon.create(couponData);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. List coupons with optional businessModule and search filtering
 */
export const listCoupons = async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    if (req.query.businessModule && req.query.businessModule !== "all") {
      filter.$or = [{ businessModule: req.query.businessModule }, { businessModule: "all" }];
    }
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Update existing coupon
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Delete coupon
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Dynamic Engine: Validate & Evaluate Coupon for ANY Business Module Cart
 * Non-hardcoded algorithm evaluates bill amount, items, phone, expiry & business rules.
 */
export const validateAndApplyCoupon = async (req, res) => {
  try {
    const { code, cartTotal = 0, items = [], customerPhone = "", businessModule = "all" } = req.body;
    
    if (!code) {
      return res.status(400).json({ valid: false, message: "कूपन कोड अनिवार्य है।" });
    }

    const cleanCode = String(code).toUpperCase().trim();
    const query = { code: cleanCode, isActive: true };
    if (req.companyId) query.companyId = req.companyId;

    const coupon = await Coupon.findOne(query);
    if (!coupon) {
      return res.status(404).json({ valid: false, message: `अमान्य कूपन कोड: '${cleanCode}' नहीं मिला।` });
    }

    // Check expiration
    const expiry = coupon.validTo || coupon.expiryDate;
    if (expiry && new Date(expiry) < new Date()) {
      return res.status(400).json({ valid: false, message: `कूपन '${cleanCode}' की वैधता समाप्त हो चुकी है!` });
    }

    // Check business module match
    if (coupon.businessModule !== "all" && businessModule !== "all" && coupon.businessModule !== businessModule) {
      return res.status(400).json({ 
        valid: false, 
        message: `यह कूपन सिर्फ '${coupon.businessModule}' मॉड्यूल के लिए मान्य है!` 
      });
    }

    // Check minimum bill amount
    const minBill = Number(coupon.minBillAmount || 0);
    const totalAmt = Number(cartTotal || 0);
    if (minBill > 0 && totalAmt < minBill) {
      return res.status(400).json({ 
        valid: false, 
        message: `यह कूपन लागू करने हेतु न्यूनतम बिल राशि ₹${minBill.toLocaleString('en-IN')} होनी चाहिए।` 
      });
    }

    // Check customer binding if set
    if (coupon.customerPhone && customerPhone) {
      const cleanPhone1 = String(coupon.customerPhone).replace(/\D/g, '').slice(-10);
      const cleanPhone2 = String(customerPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone1 && cleanPhone2 && cleanPhone1 !== cleanPhone2) {
        return res.status(400).json({ 
          valid: false, 
          message: `यह कूपन विशेष रूप से ग्राहक नंबर ${coupon.customerPhone} के लिए आरक्षित है!` 
        });
      }
    }

    // Check usage limits
    if (coupon.isSingleUse && (coupon.used || coupon.timesUsed >= (coupon.maxUses || 1))) {
      return res.status(400).json({ valid: false, message: `यह कूपन पहले ही उपयोग किया जा चुका है!` });
    }

    // Calculate Dynamic Discount
    let calculatedDiscount = 0;
    let benefitSummary = "";

    switch (coupon.couponType) {
      case "flat_discount": {
        calculatedDiscount = Number(coupon.discountAmount || coupon.discount || 0);
        benefitSummary = `फ्लैट ₹${calculatedDiscount} की सीधी छूट`;
        break;
      }
      case "percentage": {
        const pct = Number(coupon.discountPercentage || coupon.discount || 0);
        calculatedDiscount = (totalAmt * pct) / 100;
        const maxCap = Number(coupon.maxDiscountAmount || 0);
        if (maxCap > 0 && calculatedDiscount > maxCap) {
          calculatedDiscount = maxCap;
          benefitSummary = `${pct}% छूट (अधिकतम ₹${maxCap} की सीमा लागू)`;
        } else {
          benefitSummary = `${pct}% की छूट (₹${Math.round(calculatedDiscount)})`;
        }
        break;
      }
      case "buy_x_get_y": {
        // e.g. Buy 2 Get 1 Free (Clothes/Garments or Restaurant combos)
        const buyQty = Number(coupon.buyQty || 2);
        const getQty = Number(coupon.getQty || 1);
        
        // Find qualifying items in cart
        let totalApplicableUnits = 0;
        let lowestPrice = Infinity;

        items.forEach(it => {
          const itQty = Number(it.quantity || it.qty || 1);
          const itPrice = Number(it.price || it.rate || it.salePrice || 0);
          
          const matchesCategory = !coupon.targetCategory || (it.category && it.category.toLowerCase() === coupon.targetCategory.toLowerCase());
          const matchesName = !coupon.targetItemName || (it.name && it.name.toLowerCase().includes(coupon.targetItemName.toLowerCase()));

          if (matchesCategory && matchesName) {
            totalApplicableUnits += itQty;
            if (itPrice > 0 && itPrice < lowestPrice) {
              lowestPrice = itPrice;
            }
          }
        });

        if (totalApplicableUnits >= (buyQty + getQty)) {
          const sets = Math.floor(totalApplicableUnits / (buyQty + getQty));
          const freeUnits = sets * getQty;
          calculatedDiscount = freeUnits * (lowestPrice === Infinity ? 0 : lowestPrice);
          benefitSummary = `Buy ${buyQty} Get ${getQty} Free ऑफर लागू (${freeUnits} सामान मुफ्त, कुल लाभ: ₹${calculatedDiscount})`;
        } else {
          return res.status(400).json({
            valid: false,
            message: `Buy ${buyQty} Get ${getQty} ऑफर हेतु कम से कम ${buyQty + getQty} योग्य उत्पाद कार्ट में होने चाहिए (वर्तमान: ${totalApplicableUnits})।`
          });
        }
        break;
      }
      case "cashback_voucher": {
        const cashAmt = Number(coupon.discountAmount || coupon.discount || 0);
        calculatedDiscount = Math.min(cashAmt, totalAmt);
        benefitSummary = `कैश वाउचर रिडीम: ₹${calculatedDiscount}`;
        break;
      }
      default: {
        calculatedDiscount = Number(coupon.discount || 0);
        benefitSummary = `छूट: ₹${calculatedDiscount}`;
      }
    }

    // Cap discount to total amount (cannot make final negative)
    calculatedDiscount = Math.min(calculatedDiscount, totalAmt);
    const finalAmountAfterCoupon = Math.max(0, totalAmt - calculatedDiscount);

    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        couponType: coupon.couponType,
        businessModule: coupon.businessModule,
        benefitSummary
      },
      discountAmount: Math.round(calculatedDiscount * 100) / 100,
      originalTotal: totalAmt,
      finalAmount: Math.round(finalAmountAfterCoupon * 100) / 100,
      message: `🎉 कूपन '${coupon.code}' सफलतापूर्वक लागू हुआ! (${benefitSummary})`
    });

  } catch (err) {
    res.status(500).json({ valid: false, message: err.message });
  }
};
