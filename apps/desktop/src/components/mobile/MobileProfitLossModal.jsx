import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Share2,
  RefreshCw,
  PieChart,
  Calendar,
  Layers,
  Home,
  Building2,
  Wallet
} from "lucide-react";
import api from "../../services/api";
import { readLocalJson } from "@repo/shared";
import { useCompany } from "../../contexts/CompanyContext";
import { deduplicateBills } from "../../utils/deduplicateBills";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";

export default function MobileProfitLossModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  
  const [salesTotal, setSalesTotal] = useState(0);
  const [operatingExpensesTotal, setOperatingExpensesTotal] = useState(0);
  const [gharKharchTotal, setGharKharchTotal] = useState(0);
  const [netBusinessProfit, setNetBusinessProfit] = useState(0);
  const [netRemainingSavings, setNetRemainingSavings] = useState(0);
  const [billsCount, setBillsCount] = useState(0);
  const [expensesCount, setExpensesCount] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    const now = new Date();
    if (p === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (p === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (p === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const isDateInRange = (dateInput) => {
    if (!startDate && !endDate) return true;
    if (!dateInput) return true;
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return true;
      const targetStr = d.toISOString().slice(0, 10);
      if (startDate && targetStr < startDate) return false;
      if (endDate && targetStr > endDate) return false;
      return true;
    } catch (e) {
      return true;
    }
  };

  const isPersonalExpense = (e) => {
    if (!e) return false;
    const t = String(e.expenseType || "").toLowerCase();
    const c = String(e.category || "").toLowerCase();
    const tit = String(e.title || "").toLowerCase();
    const mem = String(e.familyMember || e.member || "").trim();
    return (
      t === "drawings" ||
      t === "ghar_kharch" ||
      t === "personal" ||
      c.includes("घर खर्च") ||
      c.includes("family") ||
      c.includes("personal") ||
      tit.includes("घर खर्च") ||
      (mem !== "" && mem !== "Admin" && mem !== "Shop")
    );
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let plUrl = "/api/reports/profitloss";
      if (startDate && endDate) {
        plUrl += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const [res, billingRes, expenseRes] = await Promise.all([
        api.get(plUrl).catch(() => null),
        api.get("/api/billing?limit=500").catch(() => null),
        api.get("/api/expense").catch(() => null)
      ]);

      // Server Data
      const serverPl = res?.data?.data || res?.data || res || {};
      const serverBills = billingRes?.data?.bills || billingRes?.bills || billingRes?.data || [];
      const serverExpenses = expenseRes?.data?.expenses || expenseRes?.expenses || expenseRes?.data || [];

      // Local Data
      let localBills = [];
      let localExpenses = [];
      try {
        if (typeof localStorage !== "undefined") {
          const storedB = readLocalJson(["vb_local_manual_bills", "bills"], []);
          if (Array.isArray(storedB)) localBills = storedB;
          const storedE = readLocalJson(["vb_local_expenses", "expenses"], []);
          if (Array.isArray(storedE)) localExpenses = storedE;
        }
      } catch (e) {}

      // Deduplicate & filter by date
      const allBills = deduplicateBills([
        ...(Array.isArray(serverBills) ? serverBills : []),
        ...(Array.isArray(localBills) ? localBills : [])
      ]).filter((b) => isDateInRange(b.rawDate || b.date || b.createdAt));

      const allExpenses = deduplicateExpenses([
        ...(Array.isArray(serverExpenses) ? serverExpenses : []),
        ...(Array.isArray(localExpenses) ? localExpenses : [])
      ]).filter((e) => isDateInRange(e.date || e.createdAt));

      // Calculate totals
      const calcSales = allBills.reduce(
        (sum, b) => sum + (Number(b.amount || b.finalAmount || b.total) || 0),
        0
      );

      const operatingList = allExpenses.filter((e) => !isPersonalExpense(e));
      const drawingsList = allExpenses.filter((e) => isPersonalExpense(e));

      const calcOperating = operatingList.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );
      const calcGharKharch = drawingsList.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );

      // Prefer calculated local+server if greater, else fallback to API
      const finalSales = calcSales > 0 ? calcSales : Number(serverPl.totalSales || 0);
      const finalOperating = calcOperating > 0 ? calcOperating : Number(serverPl.businessExpenses || 0);
      const finalGharKharch = calcGharKharch > 0 ? calcGharKharch : Number(serverPl.gharKharch || 0);

      const profit = finalSales - finalOperating;
      const savings = profit - finalGharKharch;

      setSalesTotal(finalSales);
      setOperatingExpensesTotal(finalOperating);
      setGharKharchTotal(finalGharKharch);
      setNetBusinessProfit(profit);
      setNetRemainingSavings(savings);
      setBillsCount(allBills.length);
      setExpensesCount(allExpenses.length);
    } catch (err) {
      console.error("Failed to fetch Mobile P&L", err);
    } finally {
      setLoading(false);
    }
  };

  const marginPercent = salesTotal > 0 ? ((netBusinessProfit / salesTotal) * 100).toFixed(1) : 0;

  const shareWhatsApp = () => {
    let msg = `*📈 ${selectedCompany?.name || "व्यापार"} - नफा-नुकसान रिपोर्ट (P&L)*\n`;
    msg += `*अवधि:* ${startDate || "All"} से ${endDate || "Now"}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 कुल बिक्री (Revenue):* ₹${salesTotal.toLocaleString("en-IN")}\n`;
    msg += `*🏢 दुकान संचालन खर्च (Operating Exp):* ₹${operatingExpensesTotal.toLocaleString("en-IN")}\n`;
    msg += `*💰 शुद्ध व्यापार लाभ (Net Profit):* ₹${netBusinessProfit.toLocaleString("en-IN")} (${marginPercent}% Margin)\n`;
    if (gharKharchTotal > 0) {
      msg += `*🏡 घर खर्च / पर्सनल निकासी:* ₹${gharKharchTotal.toLocaleString("en-IN")}\n`;
      msg += `*💵 घर खर्च के बाद शेष बचत:* ₹${netRemainingSavings.toLocaleString("en-IN")}\n`;
    }
    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Mobile Top App Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
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
              <span>📈 नफा-नुकसान (Profit & Loss)</span>
            </h2>
            <p className="text-[11px] text-emerald-100/90 font-medium truncate max-w-[200px]">
              {selectedCompany?.name || "दुकान लाभ व बचत विवरण"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={shareWhatsApp}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
            title="WhatsApp Flash Share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition"
            title="ताज़ा करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "today", label: "📅 आज (Today)" },
          { id: "month", label: "🗓️ इस महीने (Month)" },
          { id: "year", label: "📈 इस वर्ष (Year)" },
          { id: "all", label: "📊 कुल (All Time)" }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodChange(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
              period === p.id
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Scrollable Mobile Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 safe-bottom pb-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-emerald-600" />
            <span className="text-xs font-bold">रिपोर्ट लोड हो रही है...</span>
          </div>
        ) : (
          <>
            {/* Hero Net Business Profit Card */}
            <div
              className={`p-4 rounded-2xl text-white shadow-md border ${
                netBusinessProfit >= 0
                  ? "bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-500/30"
                  : "bg-gradient-to-br from-rose-600 to-red-800 border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  {netBusinessProfit >= 0 ? "💰 शुद्ध व्यापार मुनाफा (Net Profit)" : "⚠️ शुद्ध घाटा (Net Loss)"}
                </span>
                <span className="text-[10px] bg-white/20 font-mono font-bold px-2 py-0.5 rounded-full">
                  मार्जिन: {marginPercent}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                ₹{netBusinessProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                <span>कुल बिक्री: <strong>₹{salesTotal.toLocaleString("en-IN")}</strong></span>
                <span>दुकान खर्च: <strong>₹{operatingExpensesTotal.toLocaleString("en-IN")}</strong></span>
              </div>
            </div>

            {/* Inflow vs Outflow 2-Card Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
                <span className="text-[11px] font-black uppercase text-emerald-700 block flex items-center gap-1">
                  <TrendingUp size={13} /> 🟢 कुल बिक्री
                </span>
                <div className="text-lg font-black text-emerald-700 font-mono">
                  ₹{salesTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[10px] text-slate-400">{billsCount} बिल / ऑर्डर्स</p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-xs space-y-1">
                <span className="text-[11px] font-black uppercase text-rose-700 block flex items-center gap-1">
                  <Building2 size={13} /> 🏢 दुकान खर्च
                </span>
                <div className="text-lg font-black text-rose-700 font-mono">
                  ₹{operatingExpensesTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[10px] text-slate-400">दुकान संचालन खर्च</p>
              </div>
            </div>

            {/* Ghar Kharch / Personal Drawings Card */}
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Home size={15} className="text-amber-700" />
                  <span>🏡 मालिक का घर खर्च (Personal Drawings)</span>
                </div>
                <span className="text-xs font-mono font-black text-amber-900">
                  ₹{gharKharchTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80">
                नोट: घर खर्च को बिज़नेस के संचालन खर्च (Operating Expense) में नहीं जोड़ा गया है ताकि व्यापार का सही मार्जिन दिखे।
              </p>
              {gharKharchTotal > 0 && (
                <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>घर खर्च निकालने के बाद शुद्ध बचत:</span>
                  <span className={`font-mono font-black ${netRemainingSavings >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    ₹{netRemainingSavings.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Financial Health Breakdown Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart size={14} className="text-indigo-600" />
                <span>वित्तीय विश्लेषण (Financial Breakdown)</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-600">कुल बिक्री (Cash + Udhar):</span>
                  <span className="font-bold text-slate-900 font-mono">₹{salesTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-600">दुकान संचालन खर्च (Operating Exp):</span>
                  <span className="font-bold text-rose-600 font-mono">-₹{operatingExpensesTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 font-bold">
                  <span className="text-slate-800">शुद्ध दुकान मुनाफा (Operating Profit):</span>
                  <span className={`font-mono ${netBusinessProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    ₹{netBusinessProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                {gharKharchTotal > 0 && (
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-slate-600">मालिक का घरेलू खर्च (Drawings):</span>
                    <span className="font-bold text-amber-700 font-mono">-₹{gharKharchTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 font-black text-sm">
                  <span className="text-slate-900">अंतिम शुद्ध बचत (Net Savings):</span>
                  <span className={`font-mono ${netRemainingSavings >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    ₹{netRemainingSavings.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
