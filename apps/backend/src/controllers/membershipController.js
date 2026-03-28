import Membership from "../model/membership.js";

export const addMembership = async (req, res) => {
  try {
    const membership = new Membership(req.body);
    await membership.save();
    res.status(201).json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.json({ success: true, memberships });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};