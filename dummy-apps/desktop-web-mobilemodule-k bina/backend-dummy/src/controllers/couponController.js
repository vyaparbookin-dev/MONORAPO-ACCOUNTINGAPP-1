import Coupon from "../model/coupon.js";

export const addCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json({ success: true, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};