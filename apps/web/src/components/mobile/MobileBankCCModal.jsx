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
  Wallet,
  QrCode,
  Copy,
  Download,
  Check
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";
import { speakUpiPayment } from "../../utils/soundBox";

const ACCOUNT_TYPES = [
  { id: "CURRENT", label: "करंट अकाउंट (Current A/C)", icon: "🏛️", desc: "बिजनेस का मुख्य चालू खाता" },
  { id: "PERSONAL_BUSINESS", label: "पर्सनल बैंक खाता (Business Use)", icon: "👤", desc: "निजी खाता जो बिजनेस लेन-देन के लिए उपयोग होता है" },
  { id: "CC_OVERDRAFT", label: "Cash Credit (CC) / OD Limit", icon: "💳", desc: "कैश क्रेडिट व ओवरड्राफ्ट लिमिट खाता" },
  { id: "SAVINGS", label: "Savings Account (बचत खाता)", icon: "🏦", desc: "बैंक बचत खाता" }
];

export default function MobileBankCCModal({ isOpen, onClose, onAccountsChange }) {
  if (!isOpen) return null;

  const { selectedCompany } = useCompany() || {};
  const [accounts, setAccounts] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const candidateKeys = [
          "vb_local_bank_accounts",
          "bank_accounts",
          "bankAccounts",
          "local_bank_accounts",
          "vb_bank_accounts"
        ];
        for (const k of candidateKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, CURRENT, PERSONAL_BUSINESS, CC_OVERDRAFT
  const [toast, setToast] = useState(null); // { type: "success" | "error", text: string }

  // Add / Edit Account Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    accountType: "CURRENT",
    hasCcLimit: false,
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

  // Bank-to-Bank / Contra Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccId: "",
    toAccId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: "",
    note: ""
  });
  const [processingTransfer, setProcessingTransfer] = useState(false);

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

  // Payment QR Code Modal (Generate QR & WhatsApp Share)
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedAccForQr, setSelectedAccForQr] = useState(null);
  const [qrAmount, setQrAmount] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // History Modal
  const [historyAcc, setHistoryAcc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, selectedCompany]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      let serverData = [];
      try {
        const res = await api.get("/api/bank-accounts");
        serverData = Array.isArray(res?.accounts)
          ? res.accounts
          : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch (err) {
        console.warn("Server bank accounts fetch fallback:", err);
      }

      let localData = [];
      try {
        if (typeof localStorage !== "undefined") {
          const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
          const candidateKeys = [
            "vb_local_bank_accounts",
            currentCoId ? `vb_local_bank_accounts_${currentCoId}` : null,
            "bank_accounts",
            "bankAccounts",
            "local_bank_accounts",
            "vb_bank_accounts"
          ].filter(Boolean);

          for (const k of candidateKeys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  localData.push(...parsed);
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // If both server and local are empty, check selectedCompany and user profile for bank details
      if (serverData.length === 0 && localData.length === 0) {
        let uBank = null;
        try {
          const uStr = localStorage.getItem("user");
          if (uStr) uBank = JSON.parse(uStr);
        } catch (e) {}

        const bName = (selectedCompany?.bankName || selectedCompany?.accountName || uBank?.bankName || uBank?.accountName || "").trim();
        const accNo = (selectedCompany?.accountNumber || uBank?.accountNumber || "").trim();
        const ifsc = (selectedCompany?.ifscCode || uBank?.ifscCode || "").trim();
        const upi = (selectedCompany?.upiId || uBank?.upiId || "").trim();

        if (bName || accNo) {
          localData.push({
            _id: "co_bank_default",
            id: "co_bank_default",
            accountName: selectedCompany?.accountName || bName || "मुख्य बैंक खाता",
            bankName: bName || "बैंक खाता",
            accountNumber: accNo,
            ifscCode: ifsc,
            upiId: upi,
            accountType: "CURRENT",
            openingBalance: 0,
            currentBalance: 0,
            interestRate: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Merge: Server accounts first, then local records not on server
      const map = new Map();
      const getAccKey = (item, idx) => String(item._id || item.id || item.clientTempId || item.accountNumber || (item.bankName ? `${item.bankName}_${item.accountNumber || item.accountName || ''}` : '') || `acc_${idx}`);
      (Array.isArray(serverData) ? serverData : []).forEach((item, idx) => {
        const id = getAccKey(item, idx);
        if (id) map.set(id, item);
      });
      (Array.isArray(localData) ? localData : []).forEach((item, idx) => {
        const id = getAccKey(item, idx);
        if (id && !map.has(id)) map.set(id, item);
      });

      const list = Array.from(map.values());
      setAccounts(list);
      if (typeof onAccountsChange === "function") {
        try { onAccountsChange(list); } catch (e) {}
      }
      if (list.length > 0 && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("vb_local_bank_accounts", JSON.stringify(list));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error loading bank accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    const bName = (formData.bankName || "").trim();
    const aName = (formData.accountName || "").trim();
    if (!bName && !aName) {
      const msg = "कृपया बैंक या खाते का नाम दर्ज करें!";
      setToast({ type: "error", text: msg });
      alert(msg);
      return;
    }

    // DUPLICATE ACCOUNT NUMBER CHECK
    const trimmedAcc = (formData.accountNumber || "").trim();
    if (trimmedAcc) {
      const dup = accounts.find(a => {
        const aId = a._id || a.id;
        if (editingId && aId === editingId) return false;
        return (a.accountNumber || "").trim() === trimmedAcc;
      });
      if (dup) {
        const dupMsg = `⚠️ खाता नंबर "${trimmedAcc}" पहले से दर्ज है (${dup.bankName || dup.accountName})! डुप्लीकेट खाता जोड़ने की अनुमति नहीं है।`;
        setToast({ type: "error", text: dupMsg });
        alert(dupMsg);
        return;
      }
    }

    const isCcActive = Boolean(formData.hasCcLimit || formData.accountType === "CC_OVERDRAFT");
    const sLimit = Number(formData.sanctionedLimit || 0);
    const cOutstanding = Number(formData.currentOutstanding || 0);
    const oBalance = Number(formData.openingBalance || 0);

    if (isCcActive && !sLimit) {
      const msg = "कृपया कुल स्वीकृत CC लिमिट राशि (₹) दर्ज करें!";
      setToast({ type: "error", text: msg });
      alert(msg);
      return;
    }

    const availBalance = isCcActive ? Math.max(0, sLimit - cOutstanding) : oBalance;

    const payload = {
      ...formData,
      bankName: bName || aName,
      accountName: aName || bName,
      hasCcLimit: isCcActive,
      sanctionedLimit: isCcActive ? sLimit : 0,
      currentOutstanding: isCcActive ? cOutstanding : 0,
      openingBalance: availBalance,
      currentBalance: availBalance,
      balance: availBalance,
      interestRate: Number(formData.interestRate || 0),
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      if (editingId) {
        let updatedItem = null;
        try {
          const res = await api.put(`/api/bank-accounts/${editingId}`, payload);
          updatedItem = res?.data || res?.account || res;
        } catch (e) {
          console.warn("Backend update failed, saving locally:", e);
        }

        const mergedUpdated = { ...payload, ...(updatedItem && typeof updatedItem === 'object' ? updatedItem : {}), _id: editingId, id: editingId };
        setAccounts(prev => prev.map(x => ((x._id || x.id) === editingId ? mergedUpdated : x)));

        let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
        local = local.map(x => ((x._id || x.id) === editingId ? mergedUpdated : x));
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      } else {
        let serverCreated = null;
        try {
          // Do not send client string _id in POST body so Mongoose creates a valid ObjectId
          const res = await api.post("/api/bank-accounts", payload);
          serverCreated = res?.data || res?.account || res;
        } catch (e) {
          console.warn("Backend save failed, saving locally:", e);
        }

        const newId = (serverCreated && (serverCreated._id || serverCreated.id)) || ("bnk_" + Date.now());
        const newRecord = {
          ...payload,
          ...(serverCreated && typeof serverCreated === 'object' ? serverCreated : {}),
          _id: newId,
          id: newId,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
          transactions: []
        };

        // Immediately update state and localStorage
        setAccounts(prev => [newRecord, ...prev.filter(x => (x._id || x.id) !== newId)]);

        let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
        local = [newRecord, ...local.filter(x => (x._id || x.id) !== newId)];
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));

        // Sync CURRENT account with company details
        if (payload.accountType === "CURRENT" && selectedCompany?._id) {
          try {
            await api.put(`/api/company/${selectedCompany._id}`, {
              bankName: payload.bankName,
              accountName: payload.accountName,
              accountNumber: payload.accountNumber,
              ifscCode: payload.ifscCode,
              upiId: payload.upiId || selectedCompany.upiId
            });
          } catch (coErr) {}
        }
      }

      setIsFormOpen(false);
      setEditingId(null);
      resetForm();

      const successMsg = `✅ बैंक खाता "${payload.bankName || payload.accountName}" सफलतापूर्वक सहेज लिया गया!`;
      setToast({ type: "success", text: successMsg });
      if (typeof onAccountsChange === "function") {
        onAccountsChange();
      }
      try {
        await fetchAccounts();
      } catch (fErr) {}
      alert(successMsg);
      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      const errMsg = "सहेजने में त्रुटि: " + (err?.response?.data?.error || err?.message || err);
      setToast({ type: "error", text: errMsg });
      alert(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (type = "CURRENT", hasCc = false) => {
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      upiId: selectedCompany?.upiId || "",
      accountType: type,
      hasCcLimit: hasCc || type === "CC_OVERDRAFT",
      sanctionedLimit: "",
      currentOutstanding: "",
      openingBalance: "",
      interestRate: "",
      notes: ""
    });
  };

  // QR Code & Payment Utilities
  const getAccountUpiId = (acc) => {
    if (!acc) return selectedCompany?.upiId || "";
    if (acc.upiId && acc.upiId.trim()) return acc.upiId.trim();
    if (selectedCompany?.upiId && selectedCompany.upiId.trim()) return selectedCompany.upiId.trim();
    if (selectedCompany?.phone) return `${selectedCompany.phone}@upi`;
    return "vyapar@upi";
  };

  const getAccountQrUrl = (acc, amount = "") => {
    const upiId = getAccountUpiId(acc);
    const payeeName = acc?.accountName || selectedCompany?.name || "Vyapar Merchant";
    const amtNum = Number(amount);
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
    if (!isNaN(amtNum) && amtNum > 0) {
      upiString += `&am=${amtNum.toFixed(2)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiString)}&margin=12`;
  };

  const shareAccountWhatsApp = (acc, customAmount = "") => {
    const upiId = getAccountUpiId(acc);
    const coName = selectedCompany?.name || "मेरी दुकान";
    const bName = acc?.bankName || acc?.accountName || "Bank";
    const amtNum = Number(customAmount);
    const payeeName = acc?.accountName || coName;

    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
    if (!isNaN(amtNum) && amtNum > 0) {
      upiString += `&am=${amtNum.toFixed(2)}`;
    }

    let msg = `🏦 *${coName} - बैंक भुगतान QR विवरण (Bank Payment Details)*\n`;
    msg += `----------------------------------\n`;
    msg += `🏛️ *बैंक:* ${bName}\n`;
    if (acc?.accountNumber) msg += `🔢 *खाता नं.:* ••••${String(acc.accountNumber).slice(-4)}\n`;
    if (acc?.ifscCode) msg += `📍 *IFSC कोड:* ${acc.ifscCode}\n`;
    msg += `📲 *UPI ID:* ${upiId}\n`;
    if (!isNaN(amtNum) && amtNum > 0) {
      msg += `💰 *रकम:* ₹${amtNum.toLocaleString("en-IN")}\n`;
    }
    msg += `----------------------------------\n`;
    msg += `📲 *GPay / PhonePe / Paytm से 1-क्लिक भुगतान हेतु लिंक:*\n`;
    msg += `${upiString}\n\n`;
    msg += `_धन्यवाद! - ${coName}_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleOpenQrModal = (acc) => {
    setSelectedAccForQr(acc);
    setQrAmount("");
    setCopiedUpi(false);
    setIsQrOpen(true);
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
      accountName: acc.accountName || "",
      bankName: acc.bankName || "",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      upiId: acc.upiId || "",
      accountType: acc.accountType || "CURRENT",
      hasCcLimit: Boolean(acc.hasCcLimit || acc.accountType === "CC_OVERDRAFT"),
      sanctionedLimit: String(acc.sanctionedLimit || ""),
      currentOutstanding: String(acc.currentOutstanding || ""),
      openingBalance: String(acc.openingBalance || acc.balance || ""),
      interestRate: String(acc.interestRate || ""),
      notes: acc.notes || ""
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("क्या आप इस बैंक खाते को हटाना चाहते हैं?")) return;
    try {
      await api.delete(`/api/bank-accounts/${id}`).catch(() => {});
      let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
      local = local.filter(x => (x._id || x.id) !== id);
      localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      setAccounts(prev => prev.filter(x => (x._id || x.id) !== id));
      if (typeof onAccountsChange === "function") {
        onAccountsChange();
      }
      const delMsg = "🗑️ बैंक खाता सफलतापूर्वक हटा दिया गया!";
      setToast({ type: "success", text: delMsg });
      alert(delMsg);
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      console.error(e);
      alert("खाता हटाने में त्रुटि आई।");
    }
  };

  const handleQuickCashDeposit = () => {
    let targetAcc = accounts.find(a => a.accountType === "CURRENT") || accounts[0];
    if (!targetAcc) {
      // Auto-create default primary business bank account so user never gets stuck in a 15-field form!
      const defaultAcc = {
        _id: "bnk_primary_current",
        id: "bnk_primary_current",
        accountName: "मुख्य व्यापारिक चालू खाता (Primary Business)",
        bankName: "मुख्य व्यापारिक बैंक खाता (SBI/PNB/HDFC)",
        accountType: "CURRENT",
        balance: 0,
        currentBalance: 0,
        openingBalance: 0,
        transactions: [],
        createdAt: new Date().toISOString()
      };
      setAccounts([defaultAcc]);
      try {
        let local = JSON.parse(localStorage.getItem("vb_local_bank_accounts") || "[]");
        local = [defaultAcc, ...local];
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(local));
      } catch (e) {}
      targetAcc = defaultAcc;
    }

    // Close any open add-account form to prevent overlay conflicts
    setIsFormOpen(false);
    setEditingId(null);
    setSelectedAccForTx(targetAcc);
    setTxData({
      type: "DEPOSIT",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "गल्ले से बैंक में नकद जमा (Cash Deposit from Counter)",
      referenceNo: ""
    });
    setIsTxOpen(true);
  };

  const handleOpenTx = (acc, defaultType = "DEPOSIT") => {
    setSelectedAccForTx(acc);
    setTxData({
      type: defaultType,
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: defaultType === "DEPOSIT" ? "गल्ले से बैंक में नकद जमा (Cash Deposit)" : "",
      referenceNo: ""
    });
    setIsTxOpen(true);
  };

  const handleOpenTransferModal = (defaultFromAcc = null) => {
    let currentAccounts = [...accounts];
    if (currentAccounts.length < 2) {
      if (currentAccounts.length === 0) {
        const defaultCurrent = {
          _id: "bnk_primary_current",
          id: "bnk_primary_current",
          accountName: "मुख्य व्यापारिक चालू खाता (SBI/PNB/HDFC)",
          bankName: "मुख्य व्यापारिक बैंक खाता",
          accountType: "CURRENT",
          balance: 0,
          currentBalance: 0,
          openingBalance: 0,
          transactions: [],
          createdAt: new Date().toISOString()
        };
        const defaultCC = {
          _id: "bnk_primary_cc",
          id: "bnk_primary_cc",
          accountName: "बिजनेस CC / OD लिमिट खाता",
          bankName: "CC लिमिट खाता",
          accountType: "CC_OVERDRAFT",
          hasCcLimit: true,
          sanctionedLimit: 500000,
          currentOutstanding: 0,
          balance: 0,
          transactions: [],
          createdAt: new Date().toISOString()
        };
        currentAccounts = [defaultCurrent, defaultCC];
        setAccounts(currentAccounts);
        try {
          localStorage.setItem("vb_local_bank_accounts", JSON.stringify(currentAccounts));
        } catch (e) {}
      } else if (currentAccounts.length === 1) {
        const first = currentAccounts[0];
        const newType = first.accountType === "CURRENT" ? "CC_OVERDRAFT" : "CURRENT";
        const second = {
          _id: "bnk_secondary_" + Date.now(),
          id: "bnk_secondary_" + Date.now(),
          accountName: newType === "CC_OVERDRAFT" ? "CC / OD लिमिट खाता" : "दूसरा बैंक खाता (Current/Savings)",
          bankName: newType === "CC_OVERDRAFT" ? "बैंक CC लिमिट" : "दूसरा बैंक खाता",
          accountType: newType,
          hasCcLimit: newType === "CC_OVERDRAFT",
          sanctionedLimit: newType === "CC_OVERDRAFT" ? 200000 : 0,
          currentOutstanding: 0,
          balance: 0,
          currentBalance: 0,
          transactions: [],
          createdAt: new Date().toISOString()
        };
        currentAccounts = [...currentAccounts, second];
        setAccounts(currentAccounts);
        try {
          localStorage.setItem("vb_local_bank_accounts", JSON.stringify(currentAccounts));
        } catch (e) {}
      }
    }

    const fromId = defaultFromAcc ? (defaultFromAcc._id || defaultFromAcc.id) : (currentAccounts[0]?._id || currentAccounts[0]?.id || "");
    const toId = currentAccounts.find(a => (a._id || a.id) !== fromId)?._id || currentAccounts.find(a => (a._id || a.id) !== fromId)?.id || "";

    setTransferData({
      fromAccId: fromId,
      toAccId: toId,
      amount: "",
      date: new Date().toISOString().split("T")[0],
      referenceNo: "",
      note: ""
    });
    setIsTransferOpen(true);
  };

  const handleSaveBankTransfer = async (e) => {
    e.preventDefault();
    const amt = Number(transferData.amount);
    if (!transferData.amount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य ट्रांसफर राशि दर्ज करें!");
      return;
    }
    if (!transferData.fromAccId || !transferData.toAccId) {
      alert("कृपया भेजने वाला और पाने वाला दोनों बैंक खाते चुनें!");
      return;
    }
    if (transferData.fromAccId === transferData.toAccId) {
      alert("भेजने वाला और पाने वाला खाता एक ही नहीं हो सकता!");
      return;
    }

    const fromAcc = accounts.find(a => (a._id || a.id) === transferData.fromAccId);
    const toAcc = accounts.find(a => (a._id || a.id) === transferData.toAccId);
    if (!fromAcc || !toAcc) {
      alert("चुने गए बैंक खाते नहीं मिले!");
      return;
    }

    setProcessingTransfer(true);
    const refNo = transferData.referenceNo.trim() || `TRF-${Date.now().toString().slice(-6)}`;
    const txDate = transferData.date || new Date().toISOString().split("T")[0];

    try {
      // 1. Try server endpoint
      try {
        await api.post("/api/bank-accounts/transfer", {
          fromAccountId: transferData.fromAccId,
          toAccountId: transferData.toAccId,
          amount: amt,
          date: txDate,
          referenceNo: refNo,
          note: transferData.note.trim()
        });
      } catch (srvErr) {
        console.warn("Backend transfer route fallback to local:", srvErr);
        try {
          await api.post(`/api/bank-accounts/${transferData.fromAccId}/transaction`, {
            type: "TRANSFER_OUT",
            amount: amt,
            date: txDate,
            referenceNo: refNo,
            note: transferData.note.trim() || `फंड ट्रांसफर दिया ➡️ ${toAcc.bankName || toAcc.accountName}`
          });
          await api.post(`/api/bank-accounts/${transferData.toAccId}/transaction`, {
            type: "TRANSFER_IN",
            amount: amt,
            date: txDate,
            referenceNo: refNo,
            note: transferData.note.trim() || `फंड ट्रांसफर मिला ⬅️ ${fromAcc.bankName || fromAcc.accountName}`
          });
        } catch (e2) {}
      }

      // 2. Update local state and localStorage for both accounts
      const updatedAccounts = accounts.map(a => {
        const aId = a._id || a.id;
        if (aId === transferData.fromAccId) {
          const outTx = {
            id: "tx_out_" + Date.now(),
            type: "TRANSFER_OUT",
            amount: amt,
            date: txDate,
            description: transferData.note.trim() || `फंड ट्रांसफर दिया ➡️ ${toAcc.bankName || toAcc.accountName}`,
            referenceNo: refNo,
            createdAt: new Date().toISOString()
          };
          const txs = Array.isArray(a.transactions) ? [outTx, ...a.transactions] : [outTx];
          let updatedOutstanding = Number(a.currentOutstanding || 0);
          let updatedBalance = Number(a.balance || a.currentBalance || 0);
          if (a.accountType === "CC_OVERDRAFT") {
            updatedOutstanding += amt;
          } else {
            updatedBalance -= amt;
          }
          return {
            ...a,
            transactions: txs,
            currentOutstanding: updatedOutstanding,
            balance: updatedBalance,
            currentBalance: updatedBalance
          };
        } else if (aId === transferData.toAccId) {
          const inTx = {
            id: "tx_in_" + Date.now(),
            type: "TRANSFER_IN",
            amount: amt,
            date: txDate,
            description: transferData.note.trim() || `फंड ट्रांसफर मिला ⬅️ ${fromAcc.bankName || fromAcc.accountName}`,
            referenceNo: refNo,
            createdAt: new Date().toISOString()
          };
          const txs = Array.isArray(a.transactions) ? [inTx, ...a.transactions] : [inTx];
          let updatedOutstanding = Number(a.currentOutstanding || 0);
          let updatedBalance = Number(a.balance || a.currentBalance || 0);
          if (a.accountType === "CC_OVERDRAFT") {
            updatedOutstanding = Math.max(0, updatedOutstanding - amt);
          } else {
            updatedBalance += amt;
          }
          return {
            ...a,
            transactions: txs,
            currentOutstanding: updatedOutstanding,
            balance: updatedBalance,
            currentBalance: updatedBalance
          };
        }
        return a;
      });

      setAccounts(updatedAccounts);
      try {
        localStorage.setItem("vb_local_bank_accounts", JSON.stringify(updatedAccounts));
      } catch (e) {}

      setIsTransferOpen(false);
      const successMsg = `✅ ₹${amt.toLocaleString("en-IN")} का फंड ट्रांसफर (${fromAcc.bankName || fromAcc.accountName} ➡️ ${toAcc.bankName || toAcc.accountName}) सफलतापूर्वक दर्ज हो गया!`;
      setToast({ type: "success", text: successMsg });
      alert(successMsg);
      setTimeout(() => setToast(null), 6000);
      if (typeof onAccountsChange === "function") {
        onAccountsChange();
      }
      try {
        await fetchAccounts();
      } catch (fErr) {}
    } catch (err) {
      console.error("Transfer error:", err);
      alert("फंड ट्रांसफर दर्ज करने में त्रुटि: " + (err.message || err));
    } finally {
      setProcessingTransfer(false);
    }
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

      {/* Visual In-App Toast / Banner */}
      {toast && (
        <div className={`px-4 py-3 flex items-center justify-between text-xs font-black shrink-0 transition shadow-md animate-in slide-in-from-top ${
          toast.type === "success"
            ? "bg-emerald-600 text-white border-b border-emerald-700"
            : "bg-rose-600 text-white border-b border-rose-700"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{toast.type === "success" ? "✅" : "⚠️"}</span>
            <span className="leading-snug">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white cursor-pointer shrink-0 ml-2">
            <X size={15} />
          </button>
        </div>
      )}

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
        {/* 💵 & 🔄 QUICK ACTIONS: CASH DEPOSIT & BANK TRANSFER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Action 1: Cash Deposit from Counter */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                💵
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate">गल्ले से बैंक में जमा</h4>
                <p className="text-[10px] text-emerald-100 truncate">नकद बिक्री राशि बैंक में जमा करें</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickCashDeposit}
              className="px-3 py-2 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 text-xs font-black rounded-xl shadow-md shrink-0 flex items-center gap-1 cursor-pointer transition"
            >
              <span>+ नकद जमा</span>
            </button>
          </div>

          {/* Action 2: Bank-to-Bank / CC Limit Fund Transfer */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🔄
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate">बैंक-टू-बैंक ट्रांसफर</h4>
                <p className="text-[10px] text-blue-100 truncate">करंट ➡️ CC लिमिट या बैंक ➡️ बैंक</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTransferModal()}
              className="px-3 py-2 bg-white text-blue-950 hover:bg-blue-50 active:scale-95 text-xs font-black rounded-xl shadow-md shrink-0 flex items-center gap-1 cursor-pointer transition"
            >
              <span>🔄 ट्रांसफर करें</span>
            </button>
          </div>
        </div>


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
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-0.5">कोई बैंक खाता नहीं मिला</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  यहाँ अपना करंट अकाउंट या CC लिमिट जोड़ें, या सीधे दुकान के गल्ले का नकद बैंक में जमा करें।
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleQuickCashDeposit}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md cursor-pointer transition"
                >
                  💵 तुरंत नकद जमा करें
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setIsFormOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold cursor-pointer transition border border-slate-200"
                >
                  <Plus size={14} /> + पूरा खाता जोड़ें
                </button>
              </div>
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
                        {acc.accountName && (
                          <p className="text-[11px] font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                            <span className="text-slate-400 font-medium">खाताधारक:</span>
                            <span className="text-slate-900">{acc.accountName}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {acc.accountNumber ? `A/C: ••••${String(acc.accountNumber).slice(-4)}` : "अकाउंट नंबर दर्ज नहीं"}
                          {acc.ifscCode ? ` • IFSC: ${acc.ifscCode}` : ""}
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

                  {/* CC 3-BOX SYSTEM */}
                  {(isCC || acc.hasCcLimit) && (
                    <div className="bg-slate-50/90 rounded-2xl p-3 space-y-2.5 border border-slate-200/90 shadow-2xs">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {/* Box 1: कुल स्वीकृत लिमिट */}
                        <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-200/70 flex flex-col justify-center">
                          <span className="text-[10px] text-blue-700 font-bold block leading-tight">1. कुल CC लिमिट</span>
                          <span className="text-xs font-black text-blue-900 mt-1">₹{limit.toLocaleString("en-IN")}</span>
                        </div>

                        {/* Box 2: लिया गया कर्ज़ / निकाला पैसा */}
                        <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-200/70 flex flex-col justify-center">
                          <span className="text-[10px] text-rose-700 font-bold block leading-tight">2. लिया कर्ज़ (Used)</span>
                          <span className="text-xs font-black text-rose-600 mt-1">₹{out.toLocaleString("en-IN")}</span>
                        </div>

                        {/* Box 3: उपलब्ध शेष राशि / बची लिमिट */}
                        <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-200/70 flex flex-col justify-center">
                          <span className="text-[10px] text-emerald-700 font-bold block leading-tight">3. शेष उपलब्ध</span>
                          <span className="text-xs font-black text-emerald-700 mt-1">₹{avail.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Meter Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-0.5">
                          <span>उपयोग: {pct}%</span>
                          <span>बची लिमिट: {100 - pct > 0 ? 100 - pct : 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
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

                  {/* Action Buttons: 5 Grid */}
                  <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenTx(acc, "DEPOSIT")}
                      className="py-2 px-0.5 rounded-xl bg-emerald-50 active:bg-emerald-100 text-emerald-700 text-[10px] font-black flex flex-col items-center justify-center gap-0.5 cursor-pointer border border-emerald-200"
                      title="पैसे जमा करें"
                    >
                      <ArrowDownRight size={13} />
                      <span>जमा</span>
                    </button>
                    <button
                      onClick={() => handleOpenTx(acc, "WITHDRAWAL")}
                      className="py-2 px-0.5 rounded-xl bg-rose-50 active:bg-rose-100 text-rose-700 text-[10px] font-black flex flex-col items-center justify-center gap-0.5 cursor-pointer border border-rose-200"
                      title="निकासी या खर्च दर्ज करें"
                    >
                      <ArrowUpRight size={13} />
                      <span>निकासी</span>
                    </button>
                    <button
                      onClick={() => handleOpenTransferModal(acc)}
                      className="py-2 px-0.5 rounded-xl bg-blue-50 active:bg-blue-100 text-blue-700 text-[10px] font-black flex flex-col items-center justify-center gap-0.5 cursor-pointer border border-blue-200"
                      title="इस खाते से दूसरे बैंक में ट्रांसफर करें"
                    >
                      <RefreshCw size={13} />
                      <span>ट्रांसफर</span>
                    </button>
                    <button
                      onClick={() => handleOpenQrModal(acc)}
                      className="py-2 px-0.5 rounded-xl bg-indigo-50 active:bg-indigo-100 text-indigo-700 text-[10px] font-black flex flex-col items-center justify-center gap-0.5 cursor-pointer border border-indigo-200"
                      title="UPI QR कोड दिखाएं व WhatsApp शेयर करें"
                    >
                      <QrCode size={13} />
                      <span>QR शेयर</span>
                    </button>
                    <button
                      onClick={() => setHistoryAcc(acc)}
                      className="py-2 px-0.5 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                      title="लेन-देन इतिहास देखें"
                    >
                      <Clock size={13} />
                      <span>इतिहास</span>
                    </button>
                  </div>

                  {/* History & Edit bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-1">
                    <button
                      onClick={() => handleOpenMonthlyInterest(acc)}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px] truncate"
                    >
                      <Percent size={12} /> ब्याज इतिहास ({((acc.monthlyInterests || []).length)})
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer border border-blue-200"
                        title="खाता विवरण संपादित करें"
                      >
                        <Edit2 size={13} /> <span>संपादित करें</span>
                      </button>
                      <button
                        onClick={() => handleDelete(id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer border border-rose-200"
                        title="खाता हटाएं"
                      >
                        <Trash2 size={13} /> <span>हटाएं</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Button - hidden when form drawer is open */}
      {!isFormOpen && !isTxOpen && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-40">
          {accounts.length === 0 ? (
            <button
              onClick={handleQuickCashDeposit}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              💵 तुरंत नकद जमा करें (Quick Cash Deposit)
            </button>
          ) : (
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={18} /> + नया बैंक या CC लिमिट खाता जोड़ें
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Bank Account Drawer - Mobile First with Sticky Footer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header (Fixed at top) */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white">
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

            {toast && isFormOpen && (
              <div className={`mx-4 mt-3 p-2.5 rounded-xl text-xs font-black flex items-center justify-between shadow-xs shrink-0 ${
                toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-300" : "bg-rose-50 text-rose-800 border border-rose-300"
              }`}>
                <span>{toast.text}</span>
                <button type="button" onClick={() => setToast(null)} className="p-0.5 text-slate-500 hover:text-slate-800">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form id="bankAccountForm" onSubmit={handleSaveAccount} noValidate className="flex-1 overflow-y-auto p-4 space-y-3">
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

              {/* Bank Name & Account Holder Name (2 Inputs) */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक का नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. State Bank of India, HDFC Bank, ICICI"
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    खाताधारक / फर्म का नाम (Account Holder Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. आपकी फर्म का नाम या आपका नाम (उदा. Ankush Bani)"
                    value={formData.accountName}
                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
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

              {/* CC Limit Toggle Question */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800">क्या इस खाते पर CC / OD लिमिट है?</span>
                    <p className="text-[10px] text-slate-500">बैंक से स्वीकृत ओवरड्राफ्ट या कैश क्रेडिट लोन लिमिट</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasCcLimit: false, accountType: formData.accountType === "CC_OVERDRAFT" ? "CURRENT" : formData.accountType })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        !formData.hasCcLimit && formData.accountType !== "CC_OVERDRAFT"
                          ? "bg-slate-700 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      नहीं
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasCcLimit: true, accountType: formData.accountType === "SAVINGS" ? "CC_OVERDRAFT" : formData.accountType })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        formData.hasCcLimit || formData.accountType === "CC_OVERDRAFT"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      हाँ (CC है)
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditional Limits for CC vs Balances for Regular Account */}
              {(formData.hasCcLimit || formData.accountType === "CC_OVERDRAFT") ? (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
                    <CreditCard size={14} />
                    <span>CC लिमिट 3-बॉक्स विवरण (₹)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Box 1: कुल स्वीकृत CC लिमिट */}
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        1. कुल स्वीकृत CC लिमिट (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder="उदा. 1000000"
                        value={formData.sanctionedLimit}
                        onChange={e => setFormData({ ...formData, sanctionedLimit: e.target.value })}
                        className="w-full text-sm font-black px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-blue-800"
                      />
                    </div>

                    {/* Box 2: लिया गया कर्ज़ / निकाला गया पैसा */}
                    <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                      <label className="block text-[11px] font-bold text-rose-900 mb-1">
                        2. लिया कर्ज़ / निकाला (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="उदा. 400000"
                        value={formData.currentOutstanding}
                        onChange={e => setFormData({ ...formData, currentOutstanding: e.target.value })}
                        className="w-full text-sm font-black px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-rose-600"
                      />
                    </div>

                    {/* Box 3: उपलब्ध शेष राशि (Auto-Calculated) */}
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-300 shadow-2xs flex flex-col justify-between">
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        3. उपलब्ध शेष राशि (₹)
                      </label>
                      <div className="text-sm font-black text-emerald-700 py-1.5 px-2 bg-white/90 rounded-lg border border-emerald-200">
                        ₹{Math.max(0, (Number(formData.sanctionedLimit) || 0) - (Number(formData.currentOutstanding) || 0)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">वार्षिक ब्याज दर (% p.a.)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="उदा. 8.5"
                        value={formData.interestRate}
                        onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI ID (QR पेमेंट हेतु)</label>
                      <input
                        type="text"
                        placeholder="उदा. business@sbi"
                        value={formData.upiId}
                        onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (QR पेमेंट हेतु)</label>
                    <input
                      type="text"
                      placeholder="उदा. business@sbi या 9876543210@paytm"
                      value={formData.upiId}
                      onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* STICKY FOOTER BUTTONS - ALWAYS 100% VISIBLE ON MOBILE PWA! */}
            <div className="p-3.5 bg-white border-t border-slate-200 shadow-xl flex items-center gap-2.5 shrink-0 safe-bottom">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold active:bg-slate-100 cursor-pointer text-center"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                form="bankAccountForm"
                disabled={saving}
                className="flex-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                {saving ? "सहेज रहे हैं..." : "💾 खाता सहेजें (Save Bank)"}
              </button>
            </div>
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
              {/* Account Selector if multiple accounts exist */}
              {accounts.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता चुनें (Select Bank Account) *</label>
                  <select
                    value={selectedAccForTx._id || selectedAccForTx.id}
                    onChange={(e) => {
                      const found = accounts.find(a => (a._id || a.id) === e.target.value);
                      if (found) setSelectedAccForTx(found);
                    }}
                    className="w-full text-xs font-bold px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                  >
                    {accounts.map(a => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.bankName || a.accountName} ({a.accountType === "CURRENT" ? "करंट" : a.accountType === "PERSONAL_BUSINESS" ? "पर्सनल" : a.accountType === "CC_OVERDRAFT" ? "CC" : "बचत"}) - ₹{Number(a.balance || a.currentBalance || 0).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* 🔄 BANK-TO-BANK FUND TRANSFER MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg font-black">
                  🔄
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">बैंक ट्रांसफर (Fund Transfer)</h3>
                  <p className="text-[11px] text-slate-500">एक बैंक से दूसरे बैंक / CC लिमिट में रकम ट्रांसफर करें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBankTransfer} className="space-y-3.5">
              {/* From Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  १. किस बैंक खाते से पैसे निकालें (From Bank) *
                </label>
                <select
                  required
                  value={transferData.fromAccId}
                  onChange={(e) => setTransferData({ ...transferData, fromAccId: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-slate-900"
                >
                  <option value="">-- भेजने वाला बैंक चुनें --</option>
                  {accounts.map(a => {
                    const aId = a._id || a.id;
                    const isCC = a.accountType === "CC_OVERDRAFT";
                    const bal = Number(a.balance || a.currentBalance || 0);
                    const out = Number(a.currentOutstanding || 0);
                    const limit = Number(a.sanctionedLimit || 0);
                    const avail = Math.max(0, limit - out);
                    return (
                      <option key={aId} value={aId}>
                        {a.bankName || a.accountName} ({isCC ? "CC लिमिट" : "करंट/सेविंग्स"}) - {isCC ? `उपलब्ध: ₹${avail.toLocaleString("en-IN")}` : `बैलेंस: ₹${bal.toLocaleString("en-IN")}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* To Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  २. किस बैंक खाते में पैसे जमा करें (To Bank) *
                </label>
                <select
                  required
                  value={transferData.toAccId}
                  onChange={(e) => setTransferData({ ...transferData, toAccId: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-900"
                >
                  <option value="">-- पाने वाला बैंक चुनें --</option>
                  {accounts
                    .filter(a => (a._id || a.id) !== transferData.fromAccId)
                    .map(a => {
                      const aId = a._id || a.id;
                      const isCC = a.accountType === "CC_OVERDRAFT";
                      const bal = Number(a.balance || a.currentBalance || 0);
                      const out = Number(a.currentOutstanding || 0);
                      return (
                        <option key={aId} value={aId}>
                          {a.bankName || a.accountName} ({isCC ? "CC लिमिट" : "करंट/सेविंग्स"}) - {isCC ? `बकाया कर्ज़: ₹${out.toLocaleString("en-IN")}` : `बैलेंस: ₹${bal.toLocaleString("en-IN")}`}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Transfer Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ३. ट्रांसफर राशि (₹ Amount) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-lg font-black text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Date & Reference */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    value={transferData.date}
                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / चेक नं. (Ref No.)</label>
                  <input
                    type="text"
                    placeholder="उदा. UTR12345"
                    value={transferData.referenceNo}
                    onChange={(e) => setTransferData({ ...transferData, referenceNo: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Remarks / Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">विवरण / नोट (Remarks)</label>
                <input
                  type="text"
                  placeholder="उदा. चालू खाते से CC लिमिट में कर्ज़ अदायगी ट्रांसफर"
                  value={transferData.note}
                  onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={processingTransfer}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition active:scale-95"
                >
                  {processingTransfer ? <RefreshCw size={14} className="animate-spin" /> : <span>🔄 तुरंत ट्रांसफर करें</span>}
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

      {/* UPI Payment QR Code & Share Modal */}
      {isQrOpen && selectedAccForQr && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">UPI पेमेंट QR कोड</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {selectedAccForQr.bankName || selectedAccForQr.accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsQrOpen(false); setSelectedAccForQr(null); }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* QR Display Card */}
            <div className="bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 p-4 rounded-2xl border border-indigo-100/80 flex flex-col items-center text-center shadow-2xs">
              <span className="text-[11px] font-black text-indigo-900 mb-0.5">
                {selectedCompany?.name || "व्यापार पेमेंट"}
              </span>
              <span className="text-[10px] text-slate-500 mb-3">
                {selectedAccForQr.bankName} {selectedAccForQr.accountNumber ? `(••••${String(selectedAccForQr.accountNumber).slice(-4)})` : ""}
              </span>

              {/* QR Image */}
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                <img
                  src={getAccountQrUrl(selectedAccForQr, qrAmount)}
                  alt="UPI QR Code"
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>

              {/* UPI ID display & copy */}
              <div className="mt-3 flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs w-full">
                <span className="text-xs font-mono font-bold text-slate-800 truncate">
                  {getAccountUpiId(selectedAccForQr)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(getAccountUpiId(selectedAccForQr));
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer shrink-0"
                  title="UPI ID कॉपी करें"
                >
                  {copiedUpi ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} />}
                </button>
              </div>
              {copiedUpi && <span className="text-[10px] text-emerald-600 font-bold mt-1">✓ UPI ID कॉपी हो गई!</span>}
            </div>

            {/* Optional Specific Amount Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                मांग की राशि (₹) <span className="text-slate-400 font-normal">- वैकल्पिक</span>
              </label>
              <input
                type="number"
                placeholder="खाली छोड़ें या राशि दर्ज करें (उदा. 1500)"
                value={qrAmount}
                onChange={e => setQrAmount(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                यदि आप राशि डालेंगे तो ग्राहक के स्कैनर में यही राशि पहले से भरी आएगी।
              </p>
            </div>

            {/* Share & Download Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => shareAccountWhatsApp(selectedAccForQr, qrAmount)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>💬 WhatsApp पर पेमेंट QR शेयर करें</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={getAccountQrUrl(selectedAccForQr, qrAmount)}
                  download={`UPI_QR_${selectedAccForQr.bankName || "Account"}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> डाउनलोड QR
                </a>
                <button
                  type="button"
                  onClick={() => { setIsQrOpen(false); setSelectedAccForQr(null); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
