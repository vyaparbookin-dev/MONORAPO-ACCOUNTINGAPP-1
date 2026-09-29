import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Share2,
  RefreshCw,
  Wallet,
  Receipt,
  Users,
  Building,
  ChefHat,
  Sparkles,
  Award,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";
import api from "../../services/api";
import { readLocalJson } from "@repo/shared";
import { useCompany } from "../../contexts/CompanyContext";
import { getBusinessMode } from "../../utils/businessMode";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";

const parseAnyDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  if (!str || str.toLowerCase() === "today" || str === "आज") return new Date();

  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const parsed = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    if (d.getFullYear() > 2020) return d;
    const currentYear = new Date().getFullYear();
    const withYear = new Date(`${str} ${currentYear}`);
    if (!isNaN(withYear.getTime())) return withYear;
  }

  const currentYear = new Date().getFullYear();
  const tryWithYear = new Date(`${str} ${currentYear}`);
  if (!isNaN(tryWithYear.getTime())) return tryWithYear;

  return null;
};

const getLocalDayStr = (val) => {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = parseAnyDate(val);
  if (!d || isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const HINDI_MONTHS = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
];
const HINDI_DAYS = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

export default function MobileDayBookModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const business = getBusinessMode(selectedCompany);
  const isRestaurant = business.isRestaurant;

  const initialNow = new Date();
  const initialMonthStr = `${initialNow.getFullYear()}-${String(initialNow.getMonth() + 1).padStart(2, "0")}`;

  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(initialMonthStr);
  const [selectedDayDate, setSelectedDayDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTxTab, setActiveTxTab] = useState("all"); // 'all' | 'bills' | 'purchases' | 'expenses' | 'salaries' | 'parties'
  const [summaryCardFilter, setSummaryCardFilter] = useState("all"); // 'all' | 'in' | 'out' | 'cash_sales' | 'credit_sales' | 'party_in' | 'purchases' | 'expenses' | 'salaries' | 'party_out'
  const [rawdata, setRawData] = useState(null);
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    cashSales: 0,
    partyIn: 0,
    cashPurchases: 0,
    expenses: 0,
    salaries: 0,
    partyOut: 0,
  });

  useEffect(() => {
    fetchDayBook();
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (selectedDayDate) {
      setTimeout(() => {
        const el = document.getElementById(`day-pill-${selectedDayDate}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
    }
  }, [selectedDayDate, selectedMonth]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setSummaryCardFilter("all");
    const now = new Date();
    if (newPeriod === "today") {
      const todayStr = getLocalDayStr(now);
      const currYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(currYm);
      setSelectedDayDate(todayStr);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPeriod === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = getLocalDayStr(yesterday);
      const yYm = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(yYm);
      setSelectedDayDate(yStr);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPeriod === "week") {
      setSelectedDayDate("");
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      setStartDate(getLocalDayStr(sevenDaysAgo));
      setEndDate(getLocalDayStr(now));
    } else if (newPeriod === "month") {
      const currYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(currYm);
      handleSelectWholeMonth(currYm);
    } else if (newPeriod === "all") {
      setSelectedDayDate("");
      setStartDate("");
      setEndDate("");
    }
  };

  const handleSelectDay = (dayDateStr) => {
    setSelectedDayDate(dayDateStr);
    setPeriod("custom");
    setStartDate(dayDateStr);
    setEndDate(dayDateStr);
    setSummaryCardFilter("all");
  };

  const handleSelectWholeMonth = (mStr = selectedMonth) => {
    setSelectedDayDate("");
    const [y, m] = mStr.split("-").map(Number);
    const daysInM = new Date(y, m, 0).getDate();
    setPeriod("month");
    setStartDate(`${mStr}-01`);
    setEndDate(`${mStr}-${String(daysInM).padStart(2, "0")}`);
    setSummaryCardFilter("all");
  };

  const handleMonthChange = (newMonthStr) => {
    setSelectedMonth(newMonthStr);
    handleSelectWholeMonth(newMonthStr);
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    handleMonthChange(prevYm);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYm = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    handleMonthChange(nextYm);
  };

  const daysInSelectedMonth = (() => {
    const [y, m] = (selectedMonth || initialMonthStr).split("-").map(Number);
    if (!y || !m) return [];
    const daysCount = new Date(y, m, 0).getDate();
    const todayStr = getLocalDayStr(new Date());
    const list = [];
    for (let d = 1; d <= daysCount; d++) {
      const dStr = String(d).padStart(2, "0");
      const fullDateStr = `${selectedMonth}-${dStr}`;
      const dt = new Date(y, m - 1, d);
      list.push({
        dayNum: d,
        dateStr: fullDateStr,
        dayName: HINDI_DAYS[dt.getDay()],
        isToday: fullDateStr === todayStr,
        isSunday: dt.getDay() === 0
      });
    }
    return list;
  })();

  const availableMonths = (() => {
    const list = [];
    const curr = new Date();
    for (let i = -11; i <= 2; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth() + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      list.push({
        value: ym,
        label: `${HINDI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return list.reverse();
  })();

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      let url = `/api/daybook?period=${period}&limit=500`;
      if (startDate && endDate) {
        url = `/api/daybook?startDate=${startDate}&endDate=${endDate}&limit=500`;
      } else if (period === "custom") {
        url = `/api/daybook?startDate=${startDate}&endDate=${endDate}&limit=500`;
      }

      let data = null;
      try {
        const res = await api.get(url);
        data = res?.data?.data || res?.data || res;
      } catch (e) {
        console.warn("Server daybook fetch err, using local data", e);
      }

      // Merge local manual bills from localStorage (ensures offline / recent manual sales ALWAYS show)
      let localBills = [];
      try {
        const stored = readLocalJson(["vb_local_manual_bills", "bills", "manual_bills", "sales", "vb_bills"], []);
        if (Array.isArray(stored)) localBills = stored;
      } catch (e) {}

      // Also merge local expenses from localStorage
      let localExpenses = [];
      try {
        const storedExp = readLocalJson(["vb_local_expenses", "expenses", "local_expenses"], []);
        if (Array.isArray(storedExp)) localExpenses = storedExp;
      } catch (e) {}

      const now = new Date();
      const todayStr = getLocalDayStr(now);
      const yestDate = new Date(now);
      yestDate.setDate(now.getDate() - 1);
      const yestStr = getLocalDayStr(yestDate);

      const checkInRange = (rawDateVal) => {
        if (period === "all" || (!startDate && !endDate)) return true;
        const dStr = getLocalDayStr(rawDateVal);
        if (!dStr) return true;
        if (period === "today") return dStr === todayStr;
        if (period === "yesterday") return dStr === yestStr;
        if (startDate && dStr < startDate) return false;
        if (endDate && dStr > endDate) return false;
        return true;
      };

      const serverBills = Array.isArray(data?.bills) ? data.bills : [];
      const mergedBills = [...serverBills];

      localBills.forEach(lb => {
        const rawDate = lb.rawDate || lb.date || lb.createdAt;
        if (checkInRange(rawDate)) {
          const exists = mergedBills.some(sb => 
            (sb.billNumber && (sb.billNumber === lb.id || sb.billNumber === lb.billNumber)) ||
            (sb._id && (sb._id === lb._id || sb._id === lb.id))
          );
          if (!exists) {
            const amt = Number(lb.amount || lb.finalAmount || lb.total || lb.totalAmount || lb.grandTotal || 0);
            const isCredit = String(lb.paymentMode || "").toUpperCase() === "UDHAR" || 
                             String(lb.paymentMethod || "").toLowerCase() === "credit" ||
                             String(lb.paymentStatus || "").toLowerCase() === "unpaid" ||
                             Boolean(lb.isCredit);
            const resolvedMode = isCredit ? "UDHAR" : (lb.paymentMode || lb.paymentMethod || "CASH");
            const resolvedMethod = isCredit ? "credit" : (lb.paymentMethod || lb.paymentMode || "cash");
            mergedBills.push({
              ...lb,
              _id: lb._id || lb.id,
              billNumber: lb.id || lb.billNumber || (isCredit ? "SALE-UDHAR" : "SALE-CASH"),
              customerName: lb.customerName || (isCredit ? "उधार ग्राहक" : "काउंटर नकद ग्राहक"),
              amount: amt,
              finalAmount: amt,
              total: amt,
              totalAmount: amt,
              paymentMode: resolvedMode,
              paymentMethod: resolvedMethod,
              type: resolvedMode,
              paymentStatus: isCredit ? "unpaid" : (lb.paymentStatus || "paid"),
              date: lb.rawDate || lb.date || new Date().toISOString(),
              rawDate: lb.rawDate || lb.date || new Date().toISOString(),
              createdAt: lb.rawDate || lb.date || new Date().toISOString(),
              items: lb.items || []
            });
          }
        }
      });

      const serverExpenses = Array.isArray(data?.expenses) ? data.expenses : [];
      const mergedExpenses = deduplicateExpenses([...serverExpenses, ...localExpenses.filter(le => checkInRange(le.date || le.createdAt))]);

      let localPurchases = [];
      try {
        if (typeof localStorage !== "undefined") {
          const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
          const pKeys = [
            currentCoId ? `vb_local_purchases_${currentCoId}` : null,
            "vb_local_purchases",
            "purchases",
            "local_purchases"
          ].filter(Boolean);
          for (const k of pKeys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) localPurchases.push(...parsed);
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      const serverPurchases = Array.isArray(data?.purchases) ? data.purchases : [];
      const mergedPurchases = [...serverPurchases];
      localPurchases.forEach(lp => {
        const rawDate = lp.date || lp.createdAt;
        if (checkInRange(rawDate)) {
          const exists = mergedPurchases.some(sp => (sp._id && sp._id === lp._id) || (sp.invoiceNumber && sp.invoiceNumber === lp.invoiceNumber));
          if (!exists) mergedPurchases.push(lp);
        }
      });

      const combinedData = {
        ...(data || {}),
        bills: mergedBills,
        expenses: mergedExpenses,
        purchases: mergedPurchases,
        salaries: Array.isArray(data?.salaries) ? data.salaries : [],
        partyTransactions: Array.isArray(data?.partyTransactions) ? data.partyTransactions : []
      };

      setRawData(combinedData);
      calculateSummary(combinedData);
    } catch (err) {
      console.error("Failed to fetch Mobile Daybook", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let tIn = 0,
      tOut = 0;

    const isCreditBill = (b) => {
      if (!b) return false;
      const pm = String(b.paymentMode || b.paymentMethod || b.type || "").toLowerCase();
      const ps = String(b.paymentStatus || b.status || "").toLowerCase();
      return pm === "credit" || pm === "udhar" || ps === "unpaid" || ps === "partial" || ps === "issued" || Boolean(b.isCredit);
    };

    const totalBillSales = (data.bills || [])
      .reduce((sum, b) => sum + Number(b.amount || b.finalAmount || b.total || b.totalAmount || b.grandTotal || 0), 0);

    const creditSales = (data.bills || [])
      .filter(isCreditBill)
      .reduce((sum, b) => sum + Number(b.amount || b.finalAmount || b.total || b.totalAmount || b.grandTotal || 0), 0);

    const cashSales = Math.max(0, totalBillSales - creditSales);
    const partyIn = (data.partyTransactions || []).reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    const cashPurchases = (data.purchases || []).reduce((sum, p) => sum + Number(p.amountPaid || p.total || 0), 0);
    const expenses = (data.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const salaries = (data.salaries || []).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const partyOut = (data.partyTransactions || []).reduce((sum, t) => sum + Number(t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn,
      totalOut: tOut,
      netBalance: tIn - tOut,
      totalBillSales,
      cashSales,
      creditSales,
      partyIn,
      cashPurchases,
      expenses,
      salaries,
      partyOut,
    });
  };

  const shareDailyFlashWhatsApp = () => {
    let msg = `*📊 ${selectedCompany?.name || "दुकान"} - रोजाना हिसाब (DayBook)*\n`;
    msg += `*अवधि:* ${startDate} ${startDate !== endDate ? `से ${endDate}` : ""}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 कुल आवक (IN):* ₹${summary.totalIn.toLocaleString("en-IN")}\n`;
    msg += `  • नकद/ऑनलाइन सेल: ₹${summary.cashSales.toLocaleString("en-IN")}\n`;
    msg += `  • उधारी वसूली: ₹${summary.partyIn.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*🔴 कुल जावक (OUT):* ₹${summary.totalOut.toLocaleString("en-IN")}\n`;
    msg += `  • माल खरीद: ₹${summary.cashPurchases.toLocaleString("en-IN")}\n`;
    msg += `  • स्टाफ वेतन: ₹${summary.salaries.toLocaleString("en-IN")}\n`;
    msg += `  • दुकान खर्चे: ₹${summary.expenses.toLocaleString("en-IN")}\n`;
    msg += `  • सप्लायर भुगतान: ₹${summary.partyOut.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*💰 शुद्ध बचत (NET):* *₹${summary.netBalance.toLocaleString("en-IN")}*\n`;
    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const billsList = rawdata?.bills || [];
  const purchasesList = rawdata?.purchases || [];
  const expensesList = rawdata?.expenses || [];
  const salariesList = rawdata?.salaries || [];
  const partiesList = rawdata?.partyTransactions || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Mobile Top App Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            aria-label="वापस जाएं"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-black flex items-center gap-1.5 leading-tight">
              <span>📅 रोजाना बही (DayBook)</span>
            </h2>
            <p className="text-[11px] text-blue-100/90 font-medium truncate max-w-[200px]">
              {selectedCompany?.name || "दैनिक रोकड़ हिसाब"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={shareDailyFlashWhatsApp}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
            title="WhatsApp Flash Share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
          <button
            onClick={fetchDayBook}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Quick Period Selector Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "all", label: "🔄 सभी (All)" },
          { id: "today", label: "📅 आज (Today)" },
          { id: "yesterday", label: "⏮️ कल (Yesterday)" },
          { id: "week", label: "📆 इस हफ्ते (Week)" },
          { id: "month", label: "🗓️ इस महीने (Month)" }
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriodChange(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              period === p.id && !selectedDayDate
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 📅 Interactive Month Picker & Horizontal Day Scroller Strip */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-inner shrink-0">
        {/* Month Navigation Header */}
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-[11px] font-bold text-slate-300">माह चुनें:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition text-xs font-black cursor-pointer"
              title="पिछला महीना"
            >
              ◀
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-black px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer text-center"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition text-xs font-black cursor-pointer"
              title="अगला महीना"
            >
              ▶
            </button>
          </div>

          <div className="text-[11px] font-extrabold truncate max-w-[125px]">
            {selectedDayDate ? (
              <span className="bg-indigo-950 border border-indigo-700/70 px-2 py-0.5 rounded-md text-emerald-400 font-mono text-xs">
                {selectedDayDate.split("-")[2]} {HINDI_MONTHS[(Number(selectedMonth.split("-")[1]) - 1) % 12].slice(0, 3)}
              </span>
            ) : (
              <span className="text-indigo-200 text-[10px] font-bold">पूरा महीना</span>
            )}
          </div>
        </div>

        {/* Horizontally Scrollable Day Buttons Strip */}
        <div className="px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Whole Month Pill Button */}
          <button
            type="button"
            onClick={() => handleSelectWholeMonth()}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer flex flex-col items-center justify-center border ${
              !selectedDayDate && (period === "month" || (startDate && endDate && startDate !== endDate))
                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <span className="text-[9px] uppercase tracking-tighter opacity-80 leading-none">🗓️ पूरा</span>
            <span className="text-xs leading-tight font-black mt-0.5">माह</span>
          </button>

          {/* Date Buttons for each day of the selected month */}
          {daysInSelectedMonth.map((item) => {
            const isSelected = selectedDayDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                id={`day-pill-${item.dateStr}`}
                type="button"
                onClick={() => handleSelectDay(item.dateStr)}
                className={`min-w-[46px] px-2 py-1 rounded-xl text-center shrink-0 transition cursor-pointer flex flex-col items-center border active:scale-95 ${
                  isSelected
                    ? "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-indigo-300 shadow-md ring-2 ring-indigo-400 scale-105 font-black"
                    : item.isToday
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-600 hover:bg-emerald-900/60"
                    : item.isSunday
                    ? "bg-slate-800/90 text-rose-300 border-slate-700 hover:bg-slate-700"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <span className="text-[9px] uppercase tracking-tighter opacity-80 leading-none">
                  {item.dayName}
                </span>
                <span className="text-sm font-black leading-tight mt-0.5">
                  {item.dayNum}
                </span>
                {item.isToday && (
                  <span className="text-[8px] bg-emerald-500 text-slate-950 font-black px-1 rounded-full leading-none mt-0.5">
                    आज
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Mobile Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 safe-bottom pb-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold">डेटा लोड हो रहा है...</span>
          </div>
        ) : (
          <>
            {/* 1. Net Balance / Shuddh Munafa Hero Card */}
            <div 
              onClick={() => {
                setSummaryCardFilter("all");
                setActiveTxTab("all");
              }}
              className={`p-4 rounded-2xl text-white shadow-md border cursor-pointer active:scale-98 transition ${
                summary.netBalance >= 0
                  ? "bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/30"
                  : "bg-gradient-to-br from-rose-600 to-red-700 border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  {summary.netBalance >= 0 ? "💰 शुद्ध बचत / शुद्ध मुनाफा (In-Hand Surplus)" : "⚠️ शुद्ध घाटा / अधिक निकासी (Net Deficit)"}
                </span>
                <span className="text-[10px] bg-white/20 font-mono font-bold px-2 py-0.5 rounded-full">
                  {summaryCardFilter !== "all" ? "फ़िल्टर रीसेट करें" : "Net Balance"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                ₹{summary.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                <span>कुल आवक: <strong>₹{summary.totalIn.toLocaleString("en-IN")}</strong></span>
                <span>कुल जावक: <strong>₹{summary.totalOut.toLocaleString("en-IN")}</strong></span>
              </div>
            </div>

            {/* Deficit / Loss Explanation Banner */}
            {summary.netBalance < 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                <div className="font-black text-rose-800 flex items-center gap-1.5">
                  <span>⚠️</span> <span>शुद्ध घाटे का कारण (Breakdown of Net Deficit):</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  इस अवधि में कुल आवक ₹{summary.totalIn.toLocaleString("en-IN")} (बिक्री व उधारी जमा) के मुकाबले कुल जावक ₹{summary.totalOut.toLocaleString("en-IN")} (खरीद ₹{summary.cashPurchases.toLocaleString("en-IN")}, खर्चे ₹{summary.expenses.toLocaleString("en-IN")}, वेतन ₹{summary.salaries.toLocaleString("en-IN")}, सप्लायर ₹{summary.partyOut.toLocaleString("en-IN")}) अधिक रही। नीचे दिए गए आवक/जावक कार्ड्स पर टैप करके जांचें कि कौन-कौन से लेनदेन इसमें शामिल हैं।
                </p>
              </div>
            )}

            {/* 2. Inflow & Outflow 2-Card Grid (Clickable Interactive Cards) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Green Inflow Card */}
              <div 
                onClick={() => {
                  setSummaryCardFilter(prev => prev === "in" ? "all" : "in");
                  setActiveTxTab("all");
                }}
                className={`bg-white p-3 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition active:scale-98 ${
                  summaryCardFilter === "in" || summaryCardFilter === "cash_sales" || summaryCardFilter === "credit_sales" || summaryCardFilter === "party_in"
                    ? "border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/20"
                    : "border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-black uppercase">🟢 कुल आवक (IN)</span>
                  <ArrowDownCircle size={16} />
                </div>
                <div className="text-base font-black text-emerald-700 font-mono">
                  ₹{summary.totalIn.toLocaleString("en-IN")}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "cash_sales" ? "all" : "cash_sales");
                      setActiveTxTab("bills");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'cash_sales' ? 'bg-emerald-100 font-black text-emerald-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>नकद सेल:</span>
                    <span className="font-bold text-slate-900">₹{(summary.cashSales || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {(summary.creditSales || 0) > 0 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSummaryCardFilter(prev => prev === "credit_sales" ? "all" : "credit_sales");
                        setActiveTxTab("bills");
                      }}
                      className={`flex justify-between text-amber-700 p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'credit_sales' ? 'bg-amber-100 font-black text-amber-900' : 'hover:bg-slate-50'}`}
                    >
                      <span>उधार सेल:</span>
                      <span className="font-bold">₹{(summary.creditSales || 0).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "party_in" ? "all" : "party_in");
                      setActiveTxTab("parties");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'party_in' ? 'bg-emerald-100 font-black text-emerald-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>उधारी जमा:</span>
                    <span className="font-bold text-slate-900">₹{(summary.partyIn || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Red Outflow Card */}
              <div 
                onClick={() => {
                  setSummaryCardFilter(prev => prev === "out" ? "all" : "out");
                  setActiveTxTab("all");
                }}
                className={`bg-white p-3 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition active:scale-98 ${
                  summaryCardFilter === "out" || summaryCardFilter === "purchases" || summaryCardFilter === "salaries" || summaryCardFilter === "expenses" || summaryCardFilter === "party_out"
                    ? "border-rose-500 ring-2 ring-rose-400 bg-rose-50/20"
                    : "border-rose-200 hover:border-rose-400"
                }`}
              >
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[11px] font-black uppercase">🔴 कुल जावक (OUT)</span>
                  <ArrowUpCircle size={16} />
                </div>
                <div className="text-base font-black text-rose-700 font-mono">
                  ₹{summary.totalOut.toLocaleString("en-IN")}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "purchases" ? "all" : "purchases");
                      setActiveTxTab("purchases");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'purchases' ? 'bg-rose-100 font-black text-rose-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>खरीद:</span>
                    <span className="font-bold text-slate-900">₹{summary.cashPurchases.toLocaleString("en-IN")}</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "salaries" ? "all" : "salaries");
                      setActiveTxTab("salaries");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'salaries' ? 'bg-rose-100 font-black text-rose-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>वेतन:</span>
                    <span className="font-bold text-slate-900">₹{summary.salaries.toLocaleString("en-IN")}</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "expenses" ? "all" : "expenses");
                      setActiveTxTab("expenses");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'expenses' ? 'bg-rose-100 font-black text-rose-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>खर्च:</span>
                    <span className="font-bold text-slate-900">₹{summary.expenses.toLocaleString("en-IN")}</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryCardFilter(prev => prev === "party_out" ? "all" : "party_out");
                      setActiveTxTab("parties");
                    }}
                    className={`flex justify-between p-1 rounded-lg cursor-pointer ${summaryCardFilter === 'party_out' ? 'bg-rose-100 font-black text-rose-900' : 'hover:bg-slate-50'}`}
                  >
                    <span>पार्टी:</span>
                    <span className="font-bold text-slate-900">₹{summary.partyOut.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Card Filter Banner with Reset */}
            {summaryCardFilter !== "all" && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span>🔍</span>
                  <span>
                    {summaryCardFilter === 'in' && `फिल्टर: 🟢 कुल आवक (₹${summary.totalIn.toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'out' && `फिल्टर: 🔴 कुल जावक (₹${summary.totalOut.toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'cash_sales' && `फिल्टर: 💵 नकद बिक्री (₹${(summary.cashSales || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'credit_sales' && `फिल्टर: 📒 उधार बिक्री (₹${(summary.creditSales || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'party_in' && `फिल्टर: 🤝 उधारी वसूली / जमा (₹${(summary.partyIn || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'purchases' && `फिल्टर: 📦 माल खरीद (₹${(summary.cashPurchases || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'salaries' && `फिल्टर: 👨‍🍳 स्टाफ वेतन (₹${(summary.salaries || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'expenses' && `फिल्टर: ⚡ दुकान खर्चे (₹${(summary.expenses || 0).toLocaleString('en-IN')})`}
                    {summaryCardFilter === 'party_out' && `फिल्टर: 🔴 सप्लायर भुगतान (₹${(summary.partyOut || 0).toLocaleString('en-IN')})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryCardFilter("all");
                    setActiveTxTab("all");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-300 text-indigo-700 font-black text-[10px] cursor-pointer hover:bg-indigo-100 shadow-2xs"
                >
                  ✕ सभी देखें
                </button>
              </div>
            )}

            {/* 3. Transaction Filter Pills */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  लेनदेन रजिस्टर ({
                    activeTxTab === "all" ? billsList.length + purchasesList.length + expensesList.length + salariesList.length + partiesList.length :
                    activeTxTab === "bills" ? billsList.length :
                    activeTxTab === "purchases" ? purchasesList.length :
                    activeTxTab === "expenses" ? expensesList.length :
                    activeTxTab === "salaries" ? salariesList.length : partiesList.length
                  })
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: "सभी (All)" },
                  { id: "bills", label: `बिल (${billsList.length})` },
                  { id: "purchases", label: `खरीद (${purchasesList.length})` },
                  { id: "expenses", label: `खर्चे (${expensesList.length})` },
                  { id: "salaries", label: `वेतन (${salariesList.length})` },
                  { id: "parties", label: `पार्टी (${partiesList.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTxTab(t.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                      activeTxTab === t.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Mobile Transaction Cards List */}
            <div className="space-y-2">
              {/* Bills */}
              {(activeTxTab === "all" || activeTxTab === "bills" || summaryCardFilter === "in" || summaryCardFilter === "cash_sales" || summaryCardFilter === "credit_sales") &&
                !["out", "purchases", "expenses", "salaries", "party_out", "party_in"].includes(summaryCardFilter) &&
                billsList
                  .filter((b) => {
                    const pm = String(b.paymentMode || b.paymentMethod || b.type || "").toLowerCase();
                    const ps = String(b.paymentStatus || b.status || "").toLowerCase();
                    const isCredit = pm === "credit" || pm === "udhar" || ps === "unpaid" || ps === "partial" || ps === "issued" || Boolean(b.isCredit);
                    if (summaryCardFilter === "cash_sales" || summaryCardFilter === "in") return !isCredit;
                    if (summaryCardFilter === "credit_sales") return isCredit;
                    return true;
                  })
                  .map((b) => (
                    <div
                      key={`b-${b._id || b.id || Math.random()}`}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-black rounded border border-blue-100">
                            #{b.billNumber || b.invoiceNo || "BILL"}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">
                            {b.customerName || b.partyId?.name || "Walk-in Guest"}
                          </span>
                        </div>
                        {(() => {
                          const pm = String(b.paymentMode || b.paymentMethod || b.type || "").toLowerCase();
                          const ps = String(b.paymentStatus || b.status || "").toLowerCase();
                          const isCredit = pm === "credit" || pm === "udhar" || ps === "unpaid" || ps === "partial" || ps === "issued" || Boolean(b.isCredit);
                          const isUpi = pm.includes("upi") || pm.includes("online");
                          return (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span>{b.date || "Today"}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                                isCredit ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                isUpi ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {isCredit ? "उधार (Credit)" : isUpi ? "UPI ऑनलाइन" : "नकद (Cash)"}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-emerald-700 font-mono">
                          +₹{(Number(b.amount || b.finalAmount || b.total || b.totalAmount || 0)).toLocaleString("en-IN")}
                        </span>
                        {(() => {
                          const pm = String(b.paymentMode || b.paymentMethod || b.type || "").toLowerCase();
                          const ps = String(b.paymentStatus || b.status || "").toLowerCase();
                          const isCredit = pm === "credit" || pm === "udhar" || ps === "unpaid" || ps === "partial" || ps === "issued" || Boolean(b.isCredit);
                          return (
                            <span className={`text-[10px] block font-bold uppercase ${isCredit ? 'text-amber-700' : 'text-slate-400'}`}>
                              {isCredit ? 'उधार बिक्री' : 'नकद बिक्री'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}

              {/* Purchases (माल खरीद) */}
              {(activeTxTab === "all" || activeTxTab === "purchases" || summaryCardFilter === "out" || summaryCardFilter === "purchases") &&
                !["in", "cash_sales", "credit_sales", "party_in", "expenses", "salaries", "party_out"].includes(summaryCardFilter) &&
                purchasesList.map((pur) => {
                  const pAmt = Number(pur.amountPaid ?? pur.total ?? pur.finalAmount ?? 0);
                  return (
                    <div
                      key={`pur-${pur._id || pur.id || Math.random()}`}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-mono text-[10px] font-black rounded border border-purple-100">
                            #{pur.invoiceNumber || pur.billNumber || "PUR"}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">
                            {pur.partyId?.name || pur.supplierName || "सप्लायर / माल खरीद"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>{pur.date ? new Date(pur.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today"}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded font-bold text-[9px] uppercase bg-purple-100 text-purple-800 border border-purple-200">
                            📦 माल खरीद (Purchase)
                          </span>
                        </div>
                        {pur.items && pur.items.length > 0 && (
                          <div className="text-[10px] text-slate-500 pt-0.5">
                            सामान: {pur.items.map(it => it.name).filter(Boolean).slice(0, 3).join(", ")}
                            {pur.items.length > 3 ? ` +${pur.items.length - 3} अन्य` : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-rose-600 font-mono">
                          -₹{pAmt.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] block text-slate-400 font-semibold uppercase">
                          खरीद
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Expenses */}
              {(activeTxTab === "all" || activeTxTab === "expenses" || summaryCardFilter === "out" || summaryCardFilter === "expenses") &&
                !["in", "cash_sales", "credit_sales", "party_in", "purchases", "salaries", "party_out"].includes(summaryCardFilter) &&
                expensesList.map((e) => (
                  <div
                    key={`e-${e._id || e.id || Math.random()}`}
                    className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>⚡ {e.title || "खर्च"}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({e.category || "General"})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        दुकान खर्च
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-rose-600 font-mono">
                        -₹{(e.amount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] block text-slate-400 font-semibold uppercase">
                        खर्च
                      </span>
                    </div>
                  </div>
                ))}

              {/* Salaries */}
              {(activeTxTab === "all" || activeTxTab === "salaries" || summaryCardFilter === "out" || summaryCardFilter === "salaries") &&
                !["in", "cash_sales", "credit_sales", "party_in", "purchases", "expenses", "party_out"].includes(summaryCardFilter) &&
                salariesList.map((s) => (
                  <div
                    key={`s-${s._id || s.id || Math.random()}`}
                    className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>👨‍🍳 {s.staffId?.name || s.staffName || "Staff"}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        वेतन / दैनिक मजदूरी
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-rose-600 font-mono">
                        -₹{(s.amount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] block text-slate-400 font-semibold uppercase">
                        वेतन
                      </span>
                    </div>
                  </div>
                ))}

              {/* Party Transactions */}
              {(activeTxTab === "all" || activeTxTab === "parties" || summaryCardFilter === "in" || summaryCardFilter === "out" || summaryCardFilter === "party_in" || summaryCardFilter === "party_out") &&
                !["cash_sales", "credit_sales", "purchases", "expenses", "salaries"].includes(summaryCardFilter) &&
                partiesList
                  .filter((p) => {
                    const isCredit = (p.credit || 0) > 0;
                    if (summaryCardFilter === "in" || summaryCardFilter === "party_in") return isCredit;
                    if (summaryCardFilter === "out" || summaryCardFilter === "party_out") return !isCredit;
                    return true;
                  })
                  .map((p) => {
                    const isCredit = (p.credit || 0) > 0;
                    return (
                      <div
                        key={`p-${p._id || p.id || Math.random()}`}
                        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>🤝 {p.partyId?.name || p.details || "Party"}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {isCredit ? "ग्राहक से प्राप्त उधारी" : "सप्लायर को भुगतान"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-sm font-mono ${isCredit ? "text-emerald-700" : "text-rose-600"}`}>
                            {isCredit ? `+₹${p.credit}` : `-₹${p.debit}`}
                          </span>
                          <span className="text-[10px] block text-slate-400 font-semibold uppercase">
                            {isCredit ? "आवक" : "जावक"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

              {/* Empty state */}
              {billsList.length === 0 &&
                purchasesList.length === 0 &&
                expensesList.length === 0 &&
                salariesList.length === 0 &&
                partiesList.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-1">
                    <p className="text-xs font-bold text-slate-700">इस अवधि में कोई लेनदेन दर्ज नहीं है</p>
                    <p className="text-[11px] text-slate-400">बिल बनाने या खर्चे दर्ज करने पर यहाँ लाइव दिखेगा।</p>
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
