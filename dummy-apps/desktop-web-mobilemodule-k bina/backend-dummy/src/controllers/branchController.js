import Branch from "../model/branch.js";

export const addBranch = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const branch = new Branch({ ...req.body, companyId });
    await branch.save();
    res.status(201).json({ success: true, message: "Branch created successfully", branch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ companyId: req.companyId, isActive: true });
    res.status(200).json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.status(200).json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};