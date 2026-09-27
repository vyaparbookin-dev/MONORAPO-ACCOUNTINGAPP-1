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
  Wallet,
  Package,
  Sliders,
  Users,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "../../services/api";
import { readLocalJson } from "@repo/shared";
import { useCompany } from "../../contexts/CompanyContext";
import { deduplicateBills } from "../../utils/deduplicateBills";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";
import { deduplicatePurchases } from "../../utils/deduplicatePurchases";

export default function MobileProfitLossModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Dynamic Gross Profit Margin % (Default 15%, User Configurable)
  const [marginPercent, setMarginPercent] = useState(() => {
    try {
      const saved = localStorage.getItem("vb_custom_gross_margin_percent");
      return saved !== null && saved !== "" ? Number(saved) : 15;
    } catch (e) {
      return 15;
    }
  });

  // Cost Mode: "auto" | "margin" | "actual"
  const [costMode, setCostMode] = useState(() => {
    try {
      return localStorage.getItem("vb_cost_mode") || "auto";
    } catch (e) {
      return "auto";
    }
  });

  const [salesTotal, setSalesTotal] = useState(0);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [effectiveCOGSTotal, setEffectiveCOGSTotal] = useState(0);
  const [grossProfitTotal, setGrossProfitTotal] = useState(0);
  const [operatingExpensesTotal, setOperatingExpensesTotal] = useState(0);
  const [gharKharchTotal, setGharKharchTotal] = useState(0);
  const [netBusinessProfit, setNetBusinessProfit] = useState(0);
  const [netRemainingSavings, setNetRemainingSavings] = useState(0);
  const [billsCount, setBillsCount] = useState(0);
  const [expensesCount, setExpensesCount] = useState(0);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [hasActualPurchases, setHasActualPurchases] = useState(false);

  // Parties Outstanding & Opening Balance summary
  const [showPartiesDetail, setShowPartiesDetail] = useState(false);
  const [partiesSummary, setPartiesSummary] = useState({
    totalToCollect: 0,
    totalToPay: 0,
    openingBalanceTotal: 0,
    partiesList: []
  });

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate, marginPercent, costMode]);

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

  const handleMarginChange = (val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setMarginPercent(num);
    try {
      localStorage.setItem("vb_custom_gross_margin_percent", String(num));
    } catch (e) {}
  };

  const handleCostModeChange = (mode) => {
    setCostMode(mode);
    try {
      localStorage.setItem("vb_cost_mode", mode);
    } catch (e) {}
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
    // Operating / Business expenses are NEVER personal — exit early
    if (t === 'operating' || t === '') return false;
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
      let plUrl = `/api/reports/profitloss?marginPercent=${marginPercent}&costMode=${costMode}`;
      let billingUrl = "/api/billing?limit=500";
      let expenseUrl = "/api/expense";
      let purchaseUrl = "/api/purchase";
      let partyUrl = "/api/parties";

      if (startDate && endDate) {
        plUrl += `&startDate=${startDate}&endDate=${endDate}`;
        billingUrl = `/api/billing?startDate=${startDate}&endDate=${endDate}&limit=500`;
        expenseUrl = `/api/expense?startDate=${startDate}&endDate=${endDate}`;
        purchaseUrl = `/api/purchase?startDate=${startDate}&endDate=${endDate}`;
      }

      const [res, billingRes, expenseRes, purchaseRes, partyRes] = await Promise.all([
        api.get(plUrl).catch(() => null),
        api.get(billingUrl).catch(() => null),
        api.get(expenseUrl).catch(() => null),
        api.get(purchaseUrl).catch(() => null),
        api.get(partyUrl).catch(() => null)
      ]);

      // Server Data
      const serverPl = res?.data?.data || res?.data || res || {};
      const serverBills = billingRes?.data?.bills || billingRes?.bills || billingRes?.data || [];
      const serverExpenses = expenseRes?.data?.expenses || expenseRes?.expenses || expenseRes?.data || [];
      const serverPurchases = purchaseRes?.data?.purchases || purchaseRes?.purchases || purchaseRes?.data || [];

      // Local Data
      let localBills = [];
      let localExpenses = [];
      let localPurchases = [];
      try {
        if (typeof localStorage !== "undefined") {
          const storedB = readLocalJson(["vb_local_manual_bills", "bills"], []);
          if (Array.isArray(storedB)) localBills = storedB;
          const storedE = readLocalJson(["vb_local_expenses", "expenses"], []);
          if (Array.isArray(storedE)) localExpenses = storedE;
          const storedP = readLocalJson(["vb_local_purchases", "purchases"], []);
          if (Array.isArray(storedP)) localPurchases = storedP;
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

      const allPurchases = deduplicatePurchases([
        ...(Array.isArray(serverPurchases) ? serverPurchases : []),
        ...(Array.isArray(localPurchases) ? localPurchases : [])
      ]).filter((p) => isDateInRange(p.rawDate || p.date || p.createdAt));

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

      const calcActualPurchases = allPurchases.reduce(
        (sum, p) => sum + (Number(p.finalAmount || p.totalAmount || p.total || p.amountPaid) || 0),
        0
      );

      // Prefer calculated local+server if greater, else fallback to API
      const backendSales = Number(serverPl.totalSales) || 0;
      // Only add unsynced offline bills that aren't on server yet
      const unsyncedLocalSales = allBills
        .filter(b => b.isOfflineCreated && !b._id?.match(/^[0-9a-fA-F]{24}$/))
        .reduce((sum, b) => sum + Number(b.finalAmount || b.total || 0), 0);
      const finalSales = backendSales + unsyncedLocalSales;
      const finalOperating = calcOperating > 0 ? calcOperating : Number(serverPl.businessExpenses || 0);
      const finalGharKharch = calcGharKharch > 0 ? calcGharKharch : Number(serverPl.gharKharch || 0);
      const recordedPurchases = calcActualPurchases > 0 ? calcActualPurchases : Number(serverPl.actualPurchases || 0);

      const actualExists = recordedPurchases > 0;
      setHasActualPurchases(actualExists);

      // Effective Cost of Goods Sold (COGS) Calculation
      const effectiveMarginFrac = Math.max(0, Math.min(100, Number(marginPercent) || 15)) / 100;
      const estimatedCOGS = Math.round(finalSales * (1 - effectiveMarginFrac));

      const effectiveCOGS = (costMode === "actual" && actualExists)
        ? recordedPurchases
        : (costMode === "margin" ? estimatedCOGS : (actualExists ? recordedPurchases : estimatedCOGS));

      const grossProfit = Math.max(0, finalSales - effectiveCOGS);
      const netProfit = grossProfit - finalOperating;
      const savings = netProfit - finalGharKharch;

      setSalesTotal(finalSales);
      setPurchasesTotal(recordedPurchases);
      setEffectiveCOGSTotal(effectiveCOGS);
      setGrossProfitTotal(grossProfit);
      setOperatingExpensesTotal(finalOperating);
      setGharKharchTotal(finalGharKharch);
      setNetBusinessProfit(netProfit);
      setNetRemainingSavings(savings);
      setBillsCount(allBills.length);
      setExpensesCount(allExpenses.length);
      setPurchasesCount(allPurchases.length);

      // Process Parties Summary
      const rawParties = partyRes?.data?.parties || (Array.isArray(partyRes?.data) ? partyRes.data : []);
      let toCollect = 0;
      let toPay = 0;
      let openBal = 0;
      const pList = [];

      (Array.isArray(rawParties) ? rawParties : []).forEach(p => {
        if (!p || p.isActive === false || p.isDeleted === true) return;
        const curBal = Number(p.currentBalance ?? p.balance ?? 0);
        const op = Number(p.openingBalance || 0);
        openBal += op;
        if (curBal > 0) toCollect += curBal;
        else if (curBal < 0) toPay += Math.abs(curBal);
        pList.push({
          _id: p._id || p.id,
          name: p.name || p.partyName,
          balance: curBal,
          openingBalance: op,
          partyType: p.partyType || p.type || "customer",
          phone: p.mobileNumber || p.phone || ""
        });
      });

      setPartiesSummary({
        totalToCollect: toCollect,
        totalToPay: toPay,
        openingBalanceTotal: openBal,
        partiesList: pList
      });

    } catch (err) {
      console.error("Failed to fetch Mobile P&L", err);
    } finally {
      setLoading(false);
    }
  };

  const actualMarginPercent = salesTotal > 0 ? ((grossProfitTotal / salesTotal) * 100).toFixed(1) : marginPercent;

  const shareWhatsApp = () => {
    let msg = `*📈 ${selectedCompany?.name || "व्यापार"} - नफा-नुकसान रिपोर्ट (P&L)*\n`;
    msg += `*अवधि:* ${startDate || "All"} से ${endDate || "Now"}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 कुल बिक्री (Gross Sales):* ₹${salesTotal.toLocaleString("en-IN")}\n`;
    msg += `*📦 माल की खरीद लागत (COGS):* ₹${effectiveCOGSTotal.toLocaleString("en-IN")} (${(100 - Number(actualMarginPercent)).toFixed(0)}%)\n`;
    msg += `*✨ सकल मुनाफा (Gross Profit):* ₹${grossProfitTotal.toLocaleString("en-IN")} (${actualMarginPercent}% Margin)\n`;
    msg += `*🏢 दुकान संचालन खर्च (Operating Exp):* ₹${operatingExpensesTotal.toLocaleString("en-IN")}\n`;
    msg += `*💰 शुद्ध व्यापार लाभ (Net Profit):* ₹${netBusinessProfit.toLocaleString("en-IN")}\n`;
    if (gharKharchTotal > 0) {
      msg += `*🏡 घर खर्च / पर्सनल निकासी:* ₹${gharKharchTotal.toLocaleString("en-IN")}\n`;
      msg += `*💵 शुद्ध अंतिम बचत:* ₹${netRemainingSavings.toLocaleString("en-IN")}\n`;
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
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
            title="WhatsApp Flash Share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              period === p.id
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ⚡ PROFIT MARGIN & PURCHASE COST CONTROLLER STRIP */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-3.5 py-2.5 space-y-1.5 shrink-0">
        <div className="flex justify-between items-center text-xs font-extrabold text-amber-950">
          <div className="flex items-center gap-1.5">
            <Sliders size={14} className="text-amber-700" />
            <span>मुनाफा मार्जिन सेटिंग (Gross Margin %):</span>
          </div>
          <span className="bg-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-2xs">
            {marginPercent}% मुनाफा
          </span>
        </div>

        {/* Quick Margin % Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { pct: 10, label: "10% (थोक/Wholesale)" },
            { pct: 12, label: "12%" },
            { pct: 15, label: "15% (मानक/Standard)" },
            { pct: 20, label: "20% (फुटकर/Retail)" },
            { pct: 25, label: "25%" }
          ].map((item) => (
            <button
              key={item.pct}
              type="button"
              onClick={() => {
                handleMarginChange(item.pct);
                handleCostModeChange("margin");
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap transition cursor-pointer border ${
                marginPercent === item.pct && costMode !== "actual"
                  ? "bg-amber-700 text-white border-amber-700 shadow-2xs"
                  : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50"
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Custom Margin Input */}
          <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2 py-0.5 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold">कस्टम %:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={marginPercent}
              onChange={(e) => handleMarginChange(e.target.value)}
              className="w-10 text-xs font-black text-amber-900 outline-none text-center"
            />
          </div>

          {/* Actual Purchase Bills Toggle (If purchases exist) */}
          {hasActualPurchases && (
            <button
              type="button"
              onClick={() => handleCostModeChange(costMode === "actual" ? "margin" : "actual")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap transition cursor-pointer border ${
                costMode === "actual"
                  ? "bg-indigo-700 text-white border-indigo-700 shadow-2xs"
                  : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              🏢 खरीद बिल (₹{purchasesTotal.toLocaleString('en-IN')})
            </button>
          )}
        </div>

        <p className="text-[10px] text-amber-800/90 leading-tight">
          💡 हर बिल के लिए खरीद बिल डालना ज़रूरी नहीं है। जब तक आप सप्लायर बिल नहीं डालते, सिस्टम आपकी बिक्री पर <strong>{marginPercent}%</strong> का शुद्ध मुनाफा जोड़कर लागत अपने आप घटाता है।
        </p>
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
                  मार्जिन: {actualMarginPercent}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                ₹{netBusinessProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/20 grid grid-cols-3 gap-1 text-[11px] text-white/95">
                <div>
                  <span className="block text-emerald-200 text-[10px]">कुल बिक्री:</span>
                  <strong className="font-mono">₹{salesTotal.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span className="block text-amber-200 text-[10px]">सकल लाभ:</span>
                  <strong className="font-mono">₹{grossProfitTotal.toLocaleString("en-IN")}</strong>
                </div>
                <div className="text-right">
                  <span className="block text-rose-200 text-[10px]">दुकान खर्च:</span>
                  <strong className="font-mono">₹{operatingExpensesTotal.toLocaleString("en-IN")}</strong>
                </div>
              </div>
            </div>

            {/* 3-Card Financial Flow: Sales vs Purchase Cost vs Operating Expense */}
            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: Total Sales */}
              <div className="bg-white p-2.5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 block flex items-center gap-0.5">
                  <TrendingUp size={12} /> कुल बिक्री
                </span>
                <div className="text-sm sm:text-base font-black text-emerald-700 font-mono truncate">
                  ₹{salesTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[9px] text-slate-400 truncate">{billsCount} बिल दर्ज</p>
              </div>

              {/* Card 2: Cost of Goods Sold (Purchase Cost) */}
              <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-700 block flex items-center gap-0.5 truncate">
                  <Package size={12} /> माल लागत (COGS)
                </span>
                <div className="text-sm sm:text-base font-black text-amber-700 font-mono truncate">
                  ₹{effectiveCOGSTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[9px] text-slate-400 truncate">
                  {costMode === "actual" && hasActualPurchases ? "खरीद बिल अनुसार" : `${100 - Number(marginPercent)}% अनुमानित लागत`}
                </p>
              </div>

              {/* Card 3: Operating Expenses */}
              <div className="bg-white p-2.5 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-700 block flex items-center gap-0.5 truncate">
                  <Building2 size={12} /> दुकान खर्च
                </span>
                <div className="text-sm sm:text-base font-black text-rose-700 font-mono truncate">
                  ₹{operatingExpensesTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[9px] text-slate-400 truncate">{expensesCount} खर्च दर्ज</p>
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
              <p className="text-[10px] text-amber-800/80 leading-relaxed">
                नोट: घर खर्च को दुकान के संचालन खर्च में नहीं काटा जाता, यह व्यापार मुनाफे में से मालिक की व्यक्तिगत बचत में से घटता है।
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

            {/* Complete Itemized Profit & Loss Breakdown Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart size={14} className="text-indigo-600" />
                <span>नफा-नुकसान पूर्ण गणित (P&L Formula Sheet)</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                {/* 1. Total Sales */}
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-700 font-bold">1. कुल बिक्री (Total Revenue / Sales):</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{salesTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* 2. Less Cost of Goods Sold */}
                <div className="flex justify-between items-center pt-1.5">
                  <div>
                    <span className="text-amber-800 font-bold">2. (-) माल की खरीद लागत (Cost of Goods):</span>
                    <span className="text-[10px] text-slate-400 block">
                      {costMode === "actual" && hasActualPurchases ? "सप्लायर खरीद बिलों से" : `बिक्री का ${100 - Number(marginPercent)}% लागत दर`}
                    </span>
                  </div>
                  <span className="font-bold text-amber-800 font-mono">-₹{effectiveCOGSTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* 3. Gross Profit */}
                <div className="flex justify-between items-center pt-1.5 bg-emerald-50/70 p-2 rounded-xl">
                  <span className="text-emerald-900 font-black">3. (=) सकल व्यापार मुनाफा (Gross Profit):</span>
                  <span className="font-black text-emerald-700 font-mono text-sm">₹{grossProfitTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* 4. Less Operating Expenses */}
                <div className="flex justify-between items-center pt-1.5">
                  <div>
                    <span className="text-rose-700 font-bold">4. (-) दुकान संचालन खर्च (Operating Exp):</span>
                    <span className="text-[10px] text-slate-400 block">किराया, बिजली, स्टाफ, चाय, विविध खर्च</span>
                  </div>
                  <span className="font-bold text-rose-600 font-mono">-₹{operatingExpensesTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* 5. Net Business Profit */}
                <div className="flex justify-between items-center pt-1.5 font-bold">
                  <span className="text-slate-800">5. (=) शुद्ध व्यापार लाभ (Net Business Profit):</span>
                  <span className={`font-mono text-sm ${netBusinessProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    ₹{netBusinessProfit.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* 6. Less Personal Drawings */}
                {gharKharchTotal > 0 && (
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-slate-600">6. (-) मालिक का घरेलू खर्च (Drawings):</span>
                    <span className="font-bold text-amber-700 font-mono">-₹{gharKharchTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {/* 7. Final Net Savings */}
                <div className="flex justify-between items-center pt-2 font-black text-sm bg-slate-50 p-2 rounded-xl">
                  <span className="text-slate-900">7. (=) अंतिम शुद्ध बचत (Final Net Savings):</span>
                  <span className={`font-mono ${netRemainingSavings >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    ₹{netRemainingSavings.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* 👥 ALL PARTIES OUTSTANDING & OPENING BALANCES EXPLAINER CARD */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3">
              <div 
                onClick={() => setShowPartiesDetail(!showPartiesDetail)}
                className="flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-indigo-950">
                      👥 पार्टियों का कुल उधारी व बैलेंस (Parties Ledger)
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {partiesSummary.partiesList.length} पार्टियां दर्ज • पुराना हिसाब व उधारी स्थिति
                    </p>
                  </div>
                </div>
                <button type="button" className="text-indigo-600 p-1">
                  {showPartiesDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* 2-Pill Summary: To Collect vs To Pay */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 block">ग्राहकों से कुल लेने हैं (To Collect):</span>
                  <span className="font-black text-sm text-emerald-700 font-mono">
                    ₹{partiesSummary.totalToCollect.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 block">सप्लायरों को देने हैं (To Pay):</span>
                  <span className="font-black text-sm text-rose-700 font-mono">
                    ₹{partiesSummary.totalToPay.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Educational Note Explaining Why Opening Balance is in Ledger, not P&L */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <Info size={13} className="text-amber-700 shrink-0" />
                  <span>💡 P&L और पार्टी बैलेंस में क्या अंतर है?</span>
                </div>
                <p className="leading-relaxed text-[10px] text-amber-800">
                  पार्टियों का <strong>प्रारंभिक पुराना हिसाब (Opening Balance)</strong> या लेजर वसूली (Payment Received) आपकी <strong>बैलेंस शीट / खाता-बही</strong> में दिखती है। नफा-नुकसान (Profit & Loss) केवल इस अवधि में बेचे गए <strong>माल के बिलों (Sales)</strong> और <strong>खर्चों</strong> का लाभ निकालता है।
                </p>
              </div>

              {/* Collapsible Party List */}
              {showPartiesDetail && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 max-h-52 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">पार्टी-वार बकाया लिस्ट:</span>
                  {partiesSummary.partiesList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">कोई पार्टी दर्ज नहीं है।</div>
                  ) : (
                    partiesSummary.partiesList.map((p, idx) => (
                      <div key={p._id || idx} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{p.partyType} {p.phone ? `• 📞 ${p.phone}` : ""}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black font-mono ${p.balance > 0 ? "text-emerald-700" : p.balance < 0 ? "text-rose-600" : "text-slate-600"}`}>
                            ₹{Math.abs(p.balance).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            {p.balance > 0 ? "(लेने हैं)" : p.balance < 0 ? "(देने हैं)" : "(चुक्ता)"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
