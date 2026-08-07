import Laterpad from "../model/laterpad.js";

export const addLaterpad = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const laterpad = new Laterpad({ ...req.body, companyId: req.companyId });
    await laterpad.save();
    res.status(201).json({ success: true, laterpad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listLaterpads = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const laterpads = await Laterpad.find({ companyId: req.companyId });
    res.json({ success: true, laterpads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};