import Coupan from "../model/coupan.js";

export const addCoupan = async (req, res) => {
  try {
    const coupan = await Coupan.create(req.body);
    res.status(201).json({ success: true, coupan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const listCoupans = async (req, res) => {
  try {
    const coupan = await Coupan.find();
    res.json({ success: true, coupan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};