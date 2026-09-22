import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  PiggyBank,
  Plus,
  Trash2,
  Share2,
  RefreshCw,
  Calendar,
  Layers,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  X,
  CreditCard,
  Edit2,
  Clock,
  ShieldCheck,
  Award
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

const SAVING_TYPES = [
  { id: "FD", label: "Fixed Deposit (FD)", icon: "🏦", desc: "फिक्स्ड डिपॉजिट - एकमुश्त जमा" },
  { id: "RD", label: "Recurring Deposit (RD)", icon: "🗓️", desc: "रिकरिंग डिपॉजिट - मासिक बचत" },
  { id: "SIP", label: "SIP / Mutual Fund", icon: "📈", desc: "एसआईपी / म्यूचुअल फंड" },
  { id: "PPF", label: "PPF / Post Office", icon: "🏛️", desc: "पब्लिक प्रॉविडेंट फंड / डाकघर" },
  { id: "LIC", label: "LIC / Insurance Policy", icon: "🛡️", desc: "एलआईसी / जीवन बीमा प्रीमियम" },
  { id: "GOLD", label: "Gold / SGB / Digital Gold", icon: "🪙", desc: "सोना / गोल्ड बॉन्ड" },
  { id: "OTHER", label: "अन्य बचत (Other Savings)", icon: "💰", desc: "अन्य निजी या व्यापारिक निवेश" }
];

export default function MobileSavingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [savingsList, setSavingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, personal, business

  // Add / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const calculateMaturity = (startStr, years) => {
    try {
      if (!startStr) return "";
      const d = new Date(startStr);
      if (isNaN(d.getTime())) return "";
      const y = Number(years) || 1;
      d.setFullYear(d.getFullYear() + y);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    savingsType: "RD",
    institutionName: "",
    accountNumber: "",
    classification: "personal",
    fundSource: "business_salary",
    frequency: "monthly",
    installmentAmount: "",
    initialDeposit: "",
    interestRate: "",
    startDate: new Date().toISOString().split("T")[0],
    tenureYears: "1",
    isOldOngoingAccount: false,
    alreadyDepositedAmount: "",
    alreadyPaidCount: "",
    maturityDate: "",
    dueDayOfMonth: "5",
    expectedMaturityAmount: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  // Installment Pay Modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedSavingForPay, setSelectedSavingForPay] = useState(null);
  const [payData, setPayData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    sourceOfFund: "business_salary",
    notes: ""
  });
  const [paying, setPaying] = useState(false);

  // History Drawer Modal
  const [viewHistoryItem, setViewHistoryItem] = useState(null);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      let serverData = [];
      try {
        const res = await api.get("/api/savings");
        serverData = res?.data?.savings || res?.savings || res?.data || [];
      } catch (err) {
        console.warn("Server savings fetch fallback:", err);
      }

      let localData = [];
      try {
        if (typeof localStorage !== "undefined") {
          const stored = localStorage.getItem("vb_local_savings");
          if (stored) localData = JSON.parse(stored) || [];
        }
      } catch (e) {}

      // Merge by _id or id
      const map = new Map();
      (Array.isArray(localData) ? localData : []).forEach(item => {
        const id = item._id || item.id;
        if (id) map.set(id, item);
      });
      (Array.isArray(serverData) ? serverData : []).forEach(item => {
        const id = item._id || item.id;
        if (id && !map.has(id)) map.set(id, item);
      });

      const list = Array.from(map.values());
      setSavingsList(list);
    } catch (err) {
      console.error("Error loading savings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("कृपया स्कीम या बचत का नाम दर्ज करें!");
      return;
    }

    const isOld = Boolean(formData.isOldOngoingAccount);
    const pastAmt = Number(formData.alreadyDepositedAmount || 0);
    const instAmt = Number(formData.installmentAmount || 0);
    const initDeposit = Number(formData.initialDeposit || 0);

    const computedTotal = isOld && pastAmt > 0 ? pastAmt : (initDeposit > 0 ? initDeposit : (formData.savingsType === "FD" ? initDeposit : instAmt));

    const payload = {
      ...formData,
      tenureYears: Number(formData.tenureYears || 1),
      installmentAmount: instAmt,
      initialDeposit: initDeposit,
      alreadyDepositedAmount: pastAmt,
      totalDeposited: computedTotal,
      currentValue: computedTotal,
      interestRate: Number(formData.interestRate || 0),
      dueDayOfMonth: Number(formData.dueDayOfMonth || 5),
      expectedMaturityAmount: Number(formData.expectedMaturityAmount || 0),
      maturityDate: formData.maturityDate || calculateMaturity(formData.startDate, formData.tenureYears),
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      if (editingId) {
        // Update
        try {
          await api.put(`/api/savings/${editingId}`, payload);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
        local = local.map(x => ((x._id || x.id) === editingId ? { ...x, ...payload } : x));
        localStorage.setItem("vb_local_savings", JSON.stringify(local));
      } else {
        // Create
        const newId = "sav_" + Date.now();
        const newRecord = {
          ...payload,
          _id: newId,
          id: newId,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
          installments: isOld && pastAmt > 0 ? [{
            amount: pastAmt,
            date: payload.startDate || new Date().toISOString().split("T")[0],
            sourceOfFund: payload.fundSource,
            notes: `पूर्व संचित बचत (${formData.alreadyPaidCount ? `${formData.alreadyPaidCount} किस्तें` : 'पुराना चालू खाता'})`
          }] : initDeposit > 0 ? [{
            amount: initDeposit,
            date: payload.startDate || new Date().toISOString().split("T")[0],
            sourceOfFund: payload.fundSource,
            notes: "Initial Deposit / खाता शुरुआत राशि"
          }] : []
        };

        try {
          await api.post("/api/savings", newRecord);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
        local.unshift(newRecord);
        localStorage.setItem("vb_local_savings", JSON.stringify(local));
      }

      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
      fetchSavings();
    } catch (err) {
      alert("सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id || item.id);
    const sDate = item.startDate ? String(item.startDate).split("T")[0] : new Date().toISOString().split("T")[0];
    const tYrs = String(item.tenureYears || "1");
    setFormData({
      title: item.title || "",
      savingsType: item.savingsType || "RD",
      institutionName: item.institutionName || "",
      accountNumber: item.accountNumber || "",
      classification: item.classification || "personal",
      fundSource: item.fundSource || "business_salary",
      frequency: item.frequency || "monthly",
      installmentAmount: String(item.installmentAmount || ""),
      initialDeposit: String(item.initialDeposit || ""),
      interestRate: String(item.interestRate || ""),
      startDate: sDate,
      tenureYears: tYrs,
      isOldOngoingAccount: Boolean(item.isOldOngoingAccount || (Number(item.alreadyDepositedAmount || 0) > 0)),
      alreadyDepositedAmount: String(item.alreadyDepositedAmount || item.totalDeposited || ""),
      alreadyPaidCount: String(item.alreadyPaidCount || ""),
      maturityDate: item.maturityDate ? String(item.maturityDate).split("T")[0] : calculateMaturity(sDate, tYrs),
      dueDayOfMonth: String(item.dueDayOfMonth || "5"),
      expectedMaturityAmount: String(item.expectedMaturityAmount || ""),
      notes: item.notes || ""
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      title: "",
      savingsType: "RD",
      institutionName: "",
      accountNumber: "",
      classification: "personal",
      fundSource: "business_salary",
      frequency: "monthly",
      installmentAmount: "",
      initialDeposit: "",
      interestRate: "",
      startDate: today,
      tenureYears: "1",
      isOldOngoingAccount: false,
      alreadyDepositedAmount: "",
      alreadyPaidCount: "",
      maturityDate: calculateMaturity(today, 1),
      dueDayOfMonth: "5",
      expectedMaturityAmount: "",
      notes: ""
    });
  };

  const handleDelete = (id) => {
    if (!confirm("क्या आप इस बचत / निवेश खाते को हटाना चाहते हैं?")) return;
    try {
      api.delete(`/api/savings/${id}`).catch(() => {});
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.filter(x => (x._id || x.id) !== id);
      localStorage.setItem("vb_local_savings", JSON.stringify(local));
      setSavingsList(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPay = (item) => {
    setSelectedSavingForPay(item);
    setPayData({
      amount: String(item.installmentAmount || ""),
      date: new Date().toISOString().split("T")[0],
      sourceOfFund: item.fundSource || "business_salary",
      notes: `${item.title} किस्त भुगतान`
    });
    setIsPayOpen(true);
  };

  const handleRecordInstallment = async (e) => {
    e.preventDefault();
    if (!payData.amount || Number(payData.amount) <= 0) {
      alert("कृपया सही किस्त राशि दर्ज करें!");
      return;
    }
    const item = selectedSavingForPay;
    if (!item) return;

    setPaying(true);
    const id = item._id || item.id;
    const instAmt = Number(payData.amount);

    const newInst = {
      amount: instAmt,
      date: payData.date,
      sourceOfFund: payData.sourceOfFund,
      notes: payData.notes || "किस्त जमा",
      paidAt: new Date().toISOString()
    };

    try {
      // If paid from business_salary, record a drawing/salary expense automatically!
      if (payData.sourceOfFund === "business_salary") {
        const autoExp = {
          id: "exp_sav_" + Date.now(),
          _id: "exp_sav_" + Date.now(),
          title: `बचत किस्त (Salary Drawing) - ${item.title}`,
          description: `दुकान से सैलरी/ड्राइंग्स के रूप में बचत किस्त: ${item.title}`,
          amount: instAmt,
          expenseType: "drawings",
          category: "मासिक बचत व निवेश (RD/SIP/FD)",
          familyMember: "खुद (Self)",
          paymentMode: "CASH_DRAWER",
          date: payData.date,
          createdAt: new Date().toISOString()
        };
        try {
          await api.post("/api/expense", autoExp);
        } catch (err) {}
        let localExp = JSON.parse(localStorage.getItem("vb_local_expenses") || "[]");
        localExp.unshift(autoExp);
        localStorage.setItem("vb_local_expenses", JSON.stringify(localExp));
      }

      // Try server API
      try {
        await api.post(`/api/savings/${id}/installment`, newInst);
      } catch (err) {}

      // Update local storage
      let local = JSON.parse(localStorage.getItem("vb_local_savings") || "[]");
      local = local.map(s => {
        if ((s._id || s.id) === id) {
          const instList = Array.isArray(s.installments) ? [...s.installments] : [];
          instList.push(newInst);
          const newTotal = Number(s.totalDeposited || 0) + instAmt;
          return {
            ...s,
            installments: instList,
            totalDeposited: newTotal,
            currentValue: Number(s.currentValue || 0) + instAmt,
            lastPaidDate: payData.date
          };
        }
        return s;
      });
      localStorage.setItem("vb_local_savings", JSON.stringify(local));

      setIsPayOpen(false);
      setSelectedSavingForPay(null);
      fetchSavings();
    } catch (err) {
      alert("किस्त जोड़ने में त्रुटि: " + (err.message || err));
    } finally {
      setPaying(false);
    }
  };

  const filteredList = savingsList.filter(item => {
    if (activeFilter === "ALL") return true;
    return (item.classification || "personal") === activeFilter;
  });

  const totalInvestedAll = savingsList.reduce((s, x) => s + Number(x.totalDeposited || x.currentValue || x.initialDeposit || 0), 0);
  const totalMonthlyCommitment = savingsList
    .filter(x => x.frequency === "monthly" && x.status !== "CLOSED")
    .reduce((s, x) => s + Number(x.installmentAmount || 0), 0);
  const totalMaturityForecast = savingsList.reduce((s, x) => s + Number(x.expectedMaturityAmount || x.totalDeposited || 0), 0);

  const shareWhatsApp = () => {
    const coName = selectedCompany?.name || "मेरी दुकान";
    let msg = `💰 *बचत व निवेश खाता रिपोर्ट (Savings & Investment)*\n`;
    msg += `🏢 ${coName}\n`;
    msg += `----------------------------------\n`;
    msg += `💎 *कुल जमा बचत (Total Invested):* ₹${totalInvestedAll.toLocaleString("en-IN")}\n`;
    msg += `🗓️ *मासिक बचत कमिटमेंट (Monthly RD/SIP):* ₹${totalMonthlyCommitment.toLocaleString("en-IN")}/माह\n`;
    if (totalMaturityForecast > 0) {
      msg += `📈 *अपेक्षित परिपक्वता राशि (Maturity Value):* ₹${totalMaturityForecast.toLocaleString("en-IN")}\n`;
    }
    msg += `----------------------------------\n`;
    msg += `📑 *खातों का विवरण:*\n`;

    savingsList.forEach((s, idx) => {
      const typeObj = SAVING_TYPES.find(t => t.id === s.savingsType) || { label: s.savingsType, icon: "💰" };
      const fundSrcTxt = s.fundSource === "business_salary" ? "दुकान से सैलरी" : (s.fundSource === "business_capital" ? "बिजनेस कैपिटल" : "पर्सनल फंड");
      msg += `${idx + 1}. ${typeObj.icon} *${s.title}* (${s.classification === "business" ? "बिजनेस" : "पर्सनल"})\n`;
      msg += `   • जमा: ₹${Number(s.totalDeposited || 0).toLocaleString("en-IN")} | स्रोत: ${fundSrcTxt}\n`;
      if (s.installmentAmount > 0) msg += `   • किस्त: ₹${Number(s.installmentAmount).toLocaleString("en-IN")} (हर माह ${s.dueDayOfMonth || 5} तारीख)\n`;
    });

    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-black flex items-center gap-1.5 leading-tight">
              <span>💰 बचत व निवेश (FD / RD / SIP)</span>
            </h2>
            <p className="text-[11px] text-amber-100/90 font-medium">
              पर्सनल व बिजनेस बचत, बीमा व मासिक निवेश
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
            onClick={fetchSavings}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            title="ताज़ा करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "ALL", label: `📊 सभी खाते (${savingsList.length})` },
          { id: "personal", label: "👤 पर्सनल बचत (Personal)" },
          { id: "business", label: "🏢 बिजनेस बचत (Business)" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              activeFilter === tab.id
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Total Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-2xl p-3.5 shadow-md col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-100">कुल जमा पूंजी (Total Invested)</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {savingsList.length} खाते सक्रिय
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              ₹{totalInvestedAll.toLocaleString("en-IN")}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-amber-100 font-medium">
              <span>🗓️ मासिक कमिटमेंट: ₹{totalMonthlyCommitment.toLocaleString("en-IN")}/माह</span>
            </div>
          </div>
        </div>

        {/* Savings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              खाता सूची ({filteredList.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
              <p className="text-xs font-medium">बचत खाते लोड हो रहे हैं...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <PiggyBank size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">कोई बचत खाता नहीं मिला</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                यहाँ अपनी FD, RD, SIP, PPF या LIC पॉलिसी जोड़ें और नियमित किस्तों का हिसाब रखें।
              </p>
              <button
                onClick={() => { resetForm(); setIsFormOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Plus size={16} /> + नया बचत खाता जोड़ें
              </button>
            </div>
          ) : (
            filteredList.map(item => {
              const id = item._id || item.id;
              const typeObj = SAVING_TYPES.find(t => t.id === item.savingsType) || { label: item.savingsType, icon: "💰" };
              const installmentsCount = (item.installments || []).length;
              const fundSrcLabel = item.fundSource === "business_salary"
                ? "🏪 दुकान से सैलरी"
                : item.fundSource === "business_capital"
                ? "🏢 बिजनेस कैपिटल"
                : "👛 पर्सनल फंड्स";

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                        {typeObj.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                            item.classification === "business"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {item.classification === "business" ? "बिजनेस" : "पर्सनल"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.institutionName ? `${item.institutionName} • ` : ""}{typeObj.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>स्रोत: {fundSrcLabel}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">कुल जमा</span>
                      <div className="text-sm font-black text-slate-900">
                        ₹{Number(item.totalDeposited || item.currentValue || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center text-[10px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">किस्त / आवृत्ति</span>
                      <span className="font-bold text-slate-800">
                        {item.installmentAmount > 0 ? `₹${Number(item.installmentAmount).toLocaleString("en-IN")}` : "एकमुश्त"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">देय तारीख</span>
                      <span className="font-bold text-slate-800">
                        {item.dueDayOfMonth ? `हर माह ${item.dueDayOfMonth}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ब्याज दर</span>
                      <span className="font-bold text-emerald-600">
                        {item.interestRate ? `${item.interestRate}% p.a.` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenPay(item)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> + किस्त जमा करें
                    </button>
                    {installmentsCount > 0 && (
                      <button
                        onClick={() => setViewHistoryItem(item)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="किस्त इतिहास"
                      >
                        <Clock size={14} /> ({installmentsCount})
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="संपादित करें"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Button - HIDE when modal is active */}
      {!isFormOpen && !isPayOpen && !viewHistoryItem && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-40">
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={18} /> + नया बचत / निवेश खाता जोड़ें
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingId ? "बचत खाता संपादित करें" : "नया बचत व निवेश खाता"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">FD / RD / SIP / PPF / LIC / Gold विवरण</p>
                </div>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Type Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बचत का प्रकार *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAVING_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFormData({ ...formData, savingsType: t.id })}
                      className={`p-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        formData.savingsType === t.id
                          ? "bg-amber-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 active:bg-slate-200"
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="text-[10px] truncate">{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Bank */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">स्कीम / खाते का नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. SBI 5 Year FD, HDFC RD, Nippon SIP"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Start Date & Tenure (अवधि व शुरुआत तारीख) */}
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <Calendar size={13} className="text-amber-700" />
                    <span>खाता शुरुआत तारीख (Start Date) *</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold">शुरू होने का दिन</span>
                </div>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      startDate: newDate,
                      maturityDate: calculateMaturity(newDate, prev.tenureYears)
                    }));
                  }}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-amber-300/70 bg-white text-slate-800 outline-none"
                />

                {/* Tenure in Years */}
                <div className="pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-amber-950">अवधि / कितने साल के लिए है (Tenure):</label>
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {formData.tenureYears} साल (Years)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
                    {["1", "2", "3", "5", "10"].map(yr => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tenureYears: yr,
                            maturityDate: calculateMaturity(prev.startDate, yr)
                          }));
                        }}
                        className={`py-1.5 rounded-lg border text-center transition cursor-pointer ${
                          formData.tenureYears === yr
                            ? "bg-amber-700 text-white border-amber-700 font-black shadow-xs"
                            : "bg-white border-amber-200 text-amber-900"
                        }`}
                      >
                        {yr} वर्ष
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculated Maturity Date */}
                {formData.maturityDate && (
                  <div className="text-[11px] text-amber-900 font-bold flex items-center justify-between pt-1 border-t border-amber-200/50">
                    <span>🗓️ परिपक्वता तिथि (Maturity Date):</span>
                    <span className="font-black text-amber-950 underline">
                      {new Date(formData.maturityDate).toLocaleDateString("hi-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* 🟢 TOGGLE: OLD / EXISTING ONGOING ACCOUNT (पुराना चालू खाता) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      📁 क्या यह खाता पहले से चल रहा है? (पुराना डेटा)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      पहले से जमा राशि व पिछली किस्तों को जोड़ने हेतु
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isOldOngoingAccount: !prev.isOldOngoingAccount }))}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.isOldOngoingAccount ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform transform ${
                        formData.isOldOngoingAccount ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {formData.isOldOngoingAccount && (
                  <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          अब तक कुल कितना जमा हुआ? (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="उदा. 45000"
                          value={formData.alreadyDepositedAmount}
                          onChange={e => setFormData({ ...formData, alreadyDepositedAmount: e.target.value })}
                          className="w-full text-xs font-black p-2 rounded-xl border border-emerald-300 bg-white text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          कितनी किस्तें जमा हो चुकी हैं?
                        </label>
                        <input
                          type="number"
                          placeholder="उदा. 9 किस्तें"
                          value={formData.alreadyPaidCount}
                          onChange={e => setFormData({ ...formData, alreadyPaidCount: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      ✅ यह पिछली जमा राशि सीधे आपके कुल निवेश पोर्टफोलियो में जुड़ जाएगी।
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक / संस्था का नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. SBI, LIC, Groww"
                    value={formData.institutionName}
                    onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अकाउंट / पॉलिसी नं.</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Classification & Source of Funds */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">खाते का उद्देश्य</label>
                  <select
                    value={formData.classification}
                    onChange={e => setFormData({ ...formData, classification: e.target.value })}
                    className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="personal">👤 पर्सनल बचत (Personal)</option>
                    <option value="business">🏢 बिजनेस बचत (Business)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रकम का स्रोत</label>
                  <select
                    value={formData.fundSource}
                    onChange={e => setFormData({ ...formData, fundSource: e.target.value })}
                    className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="business_salary">🏪 दुकान गल्ले से (Cash Drawer)</option>
                    <option value="business_capital">🏢 बिजनेस कैपिटल</option>
                    <option value="personal_funds">👛 पर्सनल फंड्स</option>
                  </select>
                </div>
              </div>

              {/* Amounts & Due Day */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.savingsType === "FD" ? "मूलधन जमा (Principal ₹)" : "मासिक किस्त (Installment ₹)"}
                  </label>
                  <input
                    type="number"
                    placeholder="₹ 0.00"
                    value={formData.installmentAmount || formData.initialDeposit}
                    onChange={e => setFormData({
                      ...formData,
                      installmentAmount: e.target.value,
                      initialDeposit: e.target.value
                    })}
                    className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">किस्त देय तारीख (Due Day)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="जैसे: 5 या 10"
                    value={formData.dueDayOfMonth}
                    onChange={e => setFormData({ ...formData, dueDayOfMonth: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Interest & Maturity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ब्याज दर (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="उदा. 7.5"
                    value={formData.interestRate}
                    onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">परिपक्वता राशि (₹)</label>
                  <input
                    type="number"
                    placeholder="अपेक्षित रिटर्न"
                    value={formData.expectedMaturityAmount}
                    onChange={e => setFormData({ ...formData, expectedMaturityAmount: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* STICKY BOTTOM ACTION FOOTER */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-3 border-t border-slate-200 mt-4 flex items-center gap-2 -mx-4 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-30">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black cursor-pointer hover:bg-slate-50 transition"
                >
                  ✕ रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 active:scale-95 text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  {saving ? "⏳ सहेज रहे हैं..." : "💾 खाता सहेजें (Save Account)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Installment Modal */}
      {isPayOpen && selectedSavingForPay && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">किस्त जमा करें (Pay Installment)</h3>
                  <p className="text-[11px] text-slate-500">{selectedSavingForPay.title}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsPayOpen(false); setSelectedSavingForPay(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordInstallment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">जमा राशि (Amount ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="₹ 0.00"
                  value={payData.amount}
                  onChange={e => setPayData({ ...payData, amount: e.target.value })}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रकम का स्रोत (Fund Source) *</label>
                <select
                  value={payData.sourceOfFund}
                  onChange={e => setPayData({ ...payData, sourceOfFund: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="business_salary">🏪 दुकान से सैलरी के रूप में (Salary / Drawing)</option>
                  <option value="business_capital">🏢 बिजनेस कैपिटल से</option>
                  <option value="personal_funds">👛 पर्सनल बैंक / सेविंग्स से</option>
                </select>
                {payData.sourceOfFund === "business_salary" && (
                  <p className="text-[10px] text-emerald-700 mt-1 font-medium bg-emerald-50 p-2 rounded-lg">
                    ✨ दुकान से सैलरी चुनने पर यह राशि अपने आप पर्सनल ड्राइंग्स/सैलरी खर्च में भी दर्ज हो जाएगी।
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जमा तारीख</label>
                  <input
                    type="date"
                    value={payData.date}
                    onChange={e => setPayData({ ...payData, date: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">नोट / टिप्पणी</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक"
                    value={payData.notes}
                    onChange={e => setPayData({ ...payData, notes: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsPayOpen(false); setSelectedSavingForPay(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {paying ? "जमा हो रहा है..." : "✅ किस्त जमा करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {viewHistoryItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">किस्त जमा इतिहास (History)</h3>
                  <p className="text-[11px] text-slate-500">{viewHistoryItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryItem(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {(viewHistoryItem.installments || []).map((inst, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">
                      📅 {inst.date ? String(inst.date).split("T")[0] : "—"}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {inst.sourceOfFund === "business_salary" ? "🏪 दुकान सैलरी" : "👛 पर्सनल"} • {inst.notes || "किस्त"}
                    </p>
                  </div>
                  <div className="text-right font-black text-emerald-600 text-sm">
                    + ₹{Number(inst.amount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
