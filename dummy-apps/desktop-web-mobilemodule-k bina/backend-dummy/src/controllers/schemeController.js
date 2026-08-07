import Scheme from "../model/scheme.js";
import SchemeUsage from "../model/schemeusage.js";

export const addScheme = async (req, res) => {
  try {
    const scheme = new Scheme(req.body);
    await scheme.save();
    res.status(201).json({ success: true, scheme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json({ success: true, schemes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};