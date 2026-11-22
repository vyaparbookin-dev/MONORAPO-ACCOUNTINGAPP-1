import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ArrowLeft, 
  Printer, 
  FileSpreadsheet, 
  RotateCcw, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  Users,
  Package,
  Landmark,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Layers,
  ListFilter,
  Search,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import * as XLSX from "xlsx";

const TrialBalancePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("detailed"); // "detailed" or "group"
  const [selectedFy, setSelectedFy] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLedgers, setExpandedLedgers] = useState({});

  const fetchTrialBalance = async (fyVal = selectedFy) => {
    try {
      setLoading(true);
      setError(null);
      let queryUrl = "/api/reports/trialbalance";
      if (fyVal && fyVal !== "all") {
        queryUrl += `?fy=${fyVal}`;
      }
      const res = await api.get(queryUrl);
      if (res?.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error(res?.data?.message || "डेटा लोड करने में विफल");
      }
    } catch (err) {
      console.error("Trial balance fetch error:", err);
      setError(err?.response?.data?.error || err.message || "तलपट रिपोर्ट लोड करने में त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance(selectedFy);
  }, [selectedFy]);

  const toggleExpand = (id) => {
    setExpandedLedgers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const dateStr = new Date(data.asOnDate).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const rows = [
      ["गणेश हार्डवेयर - तलपट (Trial Balance Report)"],
      [`दिनांक: ${dateStr} • वित्तीय वर्ष: ${selectedFy === 'all' ? 'सभी वर्ष (Till Date)' : selectedFy}`],
      [""],
      ["क्र.", "खाता कोड (Code)", "खाता का नाम (Ledger Name)", "खाता समूह (Account Group)", "डेबिट (Debit ₹)", "क्रेडिट (Credit ₹)"]
    ];

    data.ledgers.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.code || "",
        l.name,
        l.group,
        l.debit > 0 ? l.debit : "",
        l.credit > 0 ? l.credit : ""
      ]);

      if (l.breakdown && l.breakdown.length > 0) {
        l.breakdown.forEach(b => {
          rows.push([
            "",
            "-",
            `  ↳ ${b.name} (${b.mobile || ''})`,
            l.group,
            l.debit > 0 ? b.balance : "",
            l.credit > 0 ? b.balance : ""
          ]);
        });
      }
    });

    rows.push(["", "", "", "", "", ""]);
    rows.push([
      "कुल योग (Grand Total)",
      "",
      "",
      "",
      data.summary.totalDebit,
      data.summary.totalCredit
    ]);
    rows.push([
      "अंतर (Difference)",
      "",
      "",
      "",
      data.summary.difference,
      data.summary.isBalanced ? "✓ संतुलित (Balanced)" : "⚠️ असंतुलित"
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "TrialBalance");
    XLSX.writeFile(wb, `TrialBalance_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredLedgers = (data?.ledgers || []).filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.group && l.group.toLowerCase().includes(q)) ||
      (l.code && l.code.includes(q))
    );
  });

  const isBalanced = data?.summary?.isBalanced;
  const difference = data?.summary?.difference || 0;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/reports")}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              title="रिपोर्ट्स मेन्यू पर वापस जाएं"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Scale className="w-7 h-7 text-indigo-600" />
                  तलपट (Trial Balance Report)
                </h1>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  द्वि-प्रविष्टि बहीखाता
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                सभी लेज़र खातों का नाम (Debit) व जमा (Credit) संपूर्ण मिलान रिपोर्ट
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            {/* FY Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setSelectedFy("all")}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFy === 'all' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                सभी वर्ष
              </button>
              <button
                onClick={() => setSelectedFy("2025-2026")}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFy === '2025-2026' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                FY 25-26
              </button>
              <button
                onClick={() => setSelectedFy("2024-2025")}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFy === '2024-2025' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                FY 24-25
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchTrialBalance(selectedFy)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="रिफ्रेश करें"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading || !data}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>एक्सेल एक्सपोर्ट</span>
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट (A4)</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-semibold">तलपट खाते संकलित किए जा रहे हैं...</p>
            <p className="text-xs text-slate-400 mt-1">सभी डेबिट व क्रेडिट प्रविष्टियों का संतुलन चेक हो रहा है</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <h3 className="font-bold text-base">डेटा लोड करने में समस्या आई</h3>
            </div>
            <p className="text-sm text-rose-700">{error}</p>
            <button
              onClick={() => fetchTrialBalance(selectedFy)}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Top Balance Status & Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Debits Card */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">कुल नाम (Total Debits)</span>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  ₹{Number(data.summary.totalDebit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">संपत्तियां, खरीद, व्यापारिक खर्च व आहरण</p>
              </div>

              {/* Total Credits Card */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">कुल जमा (Total Credits)</span>
                  <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  ₹{Number(data.summary.totalCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">बिक्री आय, सप्लायर देनदारियां व पूंजी</p>
              </div>

              {/* Difference Card */}
              <div className={`bg-white p-5 rounded-2xl shadow-sm border relative overflow-hidden ${Math.abs(difference) < 1 ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'}`}>
                <div className={`absolute top-0 right-0 w-2 h-full ${Math.abs(difference) < 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">अंतर (Net Difference)</span>
                  <div className={`p-2 rounded-xl ${Math.abs(difference) < 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    <Scale className="w-5 h-5" />
                  </div>
                </div>
                <div className={`text-2xl font-black mt-2 ${Math.abs(difference) < 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹{Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {Math.abs(difference) < 1 ? 'डेबिट और क्रेडिट एकदम बराबर' : 'कृपया लेज़र जांचें'}
                </p>
              </div>

              {/* Tally Status Badge Card */}
              <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between ${isBalanced ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider opacity-90">ऑडिट स्थिति</span>
                  <ShieldCheck className="w-6 h-6 text-emerald-200" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black flex items-center gap-2">
                    {isBalanced ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                        <span>पूर्णतः संतुलित</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                        <span>असंतुलित बहीखाता</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    {isBalanced ? "द्वि-प्रविष्टि (Double Entry) नियम 100% सत्यापित" : "अंतर का कारण जांचें"}
                  </p>
                </div>
              </div>

            </div>

            {/* Filter & View Mode Controls Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'detailed' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>विस्तृत खाता सूची ({data.ledgers.length})</span>
                </button>
                <button
                  onClick={() => setViewMode("group")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'group' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>समूह अनुसार (Group Summary)</span>
                </button>
              </div>

              {viewMode === "detailed" && (
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="खाता नाम, कोड या समूह से खोजें..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* MAIN TRIAL BALANCE TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
              
              {/* Print Header */}
              <div className="hidden print:block p-6 border-b border-slate-300 text-center">
                <h1 className="text-2xl font-black text-slate-900">गणेश हार्डवेयर (Ganesh Hardware)</h1>
                <p className="text-sm text-slate-600">वार्षिक व आवधिक तलपट रिपोर्ट (Trial Balance)</p>
                <p className="text-xs text-slate-500 mt-1">
                  तैयार दिनांक: {new Date(data.asOnDate).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {viewMode === "detailed" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-3 w-20 text-center">कोड</th>
                        <th className="py-3.5 px-4">खाता का नाम (Particulars / Ledger Account)</th>
                        <th className="py-3.5 px-4">खाता समूह (Group)</th>
                        <th className="py-3.5 px-4 text-right w-40 text-blue-700 bg-blue-50/50">डेबिट (Debit ₹)</th>
                        <th className="py-3.5 px-4 text-right w-40 text-purple-700 bg-purple-50/50">क्रेडिट (Credit ₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                      {filteredLedgers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400">
                            कोई खाता नहीं मिला
                          </td>
                        </tr>
                      ) : (
                        filteredLedgers.map((ledger, idx) => {
                          const hasBreakdown = ledger.breakdown && ledger.breakdown.length > 0;
                          const isExpanded = expandedLedgers[ledger.id];

                          return (
                            <React.Fragment key={ledger.id}>
                              <tr className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                                <td className="py-3 px-3 text-center font-mono text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded">
                                    {ledger.code || "1000"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    {hasBreakdown && (
                                      <button
                                        onClick={() => toggleExpand(ledger.id)}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                                        title="विवरण देखें/छिपाएं"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                    <span>{ledger.name}</span>
                                    {hasBreakdown && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                        {ledger.breakdown.length} पार्टियां
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-xs">
                                  <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
                                    {ledger.group}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/30">
                                  {ledger.debit > 0 ? `₹${Number(ledger.debit).toLocaleString('en-IN')}` : "-"}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-purple-900 bg-purple-50/30">
                                  {ledger.credit > 0 ? `₹${Number(ledger.credit).toLocaleString('en-IN')}` : "-"}
                                </td>
                              </tr>

                              {/* Breakdown sub-rows if expanded */}
                              {hasBreakdown && isExpanded && (
                                <tr className="bg-slate-50/70 border-y border-indigo-100">
                                  <td colSpan="6" className="p-3 pl-16">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner max-h-72 overflow-y-auto space-y-1">
                                      <div className="text-xs font-bold text-slate-600 pb-2 border-b border-slate-100 flex items-center justify-between">
                                        <span>विस्तृत पार्टी सूची:</span>
                                        <span>बकाया राशि (Balance)</span>
                                      </div>
                                      {ledger.breakdown.map((b, bIdx) => (
                                        <div key={bIdx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded">
                                          <span className="text-slate-700 font-semibold">
                                            {bIdx + 1}. {b.name} {b.mobile ? <span className="text-slate-400 font-normal">({b.mobile})</span> : null}
                                          </span>
                                          <span className="font-mono font-bold text-slate-800">
                                            ₹{Number(b.balance).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-black text-sm border-t-2 border-slate-900">
                        <td colSpan="4" className="py-4 px-6 text-right uppercase tracking-wider text-xs sm:text-sm">
                          कुल योग (Grand Total)
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-base text-blue-300 bg-slate-900/50">
                          ₹{Number(data.summary.totalDebit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-base text-purple-300 bg-slate-900/50">
                          ₹{Number(data.summary.totalCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* Group Summary View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">खाता समूह का नाम (Account Group)</th>
                        <th className="py-3.5 px-4 text-center">खातों की संख्या</th>
                        <th className="py-3.5 px-4 text-right w-44 text-blue-700 bg-blue-50/50">कुल नाम (Debit ₹)</th>
                        <th className="py-3.5 px-4 text-right w-44 text-purple-700 bg-purple-50/50">कुल जमा (Credit ₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                      {data.groups.map((grp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {grp.group}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                              {grp.count} खाते
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-blue-900 bg-blue-50/30">
                            {grp.debit > 0 ? `₹${Number(grp.debit).toLocaleString('en-IN')}` : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-purple-900 bg-purple-50/30">
                            {grp.credit > 0 ? `₹${Number(grp.credit).toLocaleString('en-IN')}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-black text-sm border-t-2 border-slate-900">
                        <td colSpan="3" className="py-4 px-6 text-right uppercase tracking-wider text-xs sm:text-sm">
                          समूह कुल योग (Group Total)
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-base text-blue-300 bg-slate-900/50">
                          ₹{Number(data.summary.totalDebit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-base text-purple-300 bg-slate-900/50">
                          ₹{Number(data.summary.totalCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Difference bar at bottom of table */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">तलपट संतुलन स्थिति:</span>
                  {isBalanced ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 font-bold px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      डेबिट और क्रेडिट पूर्णतः बराबर हैं (अंतर = ₹0.00)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-100 font-bold px-3 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      अंतर: ₹{Math.abs(difference).toLocaleString('en-IN')} (असंतुलित)
                    </span>
                  )}
                </div>

                <div className="text-slate-500">
                  कुल सक्रिय खाते: <span className="font-bold text-slate-800">{data.summary.ledgerCount}</span> • द्वि-प्रविष्टि बहीखाता (Tally Compliant)
                </div>
              </div>

              {/* Print Footer with Signature Block */}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-16 p-8 border-t border-slate-300 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold">हस्ताक्षर - मुंशी / अकाउंटेंट</p>
                  <p className="text-[10px] text-slate-400">लेज़र खातों का मिलान सत्यापित</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold">हस्ताक्षर - प्रोप्राइटर / CA</p>
                  <p className="text-[10px] text-slate-400">गणेश हार्डवेयर</p>
                </div>
              </div>

            </div>

          </>
        )}

      </div>
    </div>
  );
};

export default TrialBalancePage;
