import React, { useState, useEffect } from "react";
import { 
  X, RefreshCw, Scale, CheckCircle2, AlertTriangle, 
  Search, Users, Wallet, Landmark, Package, Building2, 
  ChevronRight, Calendar, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import api from "../../services/api";

export default function MobileTrialBalanceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "debit", "credit"

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/reports/trialbalance");
      if (res?.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error(res?.data?.message || "ट्रायल बैलेंस लोड करने में विफल");
      }
    } catch (err) {
      console.error("Trial balance fetch error:", err);
      setError(err?.response?.data?.error || err.message || "तलपट लोड करने में त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const totalDebit = Number(data?.totals?.totalDebit || 0);
  const totalCredit = Number(data?.totals?.totalCredit || 0);
  const isTallyBalanced = data?.totals?.isBalanced ?? (Math.abs(totalDebit - totalCredit) < 1);
  const diff = Math.abs(totalDebit - totalCredit);

  const rawLedgers = Array.isArray(data?.ledgers) ? data.ledgers : [];
  const filteredLedgers = rawLedgers.filter(it => {
    const nameMatch = String(it.name || it.ledgerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      String(it.group || it.accountGroup || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;
    if (filterType === "debit") return Number(it.debit || 0) > 0;
    if (filterType === "credit") return Number(it.credit || 0) > 0;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full max-w-xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl shadow-inner">
              📋
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">तलपट / ट्रायल बैलेंस (Trial Balance)</h2>
              <p className="text-[10px] text-slate-300 font-medium">सभी खातों का डेबिट व क्रेडिट संतुलन मिलान</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchTrialBalance}
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

        {/* Tally Balance Status */}
        {data && (
          <div className={`px-4 py-2 flex items-center justify-between text-xs font-black shrink-0 ${
            isTallyBalanced 
              ? "bg-emerald-50 text-emerald-900 border-b border-emerald-200" 
              : "bg-amber-50 text-amber-900 border-b border-amber-200"
          }`}>
            <div className="flex items-center gap-1.5">
              {isTallyBalanced ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
              <span>{isTallyBalanced ? "✓ डेबिट व क्रेडिट दोनों बराबर हैं (Tally Balanced)" : `⚠️ अंतर: ₹${diff.toLocaleString('en-IN')}`}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              खाते: {rawLedgers.length}
            </span>
          </div>
        )}

        {/* Totals Strip */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 grid grid-cols-2 gap-2 shrink-0">
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
              कुल नामे (Total Debit ₹)
            </span>
            <div className="text-base font-black text-emerald-950">
              ₹{totalDebit.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
              कुल जमा (Total Credit ₹)
            </span>
            <div className="text-base font-black text-indigo-950">
              ₹{totalCredit.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="खाता या समूह खोजें (उदा. नकद, ग्राहक, बिक्री)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: "all", label: `सभी (${rawLedgers.length})` },
              { id: "debit", label: "🟢 डेबिट (नामे)" },
              { id: "credit", label: "🔵 क्रेडिट (जमा)" }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  filterType === f.id
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Ledgers List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs font-bold">तलपट खाते तैयार हो रहे हैं...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold text-center">
              {error}
            </div>
          ) : filteredLedgers.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              कोई खाता नहीं मिला
            </div>
          ) : (
            filteredLedgers.map((item, idx) => {
              const dAmt = Number(item.debit || 0);
              const cAmt = Number(item.credit || 0);
              return (
                <div 
                  key={idx} 
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl flex items-center justify-between shadow-xs transition"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {item.name || item.ledgerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold truncate">
                      {item.group || item.accountGroup || "General"}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    {dAmt > 0 && (
                      <div className="text-xs font-black text-emerald-800">
                        ₹{dAmt.toLocaleString('en-IN')} <span className="text-[9px] font-bold text-emerald-600">Dr</span>
                      </div>
                    )}
                    {cAmt > 0 && (
                      <div className="text-xs font-black text-indigo-800">
                        ₹{cAmt.toLocaleString('en-IN')} <span className="text-[9px] font-bold text-indigo-600">Cr</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
