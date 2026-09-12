import Scheme from "../model/scheme.js";
import SchemeUsage from "../model/schemeusage.js";

export const addScheme = async (req, res) => {
  try {
    const schemeData = { ...req.body };
    if (req.companyId) schemeData.companyId = req.companyId;
    const scheme = new Scheme(schemeData);
    await scheme.save();
    res.status(201).json({ success: true, scheme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listSchemes = async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const schemes = await Scheme.find(filter);
    res.json({ success: true, schemes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
