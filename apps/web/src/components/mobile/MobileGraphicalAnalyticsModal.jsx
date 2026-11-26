import React, { useState, useEffect } from "react";
import { 
  X, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, Calendar, ChevronRight, Share2, Layers, ArrowUpRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../../services/api";

export default function MobileGraphicalAnalyticsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalExpenses: 0, totalPurchases: 0, netProfit: 0 });
  const [rangeMonths, setRangeMonths] = useState(6); // 3, 6, or 12 months

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [billsRes, expRes, purRes] = await Promise.all([
        api.get("/api/billing?limit=10000").catch(() => ({ data: [] })),
        api.get("/api/expenses").catch(() => ({ data: [] })),
        api.get("/api/purchase?limit=10000").catch(() => ({ data: [] }))
      ]);

      const bills = billsRes?.bills || billsRes?.data?.bills || (Array.isArray(billsRes?.data) ? billsRes.data : []) || [];
      const expenses = expRes?.expenses || expRes?.data?.expenses || (Array.isArray(expRes?.data) ? expRes.data : []) || [];
      const purchases = purRes?.purchases || purRes?.data?.purchases || (Array.isArray(purRes?.data) ? purRes.data : []) || [];

      const months = [];
      const today = new Date();
      for (let i = rangeMonths - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
          name: d.toLocaleDateString("hi-IN", { month: "short" }),
          fullName: d.toLocaleDateString("hi-IN", { month: "long", year: "numeric" }),
          year: d.getFullYear(),
          month: d.getMonth(),
          sales: 0,
          expenses: 0,
          purchases: 0
        });
      }

      bills.forEach(sale => {
        if (sale.isCancelled || sale.isDeleted) return;
        const d = new Date(sale.date || sale.createdAt);
        const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (entry) {
          entry.sales += (Number(sale.finalAmount) || Number(sale.totalAmount) || Number(sale.total) || 0);
        }
      });

      expenses.forEach(exp => {
        if (exp.isDeleted) return;
        const d = new Date(exp.date || exp.createdAt);
        const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (entry) {
          entry.expenses += (Number(exp.amount) || 0);
        }
      });

      purchases.forEach(pur => {
        if (pur.isDeleted) return;
        const d = new Date(pur.date || pur.createdAt);
        const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (entry) {
          entry.purchases += (Number(pur.finalAmount) || Number(pur.totalAmount) || Number(pur.total) || 0);
        }
      });

      const finalData = months.map(m => {
        const cogs = m.purchases > 0 ? m.purchases : Math.round(m.sales * 0.85);
        const grossProfit = Math.max(0, m.sales - cogs);
        const profit = grossProfit - m.expenses;
        return {
          ...m,
          cogs,
          profit,
          displayProfit: profit > 0 ? profit : 0
        };
      });

      setChartData(finalData);

      const totalSales = finalData.reduce((s, m) => s + m.sales, 0);
      const totalExpenses = finalData.reduce((s, m) => s + m.expenses, 0);
      const totalPurchases = finalData.reduce((s, m) => s + m.purchases, 0);
      const netProfit = finalData.reduce((s, m) => s + m.profit, 0);

      setSummary({ totalSales, totalExpenses, totalPurchases, netProfit });
    } catch (err) {
      console.error("Failed to load graphical analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rangeMonths]);

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full max-w-xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner border border-white/20">
              📊
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">व्यापार ग्राफिकल एनालिटिक्स (Trends)</h2>
              <p className="text-[10px] text-indigo-200 font-medium">बिक्री, खर्च व शुद्ध लाभ का एरिया चार्ट</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition active:scale-95"
              title="रिफ्रेश करें"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition active:scale-95"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Range Selector Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
            समय सीमा (Range)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { val: 3, label: "3 माह" },
              { val: 6, label: "6 माह" },
              { val: 12, label: "12 माह" }
            ].map(r => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRangeMonths(r.val)}
                className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                  rangeMonths === r.val
                    ? "bg-[#4338CA] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-emerald-700 block">कुल बिक्री ({rangeMonths}M)</span>
              <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                ₹{summary.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                <TrendingUp size={11} /> सेल्स आवक
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-rose-700 block">कुल खर्च ({rangeMonths}M)</span>
              <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                ₹{summary.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-0.5 text-[9px] font-bold text-rose-600">
                <TrendingDown size={11} /> दुकान खर्च
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-indigo-700 block">शुद्ध लाभ ({rangeMonths}M)</span>
              <div className={`text-sm sm:text-base font-black truncate ${summary.netProfit >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
                ₹{summary.netProfit.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-600">
                <DollarSign size={11} /> नेट मुनाफा
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs text-slate-900">बिक्री बनाम खर्च ट्रेंड (Revenue vs Expenses)</h3>
                <p className="text-[10px] text-slate-400 font-medium">माह-दर-माह आवक व खर्च का ग्राफ़िकल मिलान</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-indigo-600" />
                <span className="text-xs font-bold">ग्राफ़ डेटा तैयार हो रहा है...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs font-bold text-slate-400">
                पर्याप्त डेटा उपलब्ध नहीं है
              </div>
            ) : (
              <div style={{ width: "100%", height: 280, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 9, fontWeight: 600 }}
                      tickFormatter={(val) => val >= 100000 ? `${(val/100000).toFixed(1)}L` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
                      contentStyle={{ 
                        borderRadius: "16px", 
                        border: "1px solid #e2e8f0", 
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "11px",
                        fontWeight: 700
                      }} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      name="बिक्री (Sales)" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="खर्च (Expenses)" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorExpenses)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="displayProfit" 
                      name="शुद्ध लाभ (Profit)" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Month-by-Month Breakdown List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              📅 माह-दर-माह विवरण (Monthly Breakdown)
            </h4>
            
            <div className="space-y-2">
              {chartData.slice().reverse().map((m, idx) => (
                <div key={idx} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="font-black text-xs text-slate-900">{m.fullName}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      m.profit >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {m.profit >= 0 ? "मुनाफ़ा: +₹" : "घाटा: -₹"}{Math.abs(m.profit).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50/70 p-1.5 rounded-xl">
                      <span className="text-[9px] text-emerald-800 font-bold block">बिक्री</span>
                      <span className="font-black text-emerald-900">₹{m.sales.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-rose-50/70 p-1.5 rounded-xl">
                      <span className="text-[9px] text-rose-800 font-bold block">खर्च</span>
                      <span className="font-black text-rose-900">₹{m.expenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-indigo-50/70 p-1.5 rounded-xl">
                      <span className="text-[9px] text-indigo-800 font-bold block">खरीदी / लागत</span>
                      <span className="font-black text-indigo-900">₹{m.purchases.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
