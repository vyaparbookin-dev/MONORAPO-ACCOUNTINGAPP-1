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
import { useCompany } from "../../contexts/CompanyContext";

export default function MobileDayBookModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const indType = String(
    typeof selectedCompany?.industryType === "string"
      ? selectedCompany.industryType
      : typeof selectedCompany?.businessType === "string"
      ? selectedCompany.businessType
      : selectedCompany?.industryType?.name || selectedCompany?.businessType?.name || ""
  ).toLowerCase();
  const isRestaurant = indType.includes("restaurant") || indType.includes("cafe") || indType.includes("food") || indType.includes("dhaba") || indType.includes("hotel") || indType.includes("bakery");

  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [activeTxTab, setActiveTxTab] = useState("all"); // 'all' | 'bills' | 'expenses' | 'salaries' | 'parties'
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

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPeriod === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPeriod === "week") {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      setStartDate(startOfWeek.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (newPeriod === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      let url = `/api/daybook?period=${period}&limit=500`;
      if (period === "custom") {
        url = `/api/daybook?startDate=${startDate}&endDate=${endDate}&limit=500`;
      }

      const res = await api.get(url);
      const data = res?.data?.data || res?.data || res;

      if (data) {
        setRawData(data);
        calculateSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch Mobile Daybook", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let tIn = 0,
      tOut = 0;

    const cashSales = (data.bills || [])
      .filter((b) => b.paymentMethod !== "credit")
      .reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const partyIn = (data.partyTransactions || []).reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    const cashPurchases = (data.purchases || []).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const expenses = (data.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const salaries = (data.salaries || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const partyOut = (data.partyTransactions || []).reduce((sum, t) => sum + (t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn,
      totalOut: tOut,
      netBalance: tIn - tOut,
      cashSales,
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

      {/* Period Selector Tabs (Swipeable Pills) */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "today", label: "📅 आज (Today)" },
          { id: "yesterday", label: "⏮️ कल (Yesterday)" },
          { id: "week", label: "📆 इस हफ्ते (Week)" },
          { id: "month", label: "🗓️ इस महीने (Month)" }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodChange(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
              period === p.id
                ? "bg-indigo-600 text-white shadow-xs"
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
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold">डेटा लोड हो रहा है...</span>
          </div>
        ) : (
          <>
            {/* 1. Net Balance / Shuddh Munafa Hero Card */}
            <div className={`p-4 rounded-2xl text-white shadow-md border ${
              summary.netBalance >= 0
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/30"
                : "bg-gradient-to-br from-rose-600 to-red-700 border-rose-500/30"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  {summary.netBalance >= 0 ? "💰 शुद्ध बचत / शुद्ध मुनाफा (In-Hand Surplus)" : "⚠️ शुद्ध घाटा (Net Deficit)"}
                </span>
                <span className="text-[10px] bg-white/20 font-mono font-bold px-2 py-0.5 rounded-full">
                  Net Balance
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

            {/* 2. Inflow & Outflow 2-Card Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Green Inflow Card */}
              <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-black uppercase">🟢 कुल आवक (IN)</span>
                  <ArrowDownCircle size={16} />
                </div>
                <div className="text-base font-black text-emerald-700 font-mono">
                  ₹{summary.totalIn.toLocaleString("en-IN")}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>नकद/सेल:</span>
                    <span className="font-bold text-slate-900">₹{summary.cashSales.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>उधारी आई:</span>
                    <span className="font-bold text-slate-900">₹{summary.partyIn.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Red Outflow Card */}
              <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[11px] font-black uppercase">🔴 कुल जावक (OUT)</span>
                  <ArrowUpCircle size={16} />
                </div>
                <div className="text-base font-black text-rose-700 font-mono">
                  ₹{summary.totalOut.toLocaleString("en-IN")}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>खरीद:</span>
                    <span className="font-bold text-slate-900">₹{summary.cashPurchases.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>वेतन:</span>
                    <span className="font-bold text-slate-900">₹{summary.salaries.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>खर्च:</span>
                    <span className="font-bold text-slate-900">₹{summary.expenses.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>पार्टी:</span>
                    <span className="font-bold text-slate-900">₹{summary.partyOut.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Transaction Filter Pills */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  लेनदेन रजिस्टर ({
                    activeTxTab === "all" ? billsList.length + expensesList.length + salariesList.length + partiesList.length :
                    activeTxTab === "bills" ? billsList.length :
                    activeTxTab === "expenses" ? expensesList.length :
                    activeTxTab === "salaries" ? salariesList.length : partiesList.length
                  })
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: "सभी (All)" },
                  { id: "bills", label: `बिल (${billsList.length})` },
                  { id: "expenses", label: `खर्चे (${expensesList.length})` },
                  { id: "salaries", label: `वेतन (${salariesList.length})` },
                  { id: "parties", label: `पार्टी (${partiesList.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTxTab(t.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition ${
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
              {(activeTxTab === "all" || activeTxTab === "bills") &&
                billsList.map((b) => (
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
                      <p className="text-[10px] text-slate-400">
                        {b.date ? new Date(b.date).toLocaleDateString("hi-IN") : "Today"} • {b.paymentMethod || "CASH"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-emerald-700 font-mono">
                        +₹{(b.finalAmount || b.total || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] block text-slate-400 font-semibold uppercase">
                        बिक्री
                      </span>
                    </div>
                  </div>
                ))}

              {/* Expenses */}
              {(activeTxTab === "all" || activeTxTab === "expenses") &&
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
              {(activeTxTab === "all" || activeTxTab === "salaries") &&
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
              {(activeTxTab === "all" || activeTxTab === "parties") &&
                partiesList.map((p) => {
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
