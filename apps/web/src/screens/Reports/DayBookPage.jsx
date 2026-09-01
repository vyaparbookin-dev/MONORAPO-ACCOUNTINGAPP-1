import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Share2,
  TrendingUp,
  Wallet,
  ChefHat,
  Users,
  Flame,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import CustomerSummaryModal from "../../components/modals/CustomerSummaryModal";

export default function DayBookPage() {
  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
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

  // State for Customer 360° Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    fetchDayBook();
  }, [period, startDate, endDate]);

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      let url = `/api/daybook?period=${period}`;
      if (period === "custom") {
        url = `/api/daybook?startDate=${startDate}&endDate=${endDate}`;
      } else if (period === "today") {
        url = `/api/daybook?date=${startDate}`;
      }
      const res = await api.get(url);
      const data = res.data?.data;
      if (data) {
        setRawData(data);
        calculateSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch Daybook", err);
    } finally {
      setLoading(false);
    }
  };

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
    } else if (newPeriod === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      setStartDate(startOfQuarter.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (newPeriod === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
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

  const handleTallyExport = async () => {
    try {
      const res = await api.get(`/api/tally/export?startDate=${startDate}&endDate=${endDate}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data || res], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tally_Daybook_${startDate}_to_${endDate}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Tally Export Failed", err);
      alert("Failed to export Tally XML. Ensure the backend is running.");
    }
  };

  const handleCustomerClick = (partyId) => {
    if (!partyId) return;
    setSelectedCustomerId(partyId);
    setIsModalOpen(true);
  };

  // WhatsApp Daily Business Closing Flash Report
  const shareDailyFlashWhatsApp = () => {
    let msg = `*📊 DAILY BUSINESS CASHFLOW & SHUDDH MUNAFA REPORT*\n`;
    msg += `*Period / Date:* ${startDate} ${startDate !== endDate ? `to ${endDate}` : ""}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 TOTAL MONEY RECEIVED (INFLOW):* ₹${summary.totalIn.toLocaleString("en-IN")}\n`;
    msg += `  • Direct Cash/Online Sales: ₹${summary.cashSales.toLocaleString("en-IN")}\n`;
    msg += `  • Customer Udhar Received: ₹${summary.partyIn.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*🔴 TOTAL EXPENSES & OUTFLOW (OUT):* ₹${summary.totalOut.toLocaleString("en-IN")}\n`;
    msg += `  • Grocery & Raw Purchases: ₹${summary.cashPurchases.toLocaleString("en-IN")}\n`;
    msg += `  • Staff Daily Wages / Salary: ₹${summary.salaries.toLocaleString("en-IN")}\n`;
    msg += `  • Operating Expenses (Gas/Power): ₹${summary.expenses.toLocaleString("en-IN")}\n`;
    msg += `  • Supplier / Party Paid: ₹${summary.partyOut.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*💰 NET SHUDDH MUNAFA (IN HAND SURPLUS):* *₹${summary.netBalance.toLocaleString("en-IN")}*\n`;
    msg += `----------------------------------\n`;
    msg += `_Generated automatically from Business Accounting App._`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-6">
      {/* Header & Preset Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              Day Book & Daily Shuddh Munafa Register
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              दैनिक शुद्ध मुनाफा • पाई-पाई का हिसाब (आवक vs जावक vs शुद्ध बचत)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareDailyFlashWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Share2 size={15} /> WhatsApp Closing Flash
            </button>
            <button
              onClick={handleTallyExport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Download size={15} /> Tally XML
            </button>
            <button
              onClick={fetchDayBook}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              title="Refresh Daybook"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 1-Click Multi-Period Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {[
            { id: "today", label: "📅 Today (आज)" },
            { id: "yesterday", label: "⏮️ Yesterday (कल)" },
            { id: "week", label: "📆 This Week" },
            { id: "month", label: "🗓️ This Month" },
            { id: "quarter", label: "📊 This Quarter" },
            { id: "year", label: "📈 This Year" },
            { id: "custom", label: "⚙️ Custom Range" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                period === p.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs font-medium">
            <span className="text-blue-900 font-bold">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-gray-600">From:</label>
              <input
                type="date"
                className="border p-1.5 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600">To:</label>
              <input
                type="date"
                className="border p-1.5 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Master Summary Flash Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-800 font-extrabold text-sm uppercase tracking-wide">
                  Total Money IN (कुल आवक)
                </span>
                <ArrowDownCircle className="text-emerald-600" size={24} />
              </div>
              <div className="text-3xl font-black text-emerald-700">
                ₹{summary.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-2">
                सेल (Cash/UPI) + पार्टी जमा रकम
              </p>
            </div>

            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-800 font-extrabold text-sm uppercase tracking-wide">
                  Total Money OUT (कुल खर्चे)
                </span>
                <ArrowUpCircle className="text-rose-600" size={24} />
              </div>
              <div className="text-3xl font-black text-rose-700">
                ₹{summary.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-rose-600 font-medium mt-2">
                ग्रॉसरी + स्टाफ मजदूरी + गैस/बिजली + वेंडर
              </p>
            </div>

            <div
              className={`${
                summary.netBalance >= 0
                  ? "bg-gradient-to-br from-blue-900 to-slate-900 text-yellow-400"
                  : "bg-red-900 text-white"
              } p-6 rounded-2xl flex flex-col justify-between shadow-md border`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 font-extrabold text-sm uppercase tracking-wide">
                  💰 Shuddh Munafa (शुद्ध बचत)
                </span>
                <Wallet className="text-yellow-300" size={24} />
              </div>
              <div className="text-3xl font-black">
                ₹{summary.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-blue-200 font-semibold mt-2">
                {summary.netBalance >= 0
                  ? `✓ Net Cash Surplus In Hand (${(
                      summary.totalIn > 0 ? (summary.netBalance / summary.totalIn) * 100 : 0
                    ).toFixed(1)}% Margin)`
                  : "⚠️ Deficit / Loss Today"}
              </p>
            </div>
          </div>

          {/* Itemized Inflow & Outflow Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IN Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base font-black text-gray-900 border-b pb-3 flex items-center justify-between">
                <span>🟢 Income & Revenue Sources (आवक)</span>
                <span className="text-sm font-bold text-emerald-700">
                  ₹{summary.totalIn.toLocaleString("en-IN")}
                </span>
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-gray-800">
                    🍽️ Restaurant / Counter Cash & Online Sales
                  </span>
                  <span className="font-black text-emerald-700">
                    ₹{summary.cashSales.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-gray-800">
                    🤝 Customer Collections / Party Token Jama
                  </span>
                  <span className="font-black text-emerald-700">
                    ₹{summary.partyIn.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* OUT Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base font-black text-gray-900 border-b pb-3 flex items-center justify-between">
                <span>🔴 Operating Cost & Outflow (जावक)</span>
                <span className="text-sm font-bold text-rose-700">
                  ₹{summary.totalOut.toLocaleString("en-IN")}
                </span>
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🥬 Kitchen Grocery & Raw Materials Inward
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.cashPurchases.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    👨‍🍳 Staff Daily Wages & Salary Disbursals
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.salaries.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🔥 Operating Expenses (Gas, Power, Maintenance)
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.expenses.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🤝 Supplier & Outsource Vendor Payouts
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.partyOut.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Sales Bills */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
              <span>🧾 Invoices & Bills for Selected Period</span>
              <span className="text-xs text-gray-500 font-normal">
                Total: {rawdata?.bills?.length || 0} Bills
              </span>
            </h2>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
              {rawdata?.bills?.length > 0 ? (
                rawdata.bills.map((bill) => (
                  <div key={bill._id} className="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg transition">
                    <div>
                      <span className="font-bold text-gray-900">#{bill.billNumber}</span>
                      <button
                        onClick={() => handleCustomerClick(bill.partyId?._id)}
                        className="ml-3 text-blue-600 hover:underline font-semibold disabled:text-gray-600 disabled:no-underline"
                        disabled={!bill.partyId?._id}
                      >
                        {bill.partyId?.name || bill.customerName || "Walk-in Guest"}
                      </button>
                      {bill.paymentMethod && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border uppercase">
                          {bill.paymentMethod}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-gray-900 text-sm">
                      ₹{(bill.finalAmount || bill.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No sales bills found for this period.
                </div>
              )}
            </div>
          </div>

          {/* Manual Outflow & Expense Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-900 mb-4 border-b pb-2">
              📝 Expense, Staff & Vendor Transaction Logs
            </h2>
            <div className="divide-y max-h-80 overflow-y-auto pr-1 text-xs">
              {rawdata?.expenses?.map((e) => (
                <div key={e._id} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    {e.title || "Expense Entry"} <span className="text-[10px] text-gray-500 font-normal">({e.category || "General"})</span>
                  </span>
                  <span className="font-black text-rose-600">- ₹{e.amount}</span>
                </div>
              ))}
              {rawdata?.salaries?.map((s) => (
                <div key={s._id} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    👨‍🍳 Staff Salary / Daily Wage Payout ({s.staffId?.name || s.staffName || "Staff"})
                  </span>
                  <span className="font-black text-rose-600">- ₹{s.amount}</span>
                </div>
              ))}
              {rawdata?.partyTransactions?.map((t) => (
                <div key={t._id} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    {t.details || "Party Transaction"} ({t.partyId?.name || "Party"})
                  </span>
                  <span
                    className={`font-black ${
                      t.credit > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {t.credit > 0 ? `+ ₹${t.credit}` : `- ₹${t.debit}`}
                  </span>
                </div>
              ))}
              {!rawdata?.expenses?.length &&
                !rawdata?.salaries?.length &&
                !rawdata?.partyTransactions?.length && (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    No manual expense or salary entries recorded for this period.
                  </div>
                )}
            </div>
          </div>
        </>
      )}

      {/* Customer 360° Modal */}
      {isModalOpen && (
        <CustomerSummaryModal
          partyId={selectedCustomerId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
