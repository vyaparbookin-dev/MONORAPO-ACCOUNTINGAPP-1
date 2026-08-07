import Attendance from "../model/attendance.js";
import Staff from "../model/staff.js";

export const markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, checkInTime, checkOutTime, hoursWorked, notes } = req.body;

    if (!staffId || !date || !status) {
      return res.status(400).json({ success: false, error: "Staff ID, Date, and Status are required" });
    }

    // Check if staff belongs to the requested company
    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    // Check if attendance already exists for this date
    let attendance = await Attendance.findOne({ staffId, date: new Date(date).toDateString() });

    if (attendance) {
      // Update existing
      attendance.status = status;
      attendance.checkInTime = checkInTime;
      attendance.checkOutTime = checkOutTime;
      attendance.hoursWorked = hoursWorked;
      attendance.notes = notes;
      await attendance.save();
    } else {
      // Create new
      attendance = new Attendance({
        staffId,
        date: new Date(date),
        status,
        checkInTime,
        checkOutTime,
        hoursWorked,
        notes,
      });
      await attendance.save();
    }

    res.status(201).json({ success: true, attendance, message: "Attendance marked successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const filter = {};
    if (staffId) filter.staffId = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Only find attendance for staff in this company
    const staffIds = await Staff.find({ companyId: req.companyId }).select('_id');
    filter.staffId = { $in: staffIds.map(s => s._id), ...(filter.staffId && { $eq: filter.staffId }) };

    const attendance = await Attendance.find(filter)
      .populate("staffId", "name position department")
      .sort({ date: -1 });

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const report = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $lookup: { from: "staffs", localField: "staffId", foreignField: "_id", as: "staff" } },
      { $unwind: "$staff" },
      // Security: Only match staff belonging to the logged-in company
      { $match: { "staff.companyId": new mongoose.Types.ObjectId(req.companyId) } },
      {
        $group: {
          _id: "$staffId",
          totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          totalLeave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
          totalHalfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          totalHoursWorked: { $sum: "$hoursWorked" },
          staff: { $first: "$staff" }
        },
      },
    ]);

    res.json({ success: true, report, month, year });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
