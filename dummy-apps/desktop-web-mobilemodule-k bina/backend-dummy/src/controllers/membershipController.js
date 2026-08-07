import Membership from "../model/membership.js";

const normalizeMembershipPayload = (body = {}) => ({
  memberName: body.memberName || body.name || "",
  name: body.name || body.memberName || "",
  email: body.email || "",
  phone: body.phone || "",
  type: body.type || "standard",
  tier: body.tier || "Silver",
  points: Number(body.points || 0),
  isActive: body.isActive ?? true,
});

export const addMembership = async (req, res) => {
  try {
    const membership = new Membership({
      ...normalizeMembershipPayload(req.body),
      companyId: req.companyId,
    });
    await membership.save();
    res.status(201).json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, memberships });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findOne({ _id: req.params.id, isDeleted: false });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    res.json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMembership = async (req, res) => {
  try {
    const membership = await Membership.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: normalizeMembershipPayload(req.body) },
      { new: true }
    );
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    res.json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    res.json({ success: true, message: "Membership deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};