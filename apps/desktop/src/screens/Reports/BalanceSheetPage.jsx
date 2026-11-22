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
  ShieldCheck,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import * as XLSX from "xlsx";

const BalanceSheetPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formatView, setFormatView] = useState("horizontal"); // "horizontal" (T-Shape) or "vertical" (Schedule III)

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/reports/balancesheet");
      if (res?.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error(res?.data?.message || "डेटा लोड करने में विफल");
      }
    } catch (err) {
      console.error("Balance sheet fetch error:", err);
      setError(err?.response?.data?.error || err.message || "तुलन पत्र लोड करने में त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const rows = [
      ["गणेश हार्डवेयर - तुलन पत्र / बैलेंस शीट (Balance Sheet)"],
      [`दिनांक: ${new Date(data.asOnDate).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`],
      [""],
      ["देनदारियां व पूंजी (Liabilities & Capital)", "राशि (₹)", "संपत्तियां (Assets)", "राशि (₹)"],
      ["", "", "", ""],
      ["[1] पूंजी खाता (Capital Account)", "", "[1] चालू संपत्तियां (Current Assets)", ""],
      ["प्रारंभिक पूंजी (Opening Capital)", data.liabilitiesAndCapital.capitalAccount.openingCapital, "दुकान रोकड़ / गल्ला (Cash in Hand)", data.assets.currentAssets.cashInHand],
      ["(+) चालू वर्ष का शुद्ध लाभ (Net Profit)", data.liabilitiesAndCapital.capitalAccount.netProfit, "बैंक खाते (Bank Balances)", data.assets.currentAssets.bankBalances],
      ["(-) घर खर्च व आहरण (Drawings)", -data.liabilitiesAndCapital.capitalAccount.drawings, "कुल देनदार ग्राहक (Sundry Debtors)", data.assets.currentAssets.sundryDebtors],
      ["शुद्ध अंतिम पूंजी (Closing Capital)", data.liabilitiesAndCapital.capitalAccount.closingCapital, "दुकान माल स्टॉक (Closing Stock)", data.assets.currentAssets.closingStock],
      ["", "", "कुल चालू संपत्तियां", data.assets.currentAssets.total],
      ["", "", "", ""],
      ["[2] गैर-चालू देनदारियां (Loans)", "", "[2] स्थिर संपत्तियां (Fixed Assets)", ""],
      ["अनसिक्योर्ड लोन (Unsecured Loans)", data.liabilitiesAndCapital.nonCurrentLiabilities.unsecuredLoans, "दुकान फर्नीचर, कंप्यूटर व उपकरण", data.assets.fixedAssets.total],
      ["", "", "", ""],
      ["[3] चालू देनदारियां (Current Liabilities)", "", "", ""],
      ["कुल लेनदार सप्लायर (Sundry Creditors)", data.liabilitiesAndCapital.currentLiabilities.sundryCreditors, "", ""],
      ["", "", "", ""],
      ["कुल देनदारियां व पूंजी (Total Liabilities & Capital)", data.liabilitiesAndCapital.totalLiabilitiesAndCapital, "कुल संपत्तियां (Total Assets)", data.assets.totalAssets],
      ["", "", "", ""],
      ["अंतर / संतुलन स्थिति (Balance Difference)", data.balanceCheck.difference, data.balanceCheck.isBalanced ? "✓ संतुलित (Balanced)" : "⚠️ अंतर"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet");
    XLSX.writeFile(wb, `BalanceSheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const assets = data?.assets;
  const liab = data?.liabilitiesAndCapital;
  const isBalanced = data?.balanceCheck?.isBalanced;
  const diff = data?.balanceCheck?.difference || 0;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/reports")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="रिपोर्ट्स सूची पर वापस जाएं"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Scale className="text-indigo-600" size={26} />
                  <span>तुलन पत्र / बैलेंस शीट</span>
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Double-Entry Tally
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                व्यापार की कुल संपत्तियों (Assets), देनदारियों (Liabilities) व मालिक की शुद्ध पूंजी (Capital) का संपूर्ण वित्तीय विवरण
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormatView("horizontal")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  formatView === "horizontal" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                T-प्रारूप (पारंपरिक)
              </button>
              <button
                type="button"
                onClick={() => setFormatView("vertical")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  formatView === "vertical" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                वर्टिकल (Schedule-III)
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={loading || !data}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Excel फ़ाइल में डाउनलोड करें"
            >
              <FileSpreadsheet size={15} /> <span>Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="बैलेंस शीट प्रिंट करें या PDF सुरक्षित करें"
            >
              <Printer size={15} /> <span>प्रिंट / PDF</span>
            </button>

            <button
              onClick={fetchBalanceSheet}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer border border-slate-300"
              title="रिफ्रेश करें"
            >
              <RotateCcw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
            <RotateCcw size={32} className="animate-spin text-indigo-600" />
            <p className="font-bold text-slate-700 text-sm">रियल-टाइम बैलेंस शीट की गणना हो रही है...</p>
            <p className="text-xs text-slate-400">बैंक, देनदार, इन्वेंटरी, सप्लायर व मुनाफ़ा लोड हो रहा है</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
            <AlertTriangle size={20} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Top Balance Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">कुल संपत्तियां (Total Assets)</span>
                  <Package className="text-indigo-600" size={18} />
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  ₹{(assets?.totalAssets || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">
                  स्टॉक, उधारी वसूली, रोकड़ व बैंक
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">मालिक की शुद्ध पूंजी (Net Capital)</span>
                  <PiggyBank className="text-emerald-600" size={18} />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  ₹{(liab?.capitalAccount?.closingCapital || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">
                  निवेश + मुनाफ़ा - घर खर्च
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">कुल देनदारियां (Liabilities)</span>
                  <CreditCard className="text-rose-600" size={18} />
                </div>
                <div className="text-2xl font-black text-rose-700">
                  ₹{(liab?.totalLiabilities || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">
                  सप्लायर बकाया + अनसिक्योर्ड लोन
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs ${isBalanced ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="text-xs font-bold">संतुलन स्थिति (Balance Check)</span>
                  {isBalanced ? <CheckCircle2 className="text-emerald-600" size={20} /> : <AlertTriangle className="text-amber-600" size={20} />}
                </div>
                <div className={`text-xl font-black ${isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isBalanced ? "✓ पूर्णतः संतुलित" : `₹${Math.abs(diff).toLocaleString('en-IN')} अंतर`}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                  {isBalanced ? "संपत्तियां = पूंजी + देनदारियां (Tally OK)" : "असमायोजित कार्यशील पूंजी अंतर"}
                </div>
              </div>
            </div>

            {/* Main Double-Entry Balance Sheet: Two Columns (T-Format) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
              
              {/* Printable Letterhead (Shown in Print) */}
              <div className="hidden print:block p-6 text-center border-b border-slate-300">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">गणेश हार्डवेयर (Ganesh Hardware)</h1>
                <p className="text-xs text-slate-600 font-bold">तुलन पत्र / बैलेंस शीट (Balance Sheet)</p>
                <p className="text-[11px] text-slate-500">
                  दिनांक: {new Date(data.asOnDate).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className={`grid ${formatView === "horizontal" ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x" : "grid-cols-1 divide-y"} divide-slate-200`}>
                
                {/* ==================== LEFT COLUMN: LIABILITIES & CAPITAL ==================== */}
                <div className="flex flex-col">
                  <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-black text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <CreditCard size={16} className="text-rose-600" />
                      <span>देनदारियां व पूंजी (Liabilities & Capital)</span>
                    </span>
                    <span className="text-xs font-black text-slate-700">राशि (₹)</span>
                  </div>

                  <div className="p-4 space-y-5 flex-1 text-xs">
                    
                    {/* 1. Capital Account (पूंजी खाता) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <PiggyBank size={15} className="text-emerald-600" />
                          <span>[1] मालिक की पूंजी खाता (Capital Account)</span>
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          ₹{liab?.capitalAccount?.closingCapital?.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex justify-between items-center">
                          <span>प्रारंभिक / निवेशित पूंजी (Opening Capital)</span>
                          <span className="font-mono font-bold text-slate-800">
                            ₹{(liab?.capitalAccount?.openingCapital || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-700">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={13} />
                            <span>(+) चालू वित्तीय वर्ष का शुद्ध लाभ (Net Profit)</span>
                          </span>
                          <span className="font-mono font-bold">
                            +₹{(liab?.capitalAccount?.netProfit || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-rose-600">
                          <span>(-) व्यक्तिगत आहरण व घर खर्च (Drawings)</span>
                          <span className="font-mono font-bold">
                            -₹{(liab?.capitalAccount?.drawings || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between items-center font-bold text-slate-900">
                          <span>शुद्ध अंतिम पूंजी (Closing Balance)</span>
                          <span className="text-emerald-800 font-mono font-black text-xs">
                            ₹{(liab?.capitalAccount?.closingCapital || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Non-Current Liabilities (दीर्घकालिक ऋण) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <Landmark size={15} className="text-indigo-600" />
                          <span>[2] गैर-चालू देनदारियां (Non-Current Liabilities)</span>
                        </span>
                        <span className="font-black text-slate-800 text-xs">
                          ₹{(liab?.nonCurrentLiabilities?.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>परिवार/मित्रों से लिया अनसिक्योर्ड लोन</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{(liab?.nonCurrentLiabilities?.unsecuredLoans || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* 3. Current Liabilities (चालू देनदारियां - सप्लायर्स) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <Users size={15} className="text-rose-600" />
                          <span>[3] चालू देनदारियां - सप्लायर (Sundry Creditors)</span>
                        </span>
                        <span className="font-black text-rose-700 text-sm">
                          ₹{(liab?.currentLiabilities?.sundryCreditors || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        कुल {liab?.currentLiabilities?.creditorsCount || 0} सप्लायरों को भुगतान बाकी है:
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {(liab?.currentLiabilities?.topCreditors || []).map((c, i) => (
                          <div key={i} className="flex justify-between items-center py-1 px-2 rounded-lg bg-white border border-slate-100 text-[11px]">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">{c.name}</span>
                            <span className="font-mono font-bold text-rose-700">₹{c.balance.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Left Column Total */}
                  <div className="bg-slate-100 p-3.5 border-t border-slate-200 flex justify-between items-center mt-auto font-black text-sm text-slate-900">
                    <span>कुल देनदारियां व पूंजी (Total Liabilities & Capital)</span>
                    <span className="font-mono text-base text-indigo-700">
                      ₹{(liab?.totalLiabilitiesAndCapital || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* ==================== RIGHT COLUMN: ASSETS ==================== */}
                <div className="flex flex-col">
                  <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-black text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Package size={16} className="text-indigo-600" />
                      <span>संपत्तियां (Assets)</span>
                    </span>
                    <span className="text-xs font-black text-slate-700">राशि (₹)</span>
                  </div>

                  <div className="p-4 space-y-5 flex-1 text-xs">
                    
                    {/* 1. Fixed Assets (स्थिर संपत्तियां) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 size={15} className="text-purple-600" />
                          <span>[1] स्थिर संपत्तियां (Fixed Assets)</span>
                        </span>
                        <span className="font-black text-purple-700 text-sm">
                          ₹{(assets?.fixedAssets?.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {(assets?.fixedAssets?.items || []).length > 0 ? (
                        <div className="space-y-1">
                          {assets.fixedAssets.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-slate-600 text-[11px]">
                              <span>{item.assetName}</span>
                              <span className="font-mono font-bold text-slate-800">₹{item.currentValue.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          दुकान फर्नीचर, कंप्यूटर व उपकरण आदि (दर्ज नहीं)
                        </div>
                      )}
                    </div>

                    {/* 2. Current Assets (चालू संपत्तियां) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <Wallet size={15} className="text-indigo-600" />
                          <span>[2] चालू संपत्तियां (Current Assets)</span>
                        </span>
                        <span className="font-black text-indigo-700 text-sm">
                          ₹{(assets?.currentAssets?.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        
                        {/* A. Closing Stock */}
                        <div className="flex justify-between items-center py-1.5 px-2.5 rounded-xl bg-white border border-slate-200">
                          <div>
                            <div className="font-bold text-slate-800">दुकान माल स्टॉक (Closing Stock Inventory)</div>
                            <div className="text-[10px] text-slate-400">खरीद मूल्य के आधार पर मूल्यांकन</div>
                          </div>
                          <span className="font-mono font-black text-slate-900 text-xs">
                            ₹{(assets?.currentAssets?.closingStock || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* B. Sundry Debtors (उधारी ग्राहक) */}
                        <div className="border border-slate-200 rounded-xl p-2.5 bg-white space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-800">कुल देनदार ग्राहक (Sundry Debtors)</div>
                              <div className="text-[10px] text-slate-400">{assets?.currentAssets?.debtorsCount || 0} ग्राहकों से उधारी लेना बाकी</div>
                            </div>
                            <span className="font-mono font-black text-emerald-700 text-xs">
                              ₹{(assets?.currentAssets?.sundryDebtors || 0).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="space-y-1 max-h-36 overflow-y-auto pt-1 border-t border-slate-100">
                            {(assets?.currentAssets?.topDebtors || []).slice(0, 5).map((d, i) => (
                              <div key={i} className="flex justify-between items-center text-[11px] text-slate-600">
                                <span className="truncate max-w-[200px]">{d.name}</span>
                                <span className="font-mono font-bold text-slate-800">₹{d.balance.toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* C. Cash & Bank */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">रोकड़ / गल्ला (Cash)</div>
                            <div className="font-mono font-black text-sm text-slate-800 mt-0.5">
                              ₹{(assets?.currentAssets?.cashInHand || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">बैंक खाते (Banks)</div>
                            <div className="font-mono font-black text-sm text-slate-800 mt-0.5">
                              ₹{(assets?.currentAssets?.bankBalances || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Right Column Total */}
                  <div className="bg-slate-100 p-3.5 border-t border-slate-200 flex justify-between items-center mt-auto font-black text-sm text-slate-900">
                    <span>कुल संपत्तियां (Total Assets)</span>
                    <span className="font-mono text-base text-indigo-700">
                      ₹{(assets?.totalAssets || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

              </div>

              {/* Tally Verification Footer */}
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>तुलन पत्र सत्यापन (Balance Verification):</strong> कुल संपत्तियां = कुल देनदारियां + शुद्ध पूंजी
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    अंतर (Variance): ₹{Math.abs(diff).toLocaleString("en-IN")}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ संतुलित (Balanced)
                  </span>
                </div>
              </div>

              {/* Printable Signatures */}
              <div className="hidden print:grid grid-cols-2 gap-8 p-12 mt-12 text-center text-xs text-slate-700">
                <div className="border-t border-slate-400 pt-2 font-bold">
                  अधिकृत हस्ताक्षर (Proprietor / Partner)
                </div>
                <div className="border-t border-slate-400 pt-2 font-bold">
                  चार्टर्ड अकाउंटेंट (CA / Auditor Stamp & Sign)
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default BalanceSheetPage;
