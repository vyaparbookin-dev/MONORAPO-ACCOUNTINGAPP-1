import Staff from "../model/staff.js";
import StaffTransaction from "../model/StaffTransaction.js";

export const createStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    // Handle frontend sending 'mobile' instead of 'mobileNumber'
    const mobile = req.body.mobileNumber || req.body.mobile;
    const { name } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, error: "Name and Mobile Number are required" });
    }

    const existingStaff = await Staff.findOne({ mobileNumber: mobile, companyId: req.companyId });
    if (existingStaff) {
      return res.status(400).json({ success: false, error: "Staff with this mobile already exists" });
    }

    const staff = new Staff({ ...req.body, mobileNumber: mobile, companyId: req.companyId });
    await staff.save();
    res.status(201).json({ success: true, staff, message: `Staff ${name} added successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Naye Features (Advance, Attendance, Statement) ---

export const addPayment = async (req, res) => {
  try {
    const { staffId, amount, paymentType, notes } = req.body;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    let debit = 0, credit = 0;
    if (['advance', 'salary_settlement', 'deduction'].includes(paymentType)) {
      debit = amount;
      staff.balance -= amount; // Dukaan se paise gaye (Staff ka udhar)
    } else if (paymentType === 'incentive') {
      credit = amount;
      staff.balance += amount; // Staff ko dene hain (Dukaan ka jama)
    }

    const transaction = new StaffTransaction({ staffId, companyId: req.companyId, type: paymentType, date: new Date(), debit, credit, notes });
    await transaction.save();
    await staff.save();

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { staffId, status, startDate, endDate, notes } = req.body;
    const staff = await Staff.findById(staffId);
    
    let start = new Date(startDate);
    let end = new Date(endDate);
    let totalCredit = 0;
    
    // Lambi chhutti (Multiple days) loop
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      let credit = 0;
      if (staff.wageType === 'daily') {
        if (status === 'present') credit = staff.wageAmount;
        if (status === 'half-day') credit = staff.wageAmount / 2;
      }
      totalCredit += credit;
      await StaffTransaction.create({ staffId, companyId: req.companyId, type: 'attendance', date: new Date(d), status, credit, notes });
    }

    if (totalCredit > 0) {
      staff.balance += totalCredit; // Update pending balance for staff
      await staff.save();
    }

    res.status(201).json({ success: true, message: "Attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffStatement = async (req, res) => {
  try {
    const transactions = await StaffTransaction.find({ staffId: req.params.id, companyId: req.companyId }).sort({ date: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const staff = await Staff.find({ isActive: true, companyId: req.companyId }).select("-bankDetails -aadharNumber");
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStaffById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const staff = await Staff.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
    res.json({ success: true, staff, message: "Staff updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isActive: false },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
    res.json({ success: true, message: "Staff deleted (deactivated) successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
