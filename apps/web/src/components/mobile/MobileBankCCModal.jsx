import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Plus,
  Trash2,
  Share2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  X,
  CreditCard,
  Edit2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  ShieldAlert,
  Wallet
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

const ACCOUNT_TYPES = [
  { id: "CURRENT", label: "करंट अकाउंट (Current A/C)", icon: "🏛️", desc: "बिजनेस का मुख्य चालू खाता" },
  { id: "PERSONAL_BUSINESS", label: "पर्सनल बैंक खाता (Business Use)", icon: "👤", desc: "निजी खाता जो बिजनेस लेन-देन के लिए उपयोग होता है" },
  { id: "CC_OVERDRAFT", label: "Cash Credit (CC) / OD Limit", icon: "💳", desc: "कैश क्रेडिट व ओवरड्राफ्ट लिमिट खाता" },
  { id: "SAVINGS", label: "Savings Account (बचत खाता)", icon: "🏦", desc: "बैंक बचत खाता" }
];

export default function MobileBankCCModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, CURRENT, PERSONAL_BUSINESS, CC_OVERDRAFT

  // Add / Edit Account Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "CURRENT",
    sanctionedLimit: "",
    currentOutstanding: "",
    openingBalance: "",
    interestRate: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  // Transaction Modal (Deposit, Withdraw, Interest Debit)
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [selectedAccForTx, setSelectedAccForTx] = useState(null);
  const [txData, setTxData] = useState({
    type: "DEPOSIT", // DEPOSIT, WITHDRAWAL, INTEREST_DEBIT, BANK_CHARGES
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    referenceNo: ""
  });
  const [processingTx, setProcessingTx] = useState(false);

  // Monthly Interest Modal (Auto Calculate vs Manual Original Entry)
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [selectedAccForInterest, setSelectedAccForInterest] = useState(null);
  const [interestData, setInterestData] = useState({
    month: new Date().toISOString().slice(0, 7),
    monthName: "",
    calculatedInterest: 0,
    actualInterest: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    postToExpenses: true
  });
  const [savingInterest, setSavingInterest] = useState(false);

  // History Modal
  const [historyAcc, setHistoryAcc] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      let serverData = [];
      try {
        const res = await api.get("/api/bank-accounts");
        serverData = res?.data?.accounts || res?.accounts || res?.data || [];
      } catch (err) {
        console.warn("Server bank accounts fetch fallback:", err);
      }

      let localData = [];
      try {
        if (typeof localStorage !== "undefined") {
          const stored = localStorage.getItem("vb_local_bank_accounts");
          if (stored) localData = JSON.parse(stored) || [];
        }
      } catch (e) {}

      // Merge
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
      setAccounts(list);
    } catch (err) {
      console.error("Error loading bank accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!formData.bankName.trim() && !formData.accountName.trim()) {
      alert("कृपया बैंक या खाते का नाम दर्ज करें!");
      return;
    }

    const payload = {
      ...formData,
      accountName: formData.accountName || formData.bankName,
      sanctionedLimit: Number(formData.sanctionedLimit || 0),
      currentOutstanding: Number(formData.currentOutstanding || 0),
      openingBalance: Number(formData.openingBalance || 0),
      currentBalance: formData.accountType === "CC_OVERDRAFT"
        ? (Number(formData.sanctionedLimit || 0) - Number(formData.currentOutstanding || 0))
        : Number(formData.openingBalance || 0),
      interestRate: Number(formData.interestRate || 0),
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      if (editingId) {
        try {
          await api.put(`/api/bank-accounts/${editingId}`, payload);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
        local = local.map(x => ((x._id || x.id) === editingId ? { ...x, ...payload } : x));
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      } else {
        const newId = "bnk_" + Date.now();
        const newRecord = {
          ...payload,
          _id: newId,
          id: newId,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
          transactions: []
        };

        try {
          await api.post("/api/bank-accounts", newRecord);
        } catch (e) {}

        let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
        local.unshift(newRecord);
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      }

      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
      fetchAccounts();
    } catch (err) {
      alert("सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountType: "CURRENT",
      sanctionedLimit: "",
      currentOutstanding: "",
      openingBalance: "",
      interestRate: "",
      notes: ""
    });
  };

  const calculateAutoMonthlyInterest = (acc) => {
    if (!acc) return 0;
    const rate = Number(acc.interestRate || 0);
    if (rate <= 0) return 0;
    let baseAmt = 0;
    if (acc.accountType === "CC_OVERDRAFT") {
      baseAmt = Number(acc.currentOutstanding || 0);
    } else {
      baseAmt = Number(acc.balance || acc.currentBalance || 0);
    }
    if (baseAmt <= 0) return 0;
    return Math.round((baseAmt * rate) / 1200);
  };

  const getMonthNameHindi = (monthKey) => {
    if (!monthKey) return "";
    const [y, m] = monthKey.split("-");
    const months = [
      "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
      "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
    ];
    const idx = parseInt(m, 10) - 1;
    return `${months[idx] || m} ${y}`;
  };

  const handleOpenMonthlyInterest = (acc) => {
    setSelectedAccForInterest(acc);
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTitle = getMonthNameHindi(currentMonthKey);
    const autoEst = calculateAutoMonthlyInterest(acc);

    const existingEntry = (acc.monthlyInterests || []).find(m => m.month === currentMonthKey);

    setInterestData({
      month: currentMonthKey,
      monthName: monthTitle,
      calculatedInterest: autoEst,
      actualInterest: existingEntry ? String(existingEntry.actualInterest || "") : (autoEst > 0 ? String(autoEst) : ""),
      date: existingEntry && existingEntry.date ? String(existingEntry.date).split("T")[0] : now.toISOString().split("T")[0],
      note: existingEntry ? (existingEntry.note || "") : `${monthTitle} बैंक ब्याज डेबिट (${acc.bankName || acc.accountName})`,
      postToExpenses: true
    });
    setIsInterestOpen(true);
  };

  const handleMonthSelectForInterest = (mKey) => {
    if (!selectedAccForInterest) return;
    const monthTitle = getMonthNameHindi(mKey);
    const autoEst = calculateAutoMonthlyInterest(selectedAccForInterest);
    const existingEntry = (selectedAccForInterest.monthlyInterests || []).find(m => m.month === mKey);

    setInterestData(prev => ({
      ...prev,
      month: mKey,
      monthName: monthTitle,
      calculatedInterest: autoEst,
      actualInterest: existingEntry ? String(existingEntry.actualInterest || "") : (autoEst > 0 ? String(autoEst) : ""),
      date: existingEntry && existingEntry.date ? String(existingEntry.date).split("T")[0] : `${mKey}-28`,
      note: existingEntry ? (existingEntry.note || "") : `${monthTitle} बैंक ब्याज डेबिट (${selectedAccForInterest.bankName || selectedAccForInterest.accountName})`
    }));
  };

  const handleSaveMonthlyInterest = async (e) => {
    e.preventDefault();
    if (!selectedAccForInterest) return;
    const actualAmt = Number(interestData.actualInterest);
    if (isNaN(actualAmt) || actualAmt < 0) {
      alert("कृपया मान्य ब्याज राशि (₹) दर्ज करें!");
      return;
    }

    setSavingInterest(true);
    const acc = selectedAccForInterest;
    const id = acc._id || acc.id;

    const payload = {
      month: interestData.month,
      monthName: interestData.monthName || getMonthNameHindi(interestData.month),
      calculatedInterest: Number(interestData.calculatedInterest || 0),
      actualInterest: actualAmt,
      date: interestData.date,
      note: interestData.note,
      postToExpenses: interestData.postToExpenses
    };

    try {
      // 1. Try server API
      try {
        await api.post(`/api/bank-accounts/${id}/interest`, payload);
      } catch (err) {
        console.warn("Backend interest endpoint err, saving locally:", err);
      }

      // 2. Post to shop expenses if checked
      if (interestData.postToExpenses && actualAmt > 0) {
        const autoExp = {
          id: "exp_bank_int_" + Date.now(),
          _id: "exp_bank_int_" + Date.now(),
          title: `बैंक ब्याज (${payload.monthName}) - ${acc.bankName || acc.accountName}`,
          description: interestData.note || `मासिक बैंक ब्याज डेबिट: ${acc.bankName}`,
          amount: actualAmt,
          expenseType: "business",
          category: "बैंक ब्याज व शुल्क (Bank Interest & Charges)",
          paymentMode: "BANK_ACCOUNT",
          date: interestData.date,
          createdAt: new Date().toISOString()
        };
        try {
          await api.post("/api/expense", autoExp);
        } catch (err) {}
        let localExp = JSON.parse(localStorage.getItem("vb_local_expenses") || "[]");
        localExp.unshift(autoExp);
        localStorage.setItem("vb_local_expenses", JSON.stringify(localExp));
      }

      // 3. Update localStorage
      let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
      local = local.map(a => {
        if ((a._id || a.id) === id) {
          const miList = Array.isArray(a.monthlyInterests) ? [...a.monthlyInterests] : [];
          const existingIdx = miList.findIndex(m => m.month === payload.month);
          if (existingIdx >= 0) {
            miList[existingIdx] = payload;
          } else {
            miList.unshift(payload);
          }

          const newTx = {
            id: "tx_int_" + Date.now(),
            type: "INTEREST_DEBIT",
            amount: actualAmt,
            date: interestData.date,
            description: `मासिक ब्याज: ${payload.monthName} (असली ब्याज)`,
            referenceNo: `INT-${payload.month}`,
            createdAt: new Date().toISOString()
          };
          const txList = Array.isArray(a.transactions) ? [newTx, ...a.transactions] : [newTx];

          let updatedOutstanding = Number(a.currentOutstanding || 0);
          let updatedBalance = Number(a.balance || a.currentBalance || 0);
          if (a.accountType === "CC_OVERDRAFT") {
            updatedOutstanding += actualAmt;
          } else {
            updatedBalance -= actualAmt;
          }

          return {
            ...a,
            monthlyInterests: miList,
            transactions: txList,
            currentOutstanding: updatedOutstanding,
            balance: updatedBalance,
            currentBalance: updatedBalance
          };
        }
        return a;
      });
      localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));

      alert(`✅ ${payload.monthName} का ब्याज ₹${actualAmt.toLocaleString("en-IN")} सफलतापूर्वक दर्ज हो गया!`);
      setIsInterestOpen(false);
      setSelectedAccForInterest(null);
      fetchAccounts();
    } catch (err) {
      alert("ब्याज सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setSavingInterest(false);
    }
  };

  const handleOpenEdit = (acc) => {
    setEditingId(acc._id || acc.id);
    setFormData({
      accountName: acc.accountName || acc.bankName || "",
      bankName: acc.bankName || "",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      accountType: acc.accountType || "CC_OVERDRAFT",
      sanctionedLimit: String(acc.sanctionedLimit || ""),
      currentOutstanding: String(acc.currentOutstanding || ""),
      openingBalance: String(acc.openingBalance || acc.balance || ""),
      interestRate: String(acc.interestRate || ""),
      notes: acc.notes || ""
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (!confirm("क्या आप इस बैंक खाते को हटाना चाहते हैं?")) return;
    try {
      api.delete(`/api/bank-accounts/${id}`).catch(() => {});
      let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
      local = local.filter(x => (x._id || x.id) !== id);
      localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      setAccounts(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTx = (acc, defaultType = "DEPOSIT") => {
    setSelectedAccForTx(acc);
    setTxData({
      type: defaultType,
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      referenceNo: ""
    });
    setIsTxOpen(true);
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    if (!txData.amount || Number(txData.amount) <= 0) {
      alert("कृपया मान्य राशि दर्ज करें!");
      return;
    }

    const acc = selectedAccForTx;
    if (!acc) return;

    setProcessingTx(true);
    const id = acc._id || acc.id;
    const amount = Number(txData.amount);
    const isCC = acc.accountType === "CC_OVERDRAFT";

    // Build new transaction object
    const newTx = {
      id: "tx_" + Date.now(),
      type: txData.type,
      amount: amount,
      date: txData.date,
      description: txData.description || (
        txData.type === "DEPOSIT" ? "रकम जमा / लिमिट खाली" :
        txData.type === "WITHDRAWAL" ? "रकम निकासी / लिमिट उपयोग" :
        txData.type === "INTEREST_DEBIT" ? "बैंक ब्याज डेबिट" : "बैंक चार्ज डेबिट"
      ),
      referenceNo: txData.referenceNo || "",
      createdAt: new Date().toISOString()
    };

    try {
      // Calculate updated balances
      let updatedOutstanding = Number(acc.currentOutstanding || 0);
      let updatedBalance = Number(acc.balance || acc.currentBalance || 0);

      if (isCC) {
        if (txData.type === "DEPOSIT") {
          // Deposit reduces debt
          updatedOutstanding = Math.max(0, updatedOutstanding - amount);
        } else if (txData.type === "WITHDRAWAL" || txData.type === "INTEREST_DEBIT" || txData.type === "BANK_CHARGES") {
          // Withdrawals and interest increase debt
          updatedOutstanding = updatedOutstanding + amount;
        }
      } else {
        if (txData.type === "DEPOSIT") {
          updatedBalance = updatedBalance + amount;
        } else {
          updatedBalance = updatedBalance - amount;
        }
      }

      // If interest/charges debited, also auto-record in shop expenses!
      if (txData.type === "INTEREST_DEBIT" || txData.type === "BANK_CHARGES") {
        const autoExp = {
          id: "exp_bank_" + Date.now(),
          _id: "exp_bank_" + Date.now(),
          title: `बैंक चार्ज / CC ब्याज - ${acc.bankName || acc.accountName}`,
          description: txData.description || `बैंक ब्याज / चार्ज डेबिट: ${acc.bankName}`,
          amount: amount,
          expenseType: "business",
          category: "बैंक ब्याज व शुल्क (Bank Interest & Charges)",
          paymentMode: "BANK_ACCOUNT",
          date: txData.date,
          createdAt: new Date().toISOString()
        };
        try {
          await api.post("/api/expense", autoExp);
        } catch (err) {}
        let localExp = JSON.parse(localStorage.getItem("vb_local_expenses") || "[]");
        localExp.unshift(autoExp);
        localStorage.setItem("vb_local_expenses", JSON.stringify(localExp));
      }

      // Try Server API
      try {
        await api.post(`/api/bank-accounts/${id}/transactions`, newTx);
      } catch (err) {}

      // Update Local Storage
      let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
      local = local.map(a => {
        if ((a._id || a.id) === id) {
          const txList = Array.isArray(a.transactions) ? [...a.transactions] : [];
          txList.unshift(newTx);
          return {
            ...a,
            transactions: txList,
            currentOutstanding: updatedOutstanding,
            balance: updatedBalance,
            currentBalance: updatedBalance
          };
        }
        return a;
      });
      localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));

      setIsTxOpen(false);
      setSelectedAccForTx(null);
      fetchAccounts();
    } catch (err) {
      alert("लेनदेन सहेजने में त्रुटि: " + (err.message || err));
    } finally {
      setProcessingTx(false);
    }
  };

  const filteredAccounts = accounts.filter(a => {
    if (activeTab === "ALL") return true;
    return a.accountType === activeTab;
  });

  // Calculate totals
  const totalSanctionedLimit = accounts
    .filter(a => a.accountType === "CC_OVERDRAFT")
    .reduce((s, a) => s + Number(a.sanctionedLimit || 0), 0);

  const totalCCOutstanding = accounts
    .filter(a => a.accountType === "CC_OVERDRAFT")
    .reduce((s, a) => s + Number(a.currentOutstanding || 0), 0);

  const totalCCAvailable = Math.max(0, totalSanctionedLimit - totalCCOutstanding);

  const totalCurrentBalance = accounts
    .filter(a => a.accountType !== "CC_OVERDRAFT")
    .reduce((s, a) => s + Number(a.balance || a.currentBalance || 0), 0);

  const shareWhatsApp = () => {
    const coName = selectedCompany?.name || "मेरी दुकान";
    let msg = `🏦 *बैंक व CC लिमिट खाता रिपोर्ट (Bank & CC Accounts)*\n`;
    msg += `🏢 ${coName}\n`;
    msg += `----------------------------------\n`;
    if (totalSanctionedLimit > 0) {
      msg += `💳 *कुल CC स्वीकृत लिमिट:* ₹${totalSanctionedLimit.toLocaleString("en-IN")}\n`;
      msg += `🔴 *उपयोग / बाकी कर्ज़:* ₹${totalCCOutstanding.toLocaleString("en-IN")}\n`;
      msg += `🟢 *उपलब्ध खाली लिमिट:* ₹${totalCCAvailable.toLocaleString("en-IN")}\n`;
    }
    if (totalCurrentBalance > 0) {
      msg += `💰 *करंट/सेविंग्स बैंक बैलेंस:* ₹${totalCurrentBalance.toLocaleString("en-IN")}\n`;
    }
    msg += `----------------------------------\n`;
    msg += `📑 *खातों का विवरण:*\n`;

    accounts.forEach((acc, idx) => {
      const typeLabel = acc.accountType === "CC_OVERDRAFT" ? "CC / OD लिमिट" : (acc.accountType === "CURRENT" ? "करंट खाता" : "सेविंग्स खाता");
      msg += `${idx + 1}. *${acc.bankName || acc.accountName}* (${typeLabel})\n`;
      if (acc.accountType === "CC_OVERDRAFT") {
        const limit = Number(acc.sanctionedLimit || 0);
        const out = Number(acc.currentOutstanding || 0);
        const avail = Math.max(0, limit - out);
        msg += `   • लिमिट: ₹${limit.toLocaleString("en-IN")} | बाकी: ₹${out.toLocaleString("en-IN")} | उपलब्ध: ₹${avail.toLocaleString("en-IN")}\n`;
      } else {
        msg += `   • बैलेंस: ₹${Number(acc.balance || acc.currentBalance || 0).toLocaleString("en-IN")}\n`;
      }
    });

    msg += `----------------------------------\n`;
    msg += `_Generated via Mobile Vyapar App_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-black flex items-center gap-1.5 leading-tight">
              <span>🏦 बैंक व CC लिमिट खाता</span>
            </h2>
            <p className="text-[11px] text-blue-100/90 font-medium">
              करंट अकाउंट, CC ओवरड्राफ्ट लिमिट, जमा व ब्याज हिसाब
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition flex items-center gap-1 text-xs font-black shadow-md cursor-pointer shrink-0"
            title="नया बैंक खाता जोड़ें"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>+ खाता जोड़ें</span>
          </button>
          <button
            onClick={shareWhatsApp}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="WhatsApp Share"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={fetchAccounts}
            className="p-2 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            title="ताज़ा करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: "ALL", label: `📊 सभी (${accounts.length})` },
          { id: "CURRENT", label: "🏛️ करंट खाता" },
          { id: "PERSONAL_BUSINESS", label: "👤 पर्सनल (बिजनेस)" },
          { id: "CC_OVERDRAFT", label: "💳 CC / OD लिमिट" },
          { id: "SAVINGS", label: "🏦 सेविंग्स" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Action Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">⚡</span>
          <div className="min-w-0">
            <div className="text-xs font-black truncate leading-tight">
              2 बैंक खाते (करंट + पर्सनल बिज़नेस) व ब्याज
            </div>
            <div className="text-[10px] text-blue-100 truncate">
              ब्याज दर दर्ज करें • सिस्टम खुद हिसाब लगाएगा या असली ब्याज डालें
            </div>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="px-3 py-1.5 rounded-xl bg-white text-blue-900 font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1 cursor-pointer shrink-0 ml-2"
        >
          <Plus size={13} className="stroke-[3]" />
          <span>+ नया खाता जोड़ें</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* ⚡ 2 LINKED BUSINESS ACCOUNTS QUICK OVERVIEW */}
        {(() => {
          const currentAcc = accounts.find(a => a.accountType === "CURRENT");
          const personalBizAcc = accounts.find(a => a.accountType === "PERSONAL_BUSINESS");
          const totalLinked = (currentAcc ? 1 : 0) + (personalBizAcc ? 1 : 0);

          return (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-black">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      बिज़नेस के 2 मुख्य बैंक खाते (Linked Accounts)
                    </h3>
                    <p className="text-[10px] text-slate-500">करंट अकाउंट + पर्सनल बिज़नेस अकाउंट</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  totalLinked === 2 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {totalLinked} / 2 लिंक
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Slot 1: Business Current Account */}
                <div className={`p-3 rounded-xl border transition ${
                  currentAcc ? "bg-blue-50/60 border-blue-200" : "bg-slate-50/80 border-dashed border-slate-300"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">🏛️</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {currentAcc ? (currentAcc.bankName || currentAcc.accountName) : "1. मुख्य करंट खाता"}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {currentAcc ? (
                            <span>
                              बैलेंस: <strong className="text-slate-800">₹{Number(currentAcc.balance || currentAcc.currentBalance || 0).toLocaleString("en-IN")}</strong>
                              {currentAcc.interestRate ? ` • ${currentAcc.interestRate}% ब्याज` : ""}
                            </span>
                          ) : (
                            "बिजनेस का मुख्य करंट चालू खाता लिंक नहीं"
                          )}
                        </div>
                      </div>
                    </div>

                    {currentAcc ? (
                      <button
                        onClick={() => handleOpenMonthlyInterest(currentAcc)}
                        className="px-2 py-1 bg-blue-700 active:bg-blue-800 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs flex items-center gap-0.5"
                        title="मासिक ब्याज दर्ज करें"
                      >
                        <Percent size={11} /> ब्याज
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetForm();
                          setFormData(prev => ({
                            ...prev,
                            accountType: "CURRENT",
                            accountName: "मुख्य करंट खाता"
                          }));
                          setIsFormOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                      >
                        <Plus size={12} /> + जोड़ें
                      </button>
                    )}
                  </div>
                </div>

                {/* Slot 2: Personal Business Account */}
                <div className={`p-3 rounded-xl border transition ${
                  personalBizAcc ? "bg-purple-50/60 border-purple-200" : "bg-slate-50/80 border-dashed border-slate-300"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">👤</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {personalBizAcc ? (personalBizAcc.bankName || personalBizAcc.accountName) : "2. पर्सनल (बिज़नेस उपयोग)"}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {personalBizAcc ? (
                            <span>
                              बैलेंस: <strong className="text-slate-800">₹{Number(personalBizAcc.balance || personalBizAcc.currentBalance || 0).toLocaleString("en-IN")}</strong>
                              {personalBizAcc.interestRate ? ` • ${personalBizAcc.interestRate}% ब्याज` : ""}
                            </span>
                          ) : (
                            "निजी बैंक खाता जो बिज़नेस के लिए प्रयोग होता है"
                          )}
                        </div>
                      </div>
                    </div>

                    {personalBizAcc ? (
                      <button
                        onClick={() => handleOpenMonthlyInterest(personalBizAcc)}
                        className="px-2 py-1 bg-purple-700 active:bg-purple-800 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs flex items-center gap-0.5"
                        title="मासिक ब्याज दर्ज करें"
                      >
                        <Percent size={11} /> ब्याज
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetForm();
                          setFormData(prev => ({
                            ...prev,
                            accountType: "PERSONAL_BUSINESS",
                            accountName: "पर्सनल बिज़नेस खाता"
                          }));
                          setIsFormOpen(true);
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                      >
                        <Plus size={12} /> + जोड़ें
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CC Limit Meter Card (If CC accounts exist) */}
        {totalSanctionedLimit > 0 && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                <CreditCard size={15} className="text-amber-400" /> कैश क्रेडिट (CC) लिमिट स्थिति
              </span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                स्वीकृत: ₹{totalSanctionedLimit.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">उपलब्ध लिमिट (Available)</span>
                <div className="text-xl font-black text-emerald-400">
                  ₹{totalCCAvailable.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">उपयोग / बाकी (Outstanding)</span>
                <div className="text-xl font-black text-rose-400">
                  ₹{totalCCOutstanding.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              {(() => {
                const pct = totalSanctionedLimit > 0 ? (totalCCOutstanding / totalSanctionedLimit) * 100 : 0;
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>लिमिट उपयोग: {pct.toFixed(1)}%</span>
                      <span>शेष: {(100 - pct).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Bank Accounts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              बैंक खाते ({filteredAccounts.length})
            </h3>
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" /> + नया खाता
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-medium">खाते लोड हो रहे हैं...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Building2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">कोई बैंक खाता नहीं मिला</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                यहाँ अपना करंट अकाउंट, पर्सनल बिजनेस खाता या CC लिमिट जोड़ें और हर माह का ब्याज हिसाब रखें।
              </p>
              <button
                onClick={() => { resetForm(); setIsFormOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-md active:scale-95 transition cursor-pointer"
              >
                <Plus size={16} /> + नया बैंक खाता जोड़ें
              </button>
            </div>
          ) : (
            filteredAccounts.map(acc => {
              const id = acc._id || acc.id;
              const isCC = acc.accountType === "CC_OVERDRAFT";
              const isCurrent = acc.accountType === "CURRENT";
              const isPersonalBiz = acc.accountType === "PERSONAL_BUSINESS";
              const limit = Number(acc.sanctionedLimit || 0);
              const out = Number(acc.currentOutstanding || 0);
              const avail = Math.max(0, limit - out);
              const balance = Number(acc.balance || acc.currentBalance || 0);
              const txCount = (acc.transactions || []).length;
              const pct = limit > 0 ? (out / limit) * 100 : 0;
              const autoEstInterest = calculateAutoMonthlyInterest(acc);
              const hasInterests = (acc.monthlyInterests || []).length > 0;
              const latestInterest = hasInterests ? acc.monthlyInterests[0] : null;

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isCC ? "bg-amber-50 text-amber-700" : isPersonalBiz ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {isCC ? "💳" : isPersonalBiz ? "👤" : "🏛️"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900">
                            {acc.bankName || acc.accountName}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                            isCC ? "bg-amber-100 text-amber-900" : isPersonalBiz ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900"
                          }`}>
                            {isCC ? "CC / OD लिमिट" : isPersonalBiz ? "पर्सनल (बिज़नेस)" : (isCurrent ? "करंट खाता" : "सेविंग्स")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {acc.accountNumber ? `A/C: ••••${String(acc.accountNumber).slice(-4)}` : "अकाउंट नंबर दर्ज नहीं"}
                          {acc.interestRate ? ` • ${acc.interestRate}% वार्षिक ब्याज` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isCC ? (
                        <>
                          <span className="text-[10px] text-slate-400 font-medium">उपलब्ध लिमिट</span>
                          <div className="text-sm font-black text-emerald-600">
                            ₹{avail.toLocaleString("en-IN")}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-400 font-medium">खाता बैलेंस</span>
                          <div className="text-sm font-black text-slate-900">
                            ₹{balance.toLocaleString("en-IN")}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CC Meter details if CC */}
                  {isCC && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div>
                          <span className="text-slate-400 block">कुल स्वीकृत लिमिट</span>
                          <span className="font-bold text-slate-800">₹{limit.toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">बाकी कर्ज़ (Used)</span>
                          <span className="font-bold text-rose-600">₹{out.toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">ब्याज दर</span>
                          <span className="font-bold text-slate-800">{acc.interestRate ? `${acc.interestRate}%` : "—"}</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ⚡ MONTHLY INTEREST CALCULATION STRIP */}
                  <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/80 rounded-xl p-2.5 border border-indigo-100/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Percent size={11} className="text-indigo-600" />
                          <span>ब्याज दर: <strong>{acc.interestRate ? `${acc.interestRate}% p.a.` : "दर्ज नहीं"}</strong></span>
                        </div>
                        <div className="text-xs font-black text-indigo-900 mt-0.5">
                          ⚡ अनुमानित ब्याज: <span className="text-indigo-700">₹{autoEstInterest.toLocaleString("en-IN")} / माह</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenMonthlyInterest(acc)}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-black cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                      >
                        <Percent size={12} className="stroke-[2.5]" />
                        <span>मासिक ब्याज दर्ज करें</span>
                      </button>
                    </div>

                    {latestInterest && (
                      <div className="text-[10px] text-indigo-800 font-medium pt-1 border-t border-indigo-100 flex items-center justify-between">
                        <span>हालिया दर्ज: <strong>{latestInterest.monthName || latestInterest.month}</strong></span>
                        <span className="font-black text-slate-900">असली ब्याज: ₹{Number(latestInterest.actualInterest || 0).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenTx(acc, "DEPOSIT")}
                      className="py-1.5 px-2 rounded-xl bg-emerald-50 active:bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center gap-1 cursor-pointer border border-emerald-200"
                    >
                      <ArrowDownRight size={14} /> {isCC ? "जमा (खाली करें)" : "जमा करें"}
                    </button>
                    <button
                      onClick={() => handleOpenTx(acc, "WITHDRAWAL")}
                      className="py-1.5 px-2 rounded-xl bg-rose-50 active:bg-rose-100 text-rose-700 text-xs font-black flex items-center justify-center gap-1 cursor-pointer border border-rose-200"
                    >
                      <ArrowUpRight size={14} /> निकासी
                    </button>
                    <button
                      onClick={() => setHistoryAcc(acc)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock size={14} /> इतिहास ({txCount})
                    </button>
                  </div>

                  {/* History & Edit bar */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <button
                      onClick={() => handleOpenMonthlyInterest(acc)}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Percent size={12} /> ब्याज इतिहास ({((acc.monthlyInterests || []).length)})
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="संपादित करें"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-40">
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> + नया बैंक या CC लिमिट खाता जोड़ें
        </button>
      </div>

      {/* Add / Edit Bank Account Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingId ? "बैंक खाता संपादित करें" : "नया बैंक / CC लिमिट खाता"}
                  </h3>
                  <p className="text-[11px] text-slate-500">करंट, सेविंग्स या CC ओवरड्राफ्ट लिमिट</p>
                </div>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              {/* Account Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">खाते का प्रकार *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFormData({ ...formData, accountType: t.id })}
                      className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        formData.accountType === t.id
                          ? "bg-blue-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 active:bg-slate-200"
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="text-[11px] truncate">{t.label.split("(")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बैंक का नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. State Bank of India, HDFC Bank, ICICI"
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Account Number & IFSC */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अकाउंट नंबर</label>
                  <input
                    type="text"
                    placeholder="उदा. 34567890123"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    placeholder="उदा. SBIN0001234"
                    value={formData.ifscCode}
                    onChange={e => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 uppercase"
                  />
                </div>
              </div>

              {/* Conditional Limits for CC vs Balances for Current */}
              {formData.accountType === "CC_OVERDRAFT" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">स्वीकृत CC लिमिट (₹) *</label>
                      <input
                        type="number"
                        required
                        placeholder="उदा. 10,00,000"
                        value={formData.sanctionedLimit}
                        onChange={e => setFormData({ ...formData, sanctionedLimit: e.target.value })}
                        className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">वर्तमान बकाया / उपयोग (₹)</label>
                      <input
                        type="number"
                        placeholder="उदा. 4,00,000"
                        value={formData.currentOutstanding}
                        onChange={e => setFormData({ ...formData, currentOutstanding: e.target.value })}
                        className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-rose-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ब्याज दर (% p.a.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="उदा. 8.5"
                      value={formData.interestRate}
                      onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">वर्तमान बैलेंस (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={formData.openingBalance}
                      onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                      className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ब्याज दर (% p.a.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="वैकल्पिक"
                      value={formData.interestRate}
                      onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 active:bg-blue-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? "सहेज रहे हैं..." : "💾 खाता सहेजें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Entry Drawer */}
      {isTxOpen && selectedAccForTx && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">बैंक लेन-देन दर्ज करें</h3>
                <p className="text-[11px] text-slate-500">{selectedAccForTx.bankName || selectedAccForTx.accountName}</p>
              </div>
              <button
                onClick={() => { setIsTxOpen(false); setSelectedAccForTx(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-3">
              {/* Type Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">लेन-देन प्रकार *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTxData({ ...txData, type: "DEPOSIT" })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                      txData.type === "DEPOSIT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <ArrowDownRight size={14} /> {selectedAccForTx.accountType === "CC_OVERDRAFT" ? "जमा (खाली करें)" : "जमा (Deposit)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxData({ ...txData, type: "WITHDRAWAL" })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                      txData.type === "WITHDRAWAL"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <ArrowUpRight size={14} /> निकासी (Withdraw)
                  </button>
                  {selectedAccForTx.accountType === "CC_OVERDRAFT" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTxData({ ...txData, type: "INTEREST_DEBIT" })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                          txData.type === "INTEREST_DEBIT"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Percent size={13} /> बैंक ब्याज डेबिट
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxData({ ...txData, type: "BANK_CHARGES" })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                          txData.type === "BANK_CHARGES"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span>🧾</span> बैंक शुल्क / चार्ज
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रकम (Amount ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="₹ 0.00"
                  value={txData.amount}
                  onChange={e => setTxData({ ...txData, amount: e.target.value })}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    value={txData.date}
                    onChange={e => setTxData({ ...txData, date: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रेफरेंस / UTR नं.</label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक"
                    value={txData.referenceNo}
                    onChange={e => setTxData({ ...txData, referenceNo: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">विवरण (Description)</label>
                <input
                  type="text"
                  placeholder="जैसे: चेक जमा, RTGS निकासी, मासिक ब्याज"
                  value={txData.description}
                  onChange={e => setTxData({ ...txData, description: e.target.value })}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsTxOpen(false); setSelectedAccForTx(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={processingTx}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 active:bg-blue-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {processingTx ? "सहेज रहे हैं..." : "💾 लेन-देन दर्ज करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Drawer */}
      {historyAcc && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">लेन-देन इतिहास</h3>
                  <p className="text-[11px] text-slate-500">{historyAcc.bankName || historyAcc.accountName}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryAcc(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {(historyAcc.transactions || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  कोई लेन-देन दर्ज नहीं है।
                </div>
              ) : (
                (historyAcc.transactions || []).map((tx, idx) => {
                  const isDeposit = tx.type === "DEPOSIT";
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                            isDeposit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {tx.type === "DEPOSIT" ? "जमा" : (tx.type === "WITHDRAWAL" ? "निकासी" : "ब्याज/चार्ज")}
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">
                            {tx.description || "लेन-देन"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          📅 {tx.date ? String(tx.date).split("T")[0] : "—"} {tx.referenceNo ? `• UTR: ${tx.referenceNo}` : ""}
                        </p>
                      </div>
                      <div className={`text-right font-black text-sm ${
                        isDeposit ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {isDeposit ? "+" : "-"} ₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📊 Monthly Interest Entry Drawer (Auto Calculate vs Actual Statement Interest) */}
      {isInterestOpen && selectedAccForInterest && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <Percent size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    मासिक बैंक ब्याज दर्ज करें
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    {selectedAccForInterest.bankName || selectedAccForInterest.accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsInterestOpen(false); setSelectedAccForInterest(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyInterest} className="space-y-3.5">
              {/* Month Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">महीना चुनें (Select Month) *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(() => {
                    const now = new Date();
                    const options = [];
                    for (let i = 0; i < 6; i++) {
                      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      const label = getMonthNameHindi(key);
                      options.push({ key, label });
                    }
                    return options.map(opt => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => handleMonthSelectForInterest(opt.key)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition cursor-pointer text-center truncate ${
                          interestData.month === opt.key
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 active:bg-slate-200"
                        }`}
                      >
                        {opt.label.split(" ")[0]} '{opt.label.split(" ")[1]?.slice(-2)}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* System Auto-Calculated vs Actual Comparison Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">⚡ सिस्टम अनुमानित ब्याज:</span>
                  <span className="font-black text-indigo-950 text-sm">
                    ₹{Number(interestData.calculatedInterest || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  वार्षिक ब्याज दर: <strong>{selectedAccForInterest.interestRate || 0}% p.a.</strong> के आधार पर {interestData.monthName} का अनुमानित ब्याज।
                </div>
              </div>

              {/* Actual Interest from Bank Statement (Editable Input) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  बैंक स्टेटमेंट में आया असली ब्याज (Actual Interest ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="उदा. 2450.00"
                    value={interestData.actualInterest}
                    onChange={e => setInterestData({ ...interestData, actualInterest: e.target.value })}
                    className="w-full text-base font-black pl-8 pr-3 py-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/20 text-slate-900 focus:outline-none focus:bg-white transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 बैंक स्टेटमेंट या SMS में जो असली ब्याज रकम कटी है, वह यहाँ दर्ज करें।
                </p>
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    value={interestData.date}
                    onChange={e => setInterestData({ ...interestData, date: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">टिप्पणी / नोट</label>
                  <input
                    type="text"
                    placeholder="उदा. HDFC Bank ब्याज"
                    value={interestData.note}
                    onChange={e => setInterestData({ ...interestData, note: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Post to expenses checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interestData.postToExpenses}
                  onChange={e => setInterestData({ ...interestData, postToExpenses: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">व्यापार खर्चे (Shop Expense) में ऑटो-जोड़ें</span>
                  <span className="text-[10px] text-slate-500 block">
                    यह ब्याज अपने आप DayBook और Profit & Loss रिपोर्ट में खर्च के रूप में जुड़ेगा।
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsInterestOpen(false); setSelectedAccForInterest(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={savingInterest}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 active:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingInterest ? "सहेज रहे हैं..." : "💾 असली ब्याज दर्ज करें"}
                </button>
              </div>
            </form>

            {/* Past Monthly Interests History */}
            {((selectedAccForInterest.monthlyInterests || []).length > 0) && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-black text-slate-800">
                  पिछले महीनों का ब्याज इतिहास ({selectedAccForInterest.monthlyInterests.length})
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedAccForInterest.monthlyInterests.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {item.monthName || item.month}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          अनुमान: ₹{Number(item.calculatedInterest || 0).toLocaleString("en-IN")} • {item.date ? String(item.date).split("T")[0] : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">असली ब्याज</span>
                        <span className="text-sm font-black text-rose-600">
                          ₹{Number(item.actualInterest || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
