import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { Printer, ArrowLeft, RefreshCw, Search } from "lucide-react";

const PartyWiseReportPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [res, partiesRes] = await Promise.all([
        api.get("/api/reports/partywise").catch(() => null),
        api.get("/api/parties").catch(() => null)
      ]);

      const serverReports = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.reports) ? res.reports : []);
      const serverParties = Array.isArray(partiesRes?.data?.parties) ? partiesRes.data.parties : (Array.isArray(partiesRes?.data) ? partiesRes.data : []);

      let localParties = [];
      let localBills = [];
      try {
        if (typeof localStorage !== "undefined") {
          const storedP = localStorage.getItem("vb_local_parties") || localStorage.getItem("parties");
          if (storedP) localParties = JSON.parse(storedP) || [];
          const storedB = localStorage.getItem("vb_local_manual_bills");
          if (storedB) localBills = JSON.parse(storedB) || [];
        }
      } catch (e) {}

      const allParties = [...localParties, ...serverParties, ...serverReports];
      const partyMap = new Map();

      allParties.forEach(p => {
        if (!p) return;
        const name = p.name || p.partyName || "";
        if (!name) return;
        const k = name.trim().toLowerCase();

        if (!partyMap.has(k)) {
          const pIdStr = String(p._id || p.id || "");
          const matchingBills = localBills.filter(b => {
            const bParty = String(b.customerName || b.partyName || "").trim().toLowerCase();
            const bPartyId = String(b.partyId || b.customer || "");
            return (bParty && bParty === k) || (bPartyId && bPartyId === pIdStr);
          });
          const calcSales = matchingBills.reduce((s, b) => s + (Number(b.amount || b.finalAmount || b.total) || 0), 0);
          const totalSales = (p.totalSales && p.totalSales > 0) ? p.totalSales : calcSales;
          const totalPurchase = p.totalPurchase || 0;
          const balance = Number(p.balance !== undefined ? p.balance : (p.currentBalance !== undefined ? p.currentBalance : 0));

          partyMap.set(k, {
            _id: p._id || p.id || k,
            partyName: p.name || p.partyName,
            phone: p.mobileNumber || p.phone || "",
            partyType: p.partyType || p.type || "customer",
            address: p.address || "",
            totalPurchase,
            totalSales,
            balance
          });
        }
      });

      setReport(Array.from(partyMap.values()));
    } catch (error) {
      console.error("Error fetching partywise report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredReport = report.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (item.partyName || "").toLowerCase().includes(q) || (item.phone || "").includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/m')}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer shrink-0"
            title="वापस मोबाइल ऐप पर जाएं"
          >
            <ArrowLeft size={16} />
            <span>वापस</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 print:text-2xl">Party Wise Sales & Ledger Report</h1>
            <p className="text-xs text-slate-500">पार्टी-वार कुल बिक्री, खरीद व बकाया राशि का खाता</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden w-full sm:w-auto justify-end">
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition">
            <Printer size={15} /> Print
          </button>
          <button onClick={fetchReport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> ताज़ा करें
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="पार्टी नाम या फोन नंबर से खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading && <Loader />}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">पार्टी नाम (Party Name)</th>
              <th className="px-4 py-3 text-left">प्रकार (Type)</th>
              <th className="px-4 py-3 text-right">कुल खरीद (Purchase)</th>
              <th className="px-4 py-3 text-right">कुल बिक्री (Sales)</th>
              <th className="px-4 py-3 text-right">शुद्ध बकाया (Balance)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReport.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  कोई पार्टी रिकॉर्ड नहीं मिला
                </td>
              </tr>
            )}
            {filteredReport.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900">{item.partyName}</div>
                  {item.phone && <div className="text-[10px] text-slate-400">📞 {item.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700">
                    {item.partyType === 'personal' ? '👤 पर्सनल' : item.partyType === 'supplier' ? '🏢 सप्लायर' : '🛒 ग्राहक'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-600">₹{(item.totalPurchase || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-black text-emerald-700">₹{(item.totalSales || 0).toLocaleString('en-IN')}</td>
                <td className={`px-4 py-3 text-right font-black ${
                  item.balance > 0 ? 'text-rose-600' : item.balance < 0 ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {item.balance > 0 ? `₹${item.balance.toLocaleString('en-IN')} (लेने हैं)` :
                   item.balance < 0 ? `₹${Math.abs(item.balance).toLocaleString('en-IN')} (देने हैं)` :
                   '₹0 (चुक्ता)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartyWiseReportPage;