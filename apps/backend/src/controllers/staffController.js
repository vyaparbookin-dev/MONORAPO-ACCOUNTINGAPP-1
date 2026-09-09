import Staff from "../model/staff.js";
import StaffTransaction from "../model/StaffTransaction.js";
import Attendance from "../model/attendance.js";

export const createStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { name, salary, wageAmount, wageType, mobileNumber, mobile, position, overtimeRatePerHour, salesTarget, commissionPercent } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Staff Name is required" });
    }

    const phone = (mobileNumber || mobile || '').trim();
    if (phone) {
      const existingStaff = await Staff.findOne({ mobileNumber: phone, companyId: req.companyId, isActive: true });
      if (existingStaff) {
        return res.status(400).json({ success: false, error: "Staff with this mobile already exists" });
      }
    }

    const staffSalary = Number(salary || wageAmount || 0);

    const staff = new Staff({
      ...req.body,
      name: name.trim(),
      mobileNumber: phone,
      salary: staffSalary,
      wageAmount: staffSalary,
      wageType: wageType || 'monthly',
      position: position || 'Staff / Worker',
      overtimeRatePerHour: Number(overtimeRatePerHour || 0),
      salesTarget: Number(salesTarget || 0),
      commissionPercent: Number(commissionPercent || 0),
      companyId: req.companyId
    });

    await staff.save();
    res.status(201).json({ success: true, staff, message: `Staff ${name} added successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- PAGARBOOK SUMMARY & DASHBOARD (Default Attendance + Salary + Advances + OT + Commission) ---
export const getPagarBookSummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID missing" });
    }

    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-12
    const year = parseInt(req.query.year) || now.getFullYear();

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month - 1, daysInMonth, 23, 59, 59);

    // If current month, calculate up to current date, else whole month
    const isCurrentMonth = (now.getFullYear() === year && (now.getMonth() + 1) === month);
    const daysConsidered = isCurrentMonth ? now.getDate() : daysInMonth;

    const allStaff = await Staff.find({ companyId: req.companyId, isActive: true }).sort({ name: 1 });

    // Fetch Attendance records for this company and month
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    });

    // Fetch Staff Transactions (Advances, Overtime, Commission, Payments)
    const transactions = await StaffTransaction.find({
      companyId: req.companyId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).sort({ date: -1 });

    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

    const staffSummaries = allStaff.map(s => {
      const staffIdStr = s._id.toString();
      const staffAtt = attendanceRecords.filter(a => a.staffId.toString() === staffIdStr);
      const staffTx = transactions.filter(t => t.staffId.toString() === staffIdStr);

      // Check today's status
      const todayRecord = staffAtt.find(a => new Date(a.date).toDateString() === todayStr);
      const todayStatus = todayRecord ? todayRecord.status : 'present'; // Default Present

      // Count Absents and Half Days
      let absentCount = 0;
      let halfDayCount = 0;
      let explicitlyPresentCount = 0;

      staffAtt.forEach(a => {
        const d = new Date(a.date);
        const dayNum = d.getDate();
        if (dayNum <= daysConsidered) {
          if (a.status === 'absent' || a.status === 'leave') absentCount++;
          else if (a.status === 'half-day') halfDayCount++;
          else if (a.status === 'present') explicitlyPresentCount++;
        }
      });

      // Default Logic: Staff is Present on every day unless marked Absent or Half-Day
      const presentCount = Math.max(0, daysConsidered - absentCount - halfDayCount);
      const effectiveWorkingDays = presentCount + (halfDayCount * 0.5);

      const baseSalary = Number(s.salary || s.wageAmount || 0);
      const perDaySalary = daysInMonth > 0 ? (baseSalary / daysInMonth) : 0;
      const earnedSalary = Math.round(perDaySalary * effectiveWorkingDays);

      // Overtime & Commission
      const otTransactions = staffTx.filter(t => t.type === 'overtime');
      const otEarnings = otTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);

      const commTransactions = staffTx.filter(t => t.type === 'commission' || t.type === 'incentive');
      const commEarnings = commTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);

      // Advances & Payments Given
      const advanceTransactions = staffTx.filter(t => ['advance', 'salary_settlement', 'deduction'].includes(t.type));
      const totalAdvance = advanceTransactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);

      const netPayable = Math.max(0, (earnedSalary + otEarnings + commEarnings) - totalAdvance);

      return {
        _id: s._id,
        name: s.name,
        mobileNumber: s.mobileNumber || '',
        position: s.position || 'Worker',
        wageType: s.wageType || 'monthly',
        baseSalary,
        perDaySalary: Math.round(perDaySalary),
        daysInMonth,
        daysConsidered,
        todayStatus,
        presentCount,
        halfDayCount,
        absentCount,
        effectiveWorkingDays,
        earnedSalary,
        otEarnings,
        commEarnings,
        totalAdvance,
        netPayable,
        salesTarget: Number(s.salesTarget || 0),
        commissionPercent: Number(s.commissionPercent || 0),
        overtimeRatePerHour: Number(s.overtimeRatePerHour || 0),
        transactions: staffTx.slice(0, 20)
      };
    });

    const totalStaffCount = staffSummaries.length;
    const totalCompanySalaryEarned = staffSummaries.reduce((sum, s) => sum + s.earnedSalary, 0);
    const totalCompanyAdvanceGiven = staffSummaries.reduce((sum, s) => sum + s.totalAdvance, 0);
    const totalCompanyNetPayable = staffSummaries.reduce((sum, s) => sum + s.netPayable, 0);

    res.json({
      success: true,
      month,
      year,
      daysInMonth,
      daysConsidered,
      totalStaffCount,
      totalCompanySalaryEarned,
      totalCompanyAdvanceGiven,
      totalCompanyNetPayable,
      staff: staffSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Quick Mark Attendance (Present / Half Day / Absent)
export const quickMarkAttendance = async (req, res) => {
  try {
    const { staffId, status, date } = req.body;
    if (!staffId || !status) {
      return res.status(400).json({ success: false, error: "Staff ID and status are required" });
    }

    const attDate = date ? new Date(date) : new Date();
    const dateStr = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate()).toDateString();

    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    let attendance = await Attendance.findOne({
      staffId,
      date: {
        $gte: new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate()),
        $lte: new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate(), 23, 59, 59)
      }
    });

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = new Attendance({
        staffId,
        date: attDate,
        status,
        companyId: req.companyId
      });
      await attendance.save();
    }

    res.status(200).json({ success: true, message: `हाजिरी दर्ज: ${status === 'present' ? 'उपस्थित (Present)' : status === 'half-day' ? 'हाफ डे (Half Day)' : 'छुट्टी (Absent)'}`, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Record Staff Advance (बीच में दिए गए पैसे)
export const addStaffAdvance = async (req, res) => {
  try {
    const { staffId, amount, notes, date } = req.body;
    if (!staffId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid staff ID and amount are required" });
    }

    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    const advanceTx = new StaffTransaction({
      staffId,
      companyId: req.companyId,
      type: 'advance',
      date: date ? new Date(date) : new Date(),
      debit: Number(amount),
      credit: 0,
      notes: (notes || 'Advance Payment').trim()
    });

    await advanceTx.save();
    res.status(201).json({ success: true, message: `₹${amount} एडवांस सफलतापूर्वक दर्ज हुआ!`, transaction: advanceTx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Record Overtime Pay
export const addStaffOvertime = async (req, res) => {
  try {
    const { staffId, hours, amount, notes, date } = req.body;
    if (!staffId || (!hours && !amount)) {
      return res.status(400).json({ success: false, error: "Staff ID and hours or amount are required" });
    }

    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    const totalOtPay = Number(amount) || (Number(hours) * (Number(staff.overtimeRatePerHour) || (staff.salary / (30 * 8))));

    const otTx = new StaffTransaction({
      staffId,
      companyId: req.companyId,
      type: 'overtime',
      date: date ? new Date(date) : new Date(),
      debit: 0,
      credit: Math.round(totalOtPay),
      notes: notes || `Overtime: ${hours || ''} hrs`
    });

    await otTx.save();
    res.status(201).json({ success: true, message: `₹${Math.round(totalOtPay)} ओवरटाइम दर्ज हुआ!`, transaction: otTx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Record Sales Commission / Incentive
export const addStaffCommission = async (req, res) => {
  try {
    const { staffId, amount, salesAchieved, notes, date } = req.body;
    if (!staffId || !amount) {
      return res.status(400).json({ success: false, error: "Staff ID and commission amount are required" });
    }

    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    const commTx = new StaffTransaction({
      staffId,
      companyId: req.companyId,
      type: 'commission',
      date: date ? new Date(date) : new Date(),
      debit: 0,
      credit: Number(amount),
      notes: notes || `Commission on sales: ₹${salesAchieved || ''}`
    });

    await commTx.save();
    res.status(201).json({ success: true, message: `₹${amount} कमीशन दर्ज हुआ!`, transaction: commTx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { staffId, amount, paymentType, notes } = req.body;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    let debit = 0, credit = 0;
    if (['advance', 'salary_settlement', 'deduction'].includes(paymentType)) {
      debit = amount;
      staff.balance -= amount;
    } else if (paymentType === 'incentive' || paymentType === 'commission') {
      credit = amount;
      staff.balance += amount;
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
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
    
    let start = new Date(startDate || new Date());
    let end = new Date(endDate || start);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      await Attendance.findOneAndUpdate(
        { staffId, date: { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) } },
        { staffId, date: new Date(d), status, notes, companyId: req.companyId },
        { upsert: true, new: true }
      );
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

    const staff = await Staff.find({ isActive: true, companyId: req.companyId }).select("-bankDetails -aadharNumber").sort({ name: 1 });
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
      { $set: { ...req.body, updatedAt: new Date() } },
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
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
    res.json({ success: true, message: "Staff deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
