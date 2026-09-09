import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Download, Edit, Trash2, Users, DollarSign, 
  CheckCircle, Clock, Calendar, ChevronRight, ChevronLeft, 
  Send, Phone, AlertCircle, RefreshCw, X, Shield, Award, Sparkles,
  ArrowLeft, FileText, Check, AlertTriangle, Printer
} from "lucide-react";
import api from "../../services/api";

const SalaryPage = () => {
  const [pagarBookMonth, setPagarBookMonth] = useState(new Date().getMonth() + 1);
  const [pagarBookYear, setPagarBookYear] = useState(new Date().getFullYear());
  const [pagarBookData, setPagarBookData] = useState({ 
    staff: [], 
    totalCompanySalaryEarned: 0, 
    totalCompanyAdvanceGiven: 0, 
    totalCompanyNetPayable: 0,
    daysInMonth: 30
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [wageTypeFilter, setWageTypeFilter] = useState("all"); // 'all', 'daily', 'monthly'

  // Dedicated Full Page Navigation: 'list' (Main Dashboard) or 'staff_hub' (Dedicated Staff Page)
  const [activeView, setActiveView] = useState("list"); 
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [staffHubTab, setStaffHubTab] = useState("calendar"); // 'calendar', 'advances', 'salary_slip'

  // Add / Edit Staff Section States
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [monthlySalaryInput, setMonthlySalaryInput] = useState("");
  const [dailyRateInput, setDailyRateInput] = useState("");
  const [activeWageType, setActiveWageType] = useState("daily"); // 'daily' or 'monthly'
  const [staffMobile, setStaffMobile] = useState("");
  const [staffPosition, setStaffPosition] = useState("स्टाफ / कारीगर");
  const [staffPaidLeaves, setStaffPaidLeaves] = useState("0");
  const [staffOtRate, setStaffOtRate] = useState("");
  const [staffSalesTarget, setStaffSalesTarget] = useState("");
  const [staffCommission, setStaffCommission] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // New Advance Entry in Staff Hub
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advancePaymentMode, setAdvancePaymentMode] = useState("cash");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Quick OT / Commission inside Staff Hub
  const [otHours, setOtHours] = useState("");
  const [otRateOverride, setOtRateOverride] = useState("");
  const [savingOt, setSavingOt] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagarBookMonth, pagarBookYear]);

  const fetchData = async (m = pagarBookMonth, y = pagarBookYear) => {
    try {
      setLoading(true);
      const res = await api.get(`/staff/pagarbook-summary?month=${m}&year=${y}`);
      if (res.data && res.data.success) {
        setPagarBookData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch salary data:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentSelectedStaff = (pagarBookData.staff || []).find(s => s._id === selectedStaffId) || null;

  const handleOpenStaffHub = (staff) => {
    setSelectedStaffId(staff._id);
    setActiveView("staff_hub");
    setStaffHubTab("calendar");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveView("list");
    fetchData(pagarBookMonth, pagarBookYear);
  };

  const handleMonthChange = (delta) => {
    let newMonth = pagarBookMonth + delta;
    let newYear = pagarBookYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setPagarBookMonth(newMonth);
    setPagarBookYear(newYear);
  };

  // Mark attendance for any specific day (1..daysInMonth)
  const handleMarkDayAttendance = async (staffId, dayNumber, status) => {
    try {
      // Optimistic update
      setPagarBookData(prev => {
        const updatedStaff = (prev.staff || []).map(s => {
          if (s._id === staffId) {
            const updatedMap = { ...(s.dailyAttendanceMap || {}), [dayNumber]: status };
            return { ...s, dailyAttendanceMap: updatedMap };
          }
          return s;
        });
        return { ...prev, staff: updatedStaff };
      });

      const targetDate = new Date(pagarBookYear, pagarBookMonth - 1, dayNumber, 12, 0, 0);

      await api.post("/staff/quick-attendance", {
        staffId,
        status,
        date: targetDate
      });

      // Refetch full summary to recalculate salaries accurately
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert("हाजिरी दर्ज करने में त्रुटि आई।");
    }
  };

  // Dual salary fields handler: setting monthly salary activates monthly wageType
  const handleMonthlySalaryChange = (val) => {
    setMonthlySalaryInput(val);
    if (val && Number(val) > 0) {
      setActiveWageType("monthly");
      // Optional auto calculation preview: dailyRateInput could stay empty or separate
    }
  };

  // Dual salary fields handler: setting daily rate activates daily wageType
  const handleDailyRateChange = (val) => {
    setDailyRateInput(val);
    if (val && Number(val) > 0) {
      setActiveWageType("daily");
    }
  };

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffName("");
    setMonthlySalaryInput("");
    setDailyRateInput("");
    setActiveWageType("daily");
    setStaffMobile("");
    setStaffPosition("स्टाफ / कारीगर");
    setStaffPaidLeaves("0");
    setStaffOtRate("");
    setStaffSalesTarget("");
    setStaffCommission("");
    setShowAddStaffForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditStaff = (staff) => {
    setEditingStaffId(staff._id);
    setStaffName(staff.name || "");
    if (staff.wageType === "monthly") {
      setMonthlySalaryInput(staff.salary || staff.wageAmount || "");
      setDailyRateInput(staff.dailyRate ? staff.dailyRate : "");
      setActiveWageType("monthly");
    } else {
      setDailyRateInput(staff.dailyRate || staff.wageAmount || staff.salary || "");
      setMonthlySalaryInput(staff.monthlySalary ? staff.monthlySalary : "");
      setActiveWageType("daily");
    }
    setStaffMobile(staff.mobileNumber || "");
    setStaffPosition(staff.position || "स्टाफ / कारीगर");
    setStaffPaidLeaves(String(staff.paidLeavesAllowed || 0));
    setStaffOtRate(staff.overtimeRatePerHour ? String(staff.overtimeRatePerHour) : "");
    setStaffSalesTarget(staff.salesTarget ? String(staff.salesTarget) : "");
    setStaffCommission(staff.commissionPercent ? String(staff.commissionPercent) : "");
    setShowAddStaffForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStaffForm = async (e) => {
    if (e) e.preventDefault();
    if (!staffName.trim()) {
      alert("कृपया स्टाफ का नाम दर्ज करें!");
      return;
    }

    const finalWageType = activeWageType;
    let chosenSalary = 0;
    let dailyRateVal = Number(dailyRateInput) || 0;
    let monthlySalaryVal = Number(monthlySalaryInput) || 0;

    if (finalWageType === "monthly") {
      if (!monthlySalaryVal || monthlySalaryVal <= 0) {
        alert("कृपया मासिक वेतन (Monthly Salary ₹) दर्ज करें!");
        return;
      }
      chosenSalary = monthlySalaryVal;
    } else {
      if (!dailyRateVal || dailyRateVal <= 0) {
        alert("कृपया दैनिक दिहाड़ी दर (Daily Wage ₹) दर्ज करें!");
        return;
      }
      chosenSalary = dailyRateVal;
    }

    setSavingStaff(true);
    try {
      const payload = {
        name: staffName.trim(),
        salary: chosenSalary,
        wageAmount: chosenSalary,
        wageType: finalWageType,
        dailyRate: dailyRateVal,
        monthlySalary: monthlySalaryVal,
        paidLeavesAllowed: Number(staffPaidLeaves) || 0,
        mobileNumber: staffMobile.trim(),
        position: staffPosition.trim() || "स्टाफ",
        overtimeRatePerHour: Number(staffOtRate) || 0,
        salesTarget: Number(staffSalesTarget) || 0,
        commissionPercent: Number(staffCommission) || 0
      };

      if (editingStaffId) {
        await api.put(`/staff/${editingStaffId}`, payload);
        alert(`✅ ${staffName} की जानकारी व वेतन सफलतापूर्वक अपडेट हो गया!`);
      } else {
        await api.post("/staff", payload);
        alert(`✅ नया स्टाफ '${staffName}' सफलतापूर्वक जुड़ गया!`);
      }

      setShowAddStaffForm(false);
      setEditingStaffId(null);
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to save staff:", err);
      alert(err.response?.data?.error || "स्टाफ सेव करने में त्रुटि आई।");
    } finally {
      setSavingStaff(false);
    }
  };

  // Add Advance Handler in Staff Hub
  const handleSaveAdvance = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffId || !advanceAmount || Number(advanceAmount) <= 0) {
      alert("कृपया सही एडवांस राशि दर्ज करें!");
      return;
    }
    setSavingAdvance(true);
    try {
      await api.post("/staff/action", {
        staffId: selectedStaffId,
        type: "advance",
        amount: Number(advanceAmount),
        paymentMode: advancePaymentMode,
        notes: advanceNotes.trim() || "बीच में लिया गया एडवांस",
        date: advanceDate ? new Date(advanceDate) : new Date()
      });

      alert(`✅ ₹${Number(advanceAmount).toLocaleString('en-IN')} का एडवांस दर्ज हो गया!`);
      setAdvanceAmount("");
      setAdvanceNotes("");
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to add advance:", err);
      alert(err.response?.data?.error || "एडवांस दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingAdvance(false);
    }
  };

  // Add Overtime in Staff Hub
  const handleSaveOt = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffId || !otHours || Number(otHours) <= 0) {
      alert("कृपया ओवर-टाइम घंटे दर्ज करें!");
      return;
    }
    setSavingOt(true);
    try {
      await api.post("/staff/action", {
        staffId: selectedStaffId,
        type: "overtime",
        hours: Number(otHours),
        rate: otRateOverride ? Number(otRateOverride) : undefined,
        notes: `ओवर-टाइम ${otHours} घंटे`,
        date: new Date()
      });

      alert(`✅ ${otHours} घंटे का ओवर-टाइम जुड़ गया!`);
      setOtHours("");
      setOtRateOverride("");
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to add OT:", err);
      alert(err.response?.data?.error || "ओवर-टाइम दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingOt(false);
    }
  };

  // WhatsApp Salary Slip Share
  const handleShareWhatsApp = (staff) => {
    if (!staff) return;
    const monthName = new Date(pagarBookYear, pagarBookMonth - 1).toLocaleString('hi-IN', { month: 'long' });
    
    const lines = [
      `*🧾 मासिक वेतन पर्ची (Salary Slip)*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *कर्मचारी:* ${staff.name}`,
      `📱 *मोबाइल:* ${staff.mobileNumber || "N/A"}`,
      `📅 *महीना:* ${monthName} ${pagarBookYear} (कुल दिन: ${staff.daysInMonth || pagarBookData.daysInMonth || 30})`,
      `💼 *वेतन प्रकार:* ${staff.wageType === 'daily' ? `दैनिक दिहाड़ी (₹${staff.dailyRate || staff.wageAmount}/दिन)` : `मासिक वेतन (₹${staff.monthlySalary || staff.salary}/माह)`}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*📊 हाजिरी विवरण:*`,
      `  🟢 पूरे दिन उपस्थित (P): ${staff.presentDays || 0} दिन`,
      `  🟡 हाफ डे (HT): ${staff.halfDays || 0} दिन`,
      `  🔴 अनुपस्थित / छुट्टी (A): ${staff.absentDays || 0} दिन`,
      `  🎁 सवेतन छुट्टी (Paid Leave): ${staff.paidLeavesCount || 0} दिन`,
      `  ✅ कुल वेतन योग्य दिन: ${staff.payableDays || 0} दिन`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*💰 वेतन गणना:*`,
      `  💵 मूल अर्जित वेतन: ₹${(staff.earnedSalary || 0).toLocaleString('en-IN')}`,
      staff.overtimeEarnings > 0 ? `  ⏱️ ओवर-टाइम (${staff.overtimeHours || 0} घंटे): +₹${(staff.overtimeEarnings || 0).toLocaleString('en-IN')}` : null,
      staff.commissionEarnings > 0 ? `  🎯 बिक्री कमीशन / बोनस: +₹${(staff.commissionEarnings || 0).toLocaleString('en-IN')}` : null,
      `  ✨ कुल ग्रॉस वेतन: ₹${(staff.grossSalary || staff.earnedSalary || 0).toLocaleString('en-IN')}`,
      `  💸 बीच में लिया गया एडवांस: -₹${(staff.totalAdvance || 0).toLocaleString('en-IN')}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*💳 शुद्ध देय वेतन (Net Payable): ₹${(staff.netPayable || 0).toLocaleString('en-IN')}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_डिजिटल पगार बुक द्वारा सत्यापित_`
    ].filter(Boolean);

    const fullMessage = lines.join(String.fromCharCode(10));
    const phone = (staff.mobileNumber || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
  };

  const monthName = new Date(pagarBookYear, pagarBookMonth - 1).toLocaleString('hi-IN', { month: 'long' });
  const daysInCurrentMonth = pagarBookData.daysInMonth || 30;

  // Filter staff
  const filteredStaff = (pagarBookData.staff || []).filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.mobileNumber?.includes(searchTerm) ||
                          s.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWage = wageTypeFilter === "all" || s.wageType === wageTypeFilter;
    return matchesSearch && matchesWage;
  });

  // Get day of week name in Hindi
  const getHindiDayName = (year, month, day) => {
    const dayNames = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
    const d = new Date(year, month - 1, day);
    return dayNames[d.getDay()];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-3 md:p-6 pb-24">
      {/* Top Main Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  स्टाफ हाजिरी व पगार खाता (Staff & Salary Hub)
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">2026 Pro</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  दैनिक दिहाड़ी व मासिक वेतन, 30-दिन 1-टैप हाजिरी, एडवांस पासबुक व ऑटो वेतन पर्ची
                </p>
              </div>
            </div>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <button 
              onClick={() => handleMonthChange(-1)} 
              className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition shadow-sm"
              title="पिछला महीना"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 py-1 font-black text-sm md:text-base text-slate-800 flex items-center gap-1.5 min-w-[140px] justify-center">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{monthName} {pagarBookYear}</span>
            </div>
            <button 
              onClick={() => handleMonthChange(1)} 
              className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition shadow-sm"
              title="अगला महीना"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => fetchData(pagarBookMonth, pagarBookYear)}
              className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition"
              title="रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: MAIN STAFF LIST & DASHBOARD (activeView === 'list') */}
      {/* ========================================================================= */}
      {activeView === "list" && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">कुल एक्टिव स्टाफ</span>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl md:text-3xl font-black">{pagarBookData.staff?.length || 0} कर्मचारी</div>
              <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                <span>{pagarBookData.staff?.filter(s => s.wageType === 'daily').length || 0} दिहाड़ी</span>
                <span>•</span>
                <span>{pagarBookData.staff?.filter(s => s.wageType === 'monthly').length || 0} मासिक</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">माह का कुल बना वेतन</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-2xl md:text-3xl font-black">₹{(pagarBookData.totalCompanySalaryEarned || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs opacity-80 mt-1">हाजिरी व काम के अनुसार अर्जित</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">कुल दिया गया एडवांस</span>
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl md:text-3xl font-black">₹{(pagarBookData.totalCompanyAdvanceGiven || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs opacity-80 mt-1">वेतन से काटी जाने वाली राशि</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">कुल शुद्ध देय (Net Payable)</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-2xl md:text-3xl font-black">₹{(pagarBookData.totalCompanyNetPayable || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs opacity-80 mt-1">महीने के अंत में देने योग्य शुद्ध राशि</div>
            </div>
          </div>

          {/* Action Bar: Search, Filters & Add Staff Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="स्टाफ का नाम, मोबाइल नंबर या पद खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Wage Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setWageTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "all" ? "bg-white text-indigo-700 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  सभी ({pagarBookData.staff?.length || 0})
                </button>
                <button
                  onClick={() => setWageTypeFilter("daily")}
                  className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "daily" ? "bg-white text-indigo-700 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  📆 दैनिक दिहाड़ी ({pagarBookData.staff?.filter(s => s.wageType === "daily").length || 0})
                </button>
                <button
                  onClick={() => setWageTypeFilter("monthly")}
                  className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "monthly" ? "bg-white text-indigo-700 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  💵 मासिक वेतन ({pagarBookData.staff?.filter(s => s.wageType === "monthly").length || 0})
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenAddStaff}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition"
            >
              <Plus className="w-5 h-5" />
              <span>+ नया स्टाफ जोड़ें (Add Staff)</span>
            </button>
          </div>

          {/* ADD / EDIT STAFF DEDICATED FORM PANEL */}
          {showAddStaffForm && (
            <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-xl p-5 md:p-7 relative transition-all animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                    {editingStaffId ? "स्टाफ व वेतन विवरण संपादित करें (Edit Staff)" : "नया स्टाफ जोड़ें (Add New Staff)"}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">
                    दोनों अलग-अलग फील्ड उपलब्ध हैं: मासिक वेतन या दैनिक दिहाड़ी दर में से कोई भी भरें
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddStaffForm(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffForm} className="space-y-6">
                {/* Row 1: Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      स्टाफ का पूरा नाम <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="उदा. रमेश कुमार / सोनू"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      मोबाइल नंबर (व्हाट्सएप हेतु - वैकल्पिक)
                    </label>
                    <input 
                      type="text"
                      placeholder="उदा. 9876543210"
                      value={staffMobile}
                      onChange={(e) => setStaffMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      पद / कार्य का प्रकार (Designation)
                    </label>
                    <input 
                      type="text"
                      placeholder="उदा. मास्टर टेलर / हेल्पर / सेल्समैन"
                      value={staffPosition}
                      onChange={(e) => setStaffPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 2: DUAL INDEPENDENT SALARY BOXES (Highlight & Clean Selection) */}
                <div className="bg-indigo-50/70 p-4 md:p-5 rounded-2xl border border-indigo-200">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        वेतन दर निर्धारण (Dual Independent Salary Boxes):
                      </span>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        मासिक या दैनिक में से जिस बॉक्स में राशि भरेंगे, उसी अनुसार ऑटोमैटिक हिसाब होगा:
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-800">
                      <span>सक्रिय मोड:</span>
                      <span className={`px-2 py-0.5 rounded-md ${activeWageType === 'monthly' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {activeWageType === 'monthly' ? '💵 मासिक वेतन' : '📆 दैनिक दिहाड़ी'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Box 1: Monthly Salary */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${activeWageType === 'monthly' ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' : 'bg-white/80 border-slate-200 hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                          <span>💵 मासिक फिक्स वेतन (Monthly Salary ₹)</span>
                        </label>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">मासिक खाता</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                        <input 
                          type="number"
                          placeholder="उदा. 15000"
                          value={monthlySalaryInput}
                          onChange={(e) => handleMonthlySalaryChange(e.target.value)}
                          onFocus={() => setActiveWageType("monthly")}
                          className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        * पूरे 30/31 दिन का फिक्स वेतन। गैर-हाजिरी पर दिन के हिसाब से कटेगा।
                      </p>
                    </div>

                    {/* Box 2: Daily Wage Rate */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${activeWageType === 'daily' ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-100' : 'bg-white/80 border-slate-200 hover:border-emerald-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                          <span>📆 दैनिक दिहाड़ी दर (Daily Wage Rate ₹)</span>
                        </label>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">रोज की दिहाड़ी</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                        <input 
                          type="number"
                          placeholder="उदा. 500"
                          value={dailyRateInput}
                          onChange={(e) => handleDailyRateChange(e.target.value)}
                          onFocus={() => setActiveWageType("daily")}
                          className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        * जितने दिन आएगा (उपस्थित x दिहाड़ी + हाफडे x आधा) उतना वेतन बनेगा।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 3: Paid Leaves, OT & Sales Commission */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Paid Leaves Allowed */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      माह में सवेतन छुट्टी (Paid Leaves Allowance)
                    </label>
                    <select
                      value={staffPaidLeaves}
                      onChange={(e) => setStaffPaidLeaves(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="0">0 दिन (कोई फ्री छुट्टी नहीं - हर अनुपस्थिति पर कटेगा)</option>
                      <option value="1">1 दिन फ्री छुट्टी (1 दिन बिना वेतन काटे)</option>
                      <option value="2">2 दिन फ्री छुट्टी (2 दिन बिना वेतन काटे - सुविधानुसार)</option>
                      <option value="3">3 दिन फ्री छुट्टी (3 दिन बिना वेतन काटे)</option>
                      <option value="4">4 दिन फ्री छुट्टी (4 दिन बिना वेतन काटे / साप्ताहिक)</option>
                    </select>
                    <p className="text-[11px] text-amber-700 mt-1">
                      * छुट्टी लेने पर इतने दिनों का वेतन नहीं कटेगा।
                    </p>
                  </div>

                  {/* Overtime Rate */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ओवर-टाइम दर (₹ प्रति घंटा)
                    </label>
                    <input 
                      type="number"
                      placeholder="उदा. 60"
                      value={staffOtRate}
                      onChange={(e) => setStaffOtRate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      * खाली छोड़ने पर सामान्य दर लागू होगी
                    </p>
                  </div>

                  {/* Commission / Target */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      बिक्री कमीशन (Commission % on Sales)
                    </label>
                    <input 
                      type="number"
                      placeholder="उदा. 2% या 5%"
                      value={staffCommission}
                      onChange={(e) => setStaffCommission(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      * टारगेट पूरा होने पर इंसेंटिव
                    </p>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffForm(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-600 hover:bg-slate-100 transition"
                  >
                    रद्द करें (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingStaff ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingStaffId ? "स्टाफ अपडेट करें (Update Staff)" : "स्टाफ सुरक्षित करें (Save Staff)"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STAFF LISTING CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>कर्मचारी सूची व त्वरित हाजिरी</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{filteredStaff.length}</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                👉 किसी भी स्टाफ के कार्ड पर क्लिक करके उसका पूरा 30-दिन कैलेंडर व हिसाब खोलें
              </span>
            </div>

            {loading && filteredStaff.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                <p className="text-sm font-bold text-slate-600">स्टाफ व वेतन डेटा लोड हो रहा है...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">कोई स्टाफ नहीं मिला</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  अपने कारीगरों, हेल्परों और सेल्स कर्मचारियों को जोड़ें और आसानी से हाजिरी व वेतन प्रबंधित करें।
                </p>
                <button
                  onClick={handleOpenAddStaff}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  + नया स्टाफ जोड़ें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStaff.map((staff) => {
                  const todayDayNum = new Date().getDate();
                  const todayStatus = staff.dailyAttendanceMap?.[todayDayNum] || staff.todayStatus || 'none';

                  return (
                    <div 
                      key={staff._id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition p-4 md:p-5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Card Top: Staff Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg border border-indigo-200">
                              {staff.name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900">{staff.name}</h3>
                                {staff.wageType === "daily" ? (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                                    📆 दैनिक: ₹{staff.dailyRate || staff.wageAmount}/दिन
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                                    💵 मासिक: ₹{staff.monthlySalary || staff.salary}/माह
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                <span>{staff.position || "स्टाफ"}</span>
                                {staff.mobileNumber && <span>• 📱 {staff.mobileNumber}</span>}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenEditStaff(staff)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="स्टाफ विवरण बदलें"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bracket Counters Banner (As requested by User!) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 text-[11px] font-bold text-slate-700 flex flex-wrap items-center gap-1.5">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            [ 🟢 उपस्थित: {staff.presentDays || 0} दिन ]
                          </span>
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            [ 🟡 हाफ डे: {staff.halfDays || 0} दिन ]
                          </span>
                          <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                            [ 🔴 छुट्टी: {staff.absentDays || 0} दिन ]
                          </span>
                          {staff.paidLeavesCount > 0 && (
                            <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                              [ 🎁 सवेतन: {staff.paidLeavesCount} दिन ]
                            </span>
                          )}
                        </div>

                        {/* Today Attendance Quick Bar */}
                        <div className="mb-4 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              आज की हाजिरी ({todayDayNum} {monthName}):
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              {todayStatus === 'present' ? '🟢 उपस्थित' : todayStatus === 'half_day' ? '🟡 हाफ डे' : todayStatus === 'absent' ? '🔴 अनुपस्थित' : '⚪ बाकी'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleMarkDayAttendance(staff._id, todayDayNum, "present")}
                              className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                                todayStatus === "present"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              <span>🟢 उपस्थित</span>
                            </button>
                            <button
                              onClick={() => handleMarkDayAttendance(staff._id, todayDayNum, "half_day")}
                              className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                                todayStatus === "half_day"
                                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            >
                              <span>🟡 हाफ डे</span>
                            </button>
                            <button
                              onClick={() => handleMarkDayAttendance(staff._id, todayDayNum, "absent")}
                              className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                                todayStatus === "absent"
                                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              <span>🔴 छुट्टी</span>
                            </button>
                          </div>
                        </div>

                        {/* Salary Summary Row */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl text-center mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 block">बना वेतन</span>
                            <span className="text-xs font-black text-slate-900">₹{(staff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">एडवांस कटा</span>
                            <span className="text-xs font-black text-amber-600">-₹{(staff.totalAdvance || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">शुद्ध बाकी</span>
                            <span className="text-xs font-black text-emerald-700">₹{(staff.netPayable || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Open Full Hub Button */}
                      <button
                        onClick={() => handleOpenStaffHub(staff)}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 group-hover:scale-[1.01]"
                      >
                        <span>👉 पूरा 30-दिन कैलेंडर व हिसाब खोलें (Open Staff Hub)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: DEDICATED FULL-PAGE STAFF HUB (activeView === 'staff_hub')      */}
      {/* ========================================================================= */}
      {activeView === "staff_hub" && currentSelectedStaff && (
        <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">
          {/* Top Bar with Back Button & Staff Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToList}
                  className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>वापस स्टाफ लिस्ट</span>
                </button>

                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {currentSelectedStaff.name?.charAt(0) || "S"}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">{currentSelectedStaff.name}</h2>
                    {currentSelectedStaff.wageType === "daily" ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        📆 दैनिक दिहाड़ी दर: ₹{currentSelectedStaff.dailyRate || currentSelectedStaff.wageAmount}/दिन
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                        💵 मासिक वेतन: ₹{currentSelectedStaff.monthlySalary || currentSelectedStaff.salary}/माह
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-3 mt-1">
                    <span>{currentSelectedStaff.position || "स्टाफ"}</span>
                    {currentSelectedStaff.mobileNumber && <span>• 📱 {currentSelectedStaff.mobileNumber}</span>}
                    <span>• 🎁 सवेतन छुट्टी छूट: {currentSelectedStaff.paidLeavesAllowed || 0} दिन</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Slip & Print */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(currentSelectedStaff)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>व्हाट्सएप वेतन पर्ची</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट</span>
                </button>
              </div>
            </div>

            {/* TOP BRACKET COUNTERS BANNER (Requested by User) */}
            <div className="mt-5 p-3.5 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm font-black shadow-inner">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-indigo-300">[ 📅 माह के कुल दिन: {daysInCurrentMonth} ]</span>
                <span className="text-emerald-400">[ 🟢 उपस्थित: {currentSelectedStaff.presentDays || 0} दिन ]</span>
                <span className="text-amber-400">[ 🟡 हाफ डे: {currentSelectedStaff.halfDays || 0} दिन ]</span>
                <span className="text-rose-400">[ 🔴 छुट्टी: {currentSelectedStaff.absentDays || 0} दिन ]</span>
                {currentSelectedStaff.paidLeavesCount > 0 && (
                  <span className="text-purple-300">[ 🎁 सवेतन: {currentSelectedStaff.paidLeavesCount} दिन ]</span>
                )}
              </div>
              <div className="text-emerald-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                <span>[ 💳 शुद्ध बाकी: ₹{(currentSelectedStaff.netPayable || 0).toLocaleString('en-IN')} ]</span>
              </div>
            </div>

            {/* SUB-TABS NAVIGATION (Calendar, Advances, Salary Slip) */}
            <div className="mt-5 flex border-b border-slate-200">
              <button
                onClick={() => setStaffHubTab("calendar")}
                className={`py-3 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition ${
                  staffHubTab === "calendar" 
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>1. तारीखवार हाजिरी कैलेंडर (Daily Calendar)</span>
              </button>

              <button
                onClick={() => setStaffHubTab("advances")}
                className={`py-3 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition ${
                  staffHubTab === "advances" 
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>2. बीच में लिया एडवांस (Advance Passbook)</span>
              </button>

              <button
                onClick={() => setStaffHubTab("salary_slip")}
                className={`py-3 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition ${
                  staffHubTab === "salary_slip" 
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>3. वेतन पर्ची व पूरा हिसाब (Salary Slip)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-TAB 1: DAILY ATTENDANCE CALENDAR (1..daysInMonth with 3 Buttons Each)  */}
          {/* ========================================================================= */}
          {staffHubTab === "calendar" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>{monthName} {pagarBookYear} - दैनिक 30-दिन हाजिरी कैलेंडर</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    किसी भी दिन यदि हाजिरी नहीं लग पाई हो, तो मालिक कभी भी उस दिन के बटन पर क्लिक करके हाजिरी बदल सकते हैं।
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> उपस्थित (P)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> हाफ डे (HT)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> छुट्टी (A)</span>
                </div>
              </div>

              {/* Day-by-Day Calendar Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((dayNum) => {
                  const status = currentSelectedStaff.dailyAttendanceMap?.[dayNum] || "none";
                  const hindiDay = getHindiDayName(pagarBookYear, pagarBookMonth, dayNum);
                  const isSunday = hindiDay === "रवि";
                  const isToday = new Date().getDate() === dayNum && 
                                  new Date().getMonth() + 1 === pagarBookMonth && 
                                  new Date().getFullYear() === pagarBookYear;

                  return (
                    <div 
                      key={dayNum}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        isToday 
                          ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200 shadow-sm" 
                          : isSunday 
                            ? "bg-rose-50/30 border-rose-200" 
                            : status === "present"
                              ? "bg-emerald-50/30 border-emerald-200"
                              : status === "half_day"
                                ? "bg-amber-50/30 border-amber-200"
                                : status === "absent"
                                  ? "bg-rose-50/40 border-rose-200"
                                  : "bg-slate-50/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            isToday ? "bg-indigo-600 text-white" : isSunday ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-800"
                          }`}>
                            {dayNum < 10 ? `0${dayNum}` : dayNum}
                          </span>
                          <div>
                            <span className="text-xs font-black text-slate-800">{hindiDay}वार</span>
                            <span className="text-[10px] text-slate-400 block">{dayNum} {monthName}</span>
                          </div>
                        </div>

                        {/* Status Label Badge */}
                        <div>
                          {isToday && (
                            <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full mr-1">
                              आज
                            </span>
                          )}
                          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                            status === "present" 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : status === "half_day"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : status === "absent"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-slate-100 text-slate-400"
                          }`}>
                            {status === "present" ? "🟢 उपस्थित" : status === "half_day" ? "🟡 हाफ डे" : status === "absent" ? "🔴 अनुपस्थित" : "⚪ बाकी"}
                          </span>
                        </div>
                      </div>

                      {/* 3 Dedicated 1-Tap Buttons */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleMarkDayAttendance(currentSelectedStaff._id, dayNum, "present")}
                          className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-0.5 border ${
                            status === "present"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-emerald-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                        >
                          <span>🟢 P</span>
                        </button>

                        <button
                          onClick={() => handleMarkDayAttendance(currentSelectedStaff._id, dayNum, "half_day")}
                          className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-0.5 border ${
                            status === "half_day"
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                              : "bg-white text-amber-800 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                          }`}
                        >
                          <span>🟡 HT</span>
                        </button>

                        <button
                          onClick={() => handleMarkDayAttendance(currentSelectedStaff._id, dayNum, "absent")}
                          className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-0.5 border ${
                            status === "absent"
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-white text-rose-800 border-slate-200 hover:bg-rose-50 hover:border-rose-300"
                          }`}
                        >
                          <span>🔴 A</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: ADVANCES PASSBOOK & INTERMEDIATE PAYMENTS                      */}
          {/* ========================================================================= */}
          {staffHubTab === "advances" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Add New Advance Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black text-slate-900">+ नया एडवांस / बीच में पेमेंट दर्ज करें</h3>
                </div>

                <form onSubmit={handleSaveAdvance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      एडवांस राशि (Amount ₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                      <input 
                        type="number"
                        placeholder="उदा. 2000"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        required
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">भुगतान तारीख</label>
                    <input 
                      type="date"
                      value={advanceDate}
                      onChange={(e) => setAdvanceDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">भुगतान माध्यम (Payment Mode)</label>
                    <select
                      value={advancePaymentMode}
                      onChange={(e) => setAdvancePaymentMode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="cash">💵 नकद (Cash)</option>
                      <option value="online">📱 ऑनलाइन / UPI (GPay/PhonePe)</option>
                      <option value="bank">🏦 बैंक ट्रांसफर (Bank)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">टिप्पणी / विवरण (Notes)</label>
                    <input 
                      type="text"
                      placeholder="उदा. घर खर्च हेतु / त्योहार एडवांस"
                      value={advanceNotes}
                      onChange={(e) => setAdvanceNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingAdvance}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-amber-100 flex items-center justify-center gap-2"
                  >
                    {savingAdvance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>एडवांस सुरक्षित करें (Save Advance)</span>
                  </button>
                </form>

                {/* Overtime Form Section */}
                <div className="pt-4 border-t border-slate-200 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-800">+ ओवर-टाइम (OT) दर्ज करें</h4>
                  </div>
                  <form onSubmit={handleSaveOt} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">घंटे (Hours)</label>
                        <input 
                          type="number"
                          placeholder="उदा. 4"
                          value={otHours}
                          onChange={(e) => setOtHours(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">दर (₹/घंटा - ऐच्छिक)</label>
                        <input 
                          type="number"
                          placeholder={currentSelectedStaff.overtimeRatePerHour ? `₹${currentSelectedStaff.overtimeRatePerHour}` : "दर"}
                          value={otRateOverride}
                          onChange={(e) => setOtRateOverride(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingOt}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      {savingOt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>ओवर-टाइम जोड़ें</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Advances History Passbook Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">इस माह का एडवांस लेजर (Advance Passbook)</h3>
                    <p className="text-xs text-slate-500 font-medium">{monthName} {pagarBookYear} में लिए गए अग्रिम भुगतान</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">कुल एडवांस लिया गया</span>
                    <span className="text-lg font-black text-amber-600">₹{(currentSelectedStaff.totalAdvance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {(!currentSelectedStaff.advancesList || currentSelectedStaff.advancesList.length === 0) ? (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
                    <p className="text-xs font-bold">इस माह में अभी तक कोई एडवांस नहीं लिया गया है।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <th className="p-3 font-bold">तारीख</th>
                          <th className="p-3 font-bold">राशि (₹)</th>
                          <th className="p-3 font-bold">माध्यम</th>
                          <th className="p-3 font-bold">विवरण / नोट्स</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSelectedStaff.advancesList.map((adv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">
                              {new Date(adv.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-3 font-black text-amber-600">
                              ₹{Number(adv.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                {adv.paymentMode === 'online' ? '📱 UPI' : adv.paymentMode === 'bank' ? '🏦 बैंक' : '💵 नकद'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              {adv.notes || "एडवांस भुगतान"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 3: SALARY SLIP & NET CALCULATION                                  */}
          {/* ========================================================================= */}
          {staffHubTab === "salary_slip" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-8 max-w-4xl mx-auto space-y-6">
              {/* Slip Header */}
              <div className="text-center pb-6 border-b-2 border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mx-auto mb-2 shadow-md">
                  ₹
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  मासिक वेतन पर्ची व पूरा हिसाब (Salary Statement)
                </h2>
                <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">
                  माह: {monthName} {pagarBookYear} • कुल माह दिन: {daysInCurrentMonth} दिन
                </p>
              </div>

              {/* Staff Details Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">कर्मचारी का नाम:</span>
                  <span className="font-black text-slate-900 text-sm">{currentSelectedStaff.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">पद / Designation:</span>
                  <span className="font-bold text-slate-800">{currentSelectedStaff.position || "स्टाफ"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">मोबाइल नंबर:</span>
                  <span className="font-bold text-slate-800">{currentSelectedStaff.mobileNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">वेतन प्रकार दर:</span>
                  <span className="font-black text-indigo-700">
                    {currentSelectedStaff.wageType === 'daily' 
                      ? `दैनिक ₹${currentSelectedStaff.dailyRate || currentSelectedStaff.wageAmount}/दिन`
                      : `मासिक ₹${currentSelectedStaff.monthlySalary || currentSelectedStaff.salary}/माह`}
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">हाजिरी सारांश:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-800 block">🟢 उपस्थित दिन (Full Day)</span>
                    <span className="text-lg font-black text-emerald-900">{currentSelectedStaff.presentDays || 0} दिन</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <span className="text-[11px] font-bold text-amber-800 block">🟡 हाफ डे (Half Day)</span>
                    <span className="text-lg font-black text-amber-900">{currentSelectedStaff.halfDays || 0} दिन</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-800 block">🔴 अनुपस्थित / छुट्टी</span>
                    <span className="text-lg font-black text-rose-900">{currentSelectedStaff.absentDays || 0} दिन</span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                    <span className="text-[11px] font-bold text-purple-800 block">🎁 सवेतन छुट्टी छूट</span>
                    <span className="text-lg font-black text-purple-900">{currentSelectedStaff.paidLeavesCount || 0} दिन</span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Salary Calculation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="p-3">विवरण (Description)</th>
                      <th className="p-3 text-right">गणना (Calculation)</th>
                      <th className="p-3 text-right">राशि (Amount ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-800">
                        मूल अर्जित वेतन (Basic Earned Salary)
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {currentSelectedStaff.wageType === 'daily' 
                            ? `(${currentSelectedStaff.payableDays || 0} दिन x ₹${currentSelectedStaff.dailyRate || currentSelectedStaff.wageAmount})`
                            : `(मासिक ₹${currentSelectedStaff.monthlySalary || currentSelectedStaff.salary} / ${daysInCurrentMonth} दिन x ${currentSelectedStaff.payableDays || 0} दिन)`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-600">
                        {currentSelectedStaff.payableDays || 0} दिन
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        ₹{(currentSelectedStaff.earnedSalary || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {currentSelectedStaff.overtimeEarnings > 0 && (
                      <tr className="bg-indigo-50/30">
                        <td className="p-3 font-bold text-indigo-900">
                          ⏱️ ओवर-टाइम अतिरिक्त कमाई
                          <span className="block text-[10px] text-indigo-500 font-normal">
                            ({currentSelectedStaff.overtimeHours || 0} घंटे @ ₹{currentSelectedStaff.overtimeRatePerHour || 0}/घंटा)
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-indigo-700">
                          +{currentSelectedStaff.overtimeHours || 0} hrs
                        </td>
                        <td className="p-3 text-right font-black text-indigo-700">
                          +₹{(currentSelectedStaff.overtimeEarnings || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    {currentSelectedStaff.commissionEarnings > 0 && (
                      <tr className="bg-emerald-50/30">
                        <td className="p-3 font-bold text-emerald-900">
                          🎯 बिक्री इंसेंटिव / कमीशन
                          <span className="block text-[10px] text-emerald-600 font-normal">
                            (टारगेट उपलब्धि पर कमीशन)
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-700">
                          {currentSelectedStaff.commissionPercent || 0}%
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          +₹{(currentSelectedStaff.commissionEarnings || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-50 font-black">
                      <td className="p-3 text-slate-900">✨ कुल ग्रॉस वेतन (Gross Salary)</td>
                      <td className="p-3 text-right text-slate-500">-</td>
                      <td className="p-3 text-right text-slate-900 text-sm">
                        ₹{(currentSelectedStaff.grossSalary || currentSelectedStaff.earnedSalary || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    <tr className="text-amber-700">
                      <td className="p-3 font-bold">
                        💸 माह में लिया गया कुल एडवांस कटौती (Advance Deducted)
                        <span className="block text-[10px] text-amber-500 font-normal">
                          (वेतन से काटी जाने वाली अग्रिम राशि)
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">-</td>
                      <td className="p-3 text-right font-black">
                        -₹{(currentSelectedStaff.totalAdvance || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    <tr className="bg-emerald-600 text-white font-black text-sm">
                      <td className="p-4 rounded-bl-xl">💳 कुल शुद्ध देय वेतन (Net Payable Amount)</td>
                      <td className="p-4 text-right">-</td>
                      <td className="p-4 text-right text-base rounded-br-xl">
                        ₹{(currentSelectedStaff.netPayable || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions inside Slip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleBackToList}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  ← वापस स्टाफ लिस्ट
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleShareWhatsApp(currentSelectedStaff)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-100 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>व्हाट्सएप पर भेजें (WhatsApp Slip)</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>प्रिंट पर्ची</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
