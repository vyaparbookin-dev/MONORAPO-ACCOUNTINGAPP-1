import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Home,
  Users,
  Plus,
  Trash2,
  Share2,
  RefreshCw,
  Calendar,
  Filter,
  PieChart,
  User,
  ShoppingBag,
  DollarSign,
  Heart,
  CheckCircle2,
  X
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";

const DEFAULT_MEMBERS = [
  "खुद (Self)",
  "पापा (Father)",
  "मम्मी (Mother)",
  "पत्नी (Wife)",
  "बच्चे (Kids)",
  "अन्य (Other)"
];

const FAMILY_CATEGORIES = [
  "राशन व किराना (Grocery)",
  "दूध, फल व सब्जी (Daily Needs)",
  "दवाई व डॉक्टर खर्च (Medical)",
  "स्कूल / कॉलेज फीस (Education)",
  "कपड़े व पर्सनल केयर (Shopping)",
  "बिजली, गैस व पानी बिल (Utilities)",
  "यात्रा व पेट्रोल (Travel/Fuel)",
  "मनोरंजन व बाहर खाना (Dining)",
  "💰 मासिक बचत व निवेश (FD / RD / SIP / Gold)",
  "अन्य घरेलू खर्च (Misc)"
];

export default function MobileFamilyExpenseModal({ isOpen, onClose, onOpenSavings }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  // Add Expense Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    familyMember: "खुद (Self)",
    customMember: "",
    category: "राशन व किराना (Grocery)",
    paymentMode: "CASH_DRAWER",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    const now = new Date();
    if (p === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (p === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (p === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const isDateInRange = (dateVal) => {
    if (!startDate && !endDate) return true;
    if (!dateVal) return true;
    const dStr = String(dateVal).split("T")[0];
    if (startDate && dStr < startDate) return false;
    if (endDate && dStr > endDate) return false;
    return true;
  };

  const isFamilyExpense = (e) => {
    const type = String(e.expenseType || e.type || "").toLowerCase();
    const cat = String(e.category || "").toLowerCase();
    const title = String(e.title || e.description || "").toLowerCase();
    const member = String(e.familyMember || "").trim();

    if (member) return true;
    if (type.includes("drawing") || type.includes("ghar") || type.includes("personal") || type.includes("family")) return true;
    if (cat.includes("ghar") || cat.includes("home") || cat.includes("family") || cat.includes("personal") || cat.includes("drawing") || cat.includes("राशन") || cat.includes("किराना") || cat.includes("दवाई") || cat.includes("दूध") || cat.includes("फीस")) return true;
    if (title.includes("ghar") || title.includes("घर") || title.includes("personal") || title.includes("राशन") || title.includes("मम्मी") || title.includes("पापा") || title.includes("बच्चे")) return true;
    return false;
  };

  const getMemberName = (e) => {
    if (e.familyMember && e.familyMember.trim()) return e.familyMember.trim();
    const desc = String(e.title || e.description || "").toLowerCase();
    if (desc.includes("पापा") || desc.includes("father") || desc.includes("papa")) return "पापा (Father)";
    if (desc.includes("मम्मी") || desc.includes("mother") || desc.includes("mummy") || desc.includes("maa")) return "मम्मी (Mother)";
    if (desc.includes("पत्नी") || desc.includes("wife")) return "पत्नी (Wife)";
    if (desc.includes("बच्चे") || desc.includes("kids") || desc.includes("child") || desc.includes("school")) return "बच्चे (Kids)";
    return "खुद (Self)";
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let serverExp = [];
      try {
        const res = await api.get("/api/expense");
        serverExp = res?.data?.expenses || res?.expenses || res?.data || [];
      } catch (err) {
        console.warn("Server expense load failed, fallback to local");
      }

      let localExp = [];
      try {
        if (typeof localStorage !== "undefined") {
          const stored = localStorage.getItem("vb_local_expenses") || localStorage.getItem("expenses");
          if (stored) localExp = JSON.parse(stored) || [];
        }
      } catch (e) {}

      const allMerged = deduplicateExpenses([
        ...(Array.isArray(serverExp) ? serverExp : []),
        ...(Array.isArray(localExp) ? localExp : [])
      ]);

      const familyList = allMerged
        .filter(isFamilyExpense)
        .filter((e) => isDateInRange(e.date || e.createdAt))
        .map(e => ({
          ...e,
          resolvedMember: getMemberName(e)
        }));

      setExpenses(familyList);
    } catch (err) {
      console.error("Error fetching family expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("कृपया मान्य राशि (Amount) दर्ज करें!");
      return;
    }

    const memberToSave = formData.familyMember === "अन्य (Other)" && formData.customMember.trim()
      ? formData.customMember.trim()
      : formData.familyMember;

    const newExp = {
      id: "exp_fam_" + Date.now(),
      _id: "exp_fam_" + Date.now(),
      title: `${memberToSave} - ${formData.category.split(" ")[0]}`,
      description: formData.description || `${memberToSave} के लिए पारिवारिक खर्च`,
      amount: Number(formData.amount),
      expenseType: "drawings",
      category: formData.category,
      familyMember: memberToSave,
      paymentMode: formData.paymentMode,
      date: formData.date || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      // 1. Try server POST
      try {
        await api.post("/api/expense", newExp);
      } catch (err) {
        console.warn("Server POST offline, saving locally:", err);
      }

      // 2. Save locally in localStorage
      let localList = [];
      try {
        const stored = localStorage.getItem("vb_local_expenses") || localStorage.getItem("expenses");
        if (stored) localList = JSON.parse(stored) || [];
      } catch (err) {}

      localList.unshift(newExp);
      localStorage.setItem("vb_local_expenses", JSON.stringify(localList));

      setIsAddOpen(false);
      setFormData({
        amount: "",
        familyMember: "खुद (Self)",
        customMember: "",
        category: "राशन व किराना (Grocery)",
        paymentMode: "CASH_DRAWER",
        description: "",
        date: new Date().toISOString().split("T")[0]
      });
      fetchExpenses();
    } catch (err) {
      alert("खर्च सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = (id) => {
    if (!confirm("क्या आप इस फैमिली खर्च को हटाना चाहते हैं?")) return;
    try {
      api.delete(`/api/expense/${id}`).catch(() => {});
      let localList = [];
      const stored = localStorage.getItem("vb_local_expenses") || localStorage.getItem("expenses");
      if (stored) localList = JSON.parse(stored) || [];
      const filtered = localList.filter((x) => (x.id || x._id) !== id);
      localStorage.setItem("vb_local_expenses", JSON.stringify(filtered));
      setExpenses((prev) => prev.filter((x) => (x.id || x._id) !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Filtered by selected member
  const displayedExpenses = selectedMember === "ALL"
    ? expenses
    : expenses.filter((e) => e.resolvedMember === selectedMember);

  const totalFamilySpent = displayedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const overallTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Group by member
  const memberBreakdown = {};
  expenses.forEach((e) => {
    const mem = e.resolvedMember || "खुद (Self)";
    if (!memberBreakdown[mem]) {
      memberBreakdown[mem] = { total: 0, count: 0 };
    }
    memberBreakdown[mem].total += Number(e.amount || 0);
    memberBreakdown[mem].count += 1;
  });

  const memberListKeys = Object.keys(memberBreakdown);

  // WhatsApp share
  const shareWhatsApp = () => {
    const coName = selectedCompany?.name || "मेरी दुकान";
    let msg = `🏡 *फैमिली घर खर्च रिपोर्ट (Family Expenses)*\n`;
    msg += `🏢 ${coName}\n`;
    msg += `📅 अवधि: ${startDate || "आरंभ"} से ${endDate || "आज"}\n`;
    msg += `----------------------------------\n`;
    msg += `💰 *कुल घर खर्च:* ₹${overallTotal.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `👥 *सदस्य अनुसार विवरण (Member-wise):*\n`;

    memberListKeys.forEach((mem) => {
      const info = memberBreakdown[mem];
      const pct = overallTotal > 0 ? ((info.total / overallTotal) * 100).toFixed(1) : 0;
      msg += `• *${mem}*: ₹${info.total.toLocaleString("en-IN")} (${pct}%, ${info.count} एंट्रियां)\n`;
    });

    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-rose-800 via-pink-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-black flex items-center gap-1.5 leading-tight">
              <span>🏡 फैमिली घर खर्च रिपोर्ट</span>
            </h2>
            <p className="text-[11px] text-rose-100/90 font-medium">
              परिवार के सदस्य अनुसार खर्च व ड्राइंग्स विवरण
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={shareWhatsApp}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
            title="WhatsApp Share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
          <button
            onClick={fetchExpenses}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            title="ताज़ा करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "today", label: "📅 आज" },
          { id: "month", label: "🗓️ इस महीने" },
          { id: "year", label: "📈 इस वर्ष" },
          { id: "all", label: "📊 कुल (All Time)" }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodChange(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              period === p.id
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Total Summary Banner */}
        <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
            <Heart size={140} />
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-rose-100">
              {selectedMember === "ALL" ? "कुल फैमिली खर्च (Total Drawings)" : `${selectedMember} का कुल खर्च`}
            </span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {displayedExpenses.length} खर्च दर्ज
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight">
            ₹{totalFamilySpent.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-rose-100 mt-2 flex items-center gap-1 font-medium">
            <span>ℹ️</span> यह खर्च दुकान के संचालन खर्च (Shop Expenses) से अलग है।
          </p>
        </div>

        {/* 💰 Quick Shortcut to Savings & Investments */}
        <div 
          onClick={() => {
            if (onOpenSavings) {
              onClose();
              onOpenSavings();
            } else if (typeof window !== "undefined" && window.__openMobileSavingsModal) {
              onClose();
              window.__openMobileSavingsModal();
            }
          }}
          className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 shadow-xs">
              💰
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-amber-950 block truncate">
                बचत व निवेश खाते (FD / RD / SIP / Gold)
              </span>
              <span className="text-[10px] text-amber-800 font-bold block truncate">
                दुकान गल्ले से बचत किस्त जमा करें • बिजनेस खर्चों से अलग
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-[11px] rounded-xl shadow-xs shrink-0 active:scale-95 transition">
            किस्त भरें →
          </span>
        </div>

        {/* Family Member Filter Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-rose-600" /> सदस्य अनुसार फिल्टर (Filter by Member)
            </h3>
            {memberListKeys.length > 0 && (
              <span className="text-[11px] text-slate-500 font-bold">
                {memberListKeys.length} सदस्य सक्रिय
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMember("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                selectedMember === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <span>सब सदस्य (All)</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                ₹{overallTotal.toLocaleString("en-IN")}
              </span>
            </button>
            {memberListKeys.map((mem) => {
              const info = memberBreakdown[mem];
              const isSel = selectedMember === mem;
              return (
                <button
                  key={mem}
                  onClick={() => setSelectedMember(mem)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                    isSel
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{mem}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSel ? "bg-white/20 text-white" : "bg-rose-50 text-rose-700"
                  }`}>
                    ₹{info.total.toLocaleString("en-IN")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Breakdown Cards (Grid) when ALL is selected */}
        {selectedMember === "ALL" && memberListKeys.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PieChart size={14} className="text-rose-600" /> पारिवारिक खर्च का बंटवारा
            </h4>
            <div className="space-y-2.5">
              {memberListKeys.map((mem) => {
                const info = memberBreakdown[mem];
                const pct = overallTotal > 0 ? ((info.total / overallTotal) * 100).toFixed(1) : 0;
                return (
                  <div key={mem} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User size={13} className="text-rose-500" /> {mem}
                      </span>
                      <span className="font-black text-slate-900">
                        ₹{info.total.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              लेनदेन सूची ({displayedExpenses.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-medium">खर्च लोड हो रहे हैं...</p>
            </div>
          ) : displayedExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Home size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">कोई फैमिली खर्च नहीं मिला</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                इस समयावधि में कोई पारिवारिक या घरेलू खर्च दर्ज नहीं किया गया है।
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Plus size={16} /> + नया फैमिली खर्च जोड़ें
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedExpenses.map((e) => {
                const id = e._id || e.id;
                const dStr = e.date ? String(e.date).split("T")[0] : "";
                return (
                  <div
                    key={id}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-black text-sm">
                        <ShoppingBag size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {e.title || "घर खर्च"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold shrink-0">
                            {e.resolvedMember}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {e.category || "पारिवारिक खर्च"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          📅 {dStr || "आज"} • 💳 {e.paymentMode === "CASH_DRAWER" ? "दुकान गल्ला (Cash)" : "बैंक/अन्य"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">
                          ₹{Number(e.amount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteExpense(id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Expense Button */}
      <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-40">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> + नया फैमिली खर्च जोड़ें (Add Expense)
        </button>
      </div>

      {/* Add Family Expense Drawer / Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Home size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">नया फैमिली खर्च जोड़ें</h3>
                  <p className="text-[11px] text-slate-500">घर / परिवार के सदस्य का खर्च</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  रकम (Amount ₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="₹ 0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full text-lg font-black px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50"
                />
              </div>

              {/* Family Member Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  परिवार का सदस्य (Family Member) *
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {DEFAULT_MEMBERS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setFormData({ ...formData, familyMember: m })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate cursor-pointer ${
                        formData.familyMember === m
                          ? "bg-rose-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 active:bg-slate-200"
                      }`}
                    >
                      {m.split(" ")[0]}
                    </button>
                  ))}
                </div>
                {formData.familyMember === "अन्य (Other)" && (
                  <input
                    type="text"
                    placeholder="सदस्य का नाम लिखें (जैसे: चाचा, दादी, आदि)"
                    value={formData.customMember}
                    onChange={(e) => setFormData({ ...formData, customMember: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 mt-1"
                  />
                )}
              </div>

              {/* Expense Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  खर्च की श्रेणी (Category)
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  {FAMILY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  भुगतान का स्रोत (Payment Source)
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="CASH_DRAWER">🏪 दुकान गल्ले से नकद (Shop Cash Drawer)</option>
                  <option value="BANK_UPI">📱 बैंक / UPI ऑनलाइन ट्रांसफर</option>
                  <option value="PERSONAL_WALLET">👛 पर्सनल वॉलेट / जेब खर्च</option>
                </select>
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">विवरण (Note)</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक टिप्पणी"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 active:bg-rose-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? "सहेज रहे हैं..." : "💾 खर्च सहेजें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
