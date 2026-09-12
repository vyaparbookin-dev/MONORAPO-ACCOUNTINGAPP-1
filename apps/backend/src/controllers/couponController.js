import Coupon from "../model/coupon.js";

export const addCoupon = async (req, res) => {
  try {
    const couponData = { ...req.body };
    if (req.companyId) couponData.companyId = req.companyId;
    const coupon = await Coupon.create(couponData);
    res.status(201).json({ success: true, coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const coupons = await Coupon.find(filter);
    res.json({ success: true, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
