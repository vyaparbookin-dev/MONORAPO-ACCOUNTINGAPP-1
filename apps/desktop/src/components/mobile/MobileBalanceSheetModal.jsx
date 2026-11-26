import React, { useState, useEffect } from "react";
import { 
  X, RefreshCw, Scale, CheckCircle2, AlertTriangle, 
  Wallet, Landmark, Users, Package, Building2, TrendingUp, 
  ChevronDown, ChevronUp, Share2, Printer, ShieldCheck, Calendar
} from "lucide-react";
import api from "../../services/api";

export default function MobileBalanceSheetModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "assets", "liabilities"

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/reports/balancesheet");
      if (res?.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error(res?.data?.message || "बैलेंस शीट लोड करने में विफल");
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

  const assets = data?.assets;
  const liab = data?.liabilitiesAndCapital;
  const isBalanced = data?.balanceCheck?.isBalanced;
  const diff = data?.balanceCheck?.difference || 0;

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full max-w-xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl shadow-inner">
              ⚖️
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">तुलन पत्र / बैलेंस शीट (Balance Sheet)</h2>
              <p className="text-[10px] text-slate-300 font-medium">कुल संपत्तियां (Assets) बनाम देनदारियां व पूंजी</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchBalanceSheet}
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

        {/* Balance Status Banner */}
        {data && (
          <div className={`px-4 py-2 flex items-center justify-between text-xs font-black shrink-0 ${
            isBalanced 
              ? "bg-emerald-50 text-emerald-900 border-b border-emerald-200" 
              : "bg-amber-50 text-amber-900 border-b border-amber-200"
          }`}>
            <div className="flex items-center gap-1.5">
              {isBalanced ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
              <span>{isBalanced ? "✓ बैलेंस शीट पूरी तरह संतुलित है (Tally Balanced)" : `⚠️ अंतर: ₹${Math.abs(diff).toLocaleString('en-IN')}`}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              दिनांक: {new Date(data.asOnDate || Date.now()).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {/* View Filter Tabs: All vs Assets vs Liabilities */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
          {[
            { id: "all", label: "📋 सम्पूर्ण सारांश" },
            { id: "assets", label: "💰 संपत्तियां (Assets)" },
            { id: "liabilities", label: "🏢 देनदारियां (Liabilities)" }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-1.5 px-2 text-xs font-black rounded-xl transition cursor-pointer ${
                activeTab === t.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs font-bold">बैलेंस शीट तैयार हो रही है...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold text-center">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Grand Totals Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    कुल संपत्तियां (Total Assets)
                  </span>
                  <div className="text-lg font-black text-emerald-950">
                    ₹{Number(assets?.totalAssets || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-emerald-700 font-bold block">
                    रोकड़ + बैंक + उधारी + स्टॉक
                  </span>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
                    कुल देनदारियां व पूंजी
                  </span>
                  <div className="text-lg font-black text-indigo-950">
                    ₹{Number(liab?.totalLiabilitiesAndCapital || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-indigo-700 font-bold block">
                    पूंजी + लाभ + सप्लायर बकाया
                  </span>
                </div>
              </div>

              {/* 1. ASSETS SECTION */}
              {(activeTab === "all" || activeTab === "assets") && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <div>
                        <h3 className="font-black text-xs text-slate-900">संपत्तियां (Assets Breakdown)</h3>
                        <p className="text-[10px] text-slate-400">व्यापार की वर्तमान व स्थिर संपत्तियां</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700">
                      ₹{Number(assets?.totalAssets || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Cash in Hand */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Wallet size={15} className="text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">दुकान रोकड़ / गल्ला (Cash in Hand)</span>
                          <span className="text-[9px] text-slate-400">दुकान का वास्तविक नकद शेष</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{Number(assets?.currentAssets?.cashInHand || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Bank Balances */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Landmark size={15} className="text-blue-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">बैंक खाते (Bank Balances)</span>
                          <span className="text-[9px] text-slate-400">सभी करंट व सेविंग्स बैंक खाते</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{Number(assets?.currentAssets?.bankBalances || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Sundry Debtors */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-indigo-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">कुल देनदार ग्राहक (Sundry Debtors)</span>
                          <span className="text-[9px] text-emerald-700 font-bold">ग्राहकों से लेना है (Receivables)</span>
                        </div>
                      </div>
                      <span className="font-black text-emerald-800">
                        ₹{Number(assets?.currentAssets?.sundryDebtors || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Closing Stock */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Package size={15} className="text-amber-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">दुकान माल स्टॉक (Closing Stock)</span>
                          <span className="text-[9px] text-slate-400">दुकान में मौजूद माल की कुल कीमत</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{Number(assets?.currentAssets?.closingStock || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Fixed Assets */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-purple-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">स्थिर संपत्तियां (Fixed Assets)</span>
                          <span className="text-[9px] text-slate-400">दुकान फर्नीचर, कंप्यूटर, मशीनरी</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{Number(assets?.fixedAssets?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. LIABILITIES & CAPITAL SECTION */}
              {(activeTab === "all" || activeTab === "liabilities") && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <div>
                        <h3 className="font-black text-xs text-slate-900">देनदारियां व पूंजी (Liabilities & Capital)</h3>
                        <p className="text-[10px] text-slate-400">मालिक की पूंजी, लाभ व लेनदार</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-indigo-700">
                      ₹{Number(liab?.totalLiabilitiesAndCapital || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Capital Account Card */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider block">
                        💼 पूंजी खाता (Capital Account Calculation)
                      </span>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>प्रारंभिक पूंजी (Opening Capital)</span>
                          <span className="font-black">₹{Number(liab?.capitalAccount?.openingCapital || 0).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-700">
                          <span>(+) चालू वर्ष का शुद्ध लाभ (Net Profit)</span>
                          <span className="font-black">+₹{Number(liab?.capitalAccount?.netProfit || 0).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center text-rose-700">
                          <span>(-) घर खर्च व आहरण (Drawings)</span>
                          <span className="font-black">-₹{Number(liab?.capitalAccount?.drawings || 0).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="border-t border-indigo-200 pt-1.5 flex justify-between items-center font-black text-indigo-950">
                          <span>शुद्ध अंतिम पूंजी (Closing Capital)</span>
                          <span className="text-sm">₹{Number(liab?.capitalAccount?.closingCapital || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sundry Creditors */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-rose-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">कुल लेनदार सप्लायर (Sundry Creditors)</span>
                          <span className="text-[9px] text-rose-700 font-bold">व्यापारियों को देना है (Payables)</span>
                        </div>
                      </div>
                      <span className="font-black text-rose-700">
                        ₹{Number(liab?.currentLiabilities?.sundryCreditors || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Loans */}
                    <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-amber-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">बैंक व अन्य लोन (Non-Current Loans)</span>
                          <span className="text-[9px] text-slate-400">बैंक ओवरड्राफ्ट, अनसिक्योर्ड लोन</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{Number(liab?.nonCurrentLiabilities?.unsecuredLoans || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
