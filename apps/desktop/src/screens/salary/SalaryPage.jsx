import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Download, Edit, Trash2, Users, DollarSign, 
  CheckCircle, Clock, Calendar, ChevronRight, ChevronLeft, 
  Send, Phone, AlertCircle, RefreshCw, X, Shield, Award, Sparkles
} from "lucide-react";
import api from "../../services/api";

const SalaryPage = () => {
  const [pagarBookMonth, setPagarBookMonth] = useState(new Date().getMonth() + 1);
  const [pagarBookYear, setPagarBookYear] = useState(new Date().getFullYear());
  const [pagarBookData, setPagarBookData] = useState({ staff: [], totalCompanySalaryEarned: 0, totalCompanyAdvanceGiven: 0, totalCompanyNetPayable: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [wageTypeFilter, setWageTypeFilter] = useState("all"); // 'all', 'daily', 'monthly'

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffWageType, setNewStaffWageType] = useState("daily"); // 'daily' or 'monthly'
  const [newStaffSalary, setNewStaffSalary] = useState("");
  const [newStaffMobile, setNewStaffMobile] = useState("");
  const [newStaffPosition, setNewStaffPosition] = useState("Staff / Worker");
  const [newStaffPaidLeaves, setNewStaffPaidLeaves] = useState("0");
  const [newStaffOtRate, setNewStaffOtRate] = useState("");
  const [newStaffSalesTarget, setNewStaffSalesTarget] = useState("");
  const [newStaffCommission, setNewStaffCommission] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // Edit Salary Modal
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [editingStaffTarget, setEditingStaffTarget] = useState(null);
  const [editingWageType, setEditingWageType] = useState("daily");
  const [editingSalaryAmount, setEditingSalaryAmount] = useState("");
  const [editingPaidLeaves, setEditingPaidLeaves] = useState("0");
  const [savingEditSalary, setSavingEditSalary] = useState(false);

  // Quick Action Modal (Advance, OT, Commission)
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionStaffTarget, setActionStaffTarget] = useState(null);
  const [actionType, setActionType] = useState("advance");
  const [actionAmount, setActionAmount] = useState("");
  const [actionHours, setActionHours] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  // Detailed Salary Slip Modal
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState(null);

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

  const handleQuickMarkAttendance = async (staffId, status) => {
    try {
      setPagarBookData(prev => ({
        ...prev,
        staff: (prev.staff || []).map(s => s._id === staffId ? { ...s, todayStatus: status } : s)
      }));

      await api.post("/staff/quick-attendance", {
        staffId,
        status,
        date: new Date()
      });
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert("हाजिरी दर्ज करने में त्रुटि आई।");
    }
  };

  const handleSaveNewStaff = async (e) => {
    if (e) e.preventDefault();
    if (!newStaffName.trim() || !newStaffSalary) {
      alert("कृपया स्टाफ का नाम और वेतन राशि दर्ज करें!");
      return;
    }
    setSavingStaff(true);
    try {
      const payload = {
        name: newStaffName.trim(),
        salary: Number(newStaffSalary),
        wageAmount: Number(newStaffSalary),
        wageType: newStaffWageType,
        paidLeavesAllowed: Number(newStaffPaidLeaves) || 0,
        mobileNumber: newStaffMobile.trim(),
        position: newStaffPosition.trim() || "Worker",
        overtimeRatePerHour: Number(newStaffOtRate) || 0,
        salesTarget: Number(newStaffSalesTarget) || 0,
        commissionPercent: Number(newStaffCommission) || 0
      };

      await api.post("/staff", payload);
      alert(`✅ स्टाफ '${newStaffName}' (${newStaffWageType === 'daily' ? 'दैनिक ₹' + newStaffSalary + '/दिन' : 'मासिक ₹' + newStaffSalary + '/माह'}) सफलतापूर्वक जुड़ गया!`);

      setNewStaffName("");
      setNewStaffSalary("");
      setNewStaffMobile("");
      setNewStaffPosition("Staff / Worker");
      setNewStaffWageType("daily");
      setNewStaffPaidLeaves("0");
      setNewStaffOtRate("");
      setNewStaffSalesTarget("");
      setNewStaffCommission("");
      setShowAddStaffModal(false);
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to save staff:", err);
      alert(err.response?.data?.error || "स्टाफ सेव करने में त्रुटि आई।");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleUpdateStaffSalary = async (e) => {
    if (e) e.preventDefault();
    if (!editingStaffTarget || !editingSalaryAmount || Number(editingSalaryAmount) <= 0) {
      alert("कृपया सही वेतन राशि दर्ज करें!");
      return;
    }
    setSavingEditSalary(true);
    try {
      const payload = {
        salary: Number(editingSalaryAmount),
        wageAmount: Number(editingSalaryAmount),
        wageType: editingWageType,
        paidLeavesAllowed: Number(editingPaidLeaves) || 0
      };

      await api.put(`/staff/${editingStaffTarget._id}`, payload);
      alert(`✅ ${editingStaffTarget.name} का वेतन ${editingWageType === 'daily' ? 'दैनिक ₹' + editingSalaryAmount + '/दिन' : 'मासिक ₹' + editingSalaryAmount + '/माह'} पर अपडेट हो गया!`);

      setShowEditSalaryModal(false);
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to update salary:", err);
      alert("वेतन अपडेट करने में त्रुटि आई।");
    } finally {
      setSavingEditSalary(false);
    }
  };

  const handleSaveAction = async (e) => {
    if (e) e.preventDefault();
    if (!actionStaffTarget) return;

    setSavingAction(true);
    try {
      if (actionType === "advance") {
        if (!actionAmount || Number(actionAmount) <= 0) {
          alert("कृपया सही एडवांस राशि दर्ज करें!");
          return;
        }
        await api.post("/staff/advance", {
          staffId: actionStaffTarget._id,
          amount: Number(actionAmount),
          notes: actionNotes.trim() || "Advance Payment",
          date: new Date()
        });
        alert(`💵 ₹${actionAmount} एडवांस दर्ज हो गया!`);
      } else if (actionType === "overtime") {
        await api.post("/staff/overtime", {
          staffId: actionStaffTarget._id,
          hours: Number(actionHours) || 0,
          amount: Number(actionAmount) || 0,
          notes: actionNotes.trim() || `Overtime ${actionHours} hrs`,
          date: new Date()
        });
        alert(`⏱️ ओवरटाइम दर्ज हो गया!`);
      } else if (actionType === "commission") {
        if (!actionAmount || Number(actionAmount) <= 0) {
          alert("कृपया सही कमीशन राशि दर्ज करें!");
          return;
        }
        await api.post("/staff/commission", {
          staffId: actionStaffTarget._id,
          amount: Number(actionAmount),
          notes: actionNotes.trim() || "Sales Commission",
          date: new Date()
        });
        alert(`🎯 कमीशन दर्ज हो गया!`);
      }

      setShowActionModal(false);
      setActionAmount("");
      setActionHours("");
      setActionNotes("");
      fetchData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Action error:", err);
      alert("एंट्री दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingAction(false);
    }
  };

  const handleShareWhatsApp = (staff) => {
    if (!staff) return;
    const monthNames = ["", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
    const mName = monthNames[pagarBookMonth] || ("Month " + pagarBookMonth);

    const wageLabel = staff.isDaily 
      ? ("📆 दैनिक दर: ₹" + staff.perDaySalary + "/दिन")
      : ("📅 मासिक मूल वेतन: ₹" + (staff.baseSalary || 0).toLocaleString('en-IN') + " (@ ₹" + staff.perDaySalary + "/दिन)");

    const lines = [
      "*📄 वेतन पर्ची / SALARY SLIP*",
      "--------------------------------",
      "👤 *स्टाफ नाम:* " + staff.name,
      "📅 *माह:* " + mName + " " + pagarBookYear + " (कुल " + staff.daysInMonth + " दिन)",
      "💰 *वेतन प्रकार:* " + wageLabel,
      "--------------------------------",
      "🟢 *उपस्थित दिन (P):* " + staff.presentCount + " दिन",
      "🟡 *हाफ डे (HT):* " + staff.halfDayCount + " दिन",
      "🔴 *ली गई छुट्टियां (A):* " + staff.absentCount + " दिन" + (staff.paidLeavesBenefited > 0 ? (" (🎁 " + staff.paidLeavesBenefited + " दिन बिना वेतन कटे सवेतन अवकाश)") : ""),
      "⚡ *कुल देय दिन (Payable Days):* " + staff.payableDays + " दिन",
      "--------------------------------",
      "💵 *बनी हुई सैलरी:* ₹" + (staff.earnedSalary || 0).toLocaleString('en-IN'),
      (staff.otEarnings > 0 ? ("⏱️ *ओवरटाइम:* +₹" + staff.otEarnings.toLocaleString('en-IN')) : null),
      (staff.commEarnings > 0 ? ("🎯 *कमीशन:* +₹" + staff.commEarnings.toLocaleString('en-IN')) : null),
      "💸 *लिया गया एडवांस:* -₹" + (staff.totalAdvance || 0).toLocaleString('en-IN'),
      "--------------------------------",
      "⚖️ *शुद्ध देय बाकी वेतन (Net Payable):* *₹" + (staff.netPayable || 0).toLocaleString('en-IN') + "*",
      "--------------------------------",
      "_धन्यवाद!_"
    ].filter(Boolean).join(String.fromCharCode(10));

    const cleanPhone = (staff.mobileNumber || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '';
    const whatsappUrl = phoneParam 
      ? ("https://api.whatsapp.com/send?phone=91" + phoneParam + "&text=" + encodeURIComponent(lines))
      : ("https://api.whatsapp.com/send?text=" + encodeURIComponent(lines));
    
    window.open(whatsappUrl, '_blank');
  };

  const monthNames = ["", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

  const filteredStaff = (pagarBookData.staff || []).filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.mobileNumber || '').includes(searchTerm);
    const matchesWage = wageTypeFilter === 'all' || (wageTypeFilter === 'daily' ? s.isDaily : !s.isDaily);
    return matchesSearch && matchesWage;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            👔 स्टाफ वेतन व हाजिरी (PagarBook Engine)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            दैनिक दर (₹/दिन) या मासिक वेतन, सवेतन अवकाश (Paid Leaves) व 1-क्लिक हाजिरी प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                let newM = pagarBookMonth - 1;
                let newY = pagarBookYear;
                if (newM < 1) { newM = 12; newY -= 1; }
                setPagarBookMonth(newM);
                setPagarBookYear(newY);
              }}
              className="px-2 py-1 hover:bg-white rounded-lg transition"
            >
              ◀
            </button>
            <span className="px-3 text-slate-800">
              📅 {monthNames[pagarBookMonth]} {pagarBookYear}
            </span>
            <button
              onClick={() => {
                let newM = pagarBookMonth + 1;
                let newY = pagarBookYear;
                if (newM > 12) { newM = 1; newY += 1; }
                setPagarBookMonth(newM);
                setPagarBookYear(newY);
              }}
              className="px-2 py-1 hover:bg-white rounded-lg transition"
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus size={16} /> + नया स्टाफ जोड़ें
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">कुल सक्रिय स्टाफ</span>
          <div className="text-2xl font-black text-slate-900">{pagarBookData.totalStaffCount || (pagarBookData.staff || []).length} सदस्य</div>
          <span className="text-[10px] text-slate-400">माह के कुल {pagarBookData.daysInMonth || 30} दिन</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
          <span className="text-xs font-bold text-indigo-600">💰 कुल बनी सैलरी (Earned)</span>
          <div className="text-2xl font-black text-indigo-950">₹ {(pagarBookData.totalCompanySalaryEarned || 0).toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-indigo-400">काम किए दिन + सवेतन छुट्टी अनुसार</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-600">💸 दिया गया एडवांस (Advances)</span>
          <div className="text-2xl font-black text-rose-950">₹ {(pagarBookData.totalCompanyAdvanceGiven || 0).toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-rose-400">माह में बीच-बीच में ली गई राशि</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-2xl text-white shadow-md space-y-1">
          <span className="text-xs font-bold text-emerald-300">⚖️ कुल बाकी देय वेतन (Net Due)</span>
          <div className="text-2xl font-black text-emerald-300">₹ {(pagarBookData.totalCompanyNetPayable || 0).toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-slate-300">शुद्ध देय राशि</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="स्टाफ नाम या मोबाइल नंबर से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
          />
        </div>

        {/* Wage Filter Switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setWageTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
          >
            सभी ({pagarBookData.staff?.length || 0})
          </button>
          <button
            onClick={() => setWageTypeFilter("daily")}
            className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "daily" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500"}`}
          >
            📆 दैनिक वेतन ({pagarBookData.staff?.filter(s => s.isDaily).length || 0})
          </button>
          <button
            onClick={() => setWageTypeFilter("monthly")}
            className={`px-3 py-1.5 rounded-lg transition ${wageTypeFilter === "monthly" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500"}`}
          >
            📅 मासिक वेतन ({pagarBookData.staff?.filter(s => !s.isDaily).length || 0})
          </button>
        </div>
      </div>

      {/* Staff Master Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">लोड हो रहा है...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <p className="font-bold text-slate-600">कोई स्टाफ नहीं मिला</p>
            <p className="text-xs text-slate-400">ऊपर '+ नया स्टाफ जोड़ें' बटन से दैनिक या मासिक वेतन वाला स्टाफ जोड़ें</p>
          </div>
        ) : (
          filteredStaff.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-indigo-200 transition">
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-slate-900">{s.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${s.isDaily ? "bg-amber-100 text-amber-900" : "bg-indigo-100 text-indigo-900"}`}>
                      {s.isDaily ? "📆 दैनिक वेतन (Daily Wage)" : "📅 मासिक वेतन (Monthly)"}
                    </span>
                    {s.allowedPaidLeaves > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        🎁 {s.allowedPaidLeaves} दिन सवेतन छुट्टी
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>दर: <strong className="text-slate-900">{s.isDaily ? `₹${s.perDaySalary}/दिन` : `₹${(s.baseSalary || 0).toLocaleString('en-IN')}/माह (@ ₹${s.perDaySalary}/दिन)`}</strong></span>
                    <button
                      onClick={() => {
                        setEditingStaffTarget(s);
                        setEditingWageType(s.isDaily ? "daily" : "monthly");
                        setEditingSalaryAmount(s.baseSalary || s.wageAmount || 0);
                        setEditingPaidLeaves(String(s.allowedPaidLeaves || 0));
                        setShowEditSalaryModal(true);
                      }}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-bold text-[10px] border border-amber-200 cursor-pointer"
                    >
                      ✏️ दर सेट / बदलें
                    </button>
                    {s.mobileNumber && <span>• 📞 {s.mobileNumber}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedStaffForSlip(s);
                      setShowSlipModal(true);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                  >
                    📄 पूरा हिसाब
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(s)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-200 transition cursor-pointer"
                    title="WhatsApp पर वेतन पर्ची भेजें"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Attendance Stats Counter */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">माह के दिन</span>
                  <span className="font-black text-slate-700">{s.daysInMonth} दिन</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block">🟢 उपस्थित (P)</span>
                  <span className="font-black text-emerald-700">{s.presentCount} दिन</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 block">🟡 हाफ डे (HT)</span>
                  <span className="font-black text-amber-700">{s.halfDayCount} दिन</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 block">🔴 छुट्टी (A)</span>
                  <span className="font-black text-rose-700">{s.absentCount} दिन</span>
                </div>
              </div>

              {/* 3 Attendance Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 block">आज की हाजिरी (1-क्लिक हाजिरी):</span>
                <div className="grid grid-cols-3 gap-2 text-xs font-black">
                  <button
                    onClick={() => handleQuickMarkAttendance(s._id, 'present')}
                    className={`py-2 rounded-xl border transition cursor-pointer ${s.todayStatus === 'present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}`}
                  >
                    🟢 उपस्थित (P)
                  </button>
                  <button
                    onClick={() => handleQuickMarkAttendance(s._id, 'half-day')}
                    className={`py-2 rounded-xl border transition cursor-pointer ${s.todayStatus === 'half-day' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}
                  >
                    🟡 हाफ डे (HT)
                  </button>
                  <button
                    onClick={() => handleQuickMarkAttendance(s._id, 'absent')}
                    className={`py-2 rounded-xl border transition cursor-pointer ${s.todayStatus === 'absent' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'}`}
                  >
                    🔴 छुट्टी (A)
                  </button>
                </div>
              </div>

              {/* Financial Summary Strip */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <div className="text-slate-600 font-bold">
                  देय दिन: <strong className="text-slate-900">{s.payableDays}</strong> • बनी: <strong className="text-indigo-700">₹{(s.earnedSalary || 0).toLocaleString('en-IN')}</strong> • बाकी: <strong className="text-emerald-700 font-black">₹{(s.netPayable || 0).toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActionStaffTarget(s);
                      setActionType("advance");
                      setShowActionModal(true);
                    }}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[10px] border border-rose-200"
                  >
                    💸 + एडवांस
                  </button>
                  <button
                    onClick={() => {
                      setActionStaffTarget(s);
                      setActionType("overtime");
                      setShowActionModal(true);
                    }}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[10px] border border-amber-200"
                  >
                    ⏱️ + OT
                  </button>
                  <button
                    onClick={() => {
                      setActionStaffTarget(s);
                      setActionType("commission");
                      setShowActionModal(true);
                    }}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] border border-emerald-200"
                  >
                    🎯 + कमीशन
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: ADD NEW STAFF (DAILY / MONTHLY BASIS) */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                👤 नया स्टाफ जोड़ें (Add Staff)
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-4">
              {/* Wage Type Switcher */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">वेतन का आधार चुनें (Wage Type) *:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffWageType("daily")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${newStaffWageType === "daily" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📆 दैनिक वेतन (Daily Wage Rate ₹/दिन)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffWageType("monthly")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${newStaffWageType === "monthly" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📅 मासिक वेतन (Monthly Salary ₹/माह)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">स्टाफ का नाम (Staff Name) *</label>
                <input
                  type="text"
                  placeholder="उदा. राहुल शर्मा, मुन्ना कारीगर..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {newStaffWageType === "daily" ? "दैनिक दर (₹/दिन) *" : "मासिक कुल वेतन (₹/माह) *"}
                  </label>
                  <input
                    type="number"
                    placeholder={newStaffWageType === "daily" ? "₹ 500" : "₹ 15000"}
                    value={newStaffSalary}
                    onChange={(e) => setNewStaffSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">मोबाइल नंबर (वैकल्पिक)</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newStaffMobile}
                    onChange={(e) => setNewStaffMobile(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Paid Leaves */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                <label className="text-xs font-black text-emerald-950 block">
                  🎁 सवेतन छुट्टी (महीने में बिना पैसे कटे कितनी छुट्टियां मान्य हैं):
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { val: "0", label: "0 (कोई नहीं)" },
                    { val: "1", label: "1 दिन" },
                    { val: "2", label: "2 दिन" },
                    { val: "4", label: "4 दिन (Weekly)" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setNewStaffPaidLeaves(opt.val)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition ${newStaffPaidLeaves === opt.val ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-emerald-200 text-emerald-900'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">पद / भूमिका</label>
                <input
                  type="text"
                  placeholder="उदा. हेल्पर, कारीगर, सेल्समैन..."
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingStaff}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition"
              >
                {savingStaff ? "सेव हो रहा है..." : "💾 नया स्टाफ सेव करें"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SALARY / DAILY RATE */}
      {showEditSalaryModal && editingStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900">
                💰 वेतन व दैनिक दर बदलें ({editingStaffTarget.name})
              </h3>
              <button onClick={() => setShowEditSalaryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaffSalary} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">वेतन का आधार चुनें:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWageType("daily")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${editingWageType === "daily" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📆 दैनिक दर (₹/दिन)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWageType("monthly")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${editingWageType === "monthly" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📅 मासिक वेतन (₹/माह)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {editingWageType === "daily" ? "दैनिक दर (₹/दिन) *" : "मासिक कुल वेतन (₹/माह) *"}
                </label>
                <input
                  type="number"
                  placeholder={editingWageType === "daily" ? "₹ 500" : "₹ 15000"}
                  value={editingSalaryAmount}
                  onChange={(e) => setEditingSalaryAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* Paid Leaves */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                <label className="text-xs font-black text-emerald-950 block">
                  🎁 सवेतन छुट्टी (महीने में बिना वेतन कटे छुट्टियां):
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { val: "0", label: "0 (कोई नहीं)" },
                    { val: "1", label: "1 दिन" },
                    { val: "2", label: "2 दिन" },
                    { val: "4", label: "4 दिन (Weekly)" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setEditingPaidLeaves(opt.val)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition ${editingPaidLeaves === opt.val ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-emerald-200 text-emerald-900'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEditSalary}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow transition"
              >
                {savingEditSalary ? "सेव हो रहा है..." : "💾 वेतन अपडेट करें"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK ACTION (ADVANCE / OT / COMMISSION) */}
      {showActionModal && actionStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900">
                {actionType === "advance" ? "💸 एडवांस दर्ज करें" : actionType === "overtime" ? "⏱️ ओवरटाइम दर्ज करें" : "🎯 कमीशन दर्ज करें"}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-4">
              {actionType === "overtime" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">घंटे (Hours)</label>
                  <input
                    type="number"
                    placeholder="उदा. 4 घंटे"
                    value={actionHours}
                    onChange={(e) => setActionHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">राशि (₹ Amount) *</label>
                <input
                  type="number"
                  placeholder="₹ 1000"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">विवरण / नोट्स (Notes)</label>
                <input
                  type="text"
                  placeholder="उदा. घर के काम हेतु लिया..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingAction}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition"
              >
                {savingAction ? "सेव हो रहा है..." : "💾 सेव करें"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAILED SALARY SLIP */}
      {showSlipModal && selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{selectedStaffForSlip.name} - पूरा सैलरी हिसाब</h3>
                <p className="text-xs text-slate-500">{selectedStaffForSlip.isDaily ? "📆 दैनिक दर हिसाब (Daily Wage Basis)" : "📅 मासिक वेतन हिसाब (Monthly Fixed Salary)"}</p>
              </div>
              <button onClick={() => setShowSlipModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Attendance Breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-black text-slate-800 block">📊 हाजिरी व सवेतन अवकाश विवरण:</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">माह के दिन</span>
                  <span className="font-black text-slate-800">{selectedStaffForSlip.daysInMonth} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-emerald-600 block">🟢 उपस्थित</span>
                  <span className="font-black text-emerald-700">{selectedStaffForSlip.presentCount} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-amber-600 block">🟡 हाफ डे</span>
                  <span className="font-black text-amber-700">{selectedStaffForSlip.halfDayCount} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-rose-600 block">🔴 छुट्टी</span>
                  <span className="font-black text-rose-700">{selectedStaffForSlip.absentCount} दिन</span>
                </div>
              </div>

              {selectedStaffForSlip.allowedPaidLeaves > 0 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  🎁 <strong>{selectedStaffForSlip.paidLeavesBenefited} दिन सवेतन छुट्टी मिली</strong> (वेतन नहीं कटा)!
                </div>
              )}

              <p className="font-extrabold text-slate-700 bg-white p-2 rounded-xl border border-slate-100">
                ⚡ कुल देय कार्य दिवस: <strong className="text-indigo-700">{selectedStaffForSlip.payableDays} दिन</strong>
              </p>
            </div>

            {/* Calculation Sheet */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <span className="font-black text-indigo-950 block">💰 वेतन गणना:</span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-700">
                  <span>वेतन प्रकार:</span>
                  <span className="font-bold">{selectedStaffForSlip.isDaily ? "📆 दैनिक आधार (Daily Wage)" : "📅 मासिक आधार (Monthly)"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>प्रति दिन दर:</span>
                  <span className="font-bold">₹{selectedStaffForSlip.perDaySalary} / दिन</span>
                </div>
                <div className="flex justify-between text-indigo-900 font-bold border-t border-indigo-100 pt-1">
                  <span>💵 बनी हुई सैलरी ({selectedStaffForSlip.payableDays} दिन × ₹{selectedStaffForSlip.perDaySalary}):</span>
                  <span className="font-black">₹{(selectedStaffForSlip.earnedSalary || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedStaffForSlip.otEarnings > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>⏱️ ओवरटाइम वेतन:</span>
                    <span>+₹{selectedStaffForSlip.otEarnings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedStaffForSlip.commEarnings > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>🎯 कमीशन / इंसेंटिव:</span>
                    <span>+₹{selectedStaffForSlip.commEarnings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>💸 बीच में लिया एडवांस:</span>
                  <span>-₹{(selectedStaffForSlip.totalAdvance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center bg-indigo-600 text-white p-3 rounded-xl font-black text-sm mt-2 shadow-sm">
                  <span>⚖️ शुद्ध देय बाकी वेतन (Net Payable):</span>
                  <span className="text-base">₹{(selectedStaffForSlip.netPayable || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Advance History */}
            <div className="space-y-1 text-xs">
              <span className="font-black text-slate-800 block">📝 एडवांस व लेन-देन पासबुक:</span>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                {(selectedStaffForSlip.transactions || []).length === 0 ? (
                  <p className="text-slate-400 text-center py-2">इस माह कोई अतिरिक्त लेन-देन नहीं है</p>
                ) : (
                  selectedStaffForSlip.transactions.map((t, idx) => (
                    <div key={idx} className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{t.type === 'advance' ? '💸 एडवांस' : t.type === 'overtime' ? '⏱️ OT' : '🎯 कमीशन'}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">{new Date(t.date).toLocaleDateString('en-IN')}</span>
                        {t.notes && <span className="text-[10px] text-slate-500 ml-1.5">({t.notes})</span>}
                      </div>
                      <span className={`font-black ${t.debit > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {t.debit > 0 ? `-₹${t.debit}` : `+₹${t.credit}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => handleShareWhatsApp(selectedStaffForSlip)}
              className="w-full py-3 bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={15} /> WhatsApp पर वेतन पर्ची भेजें
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
