import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Calendar, ArrowDownCircle, ArrowUpCircle, Download } from "lucide-react";

export default function DayBookPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [rawdata, setRawData] = useState(null);
  const [summary, setSummary] = useState({
    totalIn: 0, totalOut: 0, netBalance: 0,
    cashSales: 0, partyIn: 0,
    cashPurchases: 0, expenses: 0, salaries: 0, partyOut: 0,
  });

  useEffect(() => {
    fetchDayBook();
  }, [selectedDate]);

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/daybook?date=${selectedDate}`);
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

  const calculateSummary = (data) => {
    let tIn = 0, tOut = 0;

    const cashSales = data.bills.filter(b => b.paymentMethod !== 'credit').reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const partyIn = data.partyTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    const cashPurchases = data.purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const expenses = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const salaries = data.salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const partyOut = data.partyTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn, totalOut: tOut, netBalance: tIn - tOut,
      cashSales, partyIn,
      cashPurchases, expenses, salaries, partyOut
    });
  };

  const handleTallyExport = async () => {
    try {
      const res = await api.get(`/api/tally/export?date=${selectedDate}`, { responseType: 'blob' });
      // Api response can be inside res.data or direct res depending on axios interceptors
      const blob = new Blob([res.data || res], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tally_Daybook_${selectedDate}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Tally Export Failed", err);
      alert("Failed to export Tally XML. Ensure the backend is running.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Day Book / Cash Book</h1>
          <p className="text-gray-500 text-sm">View daily cash flow and transactions</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Calendar className="text-blue-600" />
          <input 
            type="date" 
            className="border p-2 rounded-lg bg-gray-50 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button 
            onClick={handleTallyExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
          >
            <Download size={18} /> Tally XML
          </button>
        </div>
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
    </div>
  );
}