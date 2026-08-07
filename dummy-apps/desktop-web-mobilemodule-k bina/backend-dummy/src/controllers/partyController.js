import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";

export const createParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { name, mobileNumber, address } = req.body;
    if (!name || !mobileNumber || !address) {
      return res.status(400).json({ success: false, error: "Name, Mobile, and Address are required" });
    }

    const existingParty = await Party.findOne({ mobileNumber, companyId: req.companyId });
    if (existingParty) {
      return res.status(400).json({ success: false, error: "Party with this mobile already exists" });
    }

    const party = new Party({ ...req.body, companyId: req.companyId });
    await party.save();
    res.status(201).json({ success: true, party, message: `Party ${name} created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyStatement = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });

    const transactions = await PartyTransaction.find({ partyId: req.params.id, companyId: req.companyId }).sort({ date: -1 });
    res.json({ success: true, party, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listParties = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { type } = req.query;
    const filter = { isActive: true, companyId: req.companyId };
    if (type) filter.partyType = { $in: [type, "both"] };

    const parties = await Party.find(filter).select("_id name mobileNumber address gstNumber partyType");
    res.json({ success: true, parties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartyById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, party, message: "Party updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteParty = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isActive: false },
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, error: "Party not found" });
    res.json({ success: true, message: "Party deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
