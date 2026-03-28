import User from "../model/user.js";

export const getUsers = async (req, res) => {
  try {
    // Admin ko saare users dikhayenge
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "manager", "cashier", "employee", "user"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.status(200).json({ success: true, message: "User Role updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};