import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { readLocalJson } from "@repo/shared";
import Loader from "../../components/Loader";
import { 
  Printer, ArrowLeft, RefreshCw, Search, Eye, FileText, 
  Share2, X, MapPin, Calendar, RotateCcw, ExternalLink 
} from "lucide-react";

const PartyWiseReportPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Statement Modal State
  const [statementParty, setStatementParty] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementSiteFilter, setStatementSiteFilter] = useState("all");
  const [statementPeriodFilter, setStatementPeriodFilter] = useState("all");
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [partyMarginPercent, setPartyMarginPercent] = useState(() => {
    try {
      return Number(localStorage.getItem("vb_custom_gross_margin_percent")) || 15;
    } catch (e) {
      return 15;
    }
  });

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
          const storedP = readLocalJson(["vb_local_parties", "parties"], []);
          if (Array.isArray(storedP)) localParties = storedP;
          const storedB = readLocalJson(["vb_local_manual_bills", "bills"], []);
          if (Array.isArray(storedB)) localBills = storedB;
        }
      } catch (e) {}

      // Server data takes authoritative precedence over stale local cache
      const allParties = [...serverReports, ...serverParties, ...localParties];
      const partyMap = new Map();

      allParties.forEach(p => {
        if (!p) return;
        // Skip inactive or deleted parties
        if (p.isActive === false || p.isDeleted === true) return;
        const name = p.name || p.partyName || "";
        if (!name) return;
        const k = name.trim().toLowerCase();

        // Extra safeguard: skip soft-deleted duplicate "Ashok hardware bilaspur"
        if (k.includes("ashok hardware bilaspur")) return;

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

  // Open Full Itemized Ledger Statement
  const handleOpenStatement = async (party) => {
    setStatementParty(party);
    setStatementSiteFilter("all");
    setStatementPeriodFilter("all");
    setStatementStartDate("");
    setStatementEndDate("");
    setShowStatementModal(true);
    setStatementLoading(true);
    setStatementData(null);
    try {
      const pId = party._id || party.id;
      const res = await api.get(`/api/party/${pId}/statement`);
      if (res?.data) {
        setStatementData(res.data);
      }
    } catch (err) {
      console.error("Statement fetch error", err);
      alert("लेजर लोड करने में समस्या आई: " + (err.response?.data?.error || err.message));
    } finally {
      setStatementLoading(false);
    }
  };

  // Distinct sites available in active party's statement
  const availableSites = useMemo(() => {
    if (!statementData?.transactions) return [];
    const siteMap = new Map();
    statementData.transactions.forEach(t => {
      const s = (t.siteName || "").trim();
      if (s) {
        siteMap.set(s, (siteMap.get(s) || 0) + 1);
      }
    });
    return Array.from(siteMap.entries()).map(([name, count]) => ({ name, count }));
  }, [statementData]);

  // Filtered transactions for active party statement (by Site, FY, and Custom Date)
  const filteredStatementTransactions = useMemo(() => {
    if (!statementData?.transactions) return [];
    let list = [...statementData.transactions];

    // 1. Site filter
    if (statementSiteFilter && statementSiteFilter !== "all") {
      list = list.filter(t => (t.siteName || "").trim().toLowerCase() === statementSiteFilter.toLowerCase());
    }

    // 2. Financial Year or Date filter
    if (statementPeriodFilter === "FY2425") {
      const from = new Date("2024-04-01T00:00:00.000Z");
      const to = new Date("2025-03-31T23:59:59.999Z");
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === "FY2526") {
      const from = new Date("2025-04-01T00:00:00.000Z");
      const to = new Date("2026-03-31T23:59:59.999Z");
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === "FY2627") {
      const from = new Date("2026-04-01T00:00:00.000Z");
      const to = new Date("2027-03-31T23:59:59.999Z");
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === "custom") {
      if (statementStartDate) {
        const from = new Date(statementStartDate);
        from.setHours(0, 0, 0, 0);
        list = list.filter(t => new Date(t.date) >= from);
      }
      if (statementEndDate) {
        const to = new Date(statementEndDate);
        to.setHours(23, 59, 59, 999);
        list = list.filter(t => new Date(t.date) <= to);
      }
    }

    return list;
  }, [statementData, statementSiteFilter, statementPeriodFilter, statementStartDate, statementEndDate]);

  const filteredDebit = useMemo(() => {
    return filteredStatementTransactions.reduce((acc, t) => acc + (Number(t.debit) || 0), 0);
  }, [filteredStatementTransactions]);

  const filteredCredit = useMemo(() => {
    return filteredStatementTransactions.reduce((acc, t) => acc + (Number(t.credit) || 0), 0);
  }, [filteredStatementTransactions]);

  const filteredNet = filteredDebit - filteredCredit;

  // WhatsApp Share Ledger (incorporates active site and date range)
  const handleShareWhatsApp = () => {
    if (!statementParty) return;
    const p = statementParty;

    let periodLabel = "सभी समय (All Time)";
    if (statementPeriodFilter === "FY2425") periodLabel = "FY 2024-25 (01 Apr 2024 - 31 Mar 2025)";
    else if (statementPeriodFilter === "FY2526") periodLabel = "FY 2025-26 (01 Apr 2025 - 31 Mar 2026)";
    else if (statementPeriodFilter === "FY2627") periodLabel = "FY 2026-27 (01 Apr 2026 - 31 Mar 2027)";
    else if (statementPeriodFilter === "custom") {
      const fromStr = statementStartDate ? new Date(statementStartDate).toLocaleDateString("hi-IN") : "शुरुआत";
      const toStr = statementEndDate ? new Date(statementEndDate).toLocaleDateString("hi-IN") : "आज तक";
      periodLabel = `${fromStr} से ${toStr}`;
    }

    const siteLabel = statementSiteFilter !== "all" ? statementSiteFilter : "सभी साइटें (All Sites)";
    const isFiltered = statementSiteFilter !== "all" || statementPeriodFilter !== "all" || statementStartDate || statementEndDate;

    let text = `*खाता विवरण (Statement of Account)*\n` +
      `🏢 *गणेश हार्डवेयर (Ganesh Hardware)*\n` +
      `👤 पार्टी: *${p.name || p.partyName}*\n` +
      `📞 मोबाइल: ${p.mobileNumber && p.mobileNumber !== '9999999999' ? p.mobileNumber : (p.phone && p.phone !== '9999999999' ? p.phone : '-')}\n` +
      `📅 अवधि: *${periodLabel}*\n` +
      `🏗️ साइट: *${siteLabel}*\n` +
      `------------------------------------\n` +
      `📋 कुल प्रविष्टियाँ: ${filteredStatementTransactions.length}\n` +
      `🔴 कुल बिल (Debit): *₹${filteredDebit.toLocaleString('en-IN')}*\n` +
      `🟢 कुल जमा (Credit): *₹${filteredCredit.toLocaleString('en-IN')}*\n` +
      `⚖️ *इस अवधि/साइट का बाकी:* *₹${Math.abs(filteredNet).toLocaleString('en-IN')} ${filteredNet > 0 ? '(लेने हैं / Due)' : filteredNet < 0 ? '(देने हैं / Advance)' : '(चुक्ता / Nil)'}*\n`;

    if (isFiltered) {
      const overallBal = Number(p.currentBalance ?? p.balance ?? statementData?.currentBalance ?? 0);
      text += `💰 *कुल समग्र बकाया (All Time Net):* *₹${Math.abs(overallBal).toLocaleString('en-IN')} ${overallBal > 0 ? '(लेने हैं)' : '(देने हैं)'}*\n`;
    }

    text += `------------------------------------\n` +
      `कृपया हिसाब मिलान कर लें। धन्यवाद!\n- Ganesh Hardware`;

    const cleanPhone = (p.mobileNumber || p.phone || '').replace(/[^0-9]/g, '');
    const url = (cleanPhone && cleanPhone !== '9999999999' && cleanPhone.length >= 10)
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredReport = report.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (item.partyName || "").toLowerCase().includes(q) || (item.phone || "").includes(q);
  });

  const totalToCollect = report.filter(r => r.balance > 0).reduce((sum, r) => sum + r.balance, 0);
  const totalToPay = Math.abs(report.filter(r => r.balance < 0).reduce((sum, r) => sum + r.balance, 0));
  const totalSalesAll = report.reduce((sum, r) => sum + (r.totalSales || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Top Header */}
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
            <p className="text-xs text-slate-500">पार्टी-वार कुल बिक्री, खरीद व बकाया राशि का खाता (क्लिक करके पूरा लेजर खोलें)</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden w-full sm:w-auto justify-end flex-wrap">
          <button 
            onClick={() => navigate('/parties')}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink size={14} /> पार्टी प्रबंधन
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer">
            <Printer size={15} /> Print
          </button>
          <button onClick={fetchReport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> ताज़ा करें
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">कुल बिक्री (Total Sales Revenue)</span>
          <p className="text-lg font-black text-slate-900 mt-1">₹{totalSalesAll.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 block">🟢 कुल लेने हैं (To Collect / Due)</span>
          <p className="text-lg font-black text-emerald-700 mt-1">₹{totalToCollect.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 block">🔴 कुल देने हैं (To Pay / Advance)</span>
          <p className="text-lg font-black text-rose-600 mt-1">₹{totalToPay.toLocaleString('en-IN')}</p>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">पार्टी नाम (Party Name)</th>
              <th className="px-4 py-3 text-left">प्रकार (Type)</th>
              <th className="px-4 py-3 text-right">कुल खरीद (Purchase)</th>
              <th className="px-4 py-3 text-right">कुल बिक्री (Sales)</th>
              <th className="px-4 py-3 text-right">शुद्ध बकाया (Balance)</th>
              <th className="px-4 py-3 text-center print:hidden">खाता / रिपोर्ट</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReport.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  कोई पार्टी रिकॉर्ड नहीं मिला
                </td>
              </tr>
            )}
            {filteredReport.map((item) => (
              <tr 
                key={item._id} 
                onClick={() => handleOpenStatement(item)}
                className="hover:bg-indigo-50/50 transition cursor-pointer group"
                title="पूरा लेजर विवरण देखने के लिए क्लिक करें"
              >
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900 group-hover:text-indigo-700 transition flex items-center gap-1.5">
                    <span>{item.partyName}</span>
                  </div>
                  {item.phone && <div className="text-[10px] text-slate-400">📞 {item.phone}</div>}
                  {item.address && <div className="text-[10px] text-slate-400">📍 {item.address}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    item.partyType === 'personal' ? 'bg-purple-100 text-purple-700' :
                    item.partyType === 'supplier' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {item.partyType === 'personal' ? '👤 पर्सनल' : item.partyType === 'supplier' ? '🏢 सप्लायर' : '🛒 ग्राहक'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-600">₹{(item.totalPurchase || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-black text-indigo-700">₹{(item.totalSales || 0).toLocaleString('en-IN')}</td>
                <td className={`px-4 py-3 text-right font-black ${
                  item.balance > 0 ? 'text-emerald-700' : item.balance < 0 ? 'text-rose-600' : 'text-slate-600'
                }`}>
                  {item.balance > 0 ? `₹${item.balance.toLocaleString('en-IN')} (लेने हैं)` :
                   item.balance < 0 ? `₹${Math.abs(item.balance).toLocaleString('en-IN')} (देने हैं)` :
                   '₹0 (चुक्ता)'}
                </td>
                <td className="px-4 py-3 text-center print:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStatement(item);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                    title="पूरा बिल व लेजर खाता खोलें"
                  >
                    <Eye size={13} />
                    <span>खाता खोलें</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📄 FULL ITEMIZED PARTY LEDGER STATEMENT MODAL */}
      {showStatementModal && statementParty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-start flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/30 rounded-lg text-indigo-300">
                    <FileText size={18} />
                  </span>
                  <h2 className="text-lg sm:text-xl font-black">{statementParty.partyName || statementParty.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white capitalize">
                    {statementParty.partyType || 'customer'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2">
                  <span>📞 {statementParty.phone || statementParty.mobileNumber || 'कोई नंबर नहीं'}</span>
                  {statementParty.address && <span>• 📍 {statementParty.address}</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition"
                  title="व्हाट्सएप पर स्टेटमेंट भेजें"
                >
                  <Share2 size={14} /> <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-white/20 cursor-pointer transition"
                  title="प्रिंट या PDF डाउनलोड करें"
                >
                  <Printer size={14} /> <span>प्रिंट / PDF</span>
                </button>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {(() => {
              const isFilterActive = statementSiteFilter !== 'all' || statementPeriodFilter !== 'all' || statementStartDate || statementEndDate;
              const curBal = Number(statementParty.balance ?? statementParty.currentBalance ?? statementData?.currentBalance ?? 0);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 font-bold block">शुरूआती बैलेंस (Opening)</span>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      ₹{(statementData?.openingBalance || statementParty.openingBalance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-indigo-600 font-bold block">
                      कुल बिल (Debit) {isFilterActive && <span className="text-amber-600 font-normal">(फ़िल्टर)</span>}
                    </span>
                    <p className="text-sm font-black text-indigo-700 mt-0.5">
                      ₹{(isFilterActive ? filteredDebit : (statementData?.totalDebit || 0)).toLocaleString('en-IN')}
                    </p>
                    {isFilterActive && (
                      <span className="text-[9px] text-slate-400">कुल: ₹{(statementData?.totalDebit || 0).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      कुल जमा (Credit) {isFilterActive && <span className="text-amber-600 font-normal">(फ़िल्टर)</span>}
                    </span>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">
                      ₹{(isFilterActive ? filteredCredit : (statementData?.totalCredit || 0)).toLocaleString('en-IN')}
                    </p>
                    {isFilterActive && (
                      <span className="text-[9px] text-slate-400">कुल: ₹{(statementData?.totalCredit || 0).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-rose-600 font-bold block">
                      {isFilterActive ? 'अवधि बाकी (Period Net)' : 'मौजूदा बाकी (Net Due)'}
                    </span>
                    <p className={`text-sm font-black mt-0.5 ${
                      (isFilterActive ? filteredNet : curBal) > 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      ₹{Math.abs(isFilterActive ? filteredNet : curBal).toLocaleString('en-IN')}
                      <span className="text-[10px] font-normal ml-1">
                        {(isFilterActive ? filteredNet : curBal) > 0 ? '(लेने हैं)' : '(देने हैं)'}
                      </span>
                    </p>
                    {isFilterActive && (
                      <span className="text-[9px] text-slate-500 font-medium">
                        समग्र: ₹{Math.abs(curBal).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Party Profitability Calculator Banner (Automatic - Zero manual bill editing) */}
            {(() => {
              const isFilterActive = statementSiteFilter !== 'all' || statementPeriodFilter !== 'all' || statementStartDate || statementEndDate;
              const billTotal = isFilterActive ? filteredDebit : (statementData?.totalDebit || 0);
              if (billTotal <= 0) return null;
              const marginNum = Math.max(0, Math.min(100, Number(partyMarginPercent) || 15));
              const partyProfit = Math.round(billTotal * (marginNum / 100));
              const partyCOGS = billTotal - partyProfit;

              return (
                <div className="mx-4 my-2.5 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg font-black text-[11px] shadow-xs">
                      💰 पार्टी मुनाफ़ा विश्लेषक
                    </span>
                    <div>
                      <span className="text-slate-800 font-bold block">
                        इस पार्टी से कुल बिक्री: <strong className="text-indigo-900">₹{billTotal.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        बिना किसी बिल को खोले पूरे खाते पर ऑटोमैटिक गणना
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                      <span className="text-slate-600 font-bold text-[11px]">मार्जिन %:</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={partyMarginPercent}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPartyMarginPercent(val);
                          try {
                            localStorage.setItem("vb_custom_gross_margin_percent", String(val));
                          } catch (err) {}
                        }}
                        className="w-12 px-1 py-0.5 text-center font-black text-emerald-800 bg-emerald-50 border border-emerald-400 rounded focus:outline-none text-xs"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-700 font-black text-sm block">
                        शुद्ध मुनाफ़ा ({marginNum}%): ₹{partyProfit.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-600 font-medium">
                        (ऑटोमैटिक खरीद लागत {100 - marginNum}%: ₹{partyCOGS.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 🔍 FILTER BAR: Site, Financial Year & Custom Dates */}
            <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Site Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  <MapPin size={13} className="text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-600 text-[11px]">साइट:</span>
                  <select
                    value={statementSiteFilter}
                    onChange={(e) => setStatementSiteFilter(e.target.value)}
                    className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer text-xs pr-1"
                  >
                    <option value="all">सभी साइटें ({statementData?.transactions?.length || 0})</option>
                    {availableSites.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Year / Period Dropdown */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  <Calendar size={13} className="text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-600 text-[11px]">अवधि:</span>
                  <select
                    value={statementPeriodFilter}
                    onChange={(e) => setStatementPeriodFilter(e.target.value)}
                    className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer text-xs pr-1"
                  >
                    <option value="all">सभी समय (All Time)</option>
                    <option value="FY2425">FY 2024-25 (01/04/24 - 31/03/25)</option>
                    <option value="FY2526">FY 2025-26 (01/04/25 - 31/03/26)</option>
                    <option value="FY2627">FY 2026-27 (01/04/26 - 31/03/27)</option>
                    <option value="custom">📅 कस्टम तारीख चुनें (Custom Date)</option>
                  </select>
                </div>

                {/* Custom Date Pickers */}
                {statementPeriodFilter === "custom" && (
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs animate-in fade-in">
                    <input
                      type="date"
                      value={statementStartDate}
                      onChange={(e) => setStatementStartDate(e.target.value)}
                      className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none"
                      title="प्रारंभिक तारीख"
                    />
                    <span className="text-slate-400 font-bold text-[11px]">से</span>
                    <input
                      type="date"
                      value={statementEndDate}
                      onChange={(e) => setStatementEndDate(e.target.value)}
                      className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none"
                      title="अंतिम तारीख"
                    />
                  </div>
                )}

                {/* Reset Filters Button */}
                {(statementSiteFilter !== "all" || statementPeriodFilter !== "all" || statementStartDate || statementEndDate) && (
                  <button
                    onClick={() => {
                      setStatementSiteFilter("all");
                      setStatementPeriodFilter("all");
                      setStatementStartDate("");
                      setStatementEndDate("");
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition text-[11px]"
                    title="फ़िल्टर हटाएं"
                  >
                    <RotateCcw size={12} /> रीसेट
                  </button>
                )}
              </div>

              {/* Filter Counter */}
              <div className="text-[11px] font-bold text-slate-500 ml-auto">
                दिखा रहे हैं: <span className="text-indigo-700">{filteredStatementTransactions.length}</span> / {statementData?.transactions?.length || 0}
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {statementLoading ? (
                <div className="py-16 text-center text-slate-400 font-bold text-sm">
                  लेजर स्टेटमेंट लोड हो रहा है...
                </div>
              ) : filteredStatementTransactions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-xs">
                  चयनित फ़िल्टर (साइट या अवधि) के अनुसार कोई प्रविष्टि नहीं मिली।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b">
                      <tr>
                        <th className="px-3 py-2.5">दिनांक (Date)</th>
                        <th className="px-3 py-2.5">प्रकार (Type)</th>
                        <th className="px-3 py-2.5">रेफरेंस / बिल #</th>
                        <th className="px-3 py-2.5">विवरण (Details)</th>
                        <th className="px-3 py-2.5 text-center">साइट (Site)</th>
                        <th className="px-3 py-2.5 text-right">बिल (Debit ₹)</th>
                        <th className="px-3 py-2.5 text-right">जमा (Credit ₹)</th>
                        <th className="px-3 py-2.5 text-right">बाकी (Balance ₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStatementTransactions.map((tx, idx) => {
                        const isSale = tx.type === 'sale';
                        const isPurchase = tx.type === 'purchase';
                        const isReceipt = tx.type === 'receipt' || tx.credit > 0;
                        const formattedDate = tx.date ? new Date(tx.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                        const siteStr = (tx.siteName || '').trim();

                        return (
                          <tr key={tx._id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-700">
                              {formattedDate}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isSale ? 'bg-indigo-100 text-indigo-700' :
                                isPurchase ? 'bg-amber-100 text-amber-800' :
                                isReceipt ? 'bg-emerald-100 text-emerald-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {isSale ? '🛒 बिक्री बिल' : isPurchase ? '🏢 खरीद बिल' : isReceipt ? '🟢 मुझे मिले' : '🔴 मैंने दिए'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                              {tx.refNo || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={tx.details}>
                              {tx.details || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              {siteStr ? (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  siteStr === 'COMPLEX' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                  siteStr === 'PWD' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  siteStr === 'PAINT' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  siteStr === 'S' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  siteStr.includes('%') ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  🏗️ {siteStr}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-black text-rose-600 whitespace-nowrap">
                              {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-black text-emerald-700 whitespace-nowrap">
                              {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                              ₹{Math.abs(Number(tx.runningBalance || 0)).toLocaleString('en-IN')}
                              <span className="text-[9px] font-medium ml-1 text-slate-400">
                                {Number(tx.runningBalance || 0) >= 0 ? 'Dr' : 'Cr'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                प्रदर्शित प्रविष्टियाँ: <strong className="text-slate-800">{filteredStatementTransactions.length}</strong> / कुल: <strong>{(statementData?.transactions || []).length}</strong>
              </span>
              <button
                onClick={() => setShowStatementModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyWiseReportPage;