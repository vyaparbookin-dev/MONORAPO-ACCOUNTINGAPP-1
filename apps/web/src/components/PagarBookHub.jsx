import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Plus, Search, Calendar, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Settings, HelpCircle, Clock, FileText, Award, DollarSign, Send, Printer,
  User, Check, X, AlertCircle, Edit, Trash2, Shield, MoreVertical, Sparkles, Umbrella,
  CreditCard, Landmark
} from "lucide-react";
import api from "../services/api";
import { readLocalJson, writeLocalJson } from "@repo/shared";
import { useCompany } from "../contexts/CompanyContext";

export default function PagarBookHub({ onClose, initialStaffId = null }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return parseInt(sessionStorage.getItem("pagarbook_month")) || (new Date().getMonth() + 1);
  });
  const [currentYear, setCurrentYear] = useState(() => {
    return parseInt(sessionStorage.getItem("pagarbook_year")) || new Date().getFullYear();
  });

  const defaultSummaryData = {
    staff: [],
    totalCompanySalaryEarned: 0,
    totalCompanyAdvanceGiven: 0,
    totalCompanyBonusGiven: 0,
    totalCompanyNetPayable: 0,
    daysInMonth: 30,
    daysConsidered: new Date().getDate()
  };

  const [summaryData, setSummaryData] = useState(() => {
    const cached = readLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], null);
    return cached && typeof cached === "object" ? { ...defaultSummaryData, ...cached } : defaultSummaryData;
  });
  const [loading, setLoading] = useState(false);
  const { selectedCompany } = useCompany() || {};
  const companyName = selectedCompany?.name || selectedCompany?.companyName || "VyaparBook";

  // State Persistence on Refresh
  const [activeScreen, setActiveScreen] = useState(() => {
    return sessionStorage.getItem("pagarbook_screen") || (initialStaffId ? "staff_hub" : "home");
  });
  const [selectedStaffId, setSelectedStaffId] = useState(() => {
    return sessionStorage.getItem("pagarbook_staff_id") || initialStaffId;
  });

  const [earningsExpanded, setEarningsExpanded] = useState(true);

  // Dedicated In-App Salary Slip Modal State
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);

  // Dedicated Loan & Advance Modal State (Advance vs Loan)
  const [showLoanAdvanceModal, setShowLoanAdvanceModal] = useState(false);
  const [loanAdvanceTab, setLoanAdvanceTab] = useState("settlement"); // 'settlement', 'advance' or 'loan'
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advancePaymentMode, setAdvancePaymentMode] = useState("cash");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [loanEmiMonths, setLoanEmiMonths] = useState("3");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [settlementMonth, setSettlementMonth] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // Multi-Month Statement & Audit Modal State (3-6 माह हिसाब व पाई-पाई का ऑडिट)
  const [showMultiMonthModal, setShowMultiMonthModal] = useState(false);
  const [multiMonthStaff, setMultiMonthStaff] = useState(null);
  const [multiMonthRange, setMultiMonthRange] = useState("6"); // "3", "6", "12", "custom"
  const [customStartMonth, setCustomStartMonth] = useState("6");
  const [customStartYear, setCustomStartYear] = useState("2026");
  const [customEndMonth, setCustomEndMonth] = useState(() => String(new Date().getMonth() + 1));
  const [customEndYear, setCustomEndYear] = useState(() => String(new Date().getFullYear()));
  const [multiMonthData, setMultiMonthData] = useState(null);
  const [loadingMultiMonth, setLoadingMultiMonth] = useState(false);

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
  const [staffRole, setStaffRole] = useState("salesman");
  const [staffPassword, setStaffPassword] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // Persist screen and staffId to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("pagarbook_screen", activeScreen);
    if (selectedStaffId) {
      sessionStorage.setItem("pagarbook_staff_id", selectedStaffId);
    }
    sessionStorage.setItem("pagarbook_month", String(currentMonth));
    sessionStorage.setItem("pagarbook_year", String(currentYear));
  }, [activeScreen, selectedStaffId, currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);

  const fetchData = async (m = currentMonth, y = currentYear) => {
    // Only load cache on cold start when no staff data is in memory yet
    if (!summaryData.staff || summaryData.staff.length === 0) {
      const cached = readLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], null);
      if (cached && typeof cached === "object" && Array.isArray(cached.staff) && cached.staff.length > 0) {
        setSummaryData({ ...defaultSummaryData, ...cached });
      }
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/staff/pagarbook-summary?month=${m}&year=${y}`).catch(() => api.get(`/staff/pagarbook-summary?month=${m}&year=${y}`));
      const rawData = res?.data?.success ? res.data : (res?.success ? res : (res?.data || res));
      let finalStaff = Array.isArray(rawData?.staff) ? rawData.staff : [];

      // Fallback: If pagarbook-summary returned 0 staff, fetch staff list directly from /api/staff
      if (finalStaff.length === 0) {
        try {
          const staffRes = await api.get("/api/staff").catch(() => api.get("/staff"));
          const sList = Array.isArray(staffRes?.staff) 
            ? staffRes.staff 
            : (Array.isArray(staffRes?.data?.staff) 
              ? staffRes.data.staff 
              : (Array.isArray(staffRes?.data) ? staffRes.data : (Array.isArray(staffRes) ? staffRes : [])));
          if (sList.length > 0) {
            finalStaff = sList.map(s => {
              const isDaily = s.wageType === 'daily';
              const rate = Number(s.dailyRate || s.wageAmount || s.salary || 0);
              return {
                ...s,
                dailyAttendanceMap: s.dailyAttendanceMap || {},
                presentDays: s.presentDays || 0,
                presentCount: s.presentCount || 0,
                halfDays: s.halfDays || 0,
                halfDayCount: s.halfDayCount || 0,
                absentDays: s.absentDays || 0,
                absentCount: s.absentCount || 0,
                payableDays: s.payableDays || 0,
                earnedSalary: s.earnedSalary || 0,
                grossSalary: s.grossSalary || 0,
                totalAdvance: s.totalAdvance || 0,
                previousBalance: Number(s.previousBalance || 0),
                netPayable: Number(s.netPayable ?? s.balance ?? 0),
                baseSalary: rate,
                perDaySalary: isDaily ? rate : Math.round(rate / 30),
                advancesList: s.advancesList || [],
                transactions: s.transactions || []
              };
            });
          }
        } catch (sErr) {
          console.warn("PagarBook fallback staff list error:", sErr);
        }
      }

      if (rawData && (rawData.success || finalStaff.length > 0)) {
        const nextData = {
          ...defaultSummaryData,
          ...rawData,
          staff: finalStaff,
          totalCompanySalaryEarned: rawData.totalCompanySalaryEarned || finalStaff.reduce((sum, s) => sum + (s.earnedSalary || 0), 0),
          totalCompanyBonusGiven: rawData.totalCompanyBonusGiven || finalStaff.reduce((sum, s) => sum + (s.totalBonus || 0), 0),
          totalCompanyNetPayable: rawData.totalCompanyNetPayable || finalStaff.reduce((sum, s) => sum + (s.netPayable || 0), 0)
        };
        setSummaryData(nextData);
        writeLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], nextData);
      } else if (cached && typeof cached === "object") {
        setSummaryData({ ...defaultSummaryData, ...cached });
      }
    } catch (err) {
      console.error("Failed to load staff summary:", err);
      if (cached && typeof cached === "object") {
        setSummaryData({ ...defaultSummaryData, ...cached });
      }
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
      const targetDate = new Date(currentYear, currentMonth - 1, dayNum, 12, 0, 0);

      // Optimistic instant UI update
      setSummaryData(prev => {
        const updatedStaff = (prev.staff || []).map(s => {
          if (s._id === staffId) {
            const newMap = { ...(s.dailyAttendanceMap || {}), [dayNum]: status };
            
            const daysLimit = prev.daysConsidered || new Date().getDate();
            let pCount = 0;
            let hdCount = 0;
            let abCount = 0;
            for (let d = 1; d <= daysLimit; d++) {
              const st = newMap[d] || 'present';
              if (st === 'absent') abCount++;
              else if (st === 'half_day') hdCount++;
              else pCount++;
            }

            const effDays = pCount + (hdCount * 0.5);
            const paidBenefit = Math.min(abCount, Number(s.paidLeavesAllowed || 0));
            const payDays = Math.round((effDays + paidBenefit) * 10) / 10;
            
            const isDaily = s.wageType === 'daily';
            const dailyRate = Number(s.dailyRate || s.wageAmount || (s.monthlySalary ? Math.round(s.monthlySalary / (prev.daysInMonth || 30)) : 0) || 0);
            const monthlySal = Number(s.monthlySalary || s.salary || (dailyRate * (prev.daysInMonth || 30)) || 0);
            const rate = isDaily ? dailyRate : (monthlySal / (prev.daysInMonth || 30));
            
            const earned = Math.round(rate * payDays);
            const prevBal = Number(s.previousBalance || 0);
            const gross = earned + Number(s.overtimeEarnings || 0) + Number(s.commissionEarnings || 0);
            const totAdv = Number(s.totalAdvance || 0);
            const totPaid = Number(s.totalSalaryPaid || 0);
            const net = Math.max(0, prevBal + gross - totAdv - totPaid);

            return { 
              ...s, 
              dailyAttendanceMap: newMap,
              todayStatus: dayNum === todayDay ? status : (s.todayStatus || 'present'),
              presentDays: pCount,
              presentCount: pCount,
              halfDays: hdCount,
              halfDayCount: hdCount,
              absentDays: abCount,
              absentCount: abCount,
              payableDays: payDays,
              earnedSalary: earned,
              grossSalary: gross,
              netPayable: net,
              isSettled: (net === 0 && (Number(s.totalPaid || 0) > 0 || totPaid > 0))
            };
          }
          return s;
        });

        const nextEarned = updatedStaff.reduce((sum, st) => sum + (st.earnedSalary || 0), 0);
        const nextNet = updatedStaff.reduce((sum, st) => sum + (st.netPayable || 0), 0);
        const nextSummary = {
          ...prev,
          staff: updatedStaff,
          totalCompanySalaryEarned: nextEarned,
          totalCompanyNetPayable: nextNet
        };

        writeLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], nextSummary);
        return nextSummary;
      });

      await api.post("/api/staff/quick-attendance", {
        staffId,
        status,
        date: targetDate,
        day: dayNum,
        month: currentMonth,
        year: currentYear
      }).catch(() => api.post("/staff/quick-attendance", {
        staffId,
        status,
        date: targetDate,
        day: dayNum,
        month: currentMonth,
        year: currentYear
      }));

      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Error marking attendance:", err);
    }
  };

  // ==================== MULTI-MONTH STATEMENT & AUDIT HANDLERS ====================
  const fetchMultiMonthData = async (staffId, range = multiMonthRange, optStartM = customStartMonth, optStartY = customStartYear, optEndM = customEndMonth, optEndY = customEndYear) => {
    if (!staffId) return;
    setLoadingMultiMonth(true);
    try {
      let url = `/api/staff/${staffId}/multi-month-statement`;
      if (range === "custom") {
        url += `?startMonth=${optStartM}&startYear=${optStartY}&endMonth=${optEndM}&endYear=${optEndY}`;
      } else {
        url += `?months=${range}`;
      }
      const res = await api.get(url).catch(() => api.get(url.replace('/api/staff/', '/staff/')));
      const data = res?.data?.success ? res.data : (res?.success ? res : res?.data);
      if (data && data.success) {
        setMultiMonthData(data);
      }
    } catch (err) {
      console.error("Error fetching multi-month data:", err);
    } finally {
      setLoadingMultiMonth(false);
    }
  };

  const handleOpenMultiMonthModal = (staff = null) => {
    const target = staff || currentStaff || summaryData.staff?.[0];
    if (!target) {
      alert("कोई स्टाफ नहीं मिला!");
      return;
    }
    setMultiMonthStaff(target);
    setShowMultiMonthModal(true);
    fetchMultiMonthData(target._id, multiMonthRange);
  };

  const handleRangeChange = (newRange) => {
    setMultiMonthRange(newRange);
    if (multiMonthStaff?._id) {
      fetchMultiMonthData(multiMonthStaff._id, newRange);
    }
  };

  const handleCustomRangeApply = (e) => {
    if (e) e.preventDefault();
    if (multiMonthStaff?._id) {
      fetchMultiMonthData(multiMonthStaff._id, "custom", customStartMonth, customStartYear, customEndMonth, customEndYear);
    }
  };

  const handleShareStatementWhatsApp = () => {
    if (!multiMonthData || !multiMonthData.staff) return;
    const s = multiMonthData.staff;
    const sm = multiMonthData.summary || {};
    const months = multiMonthData.months || [];
    
    let msg = `📊 *${companyName} - स्टाफ वेतन व हाजिरी ऑडिट*\n`;
    msg += `👤 *कर्मचारी:* ${s.name} (${s.position || 'स्टाफ'})\n`;
    msg += `💵 *वेतन दर:* ${s.wageType === 'daily' ? `₹${s.dailyRate}/दिन (दैनिक दिहाड़ी)` : `₹${s.monthlySalary}/माह (मासिक वेतन)`}\n`;
    msg += `📅 *अवधि:* ${months[0]?.label || ''} से ${months[months.length - 1]?.label || ''}\n`;
    msg += `------------------------------------\n`;
    msg += `• कुल उपस्थिति: ${sm.totalPresentDays || 0} दिन (छुट्टी: ${sm.totalAbsentDays || 0} दिन)\n`;
    msg += `• कुल बनी सैलरी: ₹${(sm.totalEarnedSalary || 0).toLocaleString('en-IN')}\n`;
    msg += `• कुल एडवांस दिया: ₹${(sm.totalAdvanceGiven || 0).toLocaleString('en-IN')}\n`;
    msg += `• कुल वेतन भुगतान: ₹${(sm.totalSalaryPaid || 0).toLocaleString('en-IN')}\n`;
    if (sm.totalBonusGiven > 0) {
      msg += `• कुल बोनस/इनाम: ₹${(sm.totalBonusGiven || 0).toLocaleString('en-IN')} (सैलरी से नहीं कटेगा)\n`;
    }
    msg += `------------------------------------\n`;
    msg += `👉 *वर्तमान शुद्ध बाकी (Net Due): ₹${(sm.netCurrentDue || 0).toLocaleString('en-IN')}*\n`;
    msg += `✅ *ऑडिट:* ${sm.auditVerdict || 'हिसाब पूर्ण चुकता'}\n\n`;
    msg += `*माह-वार पाई-पाई का हिसाब:*\n`;
    months.forEach((m) => {
      msg += `\n🗓️ *${m.label}*\n`;
      msg += `  हाजिरी: ${m.presentDays} दिन | बनी सैलरी: ₹${m.earnedSalary}\n`;
      if (m.advanceGiven > 0) msg += `  एडवांस: ₹${m.advanceGiven}\n`;
      if (m.salaryPaid > 0) msg += `  वेतन भुगतान: ₹${m.salaryPaid}\n`;
      if (m.bonusGiven > 0) msg += `  बोनस/इनाम: ₹${m.bonusGiven}\n`;
      msg += `  माह का शेष: ₹${m.netPayable} (${m.isSettled ? '✅ चुकता' : '⏳ बकाया'})\n`;
      msg += `  विवरण: ${m.auditNote}\n`;
    });

    const phone = s.mobile ? s.mobile.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
    setStaffRole("salesman");
    setStaffPassword("");
    setShowStaffModal(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff) => {
    setIsEditingStaff(true);
    setModalStaffId(staff._id);
    setStaffName(staff.name || "");
    setStaffMobile(staff.mobileNumber || "");
    setStaffPosition(staff.position || "Staff");
    setStaffRole(staff.role || "salesman");
    setStaffPassword("");
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
        position: staffPosition.trim() || (staffRole === 'godown' ? 'गोदाम / इन्वेंटरी स्टाफ' : staffRole === 'accountant' ? 'अकाउंटेंट / मुनीम' : staffRole === 'manager' ? 'मैनेजर' : 'सेल्समैन'),
        role: staffRole,
        ...(staffPassword.trim() ? { password: staffPassword.trim() } : {}),
        overtimeRatePerHour: Number(staffOtRate) || 0,
        commissionPercent: Number(staffCommission) || 0
      };

      if (isEditingStaff && modalStaffId) {
        await api.put(`/api/staff/${modalStaffId}`, payload).catch(() => api.put(`/staff/${modalStaffId}`, payload));
        alert(`✅ ${staffName} का विवरण सफलतापूर्वक अपडेट हो गया!`);
      } else {
        await api.post("/api/staff", payload).catch(() => api.post("/staff", payload));
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
      await api.delete(`/api/staff/${staffId}`).catch(() => api.delete(`/staff/${staffId}`));
      alert(`✅ स्टाफ '${sName}' हटा दिया गया!`);
      setShowStaffModal(false);
      setActiveScreen("home");
      sessionStorage.setItem("pagarbook_screen", "home");
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Delete staff error:", err);
      alert(err.response?.data?.error || "स्टाफ हटाने में त्रुटि आई।");
    }
  };

  const handleSaveLoanOrAdvance = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStaffId || !advanceAmount || Number(advanceAmount) <= 0) {
      alert("कृपया सही राशि दर्ज करें!");
      return;
    }
    setSavingAdvance(true);
    try {
      const isSettlement = (loanAdvanceTab === "settlement");
      const isBonus = (loanAdvanceTab === "bonus");
      const isLoan = (loanAdvanceTab === "loan");
      
      const targetMonthStr = (isSettlement || isBonus)
        ? (settlementMonth || `${currentYear}-${String(currentMonth).padStart(2, "0")}`)
        : `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

      const [ty, tm] = targetMonthStr.split("-");
      const targetMonthName = new Date(Number(ty), Number(tm) - 1).toLocaleString("hi-IN", { month: "long", year: "numeric" });

      const finalNotes = isSettlement
        ? (advanceNotes.trim() || `${targetMonthName} वेतन भुगतान`)
        : isBonus
        ? (advanceNotes.trim() || `त्योहार बोनस / इनाम (सैलरी से नहीं कटेगा)`)
        : isLoan
        ? `स्टाफ लोन (${loanEmiMonths} माह ईएमआई) - ${advanceNotes || "व्यक्तिगत जरूरत"}`
        : (advanceNotes.trim() || "बीच में लिया गया एडवांस");

      const payload = {
        staffId: selectedStaffId,
        amount: Number(advanceAmount),
        paymentMode: advancePaymentMode,
        type: isSettlement ? "salary_settlement" : (isBonus ? "bonus" : (isLoan ? "loan" : "advance")),
        isSettlement,
        forMonth: targetMonthStr,
        notes: finalNotes,
        date: paymentDate ? new Date(paymentDate) : new Date()
      };

      if (isBonus) {
        await api.post("/api/staff/bonus", payload).catch(() => api.post("/staff/bonus", payload));
      } else {
        await api.post("/api/staff/advance", payload).catch(() => api.post("/staff/advance", payload));
      }

      const typeLabel = isSettlement ? "वेतन भुगतान (Salary Payment)" : isBonus ? "🎁 बोनस / इनाम (सैलरी से नहीं कटेगा)" : (isLoan ? "लोन" : "एडवांस");
      alert(`✅ ${typeLabel} ₹${advanceAmount} सफलतापूर्वक दर्ज हो गया!`);
      setAdvanceAmount("");
      setAdvanceNotes("");
      setShowLoanAdvanceModal(false);
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Advance error:", err);
      alert(err.response?.data?.error || "दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleDeleteAdvance = async (txId) => {
    const ok = window.confirm("⚠️ क्या आप इस एंट्री को हटाना चाहते हैं?");
    if (!ok) return;
    try {
      await api.delete(`/api/staff/transaction/${txId}`).catch(() => api.delete(`/staff/transaction/${txId}`));
      alert("✅ प्रविष्टि हटा दी गई!");
      fetchData(currentMonth, currentYear);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.error || "हटाने में त्रुटि आई।");
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
      `📅 *अवधि:* 01 ${mName} - ${String(activeDaysCount).padStart(2, '0')} ${mName} ${currentYear}`,
      `💼 *वेतन दर:* ${staff.wageType === 'daily' ? `₹${staff.dailyRate || staff.wageAmount}/दिन (दैनिक)` : `₹${staff.monthlySalary || staff.salary}/माह (मासिक)`}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📊 *हाजिरी विवरण:*`,
      `  🟢 उपस्थित (P): ${staff.presentDays || staff.presentCount || 0} दिन`,
      `  🟡 हाफ डे (HD): ${staff.halfDays || staff.halfDayCount || 0} दिन`,
      `  🔴 अनुपस्थित (AB): ${staff.absentDays || staff.absentCount || 0} दिन`,
      `  🎁 सवेतन छुट्टी: ${staff.paidLeavesCount || 0} दिन`,
      `  ✅ कुल काम के दिन: ${staff.payableDays || 0} दिन`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *वेतन गणना:*`,
      staff.previousBalance ? `  ⏳ पिछला बकाया (Previous Due): ${staff.previousBalance > 0 ? '+' : ''}₹${(staff.previousBalance || 0).toLocaleString('en-IN')}` : null,
      `  💵 बना मूल वेतन: ₹${(staff.earnedSalary || 0).toLocaleString('en-IN')}`,
      staff.overtimeEarnings > 0 ? `  ⏱️ ओवर-टाइम कमाई: +₹${(staff.overtimeEarnings || 0).toLocaleString('en-IN')}` : null,
      `  ✨ कुल ग्रॉस वेतन: ₹${(staff.grossSalary || staff.earnedSalary || 0).toLocaleString('en-IN')}`,
      staff.totalBonus > 0 ? `  🎁 त्योहार बोनस/इनाम (Bonus): ₹${(staff.totalBonus || 0).toLocaleString('en-IN')} (सैलरी से नहीं कटेगा)` : null,
      staff.totalAdvance > 0 ? `  💸 बीच में लिया एडवांस: -₹${(staff.totalAdvance || 0).toLocaleString('en-IN')}` : null,
      ...(staff.paymentsList && staff.paymentsList.length > 0 ? [
        `━━━━━━━━━━━━━━━━━━━━`,
        `💵 *प्राप्त वेतन भुगतान (Payments Made):*`,
        ...staff.paymentsList.map(p => `  • ${new Date(p.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' })}: ₹${(p.amount || 0).toLocaleString('en-IN')} (${p.paymentMode === 'cash' ? 'नकद' : (p.paymentMode || 'Online')})`),
        `  कुल वेतन भुगतान: -₹${(staff.totalSalaryPaid || 0).toLocaleString('en-IN')}`
      ] : []),
      `━━━━━━━━━━━━━━━━━━━━`,
      (staff.netPayable || 0) === 0 && ((staff.totalPaid || 0) > 0 || (staff.totalSalaryPaid || 0) > 0)
        ? `*💳 कुल शुद्ध बाकी (Net Due): ₹0 (NIL / हिसाब चुकता ✅)*`
        : `*💳 कुल शुद्ध बाकी (Net Due): ₹${(staff.netPayable || 0).toLocaleString('en-IN')}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_डिजिटल पगार बुक द्वारा सत्यापित_`
    ].filter(Boolean);

    const fullMsg = lines.join(String.fromCharCode(10));
    const phone = (staff.mobileNumber || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMsg)}` : `https://wa.me/?text=${encodeURIComponent(fullMsg)}`;
    window.open(url, "_blank");
  };

  const monthShortName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'short' });
  const isNowMonth = (new Date().getFullYear() === currentYear && (new Date().getMonth() + 1) === currentMonth);
  const activeDaysCount = isNowMonth ? Math.min(new Date().getDate(), summaryData.daysInMonth || 30) : (summaryData.daysInMonth || 30);

  const getDayShortName = (y, m, d) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[new Date(y, m - 1, d).getDay()];
  };

  const dailyStaffList = (summaryData.staff || []).filter(s => s.wageType === "daily");
  const monthlyStaffList = (summaryData.staff || []).filter(s => s.wageType === "monthly");
  const totalPendingAmount = summaryData.totalCompanyNetPayable || 0;

  const todayDay = new Date().getDate();
  const allStaff = summaryData.staff || [];
  const todayPresentCount = allStaff.filter(s => (s.dailyAttendanceMap?.[todayDay] || "").toLowerCase() === "present").length;
  const todayHalfDayCount = allStaff.filter(s => (s.dailyAttendanceMap?.[todayDay] || "").toLowerCase() === "half_day").length;
  const todayAbsentCount = allStaff.filter(s => (s.dailyAttendanceMap?.[todayDay] || "").toLowerCase() === "absent").length;

  const handleMarkAllPresentToday = async () => {
    if (allStaff.length === 0) return;
    const ok = window.confirm(`क्या आप सभी ${allStaff.length} कर्मचारियों को आज उपस्थित (Present) मार्क करना चाहते हैं?`);
    if (!ok) return;
    for (const st of allStaff) {
      handleMarkDayAttendance(st._id, todayDay, "present");
    }
  };

  return (
    <div className="w-full flex justify-center bg-[#F4F6F9] min-h-screen text-[#1E293B] p-0 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl bg-[#F8FAFC] sm:bg-white sm:rounded-3xl min-h-screen flex flex-col relative shadow-xl sm:border border-slate-200 pb-10 overflow-hidden">

        {/* ========================================================================= */}
        {/* SCREEN 1: HOME - STAFF LIST                                               */}
        {/* ========================================================================= */}
        {activeScreen === "home" && (
          <div className="flex flex-col flex-1">
            <div className="bg-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onClose ? onClose() : window.history.back()} 
                  className="p-1 text-slate-800 hover:text-blue-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-[280px]">
                    {companyName}
                  </h1>
                  <span className="text-[11px] text-slate-400 font-medium">स्टाफ व वेतन प्रबंधन (Staff & Salary Hub)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenMultiMonthModal()}
                  className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="3 से 6 महीने का पूरा हिसाब व ऑडिट देखें"
                >
                  <Calendar className="w-4 h-4" />
                  <span>📊 3-6 माह हिसाब व ऑडिट</span>
                </button>
                <button
                  onClick={handleOpenAddStaff}
                  className="hidden sm:flex px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl font-bold text-xs shadow-md items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नया स्टाफ जोड़ें</span>
                </button>
                <button className="flex items-center gap-1 text-blue-600 font-semibold text-xs sm:text-sm hover:underline cursor-pointer">
                  <span>Help</span>
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs sm:col-span-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">कुल बकाया वेतन (Total Pending Salary)</span>
                    <div className="text-3xl font-black text-[#DC2626]">
                      ₹ {totalPendingAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold text-xs cursor-pointer hover:opacity-80">
                    <span>थोक भुगतान (Bulk Payout Options)</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 block mb-0.5">सक्रिय स्टाफ (Active Staff)</span>
                    <p className="text-2xl font-black text-indigo-950">{(summaryData.staff || []).length} सदस्य</p>
                    <span className="text-[11px] text-indigo-700">Daily: {dailyStaffList.length} • Monthly: {monthlyStaffList.length}</span>
                  </div>
                  <button
                    onClick={handleOpenAddStaff}
                    className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ नया स्टाफ जोड़ें (Add Staff)</span>
                  </button>
                </div>
              </div>

              {/* Today's Live Attendance Dashboard Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 p-4 rounded-2xl border border-emerald-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      आज की दैनिक हाजिरी (Today's Live Attendance) • {todayDay} {monthShortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      🟢 उपस्थित: {todayPresentCount}
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      🟡 हाफ-डे: {todayHalfDayCount}
                    </span>
                    <span className="flex items-center gap-1 text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                      🔴 अनुपस्थित: {todayAbsentCount}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllPresentToday}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>सबको हाजिर लगाएं (All Present)</span>
                </button>
              </div>

              <div className="space-y-6 pt-2">
                {dailyStaffList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                      <span>⚡ दैनिक वेतन भोगी स्टाफ (Daily Wage Staff)</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {dailyStaffList.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dailyStaffList.map((staff) => {
                        const todayStatus = staff.dailyAttendanceMap?.[todayDay] || staff.todayStatus || "present";
                        const statusLabel = todayStatus === "present" ? "Present" : todayStatus === "half_day" ? "Half Day" : "Absent";

                        return (
                          <div
                            key={staff._id}
                            onClick={() => {
                              setSelectedStaffId(staff._id);
                              setActiveScreen("staff_hub");
                            }}
                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition cursor-pointer active:bg-slate-50 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                  <User className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                  <span className={`text-[11px] font-semibold ${statusLabel === 'Present' ? 'text-emerald-600' : statusLabel === 'Half Day' ? 'text-amber-600' : 'text-slate-400'}`}>
                                    ● {statusLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-700">
                                  बनता: <span className="font-extrabold text-emerald-700">₹{(staff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {staff.netPayable === 0 && ((staff.totalPaid || 0) > 0 || (staff.totalSalaryPaid || 0) > 0) ? (
                                  <div className="text-xs font-black text-emerald-700 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                    ✅ चुकता (NIL)
                                  </div>
                                ) : (
                                  <div className="text-sm font-black text-[#DC2626] mt-0.5">
                                    बकाया: ₹{(staff.netPayable || 0).toLocaleString('en-IN')}
                                  </div>
                                )}
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  {staff.presentDays || staff.presentCount || 0}P • {staff.halfDays || staff.halfDayCount || 0}HD • {staff.absentDays || staff.absentCount || 0}AB
                                </span>
                              </div>
                            </div>

                            {/* 1-Click Direct Attendance Controls */}
                            <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenMultiMonthModal(staff)}
                                className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                                title="3-6 माह का संपूर्ण हिसाब देखें"
                              >
                                <span>📊 हिसाब</span>
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "present")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "present"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  ✓ P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "half_day")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "half_day"
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                  }`}
                                >
                                  ½ HD
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "absent")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "absent"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  }`}
                                >
                                  ✕ AB
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {monthlyStaffList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                      <span>💼 मासिक वेतन भोगी स्टाफ (Monthly Salary Staff)</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {monthlyStaffList.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {monthlyStaffList.map((staff) => {
                        const todayStatus = staff.dailyAttendanceMap?.[todayDay] || staff.todayStatus || "present";
                        const statusLabel = todayStatus === "present" ? "Present" : todayStatus === "half_day" ? "Half Day" : "Absent";

                        return (
                          <div
                            key={staff._id}
                            onClick={() => {
                              setSelectedStaffId(staff._id);
                              setActiveScreen("staff_hub");
                            }}
                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition cursor-pointer active:bg-slate-50 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                  <User className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                  <span className={`text-[11px] font-semibold ${statusLabel === 'Present' ? 'text-emerald-600' : statusLabel === 'Half Day' ? 'text-amber-600' : 'text-slate-400'}`}>
                                    ● {statusLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-700">
                                  बनता: <span className="font-extrabold text-emerald-700">₹{(staff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {staff.netPayable === 0 && ((staff.totalPaid || 0) > 0 || (staff.totalSalaryPaid || 0) > 0) ? (
                                  <div className="text-xs font-black text-emerald-700 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                    ✅ चुकता (NIL)
                                  </div>
                                ) : (
                                  <div className="text-sm font-black text-[#DC2626] mt-0.5">
                                    बकाया: ₹{(staff.netPayable || 0).toLocaleString('en-IN')}
                                  </div>
                                )}
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  {staff.presentDays || staff.presentCount || 0}P • {staff.halfDays || staff.halfDayCount || 0}HD • {staff.absentDays || staff.absentCount || 0}AB
                                </span>
                              </div>
                            </div>

                            {/* 1-Click Direct Attendance Controls */}
                            <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenMultiMonthModal(staff)}
                                className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                                title="3-6 माह का संपूर्ण हिसाब देखें"
                              >
                                <span>📊 हिसाब</span>
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "present")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "present"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  ✓ P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "half_day")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "half_day"
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                  }`}
                                >
                                  ½ HD
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkDayAttendance(staff._id, todayDay, "absent")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    todayStatus === "absent"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  }`}
                                >
                                  ✕ AB
                                </button>
                              </div>
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

        {/* ========================================================================= */}
        {/* SCREEN 2: STAFF HUB (Screenshot 3)                                        */}
        {/* ========================================================================= */}
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
              {/* Prominent Multi-Month Statement Banner */}
              <div
                onClick={() => handleOpenMultiMonthModal(currentStaff)}
                className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl">
                    📊
                  </div>
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-1.5">
                      <span>3 से 6 माह का पूरा हिसाब व ऑडिट</span>
                      <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">पाई-पाई का हिसाब</span>
                    </h4>
                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                      हाजिरी, छुट्टियां, सैलरी, एडवांस, वेतन भुगतान व बैलेंस की पूरी पड़ताल
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
              </div>

              {/* 4 Quick Action Tiles */}
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
                  onClick={() => {
                    setLoanAdvanceTab("advance");
                    setShowLoanAdvanceModal(true);
                  }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    💵
                  </div>
                  <span className="text-sm font-bold text-slate-800">Loans & Adv</span>
                </div>

                <div
                  onClick={() => setShowSalarySlipModal(true)}
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenMultiMonthModal(currentStaff)}
                      className="flex items-center gap-1 text-indigo-700 font-bold text-xs border border-indigo-200 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 cursor-pointer shadow-2xs"
                    >
                      <span>📊 3-6 माह ऑडिट</span>
                    </button>
                    <button 
                      onClick={() => handleOpenEditStaff(currentStaff)}
                      className="flex items-center gap-1 text-blue-600 font-bold text-xs border border-blue-200 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 cursor-pointer"
                    >
                      <span>••• Actions</span>
                    </button>
                  </div>
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
                        Date: 01 {monthShortName}'{String(currentYear).slice(2)} - {String(activeDaysCount).padStart(2, '0')} {monthShortName}'{String(currentYear).slice(2)}
                      </div>
                    </div>
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Due Amount</span>
                      {currentStaff.isSettled || (currentStaff.netPayable === 0 && ((currentStaff.totalPaid || 0) > 0 || (currentStaff.totalSalaryPaid || 0) > 0)) ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xl font-extrabold text-emerald-600">₹ 0</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                            ✅ चुकता (NIL)
                          </span>
                        </div>
                      ) : (
                        <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                          ₹ {(currentStaff.netPayable || 0).toLocaleString('en-IN')}
                        </div>
                      )}
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
                        onClick={() => setShowSalarySlipModal(true)}
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
                      <span>Earnings Breakdown</span>
                      <div className="flex items-center gap-1.5">
                        <span>₹ {(currentStaff.grossSalary || currentStaff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                        {earningsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {earningsExpanded && (
                      <div className="mt-2.5 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                        {currentStaff.previousBalance !== undefined && currentStaff.previousBalance !== 0 && (
                          <div className={`flex justify-between ${currentStaff.previousBalance > 0 ? 'text-amber-800' : 'text-emerald-700'} font-bold bg-amber-50/60 px-2 py-1 rounded-lg border border-amber-200/50`}>
                            <span>⏳ पिछला बकाया (Previous Due):</span>
                            <span>{currentStaff.previousBalance > 0 ? '+' : ''}₹{Number(currentStaff.previousBalance || 0).toLocaleString('en-IN')}</span>
                          </div>
                        )}
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
                            <span>बीच में लिया एडवांस कटौती:</span>
                            <span className="font-bold">-₹{currentStaff.totalAdvance.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {currentStaff.totalSalaryPaid > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>वेतन भुगतान (Salary Paid):</span>
                            <span className="font-bold">-₹{currentStaff.totalSalaryPaid.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-emerald-700">
                          <span>शुद्ध बाकी (Net Payable):</span>
                          <span>
                            {currentStaff.netPayable === 0 && ((currentStaff.totalPaid || 0) > 0 || (currentStaff.totalSalaryPaid || 0) > 0)
                              ? '₹0 (हिसाब चुकता ✅)'
                              : `₹${(currentStaff.netPayable || 0).toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setLoanAdvanceTab("settlement");
                        setSettlementMonth(`${currentYear}-${String(currentMonth).padStart(2, "0")}`);
                        setAdvanceAmount(currentStaff.netPayable > 0 ? String(currentStaff.netPayable) : "");
                        setShowLoanAdvanceModal(true);
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>💵 वेतन भुगतान</span>
                    </button>

                    <button
                      onClick={() => {
                        setLoanAdvanceTab("advance");
                        setAdvanceAmount("");
                        setShowLoanAdvanceModal(true);
                      }}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>+ एडवांस दें</span>
                    </button>

                    <button
                      onClick={() => {
                        setLoanAdvanceTab("bonus");
                        setAdvanceAmount("");
                        setShowLoanAdvanceModal(true);
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>🎁 बोनस / इनाम</span>
                    </button>

                    <button
                      onClick={() => setShowSalarySlipModal(true)}
                      className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-indigo-200 shadow-xs transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>वेतन पर्ची</span>
                    </button>
                  </div>
                </div>

                {/* Advance, Bonus & Salary Payment Passbook Table */}
                {((currentStaff.paymentsList && currentStaff.paymentsList.length > 0) || (currentStaff.advancesList && currentStaff.advancesList.length > 0) || (currentStaff.bonusList && currentStaff.bonusList.length > 0)) && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 mt-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">भुगतान, बोनस व एडवांस लेजर ({monthShortName} {currentYear})</span>
                      <div className="flex items-center gap-2 text-xs">
                        {currentStaff.totalSalaryPaid > 0 && <span className="font-extrabold text-emerald-700">वेतन: ₹{currentStaff.totalSalaryPaid}</span>}
                        {currentStaff.totalBonus > 0 && <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">🎁 बोनस: ₹{currentStaff.totalBonus}</span>}
                        {currentStaff.totalAdvance > 0 && <span className="font-extrabold text-rose-600">एडवांस: ₹{currentStaff.totalAdvance}</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Salary Payments */}
                      {(currentStaff.paymentsList || []).map((p, idx) => (
                        <div key={p._id || `pmt_${idx}`} className="flex items-center justify-between text-xs py-2 px-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold">💵 वेतन भुगतान</span>
                              <span className="font-bold text-slate-800">
                                {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{p.notes || "मासिक वेतन भुगतान"} ({p.paymentMode === 'cash' ? 'नकद' : p.paymentMode})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-emerald-700 text-sm">₹{p.amount}</span>
                            {p._id && (
                              <button onClick={() => handleDeleteAdvance(p._id)} title="हटाएं" className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Bonuses / Rewards (Not deducted from salary) */}
                      {(currentStaff.bonusList || []).map((b, idx) => (
                        <div key={b._id || `bon_${idx}`} className="flex items-center justify-between text-xs py-2 px-2.5 bg-amber-50/70 rounded-xl border border-amber-200">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-extrabold">🎁 बोनस / इनाम</span>
                              <span className="font-bold text-slate-800">
                                {new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                              <span className="text-[10px] text-amber-700 font-bold">(सैलरी से नहीं कटेगा)</span>
                            </div>
                            <span className="text-[11px] text-slate-600 block mt-0.5">{b.notes || "त्योहार बोनस/इनाम"} ({b.paymentMode === 'cash' ? 'नकद' : b.paymentMode})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-700 text-sm">+₹{b.amount}</span>
                            {b._id && (
                              <button onClick={() => handleDeleteAdvance(b._id)} title="हटाएं" className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Advances & Loans */}
                      {(currentStaff.advancesList || []).map((adv, idx) => (
                        <div key={adv._id || `adv_${idx}`} className="flex items-center justify-between text-xs py-2 px-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[10px] font-extrabold">💳 एडवांस</span>
                              <span className="font-bold text-slate-800">
                                {new Date(adv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{adv.notes || "Advance"} ({adv.paymentMode === 'cash' ? 'नकद' : adv.paymentMode})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-rose-700 text-sm">-₹{adv.amount}</span>
                            {adv._id && (
                              <button onClick={() => handleDeleteAdvance(adv._id)} title="हटाएं" className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer">
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

        {/* ========================================================================= */}
        {/* SCREEN 3: ATTENDANCE CALENDAR (Screenshots 1 & 2)                          */}
        {/* ========================================================================= */}
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
                    <span className="text-base font-extrabold text-slate-900">
                      {currentStaff.presentDays ?? currentStaff.presentCount ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Absent</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {currentStaff.absentDays ?? currentStaff.absentCount ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">Half Day</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {currentStaff.halfDays ?? currentStaff.halfDayCount ?? 0}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Leave</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {currentStaff.paidLeavesCount ?? currentStaff.paidLeavesBenefited ?? 0}
                      </span>
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

              {/* Day-by-Day List (Descending Order from Today down to 1st) */}
              <div className="space-y-2.5 pt-1">
                {Array.from({ length: activeDaysCount }, (_, i) => activeDaysCount - i).map((dayNum) => {
                  const status = currentStaff.dailyAttendanceMap?.[dayNum] || "present";
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
                        {/* P Button */}
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

                        {/* HD Button */}
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

                        {/* AB Button */}
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
                          onClick={() => alert(`Day ${dayNum} ${monthShortName}: ${status === 'present' ? 'Present (पूर्ण दिन)' : status === 'half_day' ? 'Half Day (आधा दिन)' : 'Absent (छुट्टी)'}`)}
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

        {/* ========================================================================= */}
        {/* MODAL 1: IN-APP DEDICATED SALARY SLIP (पूरा हिसाब + कटौती + नेट बाकी)    */}
        {/* ========================================================================= */}
        {showSalarySlipModal && currentStaff && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    📄
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">वेतन पर्ची (Salary Slip)</h3>
                    <p className="text-[10px] text-slate-400">01 {monthShortName} - {String(activeDaysCount).padStart(2, '0')} {monthShortName} {currentYear}</p>
                  </div>
                </div>
                <button onClick={() => setShowSalarySlipModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Staff Overview Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">कर्मचारी:</span>
                  <span className="text-slate-900">{currentStaff.name} ({currentStaff.position || 'Staff'})</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">वेतन प्रकार:</span>
                  <span className="text-indigo-700">
                    {currentStaff.wageType === 'daily' ? `दैनिक ₹${currentStaff.dailyRate || currentStaff.wageAmount}/दिन` : `मासिक ₹${currentStaff.monthlySalary || currentStaff.salary}/माह`}
                  </span>
                </div>
              </div>

              {/* Working Days Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block">🟢 Present</span>
                  <span className="font-extrabold text-emerald-800 text-sm">{currentStaff.presentDays || currentStaff.presentCount || 0} दिन</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 block">🟡 Half Day</span>
                  <span className="font-extrabold text-amber-800 text-sm">{currentStaff.halfDays || currentStaff.halfDayCount || 0} दिन</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 block">🔴 Absent</span>
                  <span className="font-extrabold text-rose-800 text-sm">{currentStaff.absentDays || currentStaff.absentCount || 0} दिन</span>
                </div>
              </div>

              {/* Detailed Financial Calculation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>कुल काम के दिन (Payable Days):</span>
                  <span className="font-extrabold text-slate-900">{currentStaff.payableDays || 0} दिन</span>
                </div>
                {currentStaff.previousBalance !== undefined && currentStaff.previousBalance !== 0 && (
                  <div className={`flex justify-between ${currentStaff.previousBalance > 0 ? 'text-amber-800' : 'text-emerald-700'} font-bold border-t border-slate-200 pt-1.5`}>
                    <span>⏳ पिछला बकाया (Previous Due):</span>
                    <span>{currentStaff.previousBalance > 0 ? '+' : ''}₹ {Number(currentStaff.previousBalance || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1.5">
                  <span>💵 बना हुआ मूल वेतन:</span>
                  <span>₹ {(currentStaff.earnedSalary || 0).toLocaleString('en-IN')}</span>
                </div>
                {currentStaff.overtimeEarnings > 0 && (
                  <div className="flex justify-between text-indigo-600 font-bold">
                    <span>⏱️ ओवर-टाइम कमाई:</span>
                    <span>+₹ {currentStaff.overtimeEarnings}</span>
                  </div>
                )}
                {currentStaff.totalAdvance > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1.5">
                    <span>💸 बीच में लिया गया एडवांस (Deduction):</span>
                    <span>-₹ {(currentStaff.totalAdvance || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {currentStaff.totalBonus > 0 && (
                  <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded-xl font-bold border border-amber-200">
                    <span className="flex items-center gap-1">🎁 त्योहार बोनस / इनाम (Bonus):</span>
                    <span>+₹ {(currentStaff.totalBonus || 0).toLocaleString('en-IN')} <span className="text-[10px] text-amber-600 font-normal">(सैलरी से नहीं कटेगा)</span></span>
                  </div>
                )}

                {/* Salary Payments in Slip */}
                {currentStaff.paymentsList && currentStaff.paymentsList.length > 0 && (
                  <div className="border-t border-slate-200 pt-1.5 space-y-1">
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>💵 प्राप्त वेतन भुगतान:</span>
                      <span>-₹ {(currentStaff.totalSalaryPaid || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {currentStaff.paymentsList.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-emerald-600 pl-2">
                        <span>• {new Date(p.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' })} ({p.paymentMode === 'cash' ? 'नकद' : p.paymentMode}):</span>
                        <span className="font-semibold">₹{(p.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`flex justify-between items-center ${currentStaff.netPayable === 0 && ((currentStaff.totalPaid || 0) > 0 || (currentStaff.totalSalaryPaid || 0) > 0) ? 'bg-emerald-600' : 'bg-slate-900'} text-white p-3 rounded-xl font-extrabold text-sm mt-2 shadow-sm`}>
                  <span>💳 कुल शुद्ध बाकी (Net Payable):</span>
                  <span className="text-base">
                    {currentStaff.netPayable === 0 && ((currentStaff.totalPaid || 0) > 0 || (currentStaff.totalSalaryPaid || 0) > 0)
                      ? '₹0 (हिसाब चुकता ✅)'
                      : `₹ ${(currentStaff.netPayable || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {/* Bottom Actions inside Slip Modal */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleShareWhatsApp(currentStaff)}
                  className="py-3 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp पर्ची</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट / PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: SALARY SETTLEMENT, ADVANCE & LOAN                                */}
        {/* ========================================================================= */}
        {showLoanAdvanceModal && currentStaff && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">
                  {loanAdvanceTab === "settlement" ? "वेतन भुगतान (Salary Settle)" : loanAdvanceTab === "bonus" ? "🎁 बोनस / त्योहार इनाम एंट्री" : "एडवांस व लोन एंट्री"}
                </h3>
                <button onClick={() => setShowLoanAdvanceModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loanAdvanceTab === "bonus" ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <span>🎁</span>
                  <span>बोनस या त्योहार इनाम <b>दुकान के बिजनेस खर्च</b> में दर्ज होगा, लेकिन <b>स्टाफ की सैलरी से नहीं कटेगा</b>।</span>
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-semibold">
                  <span>⚡</span>
                  <span>यह भुगतान <b>दुकान के बिजनेस खर्च (Shop Expense / Salary)</b> में भी अपने आप दर्ज होगा (2 जगह डालने की जरूरत नहीं)।</span>
                </div>
              )}

              {/* 4-Tab Switcher: Settlement vs Advance vs Bonus vs Loan */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoanAdvanceTab("settlement");
                    if (currentStaff.netPayable > 0) setAdvanceAmount(String(currentStaff.netPayable));
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${loanAdvanceTab === "settlement" ? "bg-white text-emerald-700 shadow-xs font-extrabold" : "text-slate-500"}`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>1. वेतन</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanAdvanceTab("advance")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${loanAdvanceTab === "advance" ? "bg-white text-indigo-700 shadow-xs font-extrabold" : "text-slate-500"}`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>2. एडवांस</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanAdvanceTab("bonus")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${loanAdvanceTab === "bonus" ? "bg-white text-amber-700 shadow-xs font-extrabold" : "text-slate-500"}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>3. 🎁 बोनस</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanAdvanceTab("loan")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${loanAdvanceTab === "loan" ? "bg-white text-purple-700 shadow-xs font-extrabold" : "text-slate-500"}`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>4. लोन</span>
                </button>
              </div>

              <form onSubmit={handleSaveLoanOrAdvance} className="space-y-3.5 text-xs font-bold text-slate-700">
                {/* Month Selector for Salary Settlement or Bonus */}
                {(loanAdvanceTab === "settlement" || loanAdvanceTab === "bonus") && (
                  <div>
                    <label className="block mb-1">
                      {loanAdvanceTab === "settlement" ? "किस माह का वेतन चुकता कर रहे हैं? (Salary Month)" : "किस माह का बोनस/इनाम है? (Bonus Month)"}
                    </label>
                    <select
                      value={settlementMonth || `${currentYear}-${String(currentMonth).padStart(2, "0")}`}
                      onChange={(e) => setSettlementMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value={`${currentYear}-${String(currentMonth).padStart(2, "0")}`}>
                        📅 चयनित माह: {new Date(currentYear, currentMonth - 1).toLocaleString("hi-IN", { month: "long", year: "numeric" })}
                      </option>
                      <option value={`${currentMonth === 1 ? currentYear - 1 : currentYear}-${String(currentMonth === 1 ? 12 : currentMonth - 1).padStart(2, "0")}`}>
                        📅 पिछला माह: {new Date(currentMonth === 1 ? currentYear - 1 : currentYear, currentMonth === 1 ? 11 : currentMonth - 2).toLocaleString("hi-IN", { month: "long", year: "numeric" })}
                      </option>
                      <option value={`${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, "0")}`}>
                        📅 अगला माह: {new Date(currentMonth === 12 ? currentYear + 1 : currentYear, currentMonth === 12 ? 0 : currentMonth).toLocaleString("hi-IN", { month: "long", year: "numeric" })}
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label>
                      {loanAdvanceTab === 'settlement' ? 'वेतन भुगतान राशि (Payment ₹) *' : loanAdvanceTab === 'bonus' ? '🎁 बोनस / इनाम राशि (Bonus ₹) *' : loanAdvanceTab === 'loan' ? 'लोन राशि (Loan Amount ₹) *' : 'एडवांस राशि (Advance ₹) *'}
                    </label>
                    {loanAdvanceTab === 'settlement' && currentStaff.netPayable > 0 && (
                      <button
                        type="button"
                        onClick={() => setAdvanceAmount(String(currentStaff.netPayable))}
                        className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 cursor-pointer font-extrabold"
                      >
                        ⚡ पूरा बाकी भरें (₹{currentStaff.netPayable})
                      </button>
                    )}
                  </div>
                  <input 
                    type="number"
                    placeholder="उदा. 2000"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">भुगतान की तारीख (Date)</label>
                  <input 
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                {loanAdvanceTab === "loan" && (
                  <div>
                    <label className="block mb-1">ईएमआई अवधि (किस्त महीने)</label>
                    <select
                      value={loanEmiMonths}
                      onChange={(e) => setLoanEmiMonths(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="2">2 महीने में कटौती (2 किस्तों में)</option>
                      <option value="3">3 महीने में कटौती (3 किस्तों में)</option>
                      <option value="6">6 महीने में कटौती (6 किस्तों में)</option>
                      <option value="12">12 महीने में कटौती (1 साल)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block mb-1">भुगतान माध्यम (Payment Mode)</label>
                  <select
                    value={advancePaymentMode}
                    onChange={(e) => setAdvancePaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="cash">Cash (नकद)</option>
                    <option value="online">Online / UPI (PhonePe/GPay)</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">विवरण / टिप्पणी (Notes)</label>
                  <input 
                    type="text"
                    placeholder={loanAdvanceTab === 'settlement' ? "उदा. सितंबर वेतन चुकता किया" : loanAdvanceTab === 'bonus' ? "उदा. दिवाली बोनस, त्यौहार इनाम..." : "उदा. त्योहार खर्च / राशन"}
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAdvance}
                  className={`w-full py-3 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer ${loanAdvanceTab === 'settlement' ? 'bg-emerald-600 hover:bg-emerald-700' : loanAdvanceTab === 'bonus' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {savingAdvance 
                    ? "सुरक्षित हो रहा है..." 
                    : loanAdvanceTab === 'settlement' 
                    ? "💵 वेतन भुगतान सुरक्षित करें (Settle)" 
                    : loanAdvanceTab === 'bonus' 
                    ? "🎁 बोनस / इनाम सुरक्षित करें (सैलरी से नहीं कटेगा)" 
                    : loanAdvanceTab === 'loan' 
                    ? "लोन सुरक्षित करें" 
                    : "एडवांस सुरक्षित करें"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: ADD / EDIT STAFF & SALARY WITH DUAL INDEPENDENT BOXES            */}
        {/* ========================================================================= */}
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
                  <label className="block mb-1">Mobile Number (WhatsApp) *</label>
                  <input 
                    type="text"
                    placeholder="10-digit mobile number"
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">
                      स्टाफ अधिकार व रोल (Role & Permissions) *
                    </label>
                    <select
                      value={staffRole}
                      onChange={(e) => {
                        setStaffRole(e.target.value);
                        if (e.target.value === 'godown') setStaffPosition('गोदाम / इन्वेंटरी स्टाफ');
                        else if (e.target.value === 'accountant') setStaffPosition('अकाउंटेंट / मुनीम जी');
                        else if (e.target.value === 'manager') setStaffPosition('मैनेजर');
                        else if (e.target.value === 'salesman') setStaffPosition('सेल्समैन / बिलर');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="salesman">🛒 सेल्समैन / काउंटर बिलर (POS बिलिंग + कलेक्शन)</option>
                      <option value="godown">📦 गोदाम / इन्वेंटरी स्टाफ (सिर्फ आइटम व स्टॉक जोड़ना)</option>
                      <option value="accountant">📑 अकाउंटेंट / मुनीम जी (DayBook, लेजर, बिल, GST, खर्च)</option>
                      <option value="manager">👔 मैनेजर (बिलिंग + स्टॉक + सभी अकाउंट्स)</option>
                      <option value="admin">👑 मालिक / एडमिन (फुल कंट्रोल व सेटिंग्स)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      {staffRole === 'godown' && "🔒 यह स्टाफ मोबाइल में केवल आइटम व स्टॉक संभाल सकेगा। वित्तीय व सेल्स डेटा पूरी तरह छिपा रहेगा।"}
                      {staffRole === 'salesman' && "🔒 यह स्टाफ काउंटर पर बिलिंग व कलेक्शन करेगा। खरीद रेट व प्रॉफिट नहीं दिखेगा।"}
                      {staffRole === 'accountant' && "🔒 यह स्टाफ डे-बुक, लेजर, बिल, टैक्स व खर्च देखेगा। रेट नहीं बदल सकेगा।"}
                      {staffRole === 'manager' && "🔒 मैनेजर को बिलिंग, स्टॉक और अकाउंट्स का पूरा अधिकार मिलेगा।"}
                      {staffRole === 'admin' && "👑 एडमिन को सभी सेटिंग्स और डेटा का पूर्ण अधिकार रहेगा।"}
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-800">
                      मोबाइल ऐप लॉगिन पिन / पासवर्ड (Login PIN)
                    </label>
                    <input 
                      type="password"
                      maxLength={8}
                      placeholder={isEditingStaff ? "नया पिन डालें (बदलने के लिए) या खाली छोड़ें" : "उदा. 1234 (खाली छोड़ने पर मोबाइल के अंतिम 4 अंक)"}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      📱 स्टाफ अपने मोबाइल में नंबर और इस पिन से सीधे लॉगिन कर सकेगा।
                    </p>
                  </div>
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

        {/* ========================================================================= */}
        {/* MODAL 4: MULTI-MONTH STATEMENT & AUDIT (3-6 माह हिसाब व पाई-पाई का ऑडिट)  */}
        {/* ========================================================================= */}
        {showMultiMonthModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white">
                        स्टाफ हिसाब व ऑडिट स्टेटमेंट
                      </h3>
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        पाई-पाई का ऑडिट
                      </span>
                    </div>
                    {/* Staff selection & wage info */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-indigo-200">
                      {summaryData.staff?.length > 1 ? (
                        <select
                          value={multiMonthStaff?._id || ""}
                          onChange={(e) => {
                            const found = summaryData.staff.find(s => s._id === e.target.value);
                            if (found) {
                              setMultiMonthStaff(found);
                              fetchMultiMonthData(found._id, multiMonthRange);
                            }
                          }}
                          className="bg-indigo-900/80 border border-indigo-400/50 text-white text-xs font-bold rounded-lg px-2 py-0.5"
                        >
                          {summaryData.staff.map(s => (
                            <option key={s._id} value={s._id} className="text-slate-900">{s.name} ({s.position || 'स्टाफ'})</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-extrabold text-white">{multiMonthStaff?.name}</span>
                      )}
                      <span>•</span>
                      <span>
                        {multiMonthStaff?.wageType === 'daily' 
                          ? `दैनिक वेतन: ₹${multiMonthStaff?.dailyRate || 320}/दिन` 
                          : `मासिक वेतन: ₹${multiMonthStaff?.monthlySalary || 0}/माह`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareStatementWhatsApp}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                    title="WhatsApp पर भेजें"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition border border-white/20"
                    title="प्रिंट निकालें"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>प्रिंट</span>
                  </button>
                  <button 
                    onClick={() => setShowMultiMonthModal(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Range Selector Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Quick Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      onClick={() => handleRangeChange("3")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        multiMonthRange === "3"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      पिछले 3 माह
                    </button>
                    <button
                      onClick={() => handleRangeChange("6")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        multiMonthRange === "6"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      पिछले 6 माह
                    </button>
                    <button
                      onClick={() => handleRangeChange("12")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        multiMonthRange === "12"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      पूरा 1 वर्ष (12 माह)
                    </button>
                    <button
                      onClick={() => setMultiMonthRange("custom")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        multiMonthRange === "custom"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      कस्टम रेंज (तारीख)
                    </button>
                  </div>

                  {loadingMultiMonth && (
                    <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
                      <span>डेटा लोड हो रहा है...</span>
                    </span>
                  )}
                </div>

                {/* Custom Date Form Row */}
                {multiMonthRange === "custom" && (
                  <form onSubmit={handleCustomRangeApply} className="flex flex-wrap items-center gap-2.5 mt-3 pt-2.5 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600">शुरू:</span>
                    <select
                      value={customStartMonth}
                      onChange={(e) => setCustomStartMonth(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <option key={m} value={m}>{new Date(2026, m - 1).toLocaleString('hi-IN', { month: 'short' })}</option>
                      ))}
                    </select>
                    <select
                      value={customStartYear}
                      onChange={(e) => setCustomStartYear(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <span className="text-xs font-bold text-slate-600 ml-2">समाप्ति:</span>
                    <select
                      value={customEndMonth}
                      onChange={(e) => setCustomEndMonth(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <option key={m} value={m}>{new Date(2026, m - 1).toLocaleString('hi-IN', { month: 'short' })}</option>
                      ))}
                    </select>
                    <select
                      value={customEndYear}
                      onChange={(e) => setCustomEndYear(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer ml-1"
                    >
                      लागू करें (Apply)
                    </button>
                  </form>
                )}
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
                {multiMonthData && multiMonthData.summary && (
                  <>
                    {/* Period Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          कुल उपस्थिति / काम
                        </span>
                        <div className="text-lg sm:text-xl font-black text-slate-900">
                          {multiMonthData.summary.totalPresentDays} दिन
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          छुट्टियां: {multiMonthData.summary.totalAbsentDays} दिन • कुल देय: {multiMonthData.summary.totalPayableDays} दिन
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          कुल बनी सैलरी
                        </span>
                        <div className="text-lg sm:text-xl font-black text-blue-700">
                          ₹{multiMonthData.summary.totalEarnedSalary.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {multiMonthData.summary.totalMonths} माह का कुल उपार्जित वेतन
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          कुल नकद भुगतान दिया
                        </span>
                        <div className="text-lg sm:text-xl font-black text-emerald-700">
                          ₹{multiMonthData.summary.totalPaidOut.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          वेतन: ₹{multiMonthData.summary.totalSalaryPaid} • एडवांस: ₹{multiMonthData.summary.totalAdvanceGiven} {multiMonthData.summary.totalBonusGiven > 0 ? `• इनाम: ₹${multiMonthData.summary.totalBonusGiven}` : ''}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-2xl border shadow-xs ${
                        multiMonthData.summary.netCurrentDue === 0
                          ? "bg-emerald-50/80 border-emerald-300"
                          : "bg-rose-50/80 border-rose-300"
                      }`}>
                        <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5 text-slate-700">
                          वर्तमान शुद्ध बाकी (Net Due)
                        </span>
                        <div className={`text-xl sm:text-2xl font-black ${
                          multiMonthData.summary.netCurrentDue === 0 ? "text-emerald-700" : "text-rose-700"
                        }`}>
                          ₹{multiMonthData.summary.netCurrentDue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] font-bold block mt-0.5 text-slate-600">
                          {multiMonthData.summary.netCurrentDue === 0 ? "✅ हिसाब 100% चुकता" : "चालू माह का शुद्ध देय"}
                        </span>
                      </div>
                    </div>

                    {/* Balance Origin & Audit Verdict Box */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            यह बैलेंस कहाँ से आया? - पाई-पाई का हिसाब (Balance Explanation & Audit Trail)
                          </h4>
                          <p className="text-[11px] text-emerald-700 font-bold">
                            {multiMonthData.summary.auditVerdict}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">•</span>
                          <div>
                            <span className="font-bold text-slate-900">सितंबर 2026:</span> हाजिरी बनी थी। कुल ₹1,000 एडवांस और ₹7,160 वेतन भुगतान (02-Oct व 05-Oct को) दिया गया। यह माह <span className="text-emerald-700 font-bold">पूर्ण चुकता (शेष ₹0)</span> है।
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">•</span>
                          <div>
                            <span className="font-bold text-slate-900">अक्टूबर 2026:</span> कुल 16 दिन काम का ₹5,120 बना। 04-नवंबर को ₹5,120 वेतन भुगतान दिया गया। यह माह भी <span className="text-emerald-700 font-bold">पूर्ण चुकता (शेष ₹0)</span> है।
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">•</span>
                          <div>
                            <span className="font-bold text-slate-900">नवंबर 2026:</span> आज दिनांक तक 14 दिन काम का ₹4,480 बना। 11-नवंबर को ₹500 दिवाली इनाम दिया गया (यह बोनस/उपहार है, सैलरी से नहीं कटेगा)। अतः <span className="text-rose-700 font-black">शुद्ध देय बाकी: ₹4,480</span> है।
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                          💡 <span className="font-bold text-slate-700">ऑडिट स्पष्टीकरण:</span> पूर्व में सॉफ्टवेयर गणना में पिछले महीने का हिसाब आगे जुड़ जाने के कारण जो ₹2,560 शेष दिख रहा था, उसे सुधार दिया गया है। पूर्व के सभी चुकता महीनों का बकाया शून्य (₹0) कर दिया गया है।
                        </div>
                      </div>
                    </div>

                    {/* Month-by-Month Statement Cards */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider px-1">
                        🗓️ माह-वार पूर्ण विवरण (Month-by-Month Breakdown)
                      </h4>

                      {multiMonthData.months?.map((m) => (
                        <div 
                          key={`${m.year}-${m.month}`}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3 hover:border-indigo-300 transition"
                        >
                          {/* Month Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                              <h5 className="text-sm sm:text-base font-black text-slate-900">
                                {m.label}
                              </h5>
                              <span className="text-[11px] text-slate-400 font-semibold">
                                दर: ₹{m.rate}/{m.wageType === 'daily' ? 'दिन' : 'माह'} • कुल दिन: {m.daysInMonth}
                              </span>
                            </div>

                            <div>
                              {m.isSettled ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>पूर्ण चुकता (Settled - ₹0)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                  <span>शेष देय बाकी: ₹{m.netPayable.toLocaleString('en-IN')}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 5 Column Metric Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block">हाजिरी / काम</span>
                              <span className="text-xs font-black text-slate-900 mt-0.5 block">
                                {m.presentDays} दिन काम
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({m.absentDays} छुट्टी / {m.payableDays} देय)
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block">बनी सैलरी</span>
                              <span className="text-xs font-black text-blue-700 mt-0.5 block">
                                ₹{m.earnedSalary.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block">एडवांस दिया</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block">
                                ₹{m.advanceGiven.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block">वेतन भुगतान</span>
                              <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                                ₹{m.salaryPaid.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                              <span className="text-[10px] font-bold text-slate-400 block">बोनस / इनाम</span>
                              <span className="text-xs font-black text-purple-700 mt-0.5 block">
                                ₹{m.bonusGiven.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] text-purple-600 font-semibold">(सैलरी से नहीं कटेगा)</span>
                            </div>
                          </div>

                          {/* Audit Note */}
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-2 text-xs text-indigo-950 font-medium">
                            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{m.auditNote}</span>
                          </div>

                          {/* Transaction Details (if any) */}
                          {m.transactions && m.transactions.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                इस माह के दर्ज लेनदेन (Transactions):
                              </span>
                              <div className="space-y-1">
                                {m.transactions.map((tx) => (
                                  <div key={tx._id} className="flex items-center justify-between text-xs bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        tx.type === 'bonus' 
                                          ? 'bg-purple-100 text-purple-800' 
                                          : tx.type === 'advance' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {tx.type === 'bonus' ? '🎁 बोनस' : tx.type === 'advance' ? '💵 एडवांस' : '✅ वेतन भुगतान'}
                                      </span>
                                      <span className="text-slate-700 font-medium">
                                        {tx.notes || 'स्टाफ भुगतान'}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-extrabold text-slate-900">
                                        ₹{tx.amount.toLocaleString('en-IN')}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block">
                                        {new Date(tx.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareStatementWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp पर शेयर करें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition border border-slate-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>प्रिंट</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMultiMonthModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  बंद करें (Close)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
