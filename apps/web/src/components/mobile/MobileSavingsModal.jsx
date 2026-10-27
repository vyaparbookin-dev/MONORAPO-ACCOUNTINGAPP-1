import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  PiggyBank,
  Plus,
  Trash2,
  Share2,
  RefreshCw,
  Calendar,
  Layers,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  X,
  CreditCard,
  Edit2,
  Clock,
  ShieldCheck,
  Award,
  Calculator
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

const SAVING_TYPES = [
  { id: "FD", label: "Fixed Deposit (FD)", icon: "🏦", desc: "फिक्स्ड डिपॉजिट - एकमुश्त जमा" },
  { id: "RD", label: "Recurring Deposit (RD)", icon: "🗓️", desc: "रिकरिंग डिपॉजिट - मासिक बचत" },
  { id: "SIP", label: "SIP / Mutual Fund", icon: "📈", desc: "एसआईपी / म्यूचुअल फंड" },
  { id: "PPF", label: "PPF / Post Office", icon: "🏛️", desc: "पब्लिक प्रॉविडेंट फंड / डाकघर" },
  { id: "LIC", label: "LIC / Insurance Policy", icon: "🛡️", desc: "एलआईसी / जीवन बीमा प्रीमियम" },
  { id: "GOLD", label: "Gold / SGB / Digital Gold", icon: "🪙", desc: "सोना / गोल्ड बॉन्ड" },
  { id: "OTHER", label: "अन्य बचत (Other Savings)", icon: "💰", desc: "अन्य निजी या व्यापारिक निवेश" }
];

// 🔄 Auto-Debit Execution Engine for Recurring Savings (RD, SIP, PPF, etc.)
export const processAutoSavingsDebits = async (list, companyId, onExpenseAdded) => {
  if (!Array.isArray(list) || list.length === 0) return { updatedList: list, debitedCount: 0, newExpenses: [] };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`; // e.g. "2026-10"
  const todayStr = now.toISOString().split("T")[0];

  let hasChanges = false;
  let debitedCount = 0;
  const newExpenses = [];

  const updatedList = list.map(item => {
    if (!item) return item;
    const type = item.savingsType || "RD";
    // Auto-debit applies only to recurring savings (RD, SIP, PPF, LIC, OTHER) and not one-time FD or closed
    if (type === "FD" || item.status === "CLOSED") return item;

    // Check if auto-debit is enabled (default is true unless explicitly false)
    const isAutoEnabled = item.isAutoDebitEnabled !== false;
    if (!isAutoEnabled) return item;

    const dueDay = Number(item.dueDayOfMonth || 26);
    const lastMonth = String(item.lastAutoDebitMonth || "");

    // Check if today is on or past due day (e.g. 26th) AND not debited in this month yet
    const isDueThisMonth = currentDay >= dueDay && lastMonth !== currentMonthKey;

    if (isDueThisMonth) {
      const instAmt = Number(item.installmentAmount || 0);
      if (instAmt <= 0) return item;

      hasChanges = true;
      debitedCount++;

      const monthName = now.toLocaleDateString("hi-IN", { month: "long", year: "numeric" });
      const newInst = {
        amount: instAmt,
        date: todayStr,
        sourceOfFund: item.autoDebitFundSource || "shop_cash",
        notes: `🔄 स्वतः बचत RD किस्त (${monthName}) - दुकान गल्ला`,
        isAutoDebited: true,
        paidAt: now.toISOString()
      };

      const existingInsts = Array.isArray(item.installments) ? [...item.installments] : [];
      const alreadyHasThisMonth = existingInsts.some(x =>
        x.isAutoDebited && String(x.date || "").startsWith(currentMonthKey)
      );

      if (!alreadyHasThisMonth) {
        existingInsts.push(newInst);
      }

      const explicitPaidCount = Number(item.alreadyPaidCount || 0);
      const newPaidCount = Math.max(explicitPaidCount + 1, existingInsts.length);
      const newTotalDeposited = Number(item.totalDeposited || 0) + instAmt;

      // Expense object for shop cash / ledger
      const autoExp = {
        id: "exp_rd_auto_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        _id: "exp_rd_auto_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        companyId: String(companyId || "").trim(),
        title: `🔄 स्वतः RD बचत किस्त - ${item.title}`,
        description: `मासिक RD स्वतः जमा (${monthName}): दुकान गल्ले से ₹${instAmt} बचत खाते में जमा`,
        amount: instAmt,
        expenseType: "business",
        category: "मासिक बचत व निवेश (RD/SIP/FD)",
        familyMember: "खुद (Self)",
        paymentMode: "CASH_DRAWER",
        date: todayStr,
        createdAt: now.toISOString(),
        isAutoRdExpense: true,
        savingsId: item._id || item.id
      };
      newExpenses.push(autoExp);

      return {
        ...item,
        isAutoDebitEnabled: true,
        dueDayOfMonth: dueDay,
        installments: existingInsts,
        alreadyPaidCount: newPaidCount,
        alreadyDepositedAmount: newTotalDeposited,
        totalDeposited: newTotalDeposited,
        currentValue: newTotalDeposited,
        lastAutoDebitMonth: currentMonthKey,
        lastPaidDate: todayStr
      };
    }

    return item;
  });

  if (hasChanges) {
    try {
      localStorage.setItem("vb_local_savings", JSON.stringify(updatedList));
      if (companyId) {
        localStorage.setItem(`vb_local_savings_${companyId}`, JSON.stringify(updatedList));
      }
    } catch (e) {}

    if (newExpenses.length > 0) {
      try {
        let localExp = JSON.parse(localStorage.getItem("vb_local_expenses") || "[]");
        localExp = [...newExpenses, ...localExp];
        localStorage.setItem("vb_local_expenses", JSON.stringify(localExp));
        if (companyId) {
          localStorage.setItem(`vb_local_expenses_${companyId}`, JSON.stringify(localExp));
        }
      } catch (e) {}

      newExpenses.forEach(exp => {
        if (typeof onExpenseAdded === "function") {
          onExpenseAdded(exp);
        }
        api.post("/api/expense", exp).catch(() => {});
      });
    }

    updatedList.forEach(item => {
      if (item.lastAutoDebitMonth === currentMonthKey) {
        const id = item._id || item.id;
        api.put(`/api/savings/${id}`, item).catch(() => {});
      }
    });
  }

  return { updatedList, debitedCount, newExpenses };
};

export default function MobileSavingsModal({ isOpen, onClose, onExpenseAdded }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [savingsList, setSavingsList] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
        const candidateKeys = [
          "vb_local_savings",
          currentCoId ? `vb_local_savings_${currentCoId}` : null,
          "savings",
          "local_savings"
        ].filter(Boolean);
        for (const k of candidateKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, personal, business

  // Add / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const calculateMaturity = (startStr, years) => {
    try {
      if (!startStr) return "";
      const d = new Date(startStr);
      if (isNaN(d.getTime())) return "";
      const y = Number(years) || 1;
      d.setFullYear(d.getFullYear() + y);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const getElapsedMonths = (startDateStr, dueDayStr, maxMonths) => {
    if (!startDateStr) return 0;
    try {
      const start = new Date(startDateStr);
      const now = new Date();
      if (isNaN(start.getTime()) || start > now) return 0;
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      const dueDay = Number(dueDayStr || 26);
      if (now.getDate() >= dueDay) {
        months += 1;
      }
      const limit = Number(maxMonths) || 360;
      return Math.min(Math.max(0, months), limit);
    } catch {
      return 0;
    }
  };

  const calculateExpectedMaturity = (itemOrForm) => {
    if (!itemOrForm) return 0;
    const explicit = Number(itemOrForm.expectedMaturityAmount || 0);
    if (explicit > 0) return explicit;

    const type = itemOrForm.savingsType || "RD";
    const rate = Number(itemOrForm.interestRate || 0);
    const tenureYears = Number(itemOrForm.tenureYears || 1);
    const freq = itemOrForm.frequency || "monthly";
    const totalMonths = tenureYears * (freq === "quarterly" ? 4 : (freq === "yearly" ? 1 : 12));
    const instAmt = Number(itemOrForm.installmentAmount || 0);
    const initDeposit = Number(itemOrForm.initialDeposit || itemOrForm.totalDeposited || 0);

    if (type === "FD") {
      if (initDeposit <= 0) return 0;
      if (rate <= 0) return initDeposit;
      // Standard Indian Bank quarterly compounded FD formula: A = P * (1 + r/400)^(4*t)
      return Math.round(initDeposit * Math.pow(1 + rate / 400, 4 * tenureYears));
    }

    // RD / SIP / PPF / LIC / OTHER
    const totalPrincipal = totalMonths * instAmt;
    if (totalPrincipal <= 0) return Number(itemOrForm.totalDeposited || 0);
    if (rate <= 0) return totalPrincipal;

    // RD quarterly compounding (Indian Banking standard)
    const i = rate / 400; // quarterly rate
    let maturity = 0;
    for (let m = 1; m <= totalMonths; m++) {
      const quarters = (totalMonths - m + 1) / 3;
      maturity += instAmt * Math.pow(1 + i, quarters);
    }
    return Math.round(maturity);
  };

  const generatePastInstallments = (startDateStr, paidCount, instAmt, fundSource, dueDayOfMonth, totalPastAmt) => {
    const result = [];
    const base = startDateStr ? new Date(startDateStr) : new Date();
    const dueDay = Number(dueDayOfMonth || 5);
    const count = Number(paidCount || 0);
    const total = Number(totalPastAmt || 0);
    const perInst = Number(instAmt || 0);

    for (let i = 0; i < count; i++) {
      const instDate = new Date(base);
      instDate.setMonth(base.getMonth() + i);
      instDate.setDate(dueDay);

      let thisAmt = perInst;
      if (i === count - 1 && total > 0) {
        const allocated = perInst * (count - 1);
        if (allocated + perInst !== total && total > allocated) {
          thisAmt = Math.max(0, total - allocated);
        }
      }

      result.push({
        amount: thisAmt > 0 ? thisAmt : perInst,
        date: instDate.toISOString().split("T")[0],
        sourceOfFund: fundSource || "business_salary",
        notes: `किस्त #${i + 1} (${instDate.toLocaleDateString("hi-IN", { month: "short", year: "numeric" })})`
      });
    }
    return result;
  };

  const getRdMetrics = (item) => {
    if (!item) return {};
    const type = item.savingsType || "RD";
    const instAmt = Number(item.installmentAmount || 0);

    // Explicit recorded installments in the array
    const recordedList = Array.isArray(item.installments) ? item.installments : [];
    const recordedCount = recordedList.length;
    const recordedSum = recordedList.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    const autoDebitedCount = recordedList.filter(x => x.isAutoDebited).length;
    const manualDebitedCount = recordedList.filter(x => !x.isAutoDebited).length;

    // Explicit past data if user entered alreadyPaidCount / alreadyDepositedAmount
    const explicitPaidCount = Number(item.alreadyPaidCount || 0);
    const explicitPastAmt = Number(item.alreadyDepositedAmount || 0);
    const rawDeposited = Number(item.totalDeposited || item.currentValue || 0);

    let totalDeposited = 0;
    let paidCount = 0;

    if (type === "FD") {
      totalDeposited = Number(item.initialDeposit || item.totalDeposited || item.currentValue || 0);
      paidCount = totalDeposited > 0 ? 1 : 0;
    } else {
      if (explicitPastAmt > 0) {
        totalDeposited = Math.max(explicitPastAmt, recordedSum);
        paidCount = explicitPaidCount > 0 ? explicitPaidCount : (instAmt > 0 ? Math.round(totalDeposited / instAmt) : recordedCount);
      } else if (explicitPaidCount > 0) {
        paidCount = explicitPaidCount;
        totalDeposited = recordedSum > (paidCount * instAmt) ? recordedSum : (paidCount * instAmt);
      } else if (recordedList.length > 0) {
        totalDeposited = recordedSum;
        paidCount = instAmt > 0 ? Math.round(totalDeposited / instAmt) : recordedCount;
      } else {
        totalDeposited = rawDeposited;
        paidCount = explicitPaidCount > 0 ? explicitPaidCount : (instAmt > 0 && rawDeposited > 0 ? Math.round(rawDeposited / instAmt) : 0);
      }
    }

    // Dynamic Tenure & Months: If user set maturity date or paid 42, 36, or 30 installments, calculate real tenure!
    let calcMonthsFromMaturity = 0;
    if (item.startDate && item.maturityDate) {
      try {
        const sD = new Date(item.startDate);
        const mD = new Date(item.maturityDate);
        if (!isNaN(sD.getTime()) && !isNaN(mD.getTime()) && mD > sD) {
          calcMonthsFromMaturity = (mD.getFullYear() - sD.getFullYear()) * 12 + (mD.getMonth() - sD.getMonth());
        }
      } catch (e) {}
    }

    const rawTenureYears = Number(item.tenureYears || 1);
    const freqFactor = item.frequency === "quarterly" ? 4 : (item.frequency === "yearly" ? 1 : 12);
    const baseTenureMonths = Math.max(rawTenureYears * freqFactor, calcMonthsFromMaturity);

    // Total months expands dynamically to cover paid installments
    const totalMonths = Math.max(
      baseTenureMonths,
      paidCount > 0 ? (paidCount <= baseTenureMonths ? baseTenureMonths : Math.ceil(paidCount / 12) * 12) : baseTenureMonths
    );
    const tenureYears = Math.max(rawTenureYears, Math.ceil(totalMonths / 12));

    // Due months up to today from Start Date (never capped to 12!)
    const dueMonths = type === "FD" ? 1 : getElapsedMonths(item.startDate, item.dueDayOfMonth, Math.max(totalMonths, 360));

    // Overdue / Pending installments
    const overdueCount = type === "FD" ? 0 : Math.max(0, dueMonths - paidCount);
    const overdueAmount = overdueCount * instAmt;

    // Remaining future installments to complete the tenure
    const remainingCount = type === "FD" ? 0 : Math.max(0, totalMonths - paidCount);
    const remainingAmount = remainingCount * instAmt;

    // Progress percentage based on actual deposits
    const progressPct = totalMonths > 0 ? Math.min(100, Math.round((paidCount / totalMonths) * 100)) : 0;

    // Expected maturity amount for this individual card
    const expectedMaturity = calculateExpectedMaturity({
      ...item,
      tenureYears,
      installmentAmount: instAmt,
      totalDeposited
    });
    const totalPrincipal = type === "FD" ? totalDeposited : (totalMonths * instAmt);
    const interestGain = Math.max(0, expectedMaturity - totalPrincipal);

    return {
      tenureYears,
      totalMonths,
      instAmt,
      elapsedMonths: dueMonths,
      dueMonths,
      paidCount,
      totalDeposited,
      autoDebitedCount,
      manualDebitedCount,
      overdueCount,
      overdueAmount,
      remainingCount,
      remainingAmount,
      progressPct,
      expectedMaturity,
      interestGain,
      totalPrincipal
    };
  };

  const getUpcomingSchedule = (savingItem) => {
    if (!savingItem || savingItem.savingsType === "FD") return [];
    const m = getRdMetrics(savingItem);
    const instAmt = m.instAmt;
    const paidCount = m.paidCount;
    const remainingCount = m.remainingCount;

    if (remainingCount <= 0 || instAmt <= 0) return [];

    const schedule = [];
    const baseDate = savingItem.startDate ? new Date(savingItem.startDate) : new Date();
    const dueDay = Number(savingItem.dueDayOfMonth || 5);

    for (let i = 1; i <= Math.min(remainingCount, 12); i++) {
      const futureDate = new Date(baseDate);
      futureDate.setMonth(baseDate.getMonth() + paidCount + (i - 1));
      futureDate.setDate(dueDay);

      schedule.push({
        installmentNum: paidCount + i,
        monthLabel: futureDate.toLocaleDateString("hi-IN", { month: "long", year: "numeric" }),
        dueDate: futureDate.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }),
        amount: instAmt
      });
    }
    return schedule;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const getMonthYearTitle = (dateStr, idx = 1) => {
    if (!dateStr) return `किस्त #${idx}`;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `किस्त #${idx}`;
      return d.toLocaleDateString("hi-IN", { month: "long", year: "numeric" });
    } catch {
      return `किस्त #${idx}`;
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    savingsType: "RD",
    institutionName: "",
    accountNumber: "",
    classification: "personal",
    fundSource: "business_salary",
    frequency: "monthly",
    installmentAmount: "",
    initialDeposit: "",
    interestRate: "",
    startDate: new Date().toISOString().split("T")[0],
    tenureYears: "1",
    isOldOngoingAccount: false,
    alreadyDepositedAmount: "",
    alreadyPaidCount: "",
    maturityDate: "",
    dueDayOfMonth: "26",
    isAutoDebitEnabled: true,
    autoDebitFundSource: "shop_cash",
    expectedMaturityAmount: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  // Installment Pay Modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedSavingForPay, setSelectedSavingForPay] = useState(null);
  const [payData, setPayData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    sourceOfFund: "business_salary",
    notes: ""
  });
  const [paying, setPaying] = useState(false);

  // History Drawer Modal
  const [viewHistoryItem, setViewHistoryItem] = useState(null);

  // In-place Passbook Installment Editing & Adding Past Deposits
  const [editingInstallmentIdx, setEditingInstallmentIdx] = useState(null);
  const [editInstData, setEditInstData] = useState({
    date: "",
    amount: "",
    sourceOfFund: "shop_cash",
    notes: ""
  });
  const [isAddingPastInst, setIsAddingPastInst] = useState(false);
  const [newPastInstData, setNewPastInstData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    sourceOfFund: "shop_cash",
    notes: ""
  });

  // Reactive date & tenure handlers for Add/Edit Form
  const handleStartDateChange = (newDate) => {
    const sD = new Date(newDate);
    let newMatDate = formData.maturityDate;
    let newTenure = Number(formData.tenureYears || 1);

    if (formData.maturityDate) {
      const mD = new Date(formData.maturityDate);
      if (!isNaN(sD.getTime()) && !isNaN(mD.getTime()) && mD > sD) {
        const diffMonths = (mD.getFullYear() - sD.getFullYear()) * 12 + (mD.getMonth() - sD.getMonth());
        newTenure = Math.max(1, Math.round(diffMonths / 12));
      }
    } else {
      newMatDate = calculateMaturity(newDate, newTenure);
    }

    const elapsed = getElapsedMonths(newDate, formData.dueDayOfMonth, newTenure * 12);
    const inst = Number(formData.installmentAmount || 0);

    setFormData(prev => ({
      ...prev,
      startDate: newDate,
      maturityDate: newMatDate,
      tenureYears: String(newTenure),
      isOldOngoingAccount: prev.isOldOngoingAccount || elapsed > 0,
      alreadyPaidCount: prev.alreadyPaidCount ? prev.alreadyPaidCount : (elapsed > 0 ? String(elapsed) : ""),
      alreadyDepositedAmount: prev.alreadyDepositedAmount ? prev.alreadyDepositedAmount : (elapsed > 0 && inst > 0 ? String(elapsed * inst) : "")
    }));
  };

  const handleMaturityDateChange = (newMatDate) => {
    let newTenure = Number(formData.tenureYears || 1);
    if (formData.startDate && newMatDate) {
      const sD = new Date(formData.startDate);
      const mD = new Date(newMatDate);
      if (!isNaN(sD.getTime()) && !isNaN(mD.getTime()) && mD > sD) {
        const diffMonths = (mD.getFullYear() - sD.getFullYear()) * 12 + (mD.getMonth() - sD.getMonth());
        newTenure = Math.max(1, Math.round(diffMonths / 12));
      }
    }

    setFormData(prev => ({
      ...prev,
      maturityDate: newMatDate,
      tenureYears: String(newTenure)
    }));
  };

  const handleTenureChange = (yr) => {
    const newMatDate = calculateMaturity(formData.startDate, yr);
    setFormData(prev => ({
      ...prev,
      tenureYears: String(yr),
      maturityDate: newMatDate
    }));
  };

  // Open Advance RD Payment dialog (prefilled with shop cash & selected RD)
  const handleOpenAdvancePay = (item) => {
    const targetItem = item || savingsList.find(s => s.savingsType !== "FD" && s.status !== "CLOSED") || savingsList[0];
    if (!targetItem) {
      alert("कृपया पहले एक RD बचत खाता जोड़ें!");
      return;
    }
    setSelectedSavingForPay(targetItem);
    setPayData({
      amount: String(targetItem.installmentAmount || ""),
      date: new Date().toISOString().split("T")[0],
      sourceOfFund: "shop_cash",
      notes: "⚡ एडवांस RD किस्त जमा"
    });
    setIsPayOpen(true);
  };

  // 1-Click Sync Helper for user's 3 real-world RD accounts
  const handleQuickSync3Rds = async () => {
    const rdItems = savingsList.filter(s => s.savingsType === "RD");
    if (rdItems.length === 0) {
      alert("कोई RD खाता नहीं मिला। कृपया पहले 'नया खाता जोड़ें' बटन से RD खाता बनाएं।");
      return;
    }

    if (!confirm(
      "क्या आप अपने 3 RD खातों को सही शुरुआत तारीख, परिपक्वता तारीख और वास्तविक जमा किस्तों (31, 36, 43 किस्तें) के साथ सिंक करना चाहते हैं?\n\n" +
      "1. RD 1 (मैच्योरिटी 16 मार्च 2029): 5 वर्ष (60 माह) • 31 किस्तें जमा • 29 बाकी\n" +
      "2. RD 2 (मैच्योरिटी 26 अक्टूबर 2028): 5 वर्ष (60 माह) • 36 किस्तें जमा • 24 बाकी\n" +
      "3. RD 3 (मैच्योरिटी 26 मार्च 2028): 5 वर्ष (60 माह) • 43 किस्तें जमा • 17 बाकी\n\n" +
      "सिस्टम प्रत्येक खाते की पूरी तारीखवार पासबुक भी तुरंत तैयार कर देगा।"
    )) return;

    const presets = [
      {
        matchKey: "2029",
        title: "SBI RD (16 मार्च 2029)",
        startDate: "2024-03-16",
        maturityDate: "2029-03-16",
        tenureYears: 5,
        dueDayOfMonth: 16,
        paidCount: 31,
      },
      {
        matchKey: "2028_oct",
        title: "RD खाता (अक्टूबर 2028)",
        startDate: "2023-10-26",
        maturityDate: "2028-10-26",
        tenureYears: 5,
        dueDayOfMonth: 26,
        paidCount: 36,
      },
      {
        matchKey: "2028_mar",
        title: "RD खाता (मार्च 2028)",
        startDate: "2023-03-26",
        maturityDate: "2028-03-26",
        tenureYears: 5,
        dueDayOfMonth: 26,
        paidCount: 43,
      }
    ];

    let updatedList = [...savingsList];
    let count = 0;

    rdItems.forEach((rd, idx) => {
      let preset = presets[idx % presets.length];
      const str = `${rd.title || ''} ${rd.maturityDate || ''}`.toLowerCase();
      if (str.includes("2029") || str.includes("16")) {
        preset = presets[0];
      } else if (str.includes("oct") || str.includes("10")) {
        preset = presets[1];
      } else if (str.includes("mar") || str.includes("03")) {
        preset = presets[2];
      }

      count++;
      const id = rd._id || rd.id;
      const instAmt = Number(rd.installmentAmount || 3000);
      const totalDep = preset.paidCount * instAmt;
      const pastInsts = generatePastInstallments(
        preset.startDate,
        preset.paidCount,
        instAmt,
        rd.fundSource || "shop_cash",
        preset.dueDayOfMonth,
        totalDep
      );

      const updatedRd = {
        ...rd,
        title: rd.title && !rd.title.includes("खाता") ? rd.title : preset.title,
        startDate: preset.startDate,
        maturityDate: preset.maturityDate,
        tenureYears: preset.tenureYears,
        dueDayOfMonth: preset.dueDayOfMonth,
        installmentAmount: instAmt,
        alreadyPaidCount: preset.paidCount,
        alreadyDepositedAmount: totalDep,
        totalDeposited: totalDep,
        currentValue: totalDep,
        installments: pastInsts,
        isAutoDebitEnabled: rd.isAutoDebitEnabled !== false
      };

      updatedList = updatedList.map(s => (s._id || s.id) === id ? updatedRd : s);
      api.put(`/api/savings/${id}`, updatedRd).catch(() => {});
    });

    setSavingsList(updatedList);
    try {
      localStorage.setItem("vb_local_savings", JSON.stringify(updatedList));
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      if (currentCoId) {
        localStorage.setItem(`vb_local_savings_${currentCoId}`, JSON.stringify(updatedList));
      }
    } catch (e) {}

    alert(`✅ ${count} RD खाते सफलतापूर्वक सिंक हो गए!\n\nअब तारीखवार पासबुक, भरी किस्तें और बाकी किस्तों का हिसाब बिल्कुल सही दिखेगा।`);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSavings();
    }
  }, [isOpen, selectedCompany]);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      let serverData = [];
      try {
        const res = await api.get("/api/savings");
        serverData = res?.data?.savings || res?.savings || res?.data || [];
      } catch (err) {
        console.warn("Server savings fetch fallback:", err);
      }

      let localData = [];
      try {
        if (typeof localStorage !== "undefined") {
          const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
          const candidateKeys = [
            "vb_local_savings",
            currentCoId ? `vb_local_savings_${currentCoId}` : null,
            "savings",
            "local_savings"
          ].filter(Boolean);
          for (const k of candidateKeys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) localData.push(...parsed);
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // Resilient ID extraction
      const map = new Map();
      const getSavKey = (item, idx) => String(item._id || item.id || item.accountNumber || (item.title ? `${item.title}_${item.savingsType || ''}` : '') || `sav_${idx}`);
      (Array.isArray(serverData) ? serverData : []).forEach((item, idx) => {
        const id = getSavKey(item, idx);
        if (id) map.set(id, item);
      });
      (Array.isArray(localData) ? localData : []).forEach((item, idx) => {
        const id = getSavKey(item, idx);
        if (id && !map.has(id)) map.set(id, item);
      });

      const list = Array.from(map.values());
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const { updatedList } = await processAutoSavingsDebits(list, currentCoId, onExpenseAdded);
      const finalList = updatedList || list;
      setSavingsList(finalList);
      if (finalList.length > 0 && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("vb_local_savings", JSON.stringify(finalList));
          if (currentCoId) {
            localStorage.setItem(`vb_local_savings_${currentCoId}`, JSON.stringify(finalList));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error loading savings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("कृपया स्कीम या बचत का नाम दर्ज करें!");
      return;
    }

    const type = formData.savingsType || "RD";
    const instAmt = Number(formData.installmentAmount || 0);
    const initDeposit = Number(formData.initialDeposit || 0);
    const pastAmt = Number(formData.alreadyDepositedAmount || 0);
    const pastCount = Number(formData.alreadyPaidCount || 0);

    // Compute elapsed months up to today from Start Date
    const elapsedMonths = getElapsedMonths(formData.startDate, formData.dueDayOfMonth, 360);

    // Effective paid count: directly preserve user input (42, 36, 30, etc.)
    const effectivePaidCount = type === "FD"
      ? 1
      : (pastCount > 0 ? pastCount : (pastAmt > 0 && instAmt > 0 ? Math.round(pastAmt / instAmt) : 0));

    // Effective deposited amount
    const computedTotal = type === "FD"
      ? (initDeposit > 0 ? initDeposit : pastAmt)
      : (pastAmt > 0 ? pastAmt : effectivePaidCount * instAmt);

    // Compute dynamic tenure from Start Date to Maturity Date
    let calcMonthsFromMaturity = 0;
    if (formData.startDate && formData.maturityDate) {
      try {
        const sD = new Date(formData.startDate);
        const mD = new Date(formData.maturityDate);
        if (!isNaN(sD.getTime()) && !isNaN(mD.getTime()) && mD > sD) {
          calcMonthsFromMaturity = (mD.getFullYear() - sD.getFullYear()) * 12 + (mD.getMonth() - sD.getMonth());
        }
      } catch (e) {}
    }

    const rawTenure = Number(formData.tenureYears || 1);
    const freqFactor = formData.frequency === "quarterly" ? 4 : (formData.frequency === "yearly" ? 1 : 12);
    const baseTenureMonths = Math.max(rawTenure * freqFactor, calcMonthsFromMaturity);
    const totalMonths = Math.max(
      baseTenureMonths,
      effectivePaidCount > baseTenureMonths ? Math.ceil(effectivePaidCount / 12) * 12 : baseTenureMonths
    );
    const tenureYears = Math.max(rawTenure, Math.ceil(totalMonths / 12));

    const maturityDate = formData.maturityDate || calculateMaturity(formData.startDate, tenureYears);

    const calcExpectedMaturity = Number(formData.expectedMaturityAmount || 0) > 0
      ? Number(formData.expectedMaturityAmount)
      : calculateExpectedMaturity({
          ...formData,
          tenureYears,
          installmentAmount: instAmt,
          initialDeposit: initDeposit,
          totalDeposited: computedTotal
        });

    const dueDay = Number(formData.dueDayOfMonth || 26);
    const isAutoDebitEnabled = formData.isAutoDebitEnabled !== false;

    const payload = {
      ...formData,
      isAutoDebitEnabled,
      dueDayOfMonth: dueDay,
      tenureYears,
      installmentAmount: instAmt,
      initialDeposit: type === "FD" ? initDeposit : 0,
      alreadyPaidCount: effectivePaidCount,
      alreadyDepositedAmount: computedTotal,
      totalDeposited: computedTotal,
      currentValue: computedTotal,
      interestRate: Number(formData.interestRate || 0),
      expectedMaturityAmount: calcExpectedMaturity,
      maturityDate,
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      if (editingId) {
        // Update existing account
        const existing = savingsList.find(x => (x._id || x.id) === editingId);
        let updatedInsts = Array.isArray(existing?.installments) ? [...existing.installments] : [];

        // If installments are fewer than paid count, generate full date-wise passbook entries
        if (type !== "FD" && effectivePaidCount > 0 && instAmt > 0 && (updatedInsts.length < effectivePaidCount || pastAmt !== Number(existing?.totalDeposited))) {
          updatedInsts = generatePastInstallments(payload.startDate, effectivePaidCount, instAmt, payload.fundSource, payload.dueDayOfMonth, computedTotal);
        }

        const updatePayload = {
          ...payload,
          installments: updatedInsts,
          totalDeposited: computedTotal,
          currentValue: computedTotal
        };

        try {
          await api.put(`/api/savings/${editingId}`, updatePayload);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
        local = local.map(x => ((x._id || x.id) === editingId ? { ...x, ...updatePayload } : x));
        localStorage.setItem("vb_local_savings", JSON.stringify(local));
      } else {
        // Create new account
        const newId = "sav_" + Date.now();
        const pastInstallments = type !== "FD" && effectivePaidCount > 0 && instAmt > 0
          ? generatePastInstallments(payload.startDate, effectivePaidCount, instAmt, payload.fundSource, payload.dueDayOfMonth, computedTotal)
          : (type === "FD" && initDeposit > 0
              ? [{
                  amount: initDeposit,
                  date: payload.startDate || new Date().toISOString().split("T")[0],
                  sourceOfFund: payload.fundSource,
                  notes: "FD Principal Deposit / फिक्स्ड डिपॉजिट जमा"
                }]
              : []);

        const newRecord = {
          ...payload,
          _id: newId,
          id: newId,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
          installments: pastInstallments
        };

        try {
          await api.post("/api/savings", newRecord);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
        local.unshift(newRecord);
        localStorage.setItem("vb_local_savings", JSON.stringify(local));
      }

      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
      fetchSavings();
    } catch (err) {
      alert("सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

    const handleOpenEdit = (item) => {
    setEditingId(item._id || item.id);
    const m = getRdMetrics(item);
    const sDate = item.startDate ? String(item.startDate).split("T")[0] : new Date().toISOString().split("T")[0];
    const tYrs = String(m.tenureYears || item.tenureYears || "1");

    setFormData({
      title: item.title || "",
      savingsType: item.savingsType || "RD",
      institutionName: item.institutionName || "",
      accountNumber: item.accountNumber || "",
      classification: item.classification || "personal",
      fundSource: item.fundSource || "business_salary",
      frequency: item.frequency || "monthly",
      installmentAmount: String(item.installmentAmount || ""),
      initialDeposit: String(item.initialDeposit || ""),
      interestRate: String(item.interestRate || ""),
      startDate: sDate,
      tenureYears: tYrs,
      isOldOngoingAccount: m.paidCount > 0,
      alreadyDepositedAmount: String(m.totalDeposited || item.alreadyDepositedAmount || ""),
      alreadyPaidCount: String(m.paidCount || item.alreadyPaidCount || ""),
      maturityDate: item.maturityDate ? String(item.maturityDate).split("T")[0] : calculateMaturity(sDate, tYrs),
      dueDayOfMonth: String(item.dueDayOfMonth || "26"),
      isAutoDebitEnabled: item.isAutoDebitEnabled !== false,
      autoDebitFundSource: item.autoDebitFundSource || "shop_cash",
      expectedMaturityAmount: String(item.expectedMaturityAmount || (m.expectedMaturity || "")),
      notes: item.notes || ""
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      title: "",
      savingsType: "RD",
      institutionName: "",
      accountNumber: "",
      classification: "personal",
      fundSource: "business_salary",
      frequency: "monthly",
      installmentAmount: "",
      initialDeposit: "",
      interestRate: "",
      startDate: today,
      tenureYears: "1",
      isOldOngoingAccount: false,
      alreadyDepositedAmount: "",
      alreadyPaidCount: "",
      maturityDate: calculateMaturity(today, 1),
      dueDayOfMonth: "26",
      isAutoDebitEnabled: true,
      autoDebitFundSource: "shop_cash",
      expectedMaturityAmount: "",
      notes: ""
    });
  };

  // 🔄 1-Click Toggle for Automated vs Manual Recurring Deposit
  const handleToggleAutoDebit = async (item) => {
    const id = item._id || item.id;
    const currentVal = item.isAutoDebitEnabled !== false;
    const newVal = !currentVal;

    const updatedItem = {
      ...item,
      isAutoDebitEnabled: newVal,
      dueDayOfMonth: Number(item.dueDayOfMonth || 26)
    };

    setSavingsList(prev => prev.map(s => (s._id || s.id) === id ? updatedItem : s));

    try {
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.map(s => (s._id || s.id) === id ? updatedItem : s);
      localStorage.setItem("vb_local_savings", JSON.stringify(local));
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      if (currentCoId) {
        localStorage.setItem(`vb_local_savings_${currentCoId}`, JSON.stringify(local));
      }
    } catch (e) {}

    try {
      await api.put(`/api/savings/${id}`, updatedItem);
    } catch (e) {}

    if (newVal) {
      alert(`✅ स्वतः ऑटो-जमा चालू कर दिया गया!\n\nहर माह ${updatedItem.dueDayOfMonth || 26} तारीख को यह किस्त दुकान गल्ले से खुद-ब-खुद कट जाएगी और आज के खर्च में दर्ज हो जाएगी।`);
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const { updatedList } = await processAutoSavingsDebits([updatedItem], currentCoId, onExpenseAdded);
      if (updatedList && updatedList[0]) {
        setSavingsList(prev => prev.map(s => (s._id || s.id) === id ? updatedList[0] : s));
      }
    } else {
      alert(`✋ मैन्युअल मोड सक्रिय!\n\nअब स्वतः ऑटो-कट बंद है। जब भी आप पैसे देंगे, 'पैसे डालें' बटन पर क्लिक करके मैन्युअल दर्ज करेंगे।`);
    }
  };

  // ✏️ Quick Edit Due Day Shortcut (उदा. 26 तारीख)
  const handleQuickEditDueDay = async (item) => {
    const id = item._id || item.id;
    const currentDay = String(item.dueDayOfMonth || 26);
    const input = window.prompt(`हर माह RD किस्त कटने की तारीख दर्ज करें (1 से 31):\n(वर्तमान तारीख: ${currentDay})`, currentDay);
    if (!input) return;

    const parsedDay = parseInt(input.trim(), 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      alert("कृपया 1 से 31 के बीच कोई सही तारीख दर्ज करें!");
      return;
    }

    const updatedItem = {
      ...item,
      dueDayOfMonth: parsedDay
    };

    setSavingsList(prev => prev.map(s => (s._id || s.id) === id ? updatedItem : s));

    try {
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.map(s => (s._id || s.id) === id ? updatedItem : s);
      localStorage.setItem("vb_local_savings", JSON.stringify(local));
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      if (currentCoId) {
        localStorage.setItem(`vb_local_savings_${currentCoId}`, JSON.stringify(local));
      }
    } catch (e) {}

    try {
      await api.put(`/api/savings/${id}`, updatedItem);
    } catch (e) {}

    alert(`✅ RD किस्त देय तारीख बदलकर हर माह ${parsedDay} तारीख सेट कर दी गई!`);

    if (updatedItem.isAutoDebitEnabled !== false) {
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const { updatedList } = await processAutoSavingsDebits([updatedItem], currentCoId, onExpenseAdded);
      if (updatedList && updatedList[0]) {
        setSavingsList(prev => prev.map(s => (s._id || s.id) === id ? updatedList[0] : s));
      }
    }
  };

  const handleDelete = (id) => {
    if (!confirm("क्या आप इस बचत / निवेश खाते को हटाना चाहते हैं?")) return;
    try {
      api.delete(`/api/savings/${id}`).catch(() => {});
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.filter(x => (x._id || x.id) !== id);
      localStorage.setItem("vb_local_savings", JSON.stringify(local));
      setSavingsList(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSingleInstallment = async (savingItem, instIndex) => {
    if (!savingItem) return;
    const inst = (savingItem.installments || [])[instIndex];
    if (!inst) return;

    const amt = Number(inst.amount || 0);
    if (!confirm(`क्या आप ₹${amt.toLocaleString("en-IN")} की इस जमा एंट्री (${inst.notes || 'किस्त'}) को हटाना चाहते हैं? कुल जमा राशि में से यह राशि कम हो जाएगी।`)) {
      return;
    }

    const id = savingItem._id || savingItem.id;
    const updatedInstList = (savingItem.installments || []).filter((_, idx) => idx !== instIndex);
    const newTotal = Math.max(0, updatedInstList.reduce((sum, x) => sum + Number(x.amount || 0), 0));

    const updatedSaving = {
      ...savingItem,
      installments: updatedInstList,
      totalDeposited: newTotal,
      currentValue: newTotal
    };

    try {
      // 1. Update backend if available
      try {
        await api.put(`/api/savings/${id}`, {
          installments: updatedInstList,
          totalDeposited: newTotal,
          currentValue: newTotal
        });
      } catch (e) {}

      // 2. Update local storage
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.map(s => ((s._id || s.id) === id ? updatedSaving : s));
      localStorage.setItem("vb_local_savings", JSON.stringify(local));

      // 3. Update active states
      setViewHistoryItem(updatedSaving);
      setSavingsList(prev => prev.map(s => ((s._id || s.id) === id ? updatedSaving : s)));
    } catch (err) {
      alert("हटाने में त्रुटि: " + (err.message || err));
    }
  };

  const handleStartEditInstallment = (idx, inst) => {
    setEditingInstallmentIdx(idx);
    setEditInstData({
      date: inst.date ? String(inst.date).split("T")[0] : new Date().toISOString().split("T")[0],
      amount: String(inst.amount || ""),
      sourceOfFund: inst.sourceOfFund || "shop_cash",
      notes: inst.notes || ""
    });
  };

  const handleSaveEditInstallment = async (savingItem, idx) => {
    if (!savingItem) return;
    const newAmt = Number(editInstData.amount);
    if (!editInstData.date || isNaN(newAmt) || newAmt <= 0) {
      alert("कृपया सही तारीख और किस्त राशि दर्ज करें!");
      return;
    }

    const id = savingItem._id || savingItem.id;
    const instList = Array.isArray(savingItem.installments) ? [...savingItem.installments] : [];
    if (!instList[idx]) return;

    instList[idx] = {
      ...instList[idx],
      date: editInstData.date,
      amount: newAmt,
      sourceOfFund: editInstData.sourceOfFund,
      notes: editInstData.notes || instList[idx].notes
    };

    instList.sort((a, b) => new Date(a.date) - new Date(b.date));
    const newTotal = instList.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const updatedSaving = {
      ...savingItem,
      installments: instList,
      totalDeposited: newTotal,
      currentValue: newTotal
    };

    try {
      await api.put(`/api/savings/${id}`, {
        installments: instList,
        totalDeposited: newTotal,
        currentValue: newTotal
      });
    } catch (e) {}

    let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
    local = local.map(s => ((s._id || s.id) === id ? updatedSaving : s));
    localStorage.setItem("vb_local_savings", JSON.stringify(local));

    setViewHistoryItem(updatedSaving);
    setSavingsList(prev => prev.map(s => ((s._id || s.id) === id ? updatedSaving : s)));
    setEditingInstallmentIdx(null);
    alert("✅ किस्त एंट्री सफलतापूर्वक अपडेट हो गई!");
  };

  const handleAddNewPastInstallment = async (savingItem) => {
    if (!savingItem) return;
    const amt = Number(newPastInstData.amount);
    if (!newPastInstData.date || isNaN(amt) || amt <= 0) {
      alert("कृपया सही तारीख और किस्त राशि दर्ज करें!");
      return;
    }

    const id = savingItem._id || savingItem.id;
    const instList = Array.isArray(savingItem.installments) ? [...savingItem.installments] : [];

    const newEntry = {
      amount: amt,
      date: newPastInstData.date,
      sourceOfFund: newPastInstData.sourceOfFund || "shop_cash",
      notes: newPastInstData.notes || `किस्त जमा (${formatDateDisplay(newPastInstData.date)})`,
      paidAt: new Date().toISOString()
    };

    instList.push(newEntry);
    instList.sort((a, b) => new Date(a.date) - new Date(b.date));

    const newTotal = instList.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const updatedSaving = {
      ...savingItem,
      installments: instList,
      alreadyPaidCount: instList.length,
      alreadyDepositedAmount: newTotal,
      totalDeposited: newTotal,
      currentValue: newTotal
    };

    try {
      await api.put(`/api/savings/${id}`, {
        installments: instList,
        alreadyPaidCount: instList.length,
        alreadyDepositedAmount: newTotal,
        totalDeposited: newTotal,
        currentValue: newTotal
      });
    } catch (e) {}

    let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
    local = local.map(s => ((s._id || s.id) === id ? updatedSaving : s));
    localStorage.setItem("vb_local_savings", JSON.stringify(local));

    setViewHistoryItem(updatedSaving);
    setSavingsList(prev => prev.map(s => ((s._id || s.id) === id ? updatedSaving : s)));
    setIsAddingPastInst(false);
    setNewPastInstData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      sourceOfFund: "shop_cash",
      notes: ""
    });
    alert("✅ नई पासबुक एंट्री सफलतापूर्वक जोड़ी गई!");
  };

  const handleOpenPay = (item) => {
    setSelectedSavingForPay(item);
    setPayData({
      amount: String(item.installmentAmount || ""),
      date: new Date().toISOString().split("T")[0],
      sourceOfFund: "shop_cash",
      notes: `${item.title} किस्त भुगतान`
    });
    setIsPayOpen(true);
  };

  const handleRecordInstallment = async (e) => {
    e.preventDefault();
    if (!payData.amount || Number(payData.amount) <= 0) {
      alert("कृपया सही किस्त राशि दर्ज करें!");
      return;
    }
    const item = selectedSavingForPay;
    if (!item) return;

    setPaying(true);
    const id = item._id || item.id;
    const instAmt = Number(payData.amount);

    const newInst = {
      amount: instAmt,
      date: payData.date,
      sourceOfFund: payData.sourceOfFund || "shop_cash",
      notes: payData.notes || `${item.title} किस्त जमा`,
      paidAt: new Date().toISOString()
    };

    try {
      // If paid from shop cash drawer or business salary or business capital, record as expense/drawing!
      const isShopOutflow = payData.sourceOfFund === "shop_cash" || payData.sourceOfFund === "business_salary" || payData.sourceOfFund === "business_capital";
      let autoExp = null;
      if (isShopOutflow) {
        const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
        autoExp = {
          id: "exp_sav_" + Date.now(),
          _id: "exp_sav_" + Date.now(),
          companyId: currentCoId,
          title: `बचत RD किस्त - ${item.title}`,
          description: `दुकान गल्ले से बचत/RD किस्त जमा: ${item.title} (किस्त राशि: ₹${instAmt})`,
          amount: instAmt,
          expenseType: payData.sourceOfFund === "business_salary" ? "drawings" : "business",
          category: "मासिक बचत व निवेश (RD/SIP/FD)",
          familyMember: "खुद (Self)",
          paymentMode: "CASH_DRAWER",
          date: payData.date,
          createdAt: new Date().toISOString()
        };
        try {
          await api.post("/api/expense", autoExp);
        } catch (err) {}
        let localExp = JSON.parse(localStorage.getItem("vb_local_expenses") || "[]");
        localExp.unshift(autoExp);
        localStorage.setItem("vb_local_expenses", JSON.stringify(localExp));

        if (typeof onExpenseAdded === "function") {
          onExpenseAdded(autoExp);
        }
      }

      // Try server API
      try {
        await api.post(`/api/savings/${id}/installment`, newInst);
      } catch (err) {}

      // Update local storage
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.map(s => {
        if ((s._id || s.id) === id) {
          const instList = Array.isArray(s.installments) ? [...s.installments] : [];
          instList.push(newInst);
          const newTotal = Number(s.totalDeposited || 0) + instAmt;
          return {
            ...s,
            installments: instList,
            totalDeposited: newTotal,
            currentValue: Number(s.currentValue || 0) + instAmt,
            lastPaidDate: payData.date
          };
        }
        return s;
      });
      localStorage.setItem("vb_local_savings", JSON.stringify(local));

      setIsPayOpen(false);
      setSelectedSavingForPay(null);
      fetchSavings();
      alert(`✅ ₹${instAmt.toLocaleString('en-IN')} की किस्त सफलतापूर्वक RD खाते में जमा हुई${isShopOutflow ? ' और दुकान के गल्ले/खर्च से घटा दी गई' : ''}!`);
    } catch (err) {
      alert("किस्त जोड़ने में त्रुटि: " + (err.message || err));
    } finally {
      setPaying(false);
    }
  };

  const filteredList = savingsList.filter(item => {
    if (activeFilter === "ALL") return true;
    return (item.classification || "personal") === activeFilter;
  });

  const totalInvestedAll = savingsList.reduce((s, x) => {
    const m = getRdMetrics(x);
    return s + Number(m.totalDeposited || 0);
  }, 0);

  const totalMonthlyCommitment = savingsList
    .filter(x => x.frequency === "monthly" && x.status !== "CLOSED")
    .reduce((s, x) => s + Number(x.installmentAmount || 0), 0);

  const totalMaturityForecast = savingsList.reduce((s, x) => {
    const m = getRdMetrics(x);
    return s + Number(m.expectedMaturity || 0);
  }, 0);

  const totalPaidInstAll = savingsList.reduce((s, x) => {
    const m = getRdMetrics(x);
    return s + Number(m.paidCount || 0);
  }, 0);

  const totalRemainingInstAll = savingsList.reduce((s, x) => {
    const m = getRdMetrics(x);
    return s + Number(m.remainingCount || 0);
  }, 0);

  const shareWhatsApp = () => {
    const coName = selectedCompany?.name || "मेरी दुकान";
    let msg = `💰 *बचत व निवेश खाता रिपोर्ट (Savings & Investment)*\n`;
    msg += `🏢 ${coName}\n`;
    msg += `----------------------------------\n`;
    msg += `💎 *कुल जमा बचत (Total Invested):* ₹${totalInvestedAll.toLocaleString("en-IN")}\n`;
    msg += `🗓️ *मासिक बचत कमिटमेंट (Monthly RD/SIP):* ₹${totalMonthlyCommitment.toLocaleString("en-IN")}/माह\n`;
    if (totalMaturityForecast > 0) {
      msg += `📈 *अपेक्षित परिपक्वता राशि (Maturity Value):* ₹${totalMaturityForecast.toLocaleString("en-IN")}\n`;
    }
    msg += `----------------------------------\n`;
    msg += `📑 *खातों का विवरण:*\n`;

    savingsList.forEach((s, idx) => {
      const typeObj = SAVING_TYPES.find(t => t.id === s.savingsType) || { label: s.savingsType, icon: "💰" };
      const fundSrcTxt = s.fundSource === "business_salary" ? "दुकान से सैलरी" : (s.fundSource === "business_capital" ? "बिजनेस कैपिटल" : "पर्सनल फंड");
      msg += `${idx + 1}. ${typeObj.icon} *${s.title}* (${s.classification === "business" ? "बिजनेस" : "पर्सनल"})\n`;
      msg += `   • जमा: ₹${Number(s.totalDeposited || 0).toLocaleString("en-IN")} | स्रोत: ${fundSrcTxt}\n`;
      if (s.installmentAmount > 0) msg += `   • किस्त: ₹${Number(s.installmentAmount).toLocaleString("en-IN")} (हर माह ${s.dueDayOfMonth || 5} तारीख)\n`;
    });

    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-black flex items-center gap-1.5 leading-tight">
              <span>💰 बचत व निवेश (FD / RD / SIP)</span>
            </h2>
            <p className="text-[11px] text-amber-100/90 font-medium">
              पर्सनल व बिजनेस बचत, बीमा व मासिक निवेश
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={shareWhatsApp}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
            title="WhatsApp Share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
          <button
            onClick={fetchSavings}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            title="ताज़ा करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "ALL", label: `📊 सभी खाते (${savingsList.length})` },
          { id: "personal", label: "👤 पर्सनल बचत (Personal)" },
          { id: "business", label: "🏢 बिजनेस बचत (Business)" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              activeFilter === tab.id
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Total Summary Cards */}
        <div className="bg-gradient-to-br from-amber-700 via-orange-800 to-slate-900 text-white rounded-3xl p-4 shadow-xl border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-200">💎 कुल संचित बचत फंड (Total Portfolio)</span>
            <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-black">
              {savingsList.length} खाते सक्रिय
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                ₹{totalInvestedAll.toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-amber-200/90 font-medium">अब तक कुल जमा पूंजी</span>
            </div>
            {totalMaturityForecast > 0 && (
              <div className="text-right">
                <div className="text-sm font-black text-emerald-400">
                  ₹{totalMaturityForecast.toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-slate-300 font-medium">कुल अपेक्षित फंड</span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-[11px]">
            <div className="bg-white/10 rounded-xl p-2">
              <span className="text-[10px] text-amber-200 block">मासिक बचत</span>
              <span className="font-black text-white">₹{totalMonthlyCommitment.toLocaleString("en-IN")}/माह</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <span className="text-[10px] text-emerald-300 block">कुल भरी किस्तें</span>
              <span className="font-black text-white">{totalPaidInstAll} किस्तें जमा</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <span className="text-[10px] text-rose-300 block">बची हुई किस्तें</span>
              <span className="font-black text-white">{totalRemainingInstAll} किस्तें बाकी</span>
            </div>
          </div>
        </div>

        {/* Quick Advance Payment & 3 RDs Preset Helper */}
        <div className="space-y-2">
          {/* 1. Advance Payment Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-3.5 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black leading-tight text-white flex items-center gap-1.5">
                  <span>समय से पहले / एडवांस RD किस्त जमा करें</span>
                  <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-1.5 py-0.2 rounded">गल्ले से खर्च</span>
                </h4>
                <p className="text-[10px] text-emerald-100/90 font-medium mt-0.5">
                  दुकान गल्ले से राशि कटेगी और दैनिक खर्च रजिस्टर में RD बचत के रूप में दर्ज होगी
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAdvancePay()}
              className="px-3 py-2 rounded-xl bg-white text-emerald-800 text-xs font-black shadow-md hover:bg-emerald-50 active:scale-95 transition cursor-pointer shrink-0"
            >
              ⚡ एडवांस जमा
            </button>
          </div>

          {/* 2. 1-Click 3 RDs Setup Helper */}
          {savingsList.filter(s => s.savingsType === "RD").length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">🔧</span>
                <div>
                  <span className="text-xs font-black text-amber-950 block leading-tight">
                    3 RD खाते (16 मार्च 2029, अक्टूबर 2028, मार्च 2028) क्विक सेट करें
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium block">
                    तारीखवार पूरी पासबुक (31, 36, 43 किस्तें) व सही बाकी किस्तें 1-क्लिक में सेट करें
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickSync3Rds}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-[11px] shrink-0 shadow-xs cursor-pointer transition"
              >
                ⚡ 3 RD सिंक करें
              </button>
            </div>
          )}
        </div>

        {/* Savings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              खाता सूची ({filteredList.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
              <p className="text-xs font-medium">बचत खाते लोड हो रहे हैं...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <PiggyBank size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">कोई बचत खाता नहीं मिला</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                यहाँ अपनी FD, RD, SIP, PPF या LIC पॉलिसी जोड़ें और नियमित किस्तों का हिसाब रखें।
              </p>
              <button
                onClick={() => { resetForm(); setIsFormOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Plus size={16} /> + नया बचत खाता जोड़ें
              </button>
            </div>
          ) : (
            filteredList.map(item => {
              const id = item._id || item.id;
              const typeObj = SAVING_TYPES.find(t => t.id === item.savingsType) || { label: item.savingsType, icon: "💰" };
              const installmentsCount = (item.installments || []).length;
              const fundSrcLabel = item.fundSource === "business_salary"
                ? "🏪 दुकान से सैलरी"
                : item.fundSource === "business_capital"
                ? "🏢 बिजनेस कैपिटल"
                : "👛 पर्सनल फंड्स";

              const m = getRdMetrics(item);

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                        {typeObj.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                            item.classification === "business"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {item.classification === "business" ? "बिजनेस" : "पर्सनल"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.institutionName ? `${item.institutionName} • ` : ""}{typeObj.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>स्रोत: {fundSrcLabel}</span>
                          {item.startDate && (
                            <span>• शुरू: {formatDateDisplay(item.startDate)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">कुल जमा</span>
                      <div className="text-sm font-black text-slate-900">
                        ₹{m.totalDeposited.toLocaleString("en-IN")}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item)}
                        className="mt-1 text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1 ml-auto cursor-pointer shadow-xs transition"
                        title="इस RD में पैसे डालें"
                      >
                        <Plus size={12} /> पैसे डालें
                      </button>
                    </div>
                  </div>

                  {/* ⭐ INDIVIDUAL CARD EXPECTED MATURITY RETURN (हर कार्ड का अपेक्षित मिलने वाला अमाउंट) */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-3 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                        <span>🌟 अपेक्षित मिलने वाली रकम (Expected Maturity)</span>
                      </span>
                      <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        मैच्योरिटी पर
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                          ₹{m.expectedMaturity.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          {m.interestGain > 0 ? (
                            <span className="text-emerald-800">
                              (मूलधन ₹{m.totalPrincipal.toLocaleString("en-IN")} + ₹{m.interestGain.toLocaleString("en-IN")} ब्याज लाभ)
                            </span>
                          ) : (
                            `कुल लक्ष्य बचत फंड (Principal Fund)`
                          )}
                        </span>
                      </div>
                      {item.maturityDate && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-bold">परिपक्वता तारीख</span>
                          <span className="text-xs font-black text-slate-800 underline">
                            {formatDateDisplay(item.maturityDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center text-[10px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">किस्त / आवृत्ति</span>
                      <span className="font-bold text-slate-800">
                        {m.instAmt > 0 ? `₹${m.instAmt.toLocaleString("en-IN")}/माह` : "एकमुश्त"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">देय तारीख</span>
                      <span className="font-bold text-slate-800">
                        {item.dueDayOfMonth ? `हर माह ${item.dueDayOfMonth}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ब्याज दर</span>
                      <span className="font-bold text-emerald-600">
                        {item.interestRate ? `${item.interestRate}% p.a.` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Installment Progress: Prominent Side-by-Side Paid vs Remaining Breakdown */}
                  {item.savingsType !== "FD" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Paid Installments Box */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-300 rounded-2xl p-3 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">
                              जमा किस्तें (Paid)
                            </span>
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                              {`${m.progressPct}% पूर्ण`}
                            </span>
                          </div>
                          <div className="text-base sm:text-lg font-black text-emerald-700 tracking-tight">
                            ✅ {`${m.paidCount} किस्तें जमा`}
                          </div>
                          <div className="text-xs font-black text-emerald-900">
                            कुल ₹{m.totalDeposited.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-emerald-800 font-medium pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                            <span>🔄 स्वतः: {m.autoDebitedCount || 0}</span>
                            <span>✋ नकद: {m.manualDebitedCount || 0}</span>
                          </div>
                        </div>

                        {/* Remaining Installments Box */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-300 rounded-2xl p-3 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-950 uppercase tracking-tight">
                              शेष बाकी (Remaining)
                            </span>
                            <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
                              {`${m.remainingCount} माह बाकी`}
                            </span>
                          </div>
                          <div className="text-base sm:text-lg font-black text-amber-900 tracking-tight">
                            ⏳ {`${m.remainingCount} किस्तें बाकी`}
                          </div>
                          <div className="text-xs font-black text-amber-800">
                            ₹{m.instAmt.toLocaleString("en-IN")}/माह = ₹{m.remainingAmount.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-amber-800 font-medium pt-1 border-t border-amber-200/60 truncate">
                            देना शेष: कुल {m.totalMonths} माह ({m.tenureYears} वर्ष)
                          </div>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.progressPct}%` }}
                        />
                      </div>

                      {/* Overdue Alert if any */}
                      {m.overdueCount > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1 text-[11px] text-rose-700 font-bold flex items-center justify-between">
                          <span>⚠️ आज तक {m.dueMonths} देय थीं, {m.overdueCount} किस्तें बकाया हैं</span>
                          <span className="font-black text-rose-800">बकाया: ₹{m.overdueAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🔄 AUTOMATED VS MANUAL RECURRING DEPOSIT STRIP */}
                  {item.savingsType !== "FD" && (
                    <div className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between text-xs gap-2 ${
                      item.isAutoDebitEnabled !== false
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                        : "bg-slate-100 border-slate-300 text-slate-700"
                    }`}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAutoDebit(item)}
                          className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer shrink-0 ${
                            item.isAutoDebitEnabled !== false
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          }`}
                          title={item.isAutoDebitEnabled !== false ? "क्लिक करके मैन्युअल मोड करें" : "क्लिक करके स्वतः ऑटो-जमा चालू करें"}
                        >
                          {item.isAutoDebitEnabled !== false ? "🔄 स्वतः जमा: चालू" : "✋ मैन्युअल जमा"}
                        </button>

                        <div>
                          <span className="font-extrabold text-[11px] block leading-tight">
                            {item.isAutoDebitEnabled !== false
                              ? `हर माह ${item.dueDayOfMonth || 26} तारीख को गल्ले से स्वतः कटेगा`
                              : `मैन्युअल मोड (दुकानदार खुद जमा करेगा)`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {item.isAutoDebitEnabled !== false
                              ? `दुकान खर्च में ऑटो जुड़ेगा और गल्ले से घटेगा`
                              : `ऑटो-कट बंद है`}
                          </span>
                        </div>
                      </div>

                      {/* Date Edit Shortcut Button */}
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickEditDueDay(item)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-[10px] font-black text-slate-800 flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition"
                          title="तारीख बदलें"
                        >
                          📅 {item.dueDayOfMonth || 26} तारीख ✏️
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenPay(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <CreditCard size={15} /> ⚡ पैसे डालें / एडवांस जमा
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewHistoryItem(item)}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                      title="पासबुक व जमा इतिहास देखें"
                    >
                      <Clock size={14} /> पासबुक {installmentsCount > 0 ? `(${installmentsCount})` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="संपादित करें"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Button - HIDE when modal is active */}
      {!isFormOpen && !isPayOpen && !viewHistoryItem && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-40">
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={18} /> + नया बचत / निवेश खाता जोड़ें
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingId ? "बचत खाता संपादित करें" : "नया बचत व निवेश खाता"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">FD / RD / SIP / PPF / LIC / Gold विवरण</p>
                </div>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Type Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बचत का प्रकार *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAVING_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFormData({ ...formData, savingsType: t.id })}
                      className={`p-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        formData.savingsType === t.id
                          ? "bg-amber-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 active:bg-slate-200"
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="text-[10px] truncate">{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Bank */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">स्कीम / खाते का नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. SBI 5 Year FD, HDFC RD, Nippon SIP"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Start Date, Maturity Date & Tenure (अवधि व शुरुआत-मैच्योरिटी तारीखें) */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1 mb-1">
                      <Calendar size={13} className="text-amber-700" />
                      <span>शुरुआत तारीख (Start) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={e => handleStartDateChange(e.target.value)}
                      className="w-full text-xs font-black p-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1 mb-1">
                      <span>🏁 मैच्योरिटी तारीख (Maturity) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.maturityDate}
                      onChange={e => handleMaturityDateChange(e.target.value)}
                      className="w-full text-xs font-black p-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Tenure display and quick preset buttons */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-amber-950">अवधि (Tenure):</label>
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {formData.tenureYears} साल ({Number(formData.tenureYears || 1) * 12} माह)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
                    {["1", "2", "3", "5", "10"].map(yr => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleTenureChange(yr)}
                        className={`py-1.5 rounded-lg border text-center transition cursor-pointer ${
                          formData.tenureYears === yr
                            ? "bg-amber-700 text-white border-amber-700 font-black shadow-xs"
                            : "bg-white border-amber-200 text-amber-900"
                        }`}
                      >
                        {yr} वर्ष ({Number(yr) * 12} माह)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक / संस्था का नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. SBI, LIC, Groww"
                    value={formData.institutionName}
                    onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अकाउंट / पॉलिसी नं.</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Classification & Source of Funds */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">खाते का उद्देश्य</label>
                  <select
                    value={formData.classification}
                    onChange={e => setFormData({ ...formData, classification: e.target.value })}
                    className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="personal">👤 पर्सनल बचत (Personal)</option>
                    <option value="business">🏢 बिजनेस बचत (Business)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रकम का स्रोत</label>
                  <select
                    value={formData.fundSource}
                    onChange={e => setFormData({ ...formData, fundSource: e.target.value })}
                    className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="shop_cash">🏪 दुकान गल्ले से (Cash Drawer)</option>
                    <option value="business_salary">💼 दुकान सैलरी (Drawings)</option>
                    <option value="business_capital">🏢 बिजनेस कैपिटल</option>
                    <option value="personal_funds">👛 पर्सनल फंड्स</option>
                  </select>
                </div>
              </div>

              {/* Amounts & Due Day */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.savingsType === "FD" ? "मूलधन जमा (Principal ₹) *" : "मासिक किस्त (Installment ₹) *"}
                  </label>
                  <input
                    type="number"
                    placeholder="₹ 0.00"
                    value={formData.savingsType === "FD" ? formData.initialDeposit : formData.installmentAmount}
                    onChange={e => {
                      const val = e.target.value;
                      const inst = Number(val || 0);
                      const elapsed = Number(formData.alreadyPaidCount || 0);
                      const expMaturity = calculateExpectedMaturity({
                        ...formData,
                        installmentAmount: inst,
                        initialDeposit: formData.savingsType === "FD" ? val : "0"
                      });
                      if (formData.savingsType === "FD") {
                        setFormData(prev => ({
                          ...prev,
                          initialDeposit: val,
                          expectedMaturityAmount: !prev.expectedMaturityAmount || Number(prev.expectedMaturityAmount) <= 0 ? (expMaturity > 0 ? String(expMaturity) : "") : prev.expectedMaturityAmount
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          installmentAmount: val,
                          initialDeposit: "0",
                          alreadyDepositedAmount: elapsed > 0 && inst > 0 ? String(elapsed * inst) : prev.alreadyDepositedAmount,
                          expectedMaturityAmount: !prev.expectedMaturityAmount || Number(prev.expectedMaturityAmount) <= 0 ? (expMaturity > 0 ? String(expMaturity) : "") : prev.expectedMaturityAmount
                        }));
                      }
                    }}
                    className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-amber-700"
                  />
                  {formData.savingsType !== "FD" && (
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      नियमित मासिक किस्त
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">किस्त देय तारीख (Due Day) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="उदा. 26"
                    value={formData.dueDayOfMonth}
                    onChange={e => setFormData({ ...formData, dueDayOfMonth: e.target.value })}
                    className="w-full text-xs font-black px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    महीने की तारीख (डिफ़ॉल्ट 26)
                  </span>
                </div>
              </div>

              {/* 🔄 AUTOMATED VS MANUAL DEPOSIT SWITCH (Single Clean Switch) */}
              {formData.savingsType !== "FD" && (
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-950 block">
                        🔄 स्वतः ऑटो-जमा (Auto-Debit on Due Date)
                      </span>
                      <span className="text-[10px] text-emerald-800 font-medium">
                        तय तारीख को दुकान गल्ले से खुद-ब-खुद जमा व खर्च में जोड़ें
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isAutoDebitEnabled: !prev.isAutoDebitEnabled }))}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.isAutoDebitEnabled !== false ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform transform ${
                          formData.isAutoDebitEnabled !== false ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/50">
                    <span className="font-bold text-emerald-900">
                      मोड: {formData.isAutoDebitEnabled !== false ? "✅ स्वतः जमा चालू (हर माह ऑटो-कट)" : "✋ मैन्युअल जमा (बटन दबाकर)"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {formData.isAutoDebitEnabled !== false ? `हर माह ${formData.dueDayOfMonth || 26} तारीख` : "मैन्युअल"}
                    </span>
                  </div>
                </div>
              )}

              {/* 🟢 ALWAYS-VISIBLE: INSTALLMENT STATUS & PAST DEPOSITS (अब तक जमा किस्तों का स्पष्ट हिसाब) */}
              {formData.savingsType !== "FD" && (() => {
                const totalMonths = Number(formData.tenureYears || 1) * 12;
                const elapsedMonths = getElapsedMonths(formData.startDate, formData.dueDayOfMonth, 360);
                const inst = Number(formData.installmentAmount || 0);
                const expectedTotal = elapsedMonths * inst;
                const paidCount = Number(formData.alreadyPaidCount || 0);
                const remainingCount = Math.max(0, totalMonths - paidCount);

                return (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Calculator size={15} className="text-amber-600" />
                        <span>किस्तों का हिसाब (Paid vs Remaining Installments)</span>
                      </span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        {elapsedMonths} माह बीते हैं
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-2.5 rounded-xl border border-amber-200 text-xs space-y-1">
                      <p className="text-[11px] text-amber-950 font-bold leading-relaxed">
                        खाता शुरुआत (<b>{formatDateDisplay(formData.startDate)}</b>) से आज तक कुल <b>{elapsedMonths} महीने</b> की किस्तें बनती हैं (₹{expectedTotal.toLocaleString("en-IN")})।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            alreadyPaidCount: String(elapsedMonths),
                            alreadyDepositedAmount: inst > 0 ? String(elapsedMonths * inst) : prev.alreadyDepositedAmount
                          }));
                        }}
                        className="text-[10px] text-emerald-800 font-black bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        ⚡ तारीख के हिसाब से पूरी {elapsedMonths} किस्तें सेट करें
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          कितनी किस्तें जमा कीं? (Paid) *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="360"
                            placeholder={String(elapsedMonths || 0)}
                            value={formData.alreadyPaidCount}
                            onChange={e => {
                              const newCount = e.target.value;
                              const numCount = Math.max(0, parseInt(newCount) || 0);
                              setFormData(prev => ({
                                ...prev,
                                alreadyPaidCount: newCount,
                                alreadyDepositedAmount: inst > 0 ? String(numCount * inst) : prev.alreadyDepositedAmount
                              }));
                            }}
                            className="w-full text-xs font-black p-2 rounded-xl border border-slate-300 bg-white focus:border-amber-500 outline-none text-slate-900"
                          />
                          <span className="text-[11px] font-bold text-slate-500">किस्तें</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          कुल जमा रकम (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="₹ कुल राशि"
                          value={formData.alreadyDepositedAmount}
                          onChange={e => setFormData({ ...formData, alreadyDepositedAmount: e.target.value })}
                          className="w-full text-xs font-black p-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-800 focus:bg-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Live Remaining Callout */}
                    <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-amber-950">
                      <span>⏳ आगे देना बाकी रहेगा:</span>
                      <span className="font-black text-amber-900">
                        {remainingCount} किस्तें बाकी • ₹{(remainingCount * inst).toLocaleString("en-IN")} शेष
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-medium block">
                      💡 सिस्टम इन सभी {paidCount} किस्तों को तारीखवार पासबुक में स्वतः जोड़ देगा, जिसे आप कभी भी एडिट कर सकते हैं।
                    </span>
                  </div>
                );
              })()}

              {/* Interest & Maturity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ब्याज दर (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="उदा. 7.5"
                    value={formData.interestRate}
                    onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">परिपक्वता राशि (₹)</label>
                  <input
                    type="number"
                    placeholder="अपेक्षित रिटर्न"
                    value={formData.expectedMaturityAmount}
                    onChange={e => setFormData({ ...formData, expectedMaturityAmount: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* STICKY BOTTOM ACTION FOOTER */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-3 border-t border-slate-200 mt-4 flex items-center gap-2 -mx-4 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-30">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black cursor-pointer hover:bg-slate-50 transition"
                >
                  ✕ रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 active:scale-95 text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  {saving ? "⏳ सहेज रहे हैं..." : "💾 खाता सहेजें (Save Account)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Installment Modal */}
      {isPayOpen && selectedSavingForPay && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">💰 RD में पैसे डालें / एडवांस किस्त जमा करें</h3>
                  <p className="text-[11px] text-slate-500 font-bold">{selectedSavingForPay.title} ({selectedSavingForPay.savingsType || "RD"})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsPayOpen(false); setSelectedSavingForPay(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordInstallment} className="space-y-3">
              {/* Account Selector if multiple RD accounts */}
              {savingsList.filter(s => s.savingsType !== "FD" && s.status !== "CLOSED").length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RD खाता चुनें (Select Account) *</label>
                  <select
                    value={selectedSavingForPay._id || selectedSavingForPay.id}
                    onChange={(e) => {
                      const chosen = savingsList.find(s => (s._id || s.id) === e.target.value);
                      if (chosen) {
                        setSelectedSavingForPay(chosen);
                        setPayData(prev => ({
                          ...prev,
                          amount: String(chosen.installmentAmount || prev.amount),
                          notes: "⚡ एडवांस RD किस्त जमा"
                        }));
                      }
                    }}
                    className="w-full text-xs font-black px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900"
                  >
                    {savingsList.filter(s => s.savingsType !== "FD" && s.status !== "CLOSED").map(s => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.title} ({s.savingsType || "RD"}) - ₹{Number(s.installmentAmount || 0).toLocaleString("en-IN")}/माह
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">जमा राशि (Amount ₹) *</label>
                  {Number(selectedSavingForPay.installmentAmount || 0) > 0 && (
                    <span className="text-[11px] text-slate-500 font-bold">
                      नियमित मासिक किस्त: ₹{Number(selectedSavingForPay.installmentAmount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  placeholder="₹ 0.00"
                  value={payData.amount}
                  onChange={e => setPayData({ ...payData, amount: e.target.value })}
                  className="w-full text-xl font-black px-3 py-2.5 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/30 text-emerald-700 outline-none focus:border-emerald-600"
                />

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">शॉर्टकट:</span>
                  {Number(selectedSavingForPay.installmentAmount || 0) > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPayData({ ...payData, amount: String(selectedSavingForPay.installmentAmount) })}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-black rounded-lg shadow-xs transition cursor-pointer"
                      >
                        ₹{Number(selectedSavingForPay.installmentAmount).toLocaleString("en-IN")} (1 किस्त)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayData({ ...payData, amount: String(Number(selectedSavingForPay.installmentAmount) * 2) })}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-900 text-[11px] font-black rounded-lg border border-emerald-300 transition cursor-pointer"
                      >
                        ₹{(Number(selectedSavingForPay.installmentAmount) * 2).toLocaleString("en-IN")} (2 किस्तें)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayData({ ...payData, amount: String(Number(selectedSavingForPay.installmentAmount) * 3) })}
                        className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 active:scale-95 text-teal-900 text-[11px] font-black rounded-lg border border-teal-300 transition cursor-pointer"
                      >
                        ₹{(Number(selectedSavingForPay.installmentAmount) * 3).toLocaleString("en-IN")} (3 किस्तें)
                      </button>
                    </>
                  )}
                  {[1000, 2000, 5000]
                    .filter(a => a !== Number(selectedSavingForPay.installmentAmount || 0))
                    .map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayData({ ...payData, amount: String(amt) })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रकम का स्रोत (Fund Source) *</label>
                <select
                  value={payData.sourceOfFund}
                  onChange={e => setPayData({ ...payData, sourceOfFund: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="shop_cash">🏪 दुकान गल्ला / नकद (Shop Cash - खर्च में दर्ज होगा)</option>
                  <option value="business_salary">💼 दुकान से सैलरी / ड्राइंग्स (Salary Drawing)</option>
                  <option value="business_capital">🏢 बिजनेस बैंक खाता / UPI</option>
                  <option value="personal_funds">👛 पर्सनल बैंक / निजी बचत</option>
                </select>
                <p className="text-[10px] text-emerald-800 mt-1 font-medium bg-emerald-50 border border-emerald-200 p-2 rounded-lg leading-relaxed">
                  ✨ <b>दुकान गल्ले से पैसे कटेंगे</b>, आज के खर्च रजिस्टर में दर्ज होंगे और इस RD खाते की पासबुक में एडवांस किस्त के रूप में जुड़ जाएंगे।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जमा तारीख</label>
                  <input
                    type="date"
                    value={payData.date}
                    onChange={e => setPayData({ ...payData, date: e.target.value })}
                    className="w-full text-xs font-bold px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">नोट / टिप्पणी</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक"
                    value={payData.notes}
                    onChange={e => setPayData({ ...payData, notes: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsPayOpen(false); setSelectedSavingForPay(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {paying ? "⏳ जमा हो रहा है..." : "💾 ₹ पैसे जमा करें (Confirm Deposit)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History / Passbook Modal */}
      {viewHistoryItem && (() => {
        const m = getRdMetrics(viewHistoryItem);
        const vInstAmt = m.instAmt;
        const vTenureYrs = m.tenureYears;
        const vTotalMonths = m.totalMonths;
        const vPaidCount = m.paidCount;
        const vRemainingCount = m.remainingCount;
        const vTotalDep = m.totalDeposited;
        const vTargetFund = m.expectedMaturity;
        const vProgressPct = m.progressPct;
        const vSchedule = getUpcomingSchedule(viewHistoryItem);

        // Use actual recorded installments (never generate phantom entries!)
        const rawRecorded = Array.isArray(viewHistoryItem.installments) ? viewHistoryItem.installments : [];
        const vRecorded = rawRecorded;
        const vSumRecorded = vRecorded.reduce((s, x) => s + Number(x.amount || 0), 0);
        const vUnrecordedBalance = Math.max(0, vTotalDep - vSumRecorded);

        return (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-50/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-slate-900">{viewHistoryItem.title}</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        {viewHistoryItem.savingsType || "RD"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {viewHistoryItem.institutionName ? `${viewHistoryItem.institutionName} • ` : ""}
                      पासबुक व किस्त विवरण
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewHistoryItem(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Top Fund & Progress Summary */}
                <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-amber-200 font-medium block">कुल संचित फंड (Total Deposited)</span>
                      <span className="text-2xl font-black tracking-tight">₹{vTotalDep.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-amber-200 font-medium block">कुल लक्ष्य / मैच्योरिटी</span>
                      <span className="text-base font-black text-amber-100">₹{vTargetFund.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {viewHistoryItem.savingsType !== "FD" && (
                    <>
                      {/* Installment Badge Counter */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 border border-white/20">
                          <span className="text-[10px] text-emerald-200 font-medium block">जमा किस्तें (Paid)</span>
                          <span className="font-black text-sm">✅ {vPaidCount} किस्तें पूरी</span>
                          <span className="text-[10px] text-amber-100 block">₹{(vPaidCount * vInstAmt).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 border border-white/20">
                          <span className="text-[10px] text-rose-200 font-medium block">शेष बाकी (Remaining)</span>
                          <span className="font-black text-sm">⏳ {vRemainingCount} किस्तें बाकी</span>
                          <span className="text-[10px] text-amber-100 block">₹{(vRemainingCount * vInstAmt).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-100 mb-1">
                          <span>प्रगति ({vProgressPct}%)</span>
                          <span>कुल अवधि: {vTotalMonths} माह ({vTenureYrs} वर्ष)</span>
                        </div>
                        <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${vProgressPct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Unrecorded Opening Balance Card (if balance was set without individual installment logs) */}
                {vUnrecordedBalance > 0 && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1 font-bold text-amber-900">
                        <span>📌 पूर्व संचित / ओपनिंग बैलेंस:</span>
                        <span className="text-amber-800 font-black">₹{vUnrecordedBalance.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        (खाता बनाते समय दर्ज किया गया पूर्व बैलेंस)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const it = viewHistoryItem;
                        setViewHistoryItem(null);
                        handleOpenEdit(it);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer shadow-xs"
                    >
                      बैलेंस ठीक करें
                    </button>
                  </div>
                )}

                {/* Section 1: Month-wise & Date-wise Deposited Installments */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span>📜 जमा किस्तों की पासबुक (Date & Month-wise)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                          {vRecorded.length} एंट्री
                        </span>
                      </h4>
                      {vRecorded.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          कुल योग: ₹{vSumRecorded.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingPastInst(!isAddingPastInst)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <Plus size={13} /> + पुरानी किस्त जोड़ें
                    </button>
                  </div>

                  {/* Add Past Installment Form */}
                  {isAddingPastInst && (
                    <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                        <span className="text-xs font-black text-emerald-950">➕ पुरानी / पिछली तारीख की किस्त दर्ज करें</span>
                        <button
                          type="button"
                          onClick={() => setIsAddingPastInst(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold"
                        >
                          ✕ बंद करें
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">जमा तारीख</label>
                          <input
                            type="date"
                            value={newPastInstData.date}
                            onChange={e => setNewPastInstData({ ...newPastInstData, date: e.target.value })}
                            className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">किस्त रकम (₹) *</label>
                          <input
                            type="number"
                            placeholder={String(vInstAmt || 3000)}
                            value={newPastInstData.amount}
                            onChange={e => setNewPastInstData({ ...newPastInstData, amount: e.target.value })}
                            className="w-full text-xs font-black p-1.5 rounded-lg border border-slate-300 bg-white text-emerald-700"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">रकम स्रोत</label>
                          <select
                            value={newPastInstData.sourceOfFund}
                            onChange={e => setNewPastInstData({ ...newPastInstData, sourceOfFund: e.target.value })}
                            className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="shop_cash">🏪 दुकान गल्ला</option>
                            <option value="business_salary">💼 दुकान सैलरी</option>
                            <option value="business_capital">🏢 बिजनेस बैंक/UPI</option>
                            <option value="personal_funds">👛 पर्सनल फंड</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">विवरण / टिप्पणी</label>
                          <input
                            type="text"
                            placeholder="उदा. मार्च 2024 किस्त"
                            value={newPastInstData.notes}
                            onChange={e => setNewPastInstData({ ...newPastInstData, notes: e.target.value })}
                            className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingPastInst(false)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                        >
                          रद्द करें
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNewPastInstallment(viewHistoryItem)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition"
                        >
                          💾 पासबुक में जोड़ें
                        </button>
                      </div>
                    </div>
                  )}

                  {vRecorded.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                      <p className="text-slate-400 text-xs font-bold">अभी तक कोई तारीखवार किस्त एंट्री दर्ज नहीं है।</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        ऊपर दिए गए "+ पुरानी किस्त जोड़ें" या "नई किस्त जमा करें" बटन से किस्त जोड़ें।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vRecorded.map((inst, idx) => {
                        const monthTitle = getMonthYearTitle(inst.date, idx + 1);
                        const dateFormatted = formatDateDisplay(inst.date);
                        const isSalary = inst.sourceOfFund === "business_salary";
                        const isCap = inst.sourceOfFund === "business_capital";
                        const isEditingThis = editingInstallmentIdx === idx;

                        if (isEditingThis) {
                          return (
                            <div
                              key={idx}
                              className="bg-amber-50/90 rounded-2xl p-3 border-2 border-amber-400 space-y-2 shadow-xs"
                            >
                              <div className="flex items-center justify-between border-b border-amber-200/60 pb-1">
                                <span className="text-xs font-black text-amber-950">✏️ किस्त #{idx + 1} संपादित करें</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingInstallmentIdx(null)}
                                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">जमा तारीख</label>
                                  <input
                                    type="date"
                                    value={editInstData.date}
                                    onChange={e => setEditInstData({ ...editInstData, date: e.target.value })}
                                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">रकम (₹) *</label>
                                  <input
                                    type="number"
                                    value={editInstData.amount}
                                    onChange={e => setEditInstData({ ...editInstData, amount: e.target.value })}
                                    className="w-full text-xs font-black p-1.5 rounded-lg border border-slate-300 bg-white text-emerald-700"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">रकम स्रोत</label>
                                  <select
                                    value={editInstData.sourceOfFund}
                                    onChange={e => setEditInstData({ ...editInstData, sourceOfFund: e.target.value })}
                                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                                  >
                                    <option value="shop_cash">🏪 दुकान गल्ला</option>
                                    <option value="business_salary">💼 दुकान सैलरी</option>
                                    <option value="business_capital">🏢 बिजनेस बैंक/UPI</option>
                                    <option value="personal_funds">👛 पर्सनल फंड</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">टिप्पणी / विवरण</label>
                                  <input
                                    type="text"
                                    value={editInstData.notes}
                                    onChange={e => setEditInstData({ ...editInstData, notes: e.target.value })}
                                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingInstallmentIdx(null)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                                >
                                  रद्द करें
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditInstallment(viewHistoryItem, idx)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition"
                                >
                                  💾 सुरक्षित करें
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900">{monthTitle}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-slate-200 text-slate-700">
                                  किस्त #{idx + 1}
                                </span>
                                {inst.isAutoDebited && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
                                    🔄 स्वतः
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                <span>📅 {dateFormatted}</span>
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <span className={`px-1.5 py-0.2 rounded font-medium ${
                                  isSalary ? "bg-amber-100 text-amber-800" : isCap ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {isSalary ? "🏪 दुकान सैलरी (Drawing)" : isCap ? "🏢 बिजनेस कैपिटल" : "👛 पर्सनल"}
                                </span>
                                {inst.notes && <span>• {inst.notes}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-black text-emerald-600 text-sm">
                                  + ₹{Number(inst.amount || 0).toLocaleString("en-IN")}
                                </div>
                                <span className="text-[10px] text-emerald-700 font-bold">सफल जमा</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartEditInstallment(idx, inst)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                                title="इस जमा एंट्री की तारीख या रकम बदलें"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleInstallment(viewHistoryItem, idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="इस जमा एंट्री को हटाएं"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Upcoming Schedule / आगामी किस्तें */}
                {viewHistoryItem.savingsType !== "FD" && vSchedule.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span>🗓️ आगामी देय किस्तें (Upcoming Schedule)</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-black">
                          {vRemainingCount} शेष
                        </span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">
                        (हर माह {viewHistoryItem.dueDayOfMonth || 5} तारीख)
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {vSchedule.map((item, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white rounded-xl p-2.5 border border-dashed border-slate-300 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black text-[10px] flex items-center justify-center">
                              {item.installmentNum}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800">{item.monthLabel}</span>
                              <p className="text-[10px] text-slate-400">अपेक्षित तारीख: {item.dueDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-700 text-xs">
                              ₹{item.amount.toLocaleString("en-IN")}
                            </span>
                            {sIdx === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const it = viewHistoryItem;
                                  setViewHistoryItem(null);
                                  handleOpenPay(it);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] shadow-xs cursor-pointer active:scale-95 transition"
                              >
                                जमा करें
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Fixed Footer Actions */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const it = viewHistoryItem;
                    setViewHistoryItem(null);
                    handleOpenPay(it);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} /> 💵 नई किस्त जमा करें
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const it = viewHistoryItem;
                    setViewHistoryItem(null);
                    handleOpenEdit(it);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} /> एडिट
                </button>
                <button
                  type="button"
                  onClick={() => setViewHistoryItem(null)}
                  className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
