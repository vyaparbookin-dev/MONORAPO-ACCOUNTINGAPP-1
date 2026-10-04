import Expense from "../../../model/expenses.js";
import Staff from "../models/staff.js";
import StaffTransaction from "../models/StaffTransaction.js";
import Attendance from "../models/attendance.js";
import User from "../../../model/user.js";
import bcryptjs from "bcryptjs";

export const createStaff = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { 
      name, salary, wageAmount, dailyRate, monthlySalary, 
      wageType, mobileNumber, mobile, position, role, password,
      overtimeRatePerHour, salesTarget, commissionPercent, paidLeavesAllowed 
    } = req.body;

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

    const isDaily = wageType === 'daily';
    let finalWageAmount = 0;
    let finalMonthlySalary = 0;

    if (isDaily) {
      finalWageAmount = Number(dailyRate || wageAmount || salary || 0);
      finalMonthlySalary = finalWageAmount * 30;
    } else {
      finalWageAmount = Number(monthlySalary || wageAmount || salary || 0);
      finalMonthlySalary = finalWageAmount;
    }

    const assignedRole = (role || 'salesman').toLowerCase();

    const staff = new Staff({
      ...req.body,
      name: name.trim(),
      mobileNumber: phone,
      salary: finalMonthlySalary,
      wageAmount: finalWageAmount,
      wageType: isDaily ? 'daily' : 'monthly',
      paidLeavesAllowed: Number(paidLeavesAllowed || 0),
      position: position || (assignedRole === 'godown' ? 'गोदाम / इन्वेंटरी स्टाफ' : assignedRole === 'accountant' ? 'अकाउंटेंट / मुनीम' : assignedRole === 'manager' ? 'मैनेजर' : 'सेल्समैन'),
      role: assignedRole,
      overtimeRatePerHour: Number(overtimeRatePerHour || 0),
      salesTarget: Number(salesTarget || 0),
      commissionPercent: Number(commissionPercent || 0),
      companyId: req.companyId
    });

    await staff.save();

    // Auto-create / sync User login credentials for Staff with assigned role
    if (phone) {
      try {
        let userDoc = await User.findOne({ phone });
        if (!userDoc) {
          userDoc = await User.findOne({ email: `${phone}@vyaparbook.local` });
        }
        const rawPass = password || phone.slice(-4) || "1234";
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(rawPass, salt);

        if (!userDoc) {
          await User.create({
            name: name.trim(),
            phone,
            email: `${phone}@vyaparbook.local`,
            password: hashedPassword,
            role: assignedRole,
            companyId: req.companyId,
            isActive: true,
            isVerified: true
          });
        } else {
          userDoc.role = assignedRole;
          userDoc.companyId = req.companyId;
          if (password) {
            userDoc.password = hashedPassword;
          }
          await userDoc.save();
        }
      } catch (userErr) {
        console.warn("Staff user account sync warning:", userErr);
      }
    }

    res.status(201).json({ success: true, staff, message: `Staff ${name} added successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Auto-backfill existing expenses that were added for staff before 2-way sync
export const autoBackfillStaffExpenses = async (companyId) => {
  if (!companyId) return;
  try {
    const staffMembers = await Staff.find({ companyId, isActive: true });
    if (staffMembers.length === 0) return;

    const staffIdMap = new Map();
    staffMembers.forEach(s => {
      staffIdMap.set(s._id.toString(), s);
    });

    // Find operating expenses that might belong to staff
    const query = {
      companyId,
      isDeleted: { $ne: true },
      $or: [
        { staffId: { $exists: true, $ne: null } },
        { category: { $in: ['Salary', 'Staff', 'वेतन', 'स्टाफ', 'स्टाफ खर्च', 'salary', 'staff', 'Advance', 'Staff Payment'] } }
      ]
    };

    const candidateExpenses = await Expense.find(query);
    for (const exp of candidateExpenses) {
      let existingTx = null;
      if (exp.staffTransactionId) {
        existingTx = await StaffTransaction.findOne({ _id: exp.staffTransactionId, isDeleted: { $ne: true } });
      }
      if (!existingTx) {
        existingTx = await StaffTransaction.findOne({ expenseId: exp._id, isDeleted: { $ne: true } });
      }

      if (!existingTx) {
        let targetStaff = null;
        if (exp.staffId && staffIdMap.has(exp.staffId.toString())) {
          targetStaff = staffIdMap.get(exp.staffId.toString());
        }
        if (!targetStaff) {
          const text = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
          for (const s of staffMembers) {
            if (s.name && text.includes(s.name.trim().toLowerCase())) {
              targetStaff = s;
              break;
            }
          }
        }
        if (!targetStaff && staffMembers.length === 1) {
          targetStaff = staffMembers[0];
        }

        if (targetStaff) {
          const amt = Number(exp.amount) || 0;
          if (amt > 0) {
            const stTx = await StaffTransaction.create({
              staffId: targetStaff._id,
              companyId,
              type: 'advance',
              date: exp.date ? new Date(exp.date) : (exp.createdAt ? new Date(exp.createdAt) : new Date()),
              debit: amt,
              credit: 0,
              notes: (exp.description || exp.title || `दुकान खर्च से बैकफिल्ड स्टाफ भुगतान: ${targetStaff.name}`).trim(),
              expenseId: exp._id
            });
            exp.staffTransactionId = stTx._id;
            exp.staffId = targetStaff._id;
            await exp.save();

            targetStaff.balance = (Number(targetStaff.balance) || 0) - amt;
            targetStaff.updatedAt = new Date();
            await targetStaff.save();
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Auto-backfill Staff Expenses Error]:", err.message);
  }
};

// --- PAGARBOOK SUMMARY & DASHBOARD (Includes Day-by-Day Attendance Map for 30/31 Days) ---
export const getPagarBookSummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID missing" });
    }

    // Auto-sync unlinked historical expenses before calculating summaries
    await autoBackfillStaffExpenses(req.companyId);

    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-12
    const year = parseInt(req.query.year) || now.getFullYear();

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month - 1, daysInMonth, 23, 59, 59);

    const isCurrentMonth = (now.getFullYear() === year && (now.getMonth() + 1) === month);
    const daysConsidered = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

    const allStaff = await Staff.find({ companyId: req.companyId, isActive: true }).sort({ name: 1 });
    const staffIds = allStaff.map(s => s._id);

    // Fetch Attendance records for this month
    const attendanceRecords = await Attendance.find({
      staffId: { $in: staffIds },
      date: { $gte: startDate, $lte: endDate }
    });

    // Fetch Staff Transactions (Advances, Overtime, Commission, Payments)
    const transactions = await StaffTransaction.find({
      companyId: req.companyId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).sort({ date: -1 });

    // Fetch prior transactions & attendance before this month to calculate cumulative previous balance
    const priorTransactions = await StaffTransaction.find({
      companyId: req.companyId,
      date: { $lt: startDate },
      isDeleted: false
    }).sort({ date: -1 });

    const priorAttendance = await Attendance.find({
      staffId: { $in: staffIds },
      date: { $lt: startDate }
    });

    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

    const staffSummaries = allStaff.map(s => {
      const staffIdStr = s._id.toString();
      const staffAtt = attendanceRecords.filter(a => a.staffId.toString() === staffIdStr);
      const staffTx = transactions.filter(t => t.staffId.toString() === staffIdStr);

      // Check today's status
      const todayRecord = staffAtt.find(a => new Date(a.date).toDateString() === todayStr);
      const todayRaw = todayRecord ? todayRecord.status : 'present';
      const todayStatus = (todayRaw === 'half-day' || todayRaw === 'halfday' || todayRaw === 'half_day') 
        ? 'half_day' 
        : (todayRaw === 'absent' || todayRaw === 'leave') 
        ? 'absent' 
        : 'present';

      // Build Day-by-Day Attendance Map for elapsed days (1 to daysConsidered)
      const dailyAttendanceMap = {};
      let absentCount = 0;
      let halfDayCount = 0;
      let presentCount = 0;

      for (let day = 1; day <= daysConsidered; day++) {
        const matchingRecord = staffAtt.find(a => {
          const ad = new Date(a.date);
          return ad.getDate() === day && ad.getMonth() === (month - 1) && ad.getFullYear() === year;
        });

        const rawStatus = matchingRecord ? matchingRecord.status : 'present';
        const status = (rawStatus === 'half-day' || rawStatus === 'halfday' || rawStatus === 'half_day') 
          ? 'half_day' 
          : (rawStatus === 'absent' || rawStatus === 'leave') 
          ? 'absent' 
          : 'present';

        dailyAttendanceMap[day] = status;

        if (status === 'absent') absentCount++;
        else if (status === 'half_day') halfDayCount++;
        else presentCount++;
      }

      // Worked effective days: Present + (HalfDay * 0.5)
      const workedEffectiveDays = presentCount + (halfDayCount * 0.5);

      // Paid Leaves allowance
      const allowedPaidLeaves = Number(s.paidLeavesAllowed || 0);
      const paidLeavesBenefited = Math.min(absentCount, allowedPaidLeaves);
      const unpaidAbsentDays = Math.max(0, absentCount - paidLeavesBenefited);

      // Total Payable Days (e.g. 6.5)
      const payableDays = Math.round((workedEffectiveDays + paidLeavesBenefited) * 10) / 10;

      // Salary Calculation
      const isDaily = (s.wageType === 'daily');
      const dailyRateVal = Number(s.dailyRate || s.wageAmount || s.salary || 0);
      const monthlySalaryVal = Number(s.monthlySalary || s.salary || s.wageAmount || 0);

      let perDaySalary = 0;
      let earnedSalary = 0;
      let monthlyEquivalent = 0;

      if (isDaily) {
        perDaySalary = dailyRateVal;
        earnedSalary = Math.round(perDaySalary * payableDays);
        monthlyEquivalent = dailyRateVal * daysInMonth;
      } else {
        perDaySalary = daysInMonth > 0 ? (monthlySalaryVal / daysInMonth) : 0;
        earnedSalary = Math.round(perDaySalary * payableDays);
        monthlyEquivalent = monthlySalaryVal;
      }

      // Cumulative Previous Balance (from all months prior to current month)
      const priorStaffTx = priorTransactions.filter(t => t.staffId.toString() === staffIdStr);
      const priorStaffAtt = priorAttendance.filter(a => a.staffId.toString() === staffIdStr);

      let totalPriorEarned = 0;
      // Loop through each prior month from joining date (or up to 12 months back)
      const joinDate = s.dateOfJoining ? new Date(s.dateOfJoining) : new Date(year, month - 2, 1);
      let curY = joinDate.getFullYear();
      let curM = joinDate.getMonth(); // 0-11

      // Guard: do not go further back than 12 months
      const minDate = new Date(year, month - 13, 1);
      if (new Date(curY, curM, 1) < minDate) {
        curY = minDate.getFullYear();
        curM = minDate.getMonth();
      }

      while (curY < year || (curY === year && curM < (month - 1))) {
        const pmDaysInMonth = new Date(curY, curM + 1, 0).getDate();
        let pmPresent = 0;
        let pmHalfDay = 0;
        let pmAbsent = 0;

        for (let day = 1; day <= pmDaysInMonth; day++) {
          const match = priorStaffAtt.find(a => {
            const ad = new Date(a.date);
            return ad.getDate() === day && ad.getMonth() === curM && ad.getFullYear() === curY;
          });
          const rawSt = match ? match.status : 'present';
          const st = (rawSt === 'half-day' || rawSt === 'halfday' || rawSt === 'half_day')
            ? 'half_day'
            : (rawSt === 'absent' || rawSt === 'leave')
            ? 'absent'
            : 'present';

          if (st === 'absent') pmAbsent++;
          else if (st === 'half_day') pmHalfDay++;
          else pmPresent++;
        }

        const pmWorked = pmPresent + (pmHalfDay * 0.5);
        const pmPaidLeaves = Math.min(pmAbsent, allowedPaidLeaves);
        const pmPayable = pmWorked + pmPaidLeaves;

        if (isDaily) {
          totalPriorEarned += Math.round(dailyRateVal * pmPayable);
        } else {
          const pmPerDay = pmDaysInMonth > 0 ? (monthlySalaryVal / pmDaysInMonth) : 0;
          totalPriorEarned += Math.round(pmPerDay * pmPayable);
        }

        curM++;
        if (curM > 11) {
          curM = 0;
          curY++;
        }
      }

      // Prior credits (overtime, commission, incentives)
      const priorCredits = priorStaffTx
        .filter(t => ['overtime', 'commission', 'incentive'].includes(t.type))
        .reduce((sum, t) => sum + (Number(t.credit) || 0), 0);

      // Deduplicate identical prior debits (e.g. twin auto-sync entries)
      const seenPriorDebits = new Set();
      const priorDebits = priorStaffTx
        .filter(t => ['advance', 'salary_settlement', 'deduction', 'loan_emi', 'payment'].includes(t.type))
        .reduce((sum, t) => {
          const amt = Number(t.debit) || Number(t.amount) || 0;
          const dStr = t.date ? new Date(t.date).toISOString().slice(0, 16) : '';
          const key = `${amt}_${dStr}`;
          if (seenPriorDebits.has(key)) return sum;
          seenPriorDebits.add(key);
          return sum + amt;
        }, 0);

      const previousBalance = (totalPriorEarned + priorCredits) - priorDebits;

      // Overtime & Commission for current month
      const otTransactions = staffTx.filter(t => t.type === 'overtime');
      const otEarnings = otTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
      const overtimeHours = otTransactions.reduce((sum, t) => sum + (Number(t.hours || 0) || 0), 0);

      const commTransactions = staffTx.filter(t => t.type === 'commission' || t.type === 'incentive');
      const commEarnings = commTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);

      // Advances & Payments Given in current month (deduplicating identical timestamp entries)
      const seenCurDebits = new Set();
      const advanceTransactions = staffTx.filter(t => ['advance', 'salary_settlement', 'deduction', 'loan_emi', 'payment'].includes(t.type))
        .filter(t => {
          const amt = Number(t.debit) || Number(t.amount) || 0;
          const dStr = t.date ? new Date(t.date).toISOString().slice(0, 16) : '';
          const key = `${amt}_${dStr}`;
          if (seenCurDebits.has(key)) return false;
          seenCurDebits.add(key);
          return true;
        });
      const totalAdvance = advanceTransactions.reduce((sum, t) => sum + (Number(t.debit) || Number(t.amount) || 0), 0);

      const grossSalary = earnedSalary + otEarnings + commEarnings;
      // Net payable carries forward previous balance, adds current earnings, subtracts current payments/advances
      const netPayable = Math.max(0, previousBalance + grossSalary - totalAdvance);

      return {
        _id: s._id,
        name: s.name,
        mobileNumber: s.mobileNumber || '',
        position: s.position || 'Staff',
        wageType: s.wageType || 'daily',
        dailyRate: dailyRateVal,
        monthlySalary: monthlySalaryVal,
        isDaily,
        baseSalary: isDaily ? dailyRateVal : monthlySalaryVal,
        monthlyEquivalent,
        perDaySalary: Math.round(perDaySalary),
        daysInMonth,
        daysConsidered,
        todayStatus,
        dailyAttendanceMap,
        presentCount,
        presentDays: presentCount,
        halfDayCount,
        halfDays: halfDayCount,
        absentCount,
        absentDays: absentCount,
        allowedPaidLeaves,
        paidLeavesAllowed: allowedPaidLeaves,
        paidLeavesBenefited,
        paidLeavesCount: paidLeavesBenefited,
        unpaidAbsentDays,
        workedEffectiveDays,
        payableDays,
        earnedSalary,
        overtimeHours,
        otEarnings,
        overtimeEarnings: otEarnings,
        commEarnings,
        commissionEarnings: commEarnings,
        grossSalary,
        totalAdvance,
        previousBalance,
        netPayable,
        advancesList: advanceTransactions.map(t => ({
          _id: t._id,
          amount: t.debit || t.amount,
          date: t.date,
          paymentMode: t.paymentMode || 'cash',
          type: t.type,
          notes: t.notes || 'Advance'
        })),
        salesTarget: Number(s.salesTarget || 0),
        commissionPercent: Number(s.commissionPercent || 0),
        overtimeRatePerHour: Number(s.overtimeRatePerHour || 0),
        transactions: staffTx
      };
    });

    const totalStaffCount = staffSummaries.length;
    const totalCompanySalaryEarned = staffSummaries.reduce((sum, s) => sum + s.earnedSalary, 0);
    const totalCompanyAdvanceGiven = staffSummaries.reduce((sum, s) => sum + s.totalAdvance, 0);
    const totalCompanyPreviousBalance = staffSummaries.reduce((sum, s) => sum + (s.previousBalance || 0), 0);
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
      totalCompanyPreviousBalance,
      totalCompanyNetPayable,
      staff: staffSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Quick Mark Attendance for ANY specific date of the month
export const quickMarkAttendance = async (req, res) => {
  try {
    const { staffId, status, date } = req.body;
    if (!staffId || !status) {
      return res.status(400).json({ success: false, error: "Staff ID and status are required" });
    }

    const attDate = date ? new Date(date) : new Date();
    const staff = await Staff.findOne({ _id: staffId, companyId: req.companyId });
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    // Normalize status to clean format
    const normStatus = (status === 'half-day' || status === 'halfday' || status === 'half_day') 
      ? 'half_day' 
      : (status === 'absent' || status === 'leave') 
      ? 'absent' 
      : 'present';

    const startOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate(), 23, 59, 59);

    let attendance = await Attendance.findOne({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (attendance) {
      attendance.status = normStatus;
      attendance.updatedAt = new Date();
      await attendance.save();
    } else {
      attendance = new Attendance({
        staffId,
        companyId: req.companyId,
        date: attDate,
        status: normStatus
      });
      await attendance.save();
    }

    res.status(200).json({ 
      success: true, 
      message: `तारीख ${attDate.getDate()} को हाजिरी सुरक्षित हुई: ${normStatus}`, 
      attendance 
    });
  } catch (error) {
    console.error("quickMarkAttendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1-Tap Record Staff Advance
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

    // Auto-record as Shop Expense (Operating) under Salary category for 2-way sync
    try {
      const linkedExpense = await Expense.create({
        companyId: req.companyId,
        title: `स्टाफ एडवांस - ${staff.name}`,
        amount: Number(amount),
        category: "Salary",
        expenseType: "operating",
        familyMember: "",
        date: date ? new Date(date) : new Date(),
        paymentMethod: (req.body.paymentMode || 'cash').toLowerCase(),
        description: `PagarBook से दर्ज एडवांस: ${staff.name} (${(notes || 'एडवांस भुगतान').trim()})`,
        staffId: staff._id,
        staffTransactionId: advanceTx._id
      });
      advanceTx.expenseId = linkedExpense._id;
      await advanceTx.save();
    } catch (expErr) {
      console.warn("Auto shop expense creation warning for staff advance:", expErr.message);
    }

    // Update staff balance (Advance reduces net payable)
    staff.balance = (Number(staff.balance) || 0) - Number(amount);
    staff.updatedAt = new Date();
    await staff.save();

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

    // Update staff balance (Overtime increases net payable)
    staff.balance = (Number(staff.balance) || 0) + Math.round(totalOtPay);
    staff.updatedAt = new Date();
    await staff.save();

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

    // Update staff balance (Commission increases net payable)
    staff.balance = (Number(staff.balance) || 0) + Number(amount);
    staff.updatedAt = new Date();
    await staff.save();

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

    // 2-Way Sync: Create linked Expense for debit transactions (advance/salary/deduction)
    if (debit > 0) {
      try {
        const typeLabels = {
          advance: 'स्टाफ एडवांस',
          salary_settlement: 'वेतन भुगतान',
          deduction: 'स्टाफ कटौती'
        };
        const linkedExpense = await Expense.create({
          companyId: req.companyId,
          title: `${typeLabels[paymentType] || 'स्टाफ भुगतान'} - ${staff.name}`,
          amount: Number(amount),
          category: "Salary",
          expenseType: "operating",
          familyMember: "",
          date: new Date(),
          paymentMethod: (req.body.paymentMode || 'cash').toLowerCase(),
          description: `PagarBook भुगतान: ${staff.name} (${(notes || paymentType).trim()})`,
          staffId: staff._id,
          staffTransactionId: transaction._id
        });
        transaction.expenseId = linkedExpense._id;
        await transaction.save();
      } catch (expErr) {
        console.warn("Auto expense creation warning for staff payment:", expErr.message);
      }
    }

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
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStaffStatement = async (req, res) => {
  try {
    const transactions = await StaffTransaction.find({ staffId: req.params.id, companyId: req.companyId, isDeleted: { $ne: true } }).sort({ date: -1 });
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

    // Auto-sync unlinked historical expenses before returning staff
    await autoBackfillStaffExpenses(req.companyId);

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

    const { wageType, dailyRate, monthlySalary, salary, wageAmount, paidLeavesAllowed } = req.body;
    const isDaily = wageType === 'daily';

    let finalWageAmount = req.body.wageAmount;
    let finalSalary = req.body.salary;

    if (wageType) {
      if (isDaily) {
        finalWageAmount = Number(dailyRate || wageAmount || salary || 0);
        finalSalary = finalWageAmount * 30;
      } else {
        finalWageAmount = Number(monthlySalary || wageAmount || salary || 0);
        finalSalary = finalWageAmount;
      }
    }

    const updatePayload = {
      ...req.body,
      ...(wageType && { wageType: isDaily ? 'daily' : 'monthly', wageAmount: finalWageAmount, salary: finalSalary }),
      ...(paidLeavesAllowed !== undefined && { paidLeavesAllowed: Number(paidLeavesAllowed) }),
      updatedAt: new Date()
    };

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { $set: updatePayload },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });

    // Sync credentials & role with User login record for mobile access
    if (req.body.role || req.body.password || req.body.mobileNumber || req.body.name) {
      try {
        const phone = (staff.mobileNumber || req.body.mobileNumber || '').trim();
        if (phone) {
          const userDoc = await User.findOne({ phone, companyId: req.companyId });
          if (userDoc) {
            if (req.body.name) userDoc.name = req.body.name.trim();
            if (req.body.role) userDoc.role = req.body.role.toLowerCase();
            if (req.body.password) {
              const salt = await bcryptjs.genSalt(10);
              userDoc.password = await bcryptjs.hash(req.body.password, salt);
            }
            await userDoc.save();
          } else {
            const rawPass = req.body.password || phone.slice(-4) || "1234";
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(rawPass, salt);
            await User.create({
              name: staff.name,
              phone,
              email: `${phone}@vyaparbook.local`,
              password: hashedPassword,
              role: (req.body.role || staff.role || 'salesman').toLowerCase(),
              companyId: req.companyId,
              isActive: true,
              isVerified: true
            });
          }
        }
      } catch (userErr) {
        console.warn("Staff user account update sync warning:", userErr);
      }
    }

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

export const deleteStaffTransaction = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    
    // Idempotency: only find non-deleted transactions
    const tx = await StaffTransaction.findOne(
      { _id: req.params.id, companyId: req.companyId, isDeleted: { $ne: true } }
    );
    if (!tx) return res.status(404).json({ success: false, error: "Transaction not found or already deleted" });

    // Soft delete the transaction
    tx.isDeleted = true;
    await tx.save();

    // Revert staff balance
    try {
      const staff = await Staff.findById(tx.staffId);
      if (staff) {
        if (tx.debit > 0) staff.balance += tx.debit;    // Was deducted, add back
        if (tx.credit > 0) staff.balance -= tx.credit;  // Was credited, remove
        await staff.save();
      }
    } catch (balErr) {
      console.warn("Staff balance revert warning:", balErr.message);
    }

    // Delete linked expense (2-way sync)
    try {
      let linkedExpense = null;
      if (tx.expenseId) {
        linkedExpense = await Expense.findOneAndUpdate(
          { _id: tx.expenseId, companyId: req.companyId }, 
          { $set: { isDeleted: true } },
          { new: false } // return OLD doc to read bankAccountId
        );
      } else if (tx.staffId && tx.debit > 0) {
        linkedExpense = await Expense.findOneAndUpdate(
          { staffTransactionId: tx._id, companyId: req.companyId, isDeleted: { $ne: true } }, 
          { $set: { isDeleted: true } },
          { new: false }
        );
        if (!linkedExpense) {
          linkedExpense = await Expense.findOneAndUpdate(
            { staffId: tx.staffId, companyId: req.companyId, amount: tx.debit, isDeleted: { $ne: true } }, 
            { $set: { isDeleted: true } },
            { new: false }
          );
        }
      }

      // Revert bank balance if expense was bank-linked
      if (linkedExpense && linkedExpense.bankAccountId && Number(linkedExpense.amount) > 0) {
        const BankAccount = (await import("../../model/BankAccount.js")).default;
        const bank = await BankAccount.findOne({ _id: linkedExpense.bankAccountId, companyId: req.companyId });
        if (bank) {
          const revAmt = Number(linkedExpense.amount);
          if (bank.accountType === "CC_OVERDRAFT") {
            bank.currentOutstanding = Math.max(0, (Number(bank.currentOutstanding) || 0) - revAmt);
          } else {
            bank.currentBalance = (Number(bank.currentBalance) || 0) + revAmt;
          }
          bank.transactions.push({
            date: new Date(),
            type: "deposit",
            amount: revAmt,
            note: `स्टाफ लेनदेन हटाया (रिफंड): ${linkedExpense.title || 'खर्च'}`,
            referenceNo: `REV-STF-${tx._id}`
          });
          await bank.save();
        }
      }
    } catch (expDelErr) {
      console.warn("Linked expense deletion warning:", expDelErr.message);
    }

    res.json({ success: true, message: "Transaction deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
