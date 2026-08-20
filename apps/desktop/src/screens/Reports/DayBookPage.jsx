import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Calendar, ArrowDownCircle, ArrowUpCircle, Download, RefreshCw, FileSpreadsheet } from "lucide-react";
import CustomerSummaryModal from "../../components/modals/CustomerSummaryModal";

export default function DayBookPage() {
  const [period, setPeriod] = useState("today"); // today, yesterday, week, month, quarter, year, custom
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [rawdata, setRawData] = useState(null);
  const [summary, setSummary] = useState({
    totalIn: 0, totalOut: 0, netBalance: 0,
    cashSales: 0, partyIn: 0,
    cashPurchases: 0, expenses: 0, salaries: 0, partyOut: 0,
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
    let tIn = 0, tOut = 0;

    const cashSales = (data.bills || []).filter(b => b.paymentMethod !== 'credit').reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const partyIn = (data.partyTransactions || []).reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    const cashPurchases = (data.purchases || []).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const expenses = (data.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const salaries = (data.salaries || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const partyOut = (data.partyTransactions || []).reduce((sum, t) => sum + (t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn, totalOut: tOut, netBalance: tIn - tOut,
      cashSales, partyIn,
      cashPurchases, expenses, salaries, partyOut
    });
  };

  const handleTallyExport = async () => {
    try {
      const res = await api.get(`/api/tally/export?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' });
      const blob = new Blob([res.data || res], { type: 'application/xml' });
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

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-6">
      {/* Header & Preset Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              Day Book / Cash Register
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Track daily cash flow, party collections, purchases & expenses</p>
          </div>

          <div className="flex items-center gap-2">
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
            { id: "today", label: "📅 Today" },
            { id: "yesterday", label: "⏮️ Yesterday" },
            { id: "week", label: "📆 This Week" },
            { id: "month", label: "🗓️ This Month" },
            { id: "quarter", label: "📊 This Quarter" },
            { id: "year", label: "📈 This Year" },
            { id: "custom", label: "⚙️ Custom Range" },
          ].map(p => (
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
        <div className="flex justify-center my-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : (
        <>
          {/* Master Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 flex flex-col justify-center items-center shadow-sm">
              <div className="flex items-center gap-2 mb-2"><ArrowDownCircle className="text-green-600" /> <span className="text-green-800 font-semibold">Total Money IN</span></div>
              <div className="text-3xl font-bold text-green-700">₹{summary.totalIn.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex flex-col justify-center items-center shadow-sm">
              <div className="flex items-center gap-2 mb-2"><ArrowUpCircle className="text-red-600" /> <span className="text-red-800 font-semibold">Total Money OUT</span></div>
              <div className="text-3xl font-bold text-red-700">₹{summary.totalOut.toFixed(2)}</div>
            </div>
            <div className={`${summary.netBalance >= 0 ? 'bg-blue-600' : 'bg-gray-800'} text-white p-6 rounded-xl flex flex-col justify-center items-center shadow-md`}>
              <div className="text-blue-100 font-medium mb-2">Net Balance for the Day</div>
              <div className="text-4xl font-extrabold">₹{summary.netBalance.toFixed(2)}</div>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* IN Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Cash / Online IN</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-gray-600">Direct Sales (Cash/Online)</span><span className="font-semibold text-green-600">₹{summary.cashSales.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Party Received (Udhar Jama)</span><span className="font-semibold text-green-600">₹{summary.partyIn.toFixed(2)}</span></div>
              </div>
            </div>

            {/* OUT Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Cash / Online OUT</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-gray-600">Purchases Paid</span><span className="font-semibold text-red-600">₹{summary.cashPurchases.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Expenses Paid</span><span className="font-semibold text-red-600">₹{summary.expenses.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Staff Salaries</span><span className="font-semibold text-red-600">₹{summary.salaries.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Party Paid (Udhar Chukaya)</span><span className="font-semibold text-red-600">₹{summary.partyOut.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Today's Sales Bills */}
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Sales Bills</h2>
            <div className="divide-y divide-gray-100">
              {rawdata?.bills?.length > 0 ? rawdata.bills.map(bill => (
                <div key={bill._id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-700">#{bill.billNumber}</span>
                    <button 
                      onClick={() => handleCustomerClick(bill.partyId?._id)}
                      className="ml-4 text-blue-600 hover:underline disabled:text-gray-500 disabled:no-underline"
                      disabled={!bill.partyId?._id}
                    >
                      {bill.partyId?.name || bill.customerName || 'Walk-in'}
                    </button>
                    {bill.partyId && (
                      <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${bill.isNewCustomer ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {bill.isNewCustomer ? 'New' : 'Returning'}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800">₹{(bill.finalAmount || bill.total || 0).toFixed(2)}</span>
                </div>
              )) : <div className="py-4 text-center text-gray-500 text-sm">No sales bills found for this day.</div>}
            </div>
          </div>

          {/* Transaction Logs */}
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Manual Entries</h2>
            <div className="divide-y">
              {rawdata?.expenses.map(e => (
                <div key={e._id} className="py-3 flex justify-between"><span className="text-gray-700">{e.title} (Expense)</span><span className="font-bold text-red-600">- ₹{e.amount}</span></div>
              ))}
              {rawdata?.partyTransactions.map(t => (
                <div key={t._id} className="py-3 flex justify-between"><span className="text-gray-700">{t.details} ({t.partyId?.name})</span><span className={`font-bold ${t.credit > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.credit > 0 ? `+ ₹${t.credit}` : `- ₹${t.debit}`}</span></div>
              ))}
              {(!rawdata?.expenses?.length && !rawdata?.partyTransactions?.length) && (
                 <div className="py-4 text-center text-gray-500 text-sm">No manual entries found for this day.</div>
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