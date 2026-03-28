import SecurityLog from "../model/securitylog.js";

export const addLog = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID required" });
    const log = new SecurityLog({ ...req.body, companyId: req.companyId, timestamp: new Date() });
    await log.save();
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listLogs = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID required" });
    // Sirf apni company ke logs dikhayenge, aur latest wale upar (sort by timestamp -1)
    const logs = await SecurityLog.find({ companyId: req.companyId })
                                  .sort({ timestamp: -1, createdAt: -1 })
                                  .limit(100); // Maximum 100 latest logs bhejenge speed ke liye
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};