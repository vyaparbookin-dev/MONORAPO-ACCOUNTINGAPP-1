import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Plus, Search, Calendar, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Settings, HelpCircle, Clock, FileText, Award, DollarSign, Send, Printer,
  User, Check, X, AlertCircle, Edit, Trash2, Shield, MoreVertical, Sparkles, Umbrella
} from "lucide-react";
import api from "../services/api";

export default function PagarBookHub({ onClose, initialStaffId = null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState({
    staff: [],
    totalCompanySalaryEarned: 0,
    totalCompanyAdvanceGiven: 0,
    totalCompanyNetPayable: 0,
    daysInMonth: 30
  });
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Ganesh traders sarangarh");

  // Screen state: 'home' (Screenshot 4) | 'staff_hub' (Screenshot 3) | 'attendance_cal' (Screenshots 1 & 2)
  const [activeScreen, setActiveScreen] = useState(initialStaffId ? "staff_hub" : "home");
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);

  const [earningsExpanded, setEarningsExpanded] = useState(true);

  // Add / Edit Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [modalStaffId, setModalStaffId] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffPosition, setStaffPosition] = useState("Staff");
  const [monthlySalaryInput, setMonthlySalaryInput] = useState("");
  const [dailyRateInput, setDailyRateInput] = useState("");
  const [activeWageType, setActiveWageType] = useState("daily"); // 'daily' or 'monthly'
  const [staffPaidLeaves, setStaffPaidLeaves] = useState("0");
  const [staffOtRate, setStaffOtRate] = useState("");
  const [staffCommission, setStaffCommission] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // Add Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advancePaymentMode, setAdvancePaymentMode] = useState("cash");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [savingAdvance, setSavingAdvance] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);

  const fetchData = async (m = currentMonth, y = currentYear) => {
    try {
      setLoading(true);
      const res = await api.get(`/staff/pagarbook-summary?month=${m}&year=${y}`);
      if (res.data && res.data.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error("Failed to load staff summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentStaff = (summaryData.staff || []).find(s => s._id === selectedStaffId) || null;

  const handleMonthChange = (delta) => {
    let newM = currentMonth + delta;
    let newY = currentYear;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    } else if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setCurrentMonth(newM);
    setCurrentYear(newY);
  };

  // 1-Tap Attendance Mark for any day
  const handleMarkDayAttendance = async (staffId, dayNum, status) => {
    try {
      setSummaryData(prev => {
        const updatedStaff = (prev.staff || []).map(s => {
          if (s._id === staffId) {
            const newMap = { ...(s.dailyAttendanceMap || {}), [dayNum]: status };
            return { ...s, dailyAttendanceMap: newMap };
          }
          return s;
        });
        return { ...prev, staff: updatedStaff };
      });

      const targetDate = new Date(currentYear, currentMonth - 1, dayNum, 12, 0, 0);
      await api.post("/staff/quick-attendance", {
        staffId,
        status,
        date: targetDate
      });

      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Error marking attendance:", err);
    }
  };

  // Open Add Staff Modal
  const handleOpenAddStaff = () => {
    setIsEditingStaff(false);
    setModalStaffId(null);
    setStaffName("");
    setStaffMobile("");
    setStaffPosition("Staff");
    setMonthlySalaryInput("");
    setDailyRateInput("");
    setActiveWageType("daily");
    setStaffPaidLeaves("0");
    setStaffOtRate("");
    setStaffCommission("");
    setShowStaffModal(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff) => {
    setIsEditingStaff(true);
    setModalStaffId(staff._id);
    setStaffName(staff.name || "");
    setStaffMobile(staff.mobileNumber || "");
    setStaffPosition(staff.position || "Staff");
    if (staff.wageType === "monthly") {
      setMonthlySalaryInput(staff.monthlySalary ? String(staff.monthlySalary) : String(staff.salary || staff.wageAmount || ""));
      setDailyRateInput(staff.dailyRate ? String(staff.dailyRate) : "");
      setActiveWageType("monthly");
    } else {
      setDailyRateInput(staff.dailyRate ? String(staff.dailyRate) : String(staff.wageAmount || staff.salary || ""));
      setMonthlySalaryInput(staff.monthlySalary ? String(staff.monthlySalary) : "");
      setActiveWageType("daily");
    }
    setStaffPaidLeaves(String(staff.paidLeavesAllowed || 0));
    setStaffOtRate(staff.overtimeRatePerHour ? String(staff.overtimeRatePerHour) : "");
    setStaffCommission(staff.commissionPercent ? String(staff.commissionPercent) : "");
    setShowStaffModal(true);
  };

  const handleSaveStaffModal = async (e) => {
    if (e) e.preventDefault();
    if (!staffName.trim()) {
      alert("कृपया स्टाफ का नाम दर्ज करें!");
      return;
    }

    let chosenSalary = 0;
    const dailyVal = Number(dailyRateInput) || 0;
    const monthlyVal = Number(monthlySalaryInput) || 0;

    if (activeWageType === "monthly") {
      if (!monthlyVal || monthlyVal <= 0) {
        alert("कृपया मासिक वेतन (Monthly Salary ₹) दर्ज करें!");
        return;
      }
      chosenSalary = monthlyVal;
    } else {
      if (!dailyVal || dailyVal <= 0) {
        alert("कृपया दैनिक दिहाड़ी दर (Daily Wage Rate ₹) दर्ज करें!");
        return;
      }
      chosenSalary = dailyVal;
    }

    setSavingStaff(true);
    try {
      const payload = {
        name: staffName.trim(),
        salary: chosenSalary,
        wageAmount: chosenSalary,
        wageType: activeWageType,
        dailyRate: dailyVal,
        monthlySalary: monthlyVal,
        paidLeavesAllowed: Number(staffPaidLeaves) || 0,
        mobileNumber: staffMobile.trim(),
        position: staffPosition.trim() || "Staff",
        overtimeRatePerHour: Number(staffOtRate) || 0,
        commissionPercent: Number(staffCommission) || 0
      };

      if (isEditingStaff && modalStaffId) {
        await api.put(`/staff/${modalStaffId}`, payload);
        alert(`✅ ${staffName} का विवरण सफलतापूर्वक अपडेट हो गया!`);
      } else {
        await api.post("/staff", payload);
        alert(`✅ नया स्टाफ '${staffName}' सफलतापूर्वक जुड़ गया!`);
      }

      setShowStaffModal(false);
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Save staff error:", err);
      alert(err.response?.data?.error || "स्टाफ सुरक्षित करने में त्रुटि आई।");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, sName) => {
    const ok = window.confirm(`⚠️ क्या आप वाकई '${sName}' को हटाना (Delete) चाहते हैं?`);
    if (!ok) return;

    try {
      await api.delete(`/staff/${staffId}`);
      alert(`✅ स्टाफ '${sName}' हटा दिया गया!`);
      setShowStaffModal(false);
      if (activeScreen !== "home") setActiveScreen("home");
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Delete staff error:", err);
      alert(err.response?.data?.error || "स्टाफ हटाने में त्रुटि आई।");
    }
  };

  const handleSaveAdvance = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffId || !advanceAmount || Number(advanceAmount) <= 0) {
      alert("कृपया सही राशि दर्ज करें!");
      return;
    }
    setSavingAdvance(true);
    try {
      await api.post("/staff/advance", {
        staffId: selectedStaffId,
        amount: Number(advanceAmount),
        paymentMode: advancePaymentMode,
        notes: advanceNotes.trim() || "एडवांस भुगतान",
        date: new Date()
      });
      alert(`✅ ₹${advanceAmount} का एडवांस जुड़ गया!`);
      setAdvanceAmount("");
      setAdvanceNotes("");
      setShowAdvanceModal(false);
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Advance error:", err);
      alert(err.response?.data?.error || "एडवांस दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleDeleteAdvance = async (txId) => {
    const ok = window.confirm("⚠️ क्या आप इस एडवांस एंट्री को हटाना चाहते हैं?");
    if (!ok) return;
    try {
      await api.delete(`/staff/transaction/${txId}`);
      alert("✅ एडवांस प्रविष्टि हटा दी गई!");
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Delete advance error:", err);
      alert(err.response?.data?.error || "एडवांस हटाने में त्रुटि आई।");
    }
  };

  const handleShareWhatsApp = (staff) => {
    if (!staff) return;
    const mName = new Date(currentYear, currentMonth - 1).toLocaleString('hi-IN', { month: 'short' });
    const lines = [
      `*🧾 मासिक वेतन पर्ची (Salary Slip)*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *कर्मचारी:* ${staff.name}`,
      `📱 *मोबाइल:* ${staff.mobileNumber || "N/A"}`,
      `📅 *महीना:* ${mName} ${currentYear}`,
      `💼 *वेतन दर:* ${staff.wageType === 'daily' ? `₹${staff.dailyRate || staff.wageAmount}/दिन (दैनिक)` : `₹${staff.monthlySalary || staff.salary}/माह (मासिक)`}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📊 *हाजिरी:*`,
      `  🟢 उपस्थित (P): ${staff.presentDays || 0} दिन`,
      `  🟡 हाफ डे (HD): ${staff.halfDays || 0} दिन`,
      `  🔴 अनुपस्थित (AB): ${staff.absentDays || 0} दिन`,
      `  🎁 सवेतन छुट्टी: ${staff.paidLeavesCount || 0} दिन`,
      `  ✅ कुल वेतन योग्य दिन: ${staff.payableDays || 0} दिन`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *वेतन गणना:*`,
      `  💵 मूल वेतन: ₹${(staff.earnedSalary || 0).toLocaleString('en-IN')}`,
      staff.overtimeEarnings > 0 ? `  ⏱️ ओवर-टाइम: +₹${(staff.overtimeEarnings || 0).toLocaleString('en-IN')}` : null,
      `  💸 एडवांस कटौती: -₹${(staff.totalAdvance || 0).toLocaleString('en-IN')}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*💳 शुद्ध देय वेतन (Net Due): ₹${(staff.netPayable || 0).toLocaleString('en-IN')}*`
    ].filter(Boolean);

    const fullMsg = lines.join(String.fromCharCode(10));
    const phone = (staff.mobileNumber || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMsg)}` : `https://wa.me/?text=${encodeURIComponent(fullMsg)}`;
    window.open(url, "_blank");
  };

  const monthShortName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'short' });
  const daysCount = summaryData.daysInMonth || 30;

  const getDayShortName = (y, m, d) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[new Date(y, m - 1, d).getDay()];
  };

  const dailyStaffList = (summaryData.staff || []).filter(s => s.wageType === "daily");
  const monthlyStaffList = (summaryData.staff || []).filter(s => s.wageType === "monthly");
  const totalPendingAmount = summaryData.totalCompanyNetPayable || 0;

  return (
    <div className="w-full flex justify-center bg-[#F4F6F9] min-h-screen text-[#1E293B]">
      <div className="w-full max-w-lg bg-[#F8FAFC] min-h-screen flex flex-col relative shadow-xl pb-10">

        {/* SCREEN 1: HOME - STAFF LIST (Screenshot 4) */}
        {activeScreen === "home" && (
          <div className="flex flex-col flex-1">
            <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onClose ? onClose() : window.history.back()} 
                  className="p-1 text-slate-800 hover:text-blue-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-slate-900 truncate max-w-[220px]">
                  {companyName}
                </h1>
              </div>
              <button className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:underline cursor-pointer">
                <span>Help</span>
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                <span className="text-xs font-medium text-slate-500 block mb-1">Total Pending</span>
                <div className="text-3xl font-extrabold text-[#DC2626] mb-4">
                  ₹ {totalPendingAmount.toLocaleString('en-IN')}
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold text-sm cursor-pointer hover:opacity-80">
                  <span>Bulk Payment</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={handleOpenAddStaff}
                className="w-full py-3.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Add Staff</span>
              </button>

              <div className="space-y-4 pt-2">
                {dailyStaffList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Daily ({dailyStaffList.length})
                    </h3>
                    <div className="space-y-2">
                      {dailyStaffList.map((staff) => {
                        const todayDay = new Date().getDate();
                        const todayStatus = staff.dailyAttendanceMap?.[todayDay] || "Absent";
                        const statusLabel = todayStatus === "present" ? "Present" : todayStatus === "half_day" ? "Half Day" : "Absent";

                        return (
                          <div
                            key={staff._id}
                            onClick={() => {
                              setSelectedStaffId(staff._id);
                              setActiveScreen("staff_hub");
                            }}
                            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between hover:border-blue-300 transition cursor-pointer active:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                <span className={`text-xs font-medium ${statusLabel === 'Present' ? 'text-emerald-600' : statusLabel === 'Half Day' ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-bold text-[#DC2626]">
                                ₹ {(staff.netPayable || 0).toLocaleString('en-IN')}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">Pending</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {monthlyStaffList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Monthly ({monthlyStaffList.length})
                    </h3>
                    <div className="space-y-2">
                      {monthlyStaffList.map((staff) => {
                        const todayDay = new Date().getDate();
                        const todayStatus = staff.dailyAttendanceMap?.[todayDay] || "Absent";
                        const statusLabel = todayStatus === "present" ? "Present" : todayStatus === "half_day" ? "Half Day" : "Absent";

                        return (
                          <div
                            key={staff._id}
                            onClick={() => {
                              setSelectedStaffId(staff._id);
                              setActiveScreen("staff_hub");
                            }}
                            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between hover:border-blue-300 transition cursor-pointer active:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                <span className={`text-xs font-medium ${statusLabel === 'Present' ? 'text-emerald-600' : statusLabel === 'Half Day' ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-bold text-[#DC2626]">
                                ₹ {(staff.netPayable || 0).toLocaleString('en-IN')}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">Pending</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {summaryData.staff?.length === 0 && (
                  <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-30 text-blue-500" />
                    <p className="text-sm font-bold text-slate-700 mb-1">No staff members added yet</p>
                    <p className="text-xs text-slate-400 mb-4">Click '+ Add Staff' above to add your workers.</p>
                  </div>
                )}

                <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100 text-center space-y-3 mt-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-2xl">
                    📱
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Get daily attendance with selfie and location from your staff
                  </h4>
                  <button className="w-full py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-50 transition">
                    Learn more about premium features
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: STAFF HUB (Screenshot 3) */}
        {activeScreen === "staff_hub" && currentStaff && (
          <div className="flex flex-col flex-1 animate-fadeIn">
            <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveScreen("home")} 
                  className="p-1 text-slate-800 hover:text-blue-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-slate-900">{currentStaff.name}</h1>
              </div>
              <button 
                onClick={() => handleOpenEditStaff(currentStaff)}
                className="text-blue-600 font-bold text-sm hover:underline px-2 py-1 rounded-md active:bg-blue-50 cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setActiveScreen("attendance_cal")}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    🏃
                  </div>
                  <span className="text-sm font-bold text-slate-800">Attendance</span>
                </div>

                <div
                  onClick={() => setShowAdvanceModal(true)}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    💵
                  </div>
                  <span className="text-sm font-bold text-slate-800">Loans</span>
                </div>

                <div
                  onClick={() => handleShareWhatsApp(currentStaff)}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    📄
                  </div>
                  <span className="text-sm font-bold text-slate-800">Salary Slips</span>
                </div>

                <div
                  onClick={() => alert(`कमीशन: ${currentStaff.commissionPercent || 0}% | ओवर-टाइम दर: ₹${currentStaff.overtimeRatePerHour || 0}/घंटा`)}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    📊
                  </div>
                  <span className="text-sm font-bold text-slate-800">Goals</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-base font-bold text-slate-900">Salary Overview</h3>
                  <button 
                    onClick={() => handleOpenEditStaff(currentStaff)}
                    className="flex items-center gap-1 text-blue-600 font-bold text-xs border border-blue-200 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 cursor-pointer"
                  >
                    <span>••• Actions</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between mb-3">
                  <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <span className="text-sm font-bold text-slate-800">
                    {monthShortName} {currentYear}
                  </span>
                  <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{monthShortName} {currentYear}</h4>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Date: 01 {monthShortName}'{String(currentYear).slice(2)} - {daysCount} {monthShortName}'{String(currentYear).slice(2)}
                      </div>
                    </div>
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Due Amount</span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        ₹ {(currentStaff.netPayable || 0).toLocaleString('en-IN')}
                      </div>
                      <button 
                        onClick={() => handleOpenEditStaff(currentStaff)}
                        className="text-xs font-bold text-blue-600 mt-2 block hover:underline cursor-pointer"
                      >
                        Edit Salary
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Payable Days</span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {currentStaff.payableDays || 0}
                      </div>
                      <button 
                        onClick={() => setActiveScreen("attendance_cal")}
                        className="text-xs font-bold text-blue-600 mt-2 block hover:underline cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div 
                      onClick={() => setEarningsExpanded(!earningsExpanded)}
                      className="flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer"
                    >
                      <span>Earnings</span>
                      <div className="flex items-center gap-1.5">
                        <span>₹ {(currentStaff.grossSalary || currentStaff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                        {earningsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {earningsExpanded && (
                      <div className="mt-2.5 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Basic Earned ({currentStaff.payableDays || 0} days):</span>
                          <span className="font-bold text-slate-900">₹{(currentStaff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {currentStaff.overtimeEarnings > 0 && (
                          <div className="flex justify-between text-indigo-600">
                            <span>Overtime ({currentStaff.overtimeHours || 0} hrs):</span>
                            <span className="font-bold">+₹{currentStaff.overtimeEarnings}</span>
                          </div>
                        )}
                        {currentStaff.totalAdvance > 0 && (
                          <div className="flex justify-between text-amber-600">
                            <span>Advance Deduction:</span>
                            <span className="font-bold">-₹{currentStaff.totalAdvance}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleShareWhatsApp(currentStaff)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Slip</span>
                    </button>

                    <button
                      onClick={() => setShowAdvanceModal(true)}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>+ Pay / Advance</span>
                    </button>
                  </div>
                </div>

                {currentStaff.advancesList && currentStaff.advancesList.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 mt-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Advance Passbook</span>
                      <span className="text-xs font-extrabold text-amber-600">Total: ₹{currentStaff.totalAdvance}</span>
                    </div>
                    <div className="space-y-2">
                      {currentStaff.advancesList.map((adv, idx) => (
                        <div key={adv._id || idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {new Date(adv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[11px] text-slate-400">{adv.notes || "Advance"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-600">₹{adv.amount}</span>
                            {adv._id && (
                              <button onClick={() => handleDeleteAdvance(adv._id)} className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: ATTENDANCE CALENDAR (Screenshots 1 & 2) */}
        {activeScreen === "attendance_cal" && currentStaff && (
          <div className="flex flex-col flex-1 animate-fadeIn">
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveScreen("staff_hub")} 
                  className="p-1 text-slate-800 hover:text-blue-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">Attendance</h1>
                  <span className="text-xs text-slate-500 font-medium block">{currentStaff.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-500">
                <button title="History"><Clock className="w-5 h-5" /></button>
                <button onClick={() => handleOpenEditStaff(currentStaff)} title="Settings"><Settings className="w-5 h-5" /></button>
                <button title="Help"><HelpCircle className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between shadow-xs">
                <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <ChevronLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{monthShortName}, {currentYear}</span>
                </div>
                <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* 3x3 Metric Grid (Screenshot 2) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">Summary</span>
                  <button className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:underline">
                    <span>More Info</span>
                    <AlertCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Present</span>
                    <span className="text-base font-extrabold text-slate-900">{currentStaff.presentDays || 0}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Absent</span>
                    <span className="text-base font-extrabold text-slate-900">{currentStaff.absentDays || 0}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Half Day</span>
                    <span className="text-base font-extrabold text-slate-900">{currentStaff.halfDays || 0}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Leave</span>
                      <span className="text-base font-extrabold text-slate-900">{currentStaff.paidLeavesCount || 0}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Fine</span>
                    <span className="text-xs font-bold text-slate-900 mt-1 block">0h 0m</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Overtime</span>
                    <span className="text-xs font-bold text-slate-900 mt-1 block">{currentStaff.overtimeHours || 0}h 0m</span>
                  </div>

                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Punch In</span>
                    <span className="text-base font-extrabold text-slate-900">0</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Punch Out</span>
                    <span className="text-base font-extrabold text-slate-900">0</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">EWH</span>
                    <span className="text-base font-extrabold text-slate-900">-</span>
                  </div>
                </div>
              </div>

              {/* Manage Leaves Tile */}
              <div 
                onClick={() => handleOpenEditStaff(currentStaff)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Umbrella className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Manage Leaves</h4>
                  <span className="text-xs text-slate-400 font-medium">
                    Allowed: {currentStaff.paidLeavesAllowed || 0} paid leaves / month
                  </span>
                </div>
              </div>

              {/* Day-by-Day List (Descending Order) */}
              <div className="space-y-2.5 pt-1">
                {Array.from({ length: daysCount }, (_, i) => daysCount - i).map((dayNum) => {
                  const status = currentStaff.dailyAttendanceMap?.[dayNum] || "none";
                  const dayName = getDayShortName(currentYear, currentMonth, dayNum);

                  return (
                    <div
                      key={dayNum}
                      className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {dayNum} {monthShortName}, {dayName}
                        </span>
                        <span className={`text-xs font-semibold ${
                          status === "present" ? "text-slate-500" : status === "absent" ? "text-[#DC2626]" : status === "half_day" ? "text-amber-600" : "text-slate-400"
                        }`}>
                          {status === "present" ? "8:30 Hrs" : status === "absent" ? "Absent" : status === "half_day" ? "4:00 Hrs" : "Pending"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkDayAttendance(currentStaff._id, dayNum, "present")}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            status === "present"
                              ? "bg-[#16A34A] text-white shadow-sm"
                              : "bg-[#F1F5F9] text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          P
                        </button>

                        <button
                          onClick={() => handleMarkDayAttendance(currentStaff._id, dayNum, "half_day")}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            status === "half_day"
                              ? "bg-[#F59E0B] text-white shadow-sm"
                              : "bg-[#F1F5F9] text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          HD
                        </button>

                        <button
                          onClick={() => handleMarkDayAttendance(currentStaff._id, dayNum, "absent")}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            status === "absent"
                              ? "bg-[#DC2626] text-white shadow-sm"
                              : "bg-[#F1F5F9] text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          AB
                        </button>

                        <button 
                          onClick={() => alert(`Day ${dayNum} ${monthShortName}: ${status}`)}
                          className="p-2 bg-[#F1F5F9] text-blue-600 rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: ADD / EDIT STAFF & SALARY */}
        {showStaffModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isEditingStaff ? "Edit Staff & Salary" : "Add New Staff"}
                </h3>
                <button onClick={() => setShowStaffModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffModal} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1">Staff Name *</label>
                  <input 
                    type="text"
                    placeholder="e.g. Satish Baretha"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-1">Mobile Number (WhatsApp)</label>
                  <input 
                    type="text"
                    placeholder="10-digit mobile number"
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 space-y-3">
                  <span className="text-xs font-extrabold text-blue-900 block">
                    Salary Setup (Choose Wage Type):
                  </span>

                  <div 
                    onClick={() => setActiveWageType("daily")}
                    className={`p-3 rounded-xl border transition cursor-pointer ${activeWageType === 'daily' ? 'bg-white border-emerald-500 shadow-sm' : 'bg-white/70 border-slate-200'}`}
                  >
                    <label className="flex items-center justify-between mb-1 text-slate-800">
                      <span>📆 Daily Wage Rate (दैनिक दिहाड़ी ₹)</span>
                      {activeWageType === 'daily' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number"
                        placeholder="e.g. 500"
                        value={dailyRateInput}
                        onChange={(e) => {
                          setDailyRateInput(e.target.value);
                          if (e.target.value) setActiveWageType("daily");
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveWageType("monthly")}
                    className={`p-3 rounded-xl border transition cursor-pointer ${activeWageType === 'monthly' ? 'bg-white border-blue-500 shadow-sm' : 'bg-white/70 border-slate-200'}`}
                  >
                    <label className="flex items-center justify-between mb-1 text-slate-800">
                      <span>💵 Monthly Salary (मासिक वेतन ₹)</span>
                      {activeWageType === 'monthly' && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number"
                        placeholder="e.g. 15000"
                        value={monthlySalaryInput}
                        onChange={(e) => {
                          setMonthlySalaryInput(e.target.value);
                          if (e.target.value) setActiveWageType("monthly");
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Paid Leaves (माह में सवेतन छुट्टी छूट)</label>
                  <select
                    value={staffPaidLeaves}
                    onChange={(e) => setStaffPaidLeaves(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="0">0 Days (No Free Leave)</option>
                    <option value="1">1 Day Free Leave</option>
                    <option value="2">2 Days Free Leaves (बिना वेतन काटे)</option>
                    <option value="3">3 Days Free Leaves</option>
                    <option value="4">4 Days Free Leaves</option>
                  </select>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingStaff ? "Saving..." : isEditingStaff ? "Update Staff" : "Save Staff"}
                  </button>

                  {isEditingStaff && modalStaffId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(modalStaffId, staffName)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Staff (स्टाफ हटाएं)</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD ADVANCE */}
        {showAdvanceModal && currentStaff && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-extrabold text-slate-900">Add Loan / Advance</h3>
                <button onClick={() => setShowAdvanceModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1">Advance Amount (₹) *</label>
                  <input 
                    type="number"
                    placeholder="e.g. 2000"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Payment Mode</label>
                  <select
                    value={advancePaymentMode}
                    onChange={(e) => setAdvancePaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="cash">Cash (नकद)</option>
                    <option value="online">Online / UPI</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Notes / Reason</label>
                  <input 
                    type="text"
                    placeholder="e.g. Festival advance / Ration"
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAdvance}
                  className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingAdvance ? "Saving..." : "Save Advance"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
