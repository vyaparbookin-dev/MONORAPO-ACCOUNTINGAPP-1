import Lead from '../model/lead.js';

export const createLead = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const lead = new Lead({ ...req.body, companyId });
    await lead.save();
    res.status(201).json({ success: true, message: "Lead created successfully", data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeads = async (req, res) => {
  try {
    const { companyId } = req;
    const leads = await Lead.find({ companyId })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('assignedTo', 'name');
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    res.status(200).json({ success: true, message: "Lead updated successfully", data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};