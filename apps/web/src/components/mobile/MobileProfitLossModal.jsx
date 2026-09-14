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
  Layers
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

export default function MobileProfitLossModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const fetchReport = async () => {
    setLoading(true);
    try {
      let plUrl = "/api/reports/profitloss";
      if (startDate && endDate) {
        plUrl += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(plUrl);
      const data = res?.data?.data || res?.data || res;
      if (data) {
        setReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch Mobile P&L", err);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = report?.totalSales ?? report?.breakdown?.totalRevenue ?? 0;
  const totalExpenses = report?.totalExpenses ?? report?.breakdown?.totalExpenses ?? 0;
  const netProfit = report?.netProfit ?? (totalSales - totalExpenses);
  const grossProfit = report?.grossProfit ?? totalSales;
  const marginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

  const shareWhatsApp = () => {
    let msg = `*📈 ${selectedCompany?.name || "व्यापार"} - नफा-नुकसान रिपोर्ट (P&L)*\n`;
    msg += `*अवधि:* ${startDate || "All"} से ${endDate || "Now"}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 कुल बिक्री (Revenue):* ₹${totalSales.toLocaleString("en-IN")}\n`;
    msg += `*🔴 कुल खर्चे (Expenses):* ₹${totalExpenses.toLocaleString("en-IN")}\n`;
    msg += `*💰 शुद्ध मुनाफा (Net Profit):* ₹${netProfit.toLocaleString("en-IN")} (${marginPercent}%)\n`;
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
              {selectedCompany?.name || "व्यापार लाभ विवरण"}
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
            title="Refresh"
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
            {/* Hero Net Profit Card */}
            <div className={`p-4 rounded-2xl text-white shadow-md border ${
              netProfit >= 0
                ? "bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-500/30"
                : "bg-gradient-to-br from-rose-600 to-red-800 border-rose-500/30"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  {netProfit >= 0 ? "💰 शुद्ध लाभ (Net Profit)" : "⚠️ शुद्ध घाटा (Net Loss)"}
                </span>
                <span className="text-[10px] bg-white/20 font-mono font-bold px-2 py-0.5 rounded-full">
                  मार्जिन: {marginPercent}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                ₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                <span>सकल लाभ (Gross): <strong>₹{grossProfit.toLocaleString("en-IN")}</strong></span>
                <span>शुद्ध मुनाफा दर: <strong>{marginPercent}%</strong></span>
              </div>
            </div>

            {/* Inflow vs Outflow Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
                <span className="text-[11px] font-black uppercase text-emerald-700 block">🟢 कुल बिक्री (Revenue)</span>
                <div className="text-lg font-black text-emerald-700 font-mono">
                  ₹{totalSales.toLocaleString("en-IN")}
                </div>
                <p className="text-[10px] text-slate-400">ऑर्डर्स व डायरेक्ट सेल</p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-xs space-y-1">
                <span className="text-[11px] font-black uppercase text-rose-700 block">🔴 कुल खर्चे (Expenses)</span>
                <div className="text-lg font-black text-rose-700 font-mono">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </div>
                <p className="text-[10px] text-slate-400">दुकान खर्च व वेतन</p>
              </div>
            </div>

            {/* Financial Health Summary Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                📊 वित्तीय विश्लेषण (Financial Breakdown)
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-600">कुल इनवॉइस बिक्री:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{totalSales.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-600">दुकान व संचालन खर्च:</span>
                  <span className="font-bold text-rose-600 font-mono">-₹{totalExpenses.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 font-black">
                  <span className="text-slate-900">अंतिम शुद्ध मुनाफा (Net):</span>
                  <span className={`font-mono ${netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    ₹{netProfit.toLocaleString("en-IN")}
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
