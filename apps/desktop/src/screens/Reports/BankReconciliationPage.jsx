import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Building2, 
  Plus, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Wallet, 
  RefreshCw, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  Check, 
  Sparkles, 
  Scale, 
  Zap, 
  Layers, 
  Search,
  ExternalLink,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import * as XLSX from 'xlsx';

export default function BankReconciliationPage() {
  const { selectedCompany } = useCompany() || {};
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  // Active View Tab: "reconciliation" | "accounts" | "feeds"
  const [activeTab, setActiveTab] = useState("reconciliation");

  // Reconciliation Results & Upload State
  const [file, setFile] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [results, setResults] = useState(null);
  const [statementBalanceInput, setStatementBalanceInput] = useState("");
  const [activeResultsSubTab, setActiveResultsSubTab] = useState("matched"); // "matched" | "unmatched"

  // 1-Click Post Missing Entry Modal
  const [postingEntry, setPostingEntry] = useState(null); // entry being posted
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    category: "बैंक चार्ज व अन्य व्यय (Bank Charges & Fees)",
    entryType: "expense",
    notes: ""
  });
  const [savingPost, setSavingPost] = useState(false);

  // Print BRS Modal
  const [showPrintBrs, setShowPrintBrs] = useState(false);

  // Add Bank Account Modal
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankData, setNewBankData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    accountType: 'CURRENT',
    openingBalance: '',
    sanctionedLimit: '',
    hasCcLimit: false,
    isDefaultUPI: false
  });
  const [savingBank, setSavingBank] = useState(false);

  // Fetch Bank Accounts
  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get('/api/bank-accounts');
      const accounts = Array.isArray(res?.accounts) 
        ? res.accounts 
        : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0]);
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [selectedCompany]);

  // Handle Bank Account Switch
  const handleSelectAccount = (accId) => {
    const acc = bankAccounts.find(a => (a._id || a.id) === accId);
    if (acc) setSelectedAccount(acc);
  };

  // Live Bank Feeds Auto-Sync
  const handleSyncLiveFeeds = async () => {
    try {
      setReconciling(true);
      const accId = selectedAccount?._id || selectedAccount?.id;
      const res = await api.get(`/api/bank-rec/feeds${accId ? `/${accId}` : ''}`);
      const feeds = res.data?.feeds || [];

      if (feeds.length === 0) {
        alert("कोई लाइव बैंक प्रविष्टियां नहीं मिलीं");
        return;
      }

      // Automatically reconcile against live feeds
      const recRes = await api.post('/api/bank-rec/reconcile', {
        bankAccountId: accId,
        statementEntries: feeds,
        statementClosingBalance: feeds[feeds.length - 1]?.balance
      });

      if (recRes.data?.success) {
        setResults(recRes.data.data);
      }
    } catch (err) {
      console.error("Live feed sync error:", err);
      alert("बैंक फीड्स सिंक करने में त्रुटि: " + (err.response?.data?.error || err.message));
    } finally {
      setReconciling(false);
    }
  };

  // Universal File Upload & Reconcile (Excel / CSV)
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const processStatementAndReconcile = () => {
    if (!file) return alert("कृपया पहले बैंक स्टेटमेंट फ़ाइल (Excel या CSV) चुनें!");

    setReconciling(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        let entries = [];
        const data = e.target.result;

        // If Excel (.xlsx or .xls)
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          entries = parseJsonRowsToEntries(jsonRows);
        } else {
          // If CSV / TXT
          const text = new TextDecoder('utf-8').decode(new Uint8Array(data));
          const lines = text.split('\n');
          entries = parseCsvLinesToEntries(lines);
        }

        if (entries.length === 0) {
          alert("स्टेटमेंट में कोई मान्य प्रविष्टियां नहीं मिलीं। कृपया फ़ाइल का प्रारूप जांचें।");
          setReconciling(false);
          return;
        }

        const accId = selectedAccount?._id || selectedAccount?.id;
        const recRes = await api.post('/api/bank-rec/reconcile', {
          bankAccountId: accId,
          statementEntries: entries,
          statementClosingBalance: statementBalanceInput ? parseFloat(statementBalanceInput) : undefined
        });

        if (recRes.data?.success) {
          setResults(recRes.data.data);
          alert(`✅ समाधान पूर्ण! ${recRes.data.data.brsSummary.matchedCount} प्रविष्टियां स्वतः मिलान हुईं।`);
        }
      } catch (err) {
        console.error("Statement processing error:", err);
        alert("स्टेटमेंट प्रोसेस करने में त्रुटि: " + (err.response?.data?.error || err.message));
      } finally {
        setReconciling(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Intelligent CSV Parser for Indian Banks
  const parseCsvLinesToEntries = (lines) => {
    const entries = [];
    if (lines.length < 2) return entries;

    const header = lines[0].toLowerCase().split(',');
    const dateIdx = header.findIndex(h => h.includes('date') || h.includes('दिनांक'));
    const descIdx = header.findIndex(h => h.includes('desc') || h.includes('particular') || h.includes('narration') || h.includes('विवरण'));
    const debitIdx = header.findIndex(h => h.includes('debit') || h.includes('dr') || h.includes('withdrawal') || h.includes('नाम'));
    const creditIdx = header.findIndex(h => h.includes('credit') || h.includes('cr') || h.includes('deposit') || h.includes('जमा'));
    const refIdx = header.findIndex(h => h.includes('ref') || h.includes('chq') || h.includes('utr') || h.includes('चेक'));
    const balIdx = header.findIndex(h => h.includes('bal') || h.includes('शेष'));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');

      const dStr = dateIdx >= 0 ? cols[dateIdx]?.trim() : cols[0]?.trim();
      const desc = descIdx >= 0 ? cols[descIdx]?.trim() : (cols[1]?.trim() || "बैंक लेनदेन");
      const dr = debitIdx >= 0 ? parseFloat(cols[debitIdx]) || 0 : 0;
      const cr = creditIdx >= 0 ? parseFloat(cols[creditIdx]) || 0 : 0;
      const ref = refIdx >= 0 ? cols[refIdx]?.trim() : "";
      const bal = balIdx >= 0 ? parseFloat(cols[balIdx]) : undefined;

      if (dr > 0) {
        entries.push({ date: dStr, description: desc, amount: dr, type: 'debit', referenceNo: ref, balance: bal });
      } else if (cr > 0) {
        entries.push({ date: dStr, description: desc, amount: cr, type: 'credit', referenceNo: ref, balance: bal });
      }
    }
    return entries;
  };

  // Intelligent JSON Row Parser (from Excel)
  const parseJsonRowsToEntries = (rows) => {
    const entries = [];
    rows.forEach(r => {
      const keys = Object.keys(r);
      const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('दिनांक'));
      const descKey = keys.find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('particular') || k.toLowerCase().includes('narration'));
      const drKey = keys.find(k => k.toLowerCase().includes('debit') || k.toLowerCase().includes('dr') || k.toLowerCase().includes('withdrawal'));
      const crKey = keys.find(k => k.toLowerCase().includes('credit') || k.toLowerCase().includes('cr') || k.toLowerCase().includes('deposit'));
      const refKey = keys.find(k => k.toLowerCase().includes('ref') || k.toLowerCase().includes('chq') || k.toLowerCase().includes('utr'));
      const balKey = keys.find(k => k.toLowerCase().includes('bal'));

      const dStr = dateKey ? r[dateKey] : Object.values(r)[0];
      const desc = descKey ? r[descKey] : "बैंक लेनदेन";
      const dr = drKey ? parseFloat(r[drKey]) || 0 : 0;
      const cr = crKey ? parseFloat(r[crKey]) || 0 : 0;
      const ref = refKey ? String(r[refKey]) : "";
      const bal = balKey ? parseFloat(r[balKey]) : undefined;

      if (dr > 0) {
        entries.push({ date: dStr, description: desc, amount: dr, type: 'debit', referenceNo: ref, balance: bal });
      } else if (cr > 0) {
        entries.push({ date: dStr, description: desc, amount: cr, type: 'credit', referenceNo: ref, balance: bal });
      }
    });
    return entries;
  };

  // 1-Click Post Missing Entry
  const handleOpenPostModal = (entry) => {
    setPostingEntry(entry);
    setPostForm({
      category: entry.type === 'debit' ? "बैंक चार्ज व अन्य व्यय (Bank Charges & Fees)" : "अन्य व्यावसायिक आय (Other Income)",
      entryType: entry.type === 'debit' ? "expense" : "receipt",
      notes: entry.description || ""
    });
    setShowPostModal(true);
  };

  const handleSaveMissingEntry = async (e) => {
    e.preventDefault();
    if (!postingEntry) return;

    setSavingPost(true);
    try {
      const payload = {
        entryType: postForm.entryType,
        amount: postingEntry.amount,
        date: postingEntry.date,
        description: postForm.notes,
        category: postForm.category,
        bankAccountId: selectedAccount?._id || selectedAccount?.id
      };

      const res = await api.post('/api/bank-rec/post-entry', payload);
      alert(`✅ ${res.data?.message || "प्रविष्टि बहीखाते में दर्ज हो गई!"}`);

      // Move this item from unmatched to matched locally
      setResults(prev => {
        if (!prev) return prev;
        const newUnmatched = prev.unmatched.filter(u => u !== postingEntry);
        const newMatched = [
          ...prev.matched,
          {
            statementEntry: postingEntry,
            matchDetails: {
              model: postForm.entryType === 'expense' ? 'Expance' : 'BankAccount',
              label: `${postForm.entryType === 'expense' ? 'खर्च' : 'जमा'}: ${postForm.category}`,
              confidence: 'exact'
            }
          }
        ];
        return {
          ...prev,
          unmatched: newUnmatched,
          matched: newMatched,
          brsSummary: {
            ...prev.brsSummary,
            matchedCount: newMatched.length,
            unmatchedCount: newUnmatched.length
          }
        };
      });

      setShowPostModal(false);
      setPostingEntry(null);
      fetchBankAccounts();
    } catch (err) {
      alert("प्रविष्टि सहेजने में विफल: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingPost(false);
    }
  };

  // Download Sample Statement CSV
  const handleDownloadSampleCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleRows = [
      'Date,Description,ReferenceNo,Debit,Credit,Balance',
      `${today},UPI/CR/431209823122/Customer Payment,UPI4312098231,,4500.00,14500.00`,
      `${today},NEFT/DR/N029384920/Asian Paints Raw Material,N029384920,2500.00,,12000.00`,
      `${today},CHG/SMS ALERT CHARGES Q3 2026,CHG882910,17.70,,11982.30`,
      `${today},CASH DEP/BR Raipur Main/Self Slip 449,DEP449102,,10000.00,21982.30`
    ].join('\n');

    const blob = new Blob([sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_bank_statement_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export BRS Summary to Excel
  const handleExportBrsExcel = () => {
    if (!results) return alert("पहले बैंक स्टेटमेंट समाधान चलाएं!");
    const wb = XLSX.utils.book_new();

    const rows = [
      ["गणेश हार्डवेयर - बैंक समाधान विवरण (Bank Reconciliation Statement)"],
      [`बैंक खाता: ${selectedAccount?.bankName} (${selectedAccount?.accountNumber})`],
      [`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`],
      [""],
      ["विवरण (BRS Parameter)", "राशि (₹)"],
      ["बहीखाता अनुसार बैंक शेष (Balance as per Books)", results.brsSummary.booksBalance],
      ["बैंक पासबुक अनुसार शेष (Balance as per Statement)", results.brsSummary.statementBalance],
      ["समाधान अंतर (Reconciliation Difference)", results.brsSummary.difference],
      ["स्थिति (Status)", results.brsSummary.isBalanced ? "पूर्णतः संतुलित (Balanced)" : "असमायोजित अंतर"],
      [""],
      ["क्र.", "दिनांक", "विवरण (Narration)", "रेफरेंस नं.", "डेबिट (₹)", "क्रेडिट (₹)", "मिलान स्थिति", "बहीखाता मैच प्रविष्टि"]
    ];

    results.matched.forEach((m, idx) => {
      rows.push([
        idx + 1,
        m.statementEntry.date,
        m.statementEntry.description,
        m.statementEntry.referenceNo || "-",
        m.statementEntry.type === 'debit' ? m.statementEntry.amount : "",
        m.statementEntry.type === 'credit' ? m.statementEntry.amount : "",
        "✓ 100% मिलान (Matched)",
        m.matchDetails?.label || m.matchDetails?.model
      ]);
    });

    results.unmatched.forEach((u, idx) => {
      rows.push([
        results.matched.length + idx + 1,
        u.date,
        u.description,
        u.referenceNo || "-",
        u.type === 'debit' ? u.amount : "",
        u.type === 'credit' ? u.amount : "",
        "⚠️ बहीखाते में अनुपलब्ध (Unmatched)",
        "छूटी हुई प्रविष्टि"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "BRS_Report");
    XLSX.writeFile(wb, `BRS_${selectedAccount?.bankName || 'Bank'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + Number(b.currentBalance ?? b.balance ?? b.openingBalance ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200/60 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  बैंक समाधान व ऑटो-रीकंसीलिएशन (Bank Reconciliation & BRS)
                </h1>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  ऑटो-टैली इंजन
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                बैंक पासबुक बनाम बहीखाता (Cash Book) का 1-क्लिक समाधान, ऑटो-मैचिंग व BRS प्रिंट रिपोर्ट
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={fetchBankAccounts}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAccounts ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-4 h-4" />
              <span>नमूना स्टेटमेंट</span>
            </button>

            <button
              onClick={handleSyncLiveFeeds}
              disabled={reconciling}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ लाइव बैंक फीड्स सिंक</span>
            </button>
          </div>
        </div>

        {/* Bank Account Selector Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              सक्रिय समाधान बैंक खाता चुनें (Select Bank Account):
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedAccount?._id || selectedAccount?.id || ""}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="w-full md:max-w-md bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {bankAccounts.map(b => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.bankName?.toUpperCase()} - {b.accountNumber} ({b.accountName})
                  </option>
                ))}
              </select>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-2 rounded-xl border border-emerald-200 whitespace-nowrap">
                खाता बैलेंस: ₹{Number(selectedAccount?.currentBalance || selectedAccount?.balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick File Upload Trigger */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <input
              type="file"
              id="statementFile"
              accept=".csv, .xlsx, .xls, .txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="statementFile"
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 transition"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>{file ? file.name.slice(0, 20) + '...' : '📂 बैंक स्टेटमेंट फ़ाइल चुनें'}</span>
            </label>
            <button
              onClick={processStatementAndReconcile}
              disabled={reconciling || !file}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {reconciling ? 'मिलान हो रहा है...' : 'समाधान चलाएं (Auto-Tally)'}
            </button>
          </div>
        </div>

        {/* BRS COMPARISON SUMMARY WIDGET (When reconciled) */}
        {results && (
          <div className="space-y-4">
            
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">बहीखाता शेष (Books Balance)</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  ₹{Number(results.brsSummary.booksBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 mt-1">ऐप में दर्ज बैंक खाता शेष</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">पासबुक शेष (Statement Balance)</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  ₹{Number(results.brsSummary.statementBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 mt-1">बैंक स्टेटमेंट अंतिम शेष</p>
              </div>

              <div className={`p-4 rounded-2xl shadow-sm border ${results.brsSummary.isBalanced ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">समाधान अंतर (BRS Difference)</span>
                <div className={`text-2xl font-black mt-1 ${results.brsSummary.isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹{Math.abs(results.brsSummary.difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs mt-1 text-slate-500">
                  {results.brsSummary.isBalanced ? '✓ पूर्णतः संतुलित' : 'असमायोजित अंतर'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">ऑटो-मैच दर</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-white">
                    {results.brsSummary.matchPercentage}%
                  </div>
                  <p className="text-[11px] text-indigo-300 mt-0.5">
                    {results.brsSummary.matchedCount} / {results.brsSummary.totalEntries} प्रविष्टियां सत्यापित
                  </p>
                </div>
              </div>

            </div>

            {/* Results Review Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Tab Selector & Actions */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/60">
                <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveResultsSubTab("matched")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeResultsSubTab === 'matched' ? 'bg-white text-emerald-800 shadow' : 'text-slate-600'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>सत्यापित मिलान ({results.matched.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveResultsSubTab("unmatched")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeResultsSubTab === 'unmatched' ? 'bg-white text-rose-800 shadow' : 'text-slate-600'}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>छूटी हुई प्रविष्टियां ({results.unmatched.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportBrsExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>BRS एक्सेल डाउनलोड</span>
                  </button>
                  <button
                    onClick={() => setShowPrintBrs(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>BRS प्रिंट (A4)</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {activeResultsSubTab === "matched" ? (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">दिनांक</th>
                        <th className="py-3 px-4">बैंक विवरण (Narration / Ref)</th>
                        <th className="py-3 px-4 text-right">राशि (₹)</th>
                        <th className="py-3 px-4">बहीखाता मिलान प्रविष्टि (Matched In Books)</th>
                        <th className="py-3 px-4 text-center">सटीकता (Confidence)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.matched.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            कोई मिलान नहीं मिला
                          </td>
                        </tr>
                      ) : (
                        results.matched.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                              {new Date(m.statementEntry.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              <div>{m.statementEntry.description}</div>
                              {m.statementEntry.referenceNo && (
                                <span className="text-[11px] font-mono text-slate-400">Ref: {m.statementEntry.referenceNo}</span>
                              )}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${m.statementEntry.type === 'credit' ? 'text-emerald-700' : 'text-slate-800'}`}>
                              {m.statementEntry.type === 'credit' ? '+' : '-'}₹{Number(m.statementEntry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 font-bold text-indigo-700">
                              <span className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {m.matchDetails?.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                {m.matchDetails?.confidence === 'exact' ? '100% सटीक' : 'उच्च मिलान'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* UNMATCHED TABLE WITH 1-CLICK POST BUTTON */
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-rose-50/80 text-rose-900 font-bold border-b border-rose-200">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">दिनांक</th>
                        <th className="py-3 px-4">बैंक स्टेटमेंट विवरण (Narration)</th>
                        <th className="py-3 px-4 text-center">प्रकार</th>
                        <th className="py-3 px-4 text-right">राशि (₹)</th>
                        <th className="py-3 px-4 text-center">1-क्लिक समाधान (1-Click Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {results.unmatched.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            ✓ कोई छूटी हुई प्रविष्टि नहीं है! सभी प्रविष्टियां सत्यापित हैं।
                          </td>
                        </tr>
                      ) : (
                        results.unmatched.map((u, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/40">
                            <td className="py-3 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                              {new Date(u.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              <div>{u.description}</div>
                              {u.referenceNo && <span className="text-[11px] font-mono text-slate-400">Ref: {u.referenceNo}</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {u.type === 'credit' ? 'क्रेडिट (जमा)' : 'डेबिट (निकासी)'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ₹{Number(u.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleOpenPostModal(u)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 mx-auto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>बहीखाते में दर्ज करें</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

          </div>
        )}

        {/* MODAL: 1-CLICK POST MISSING ENTRY */}
        {showPostModal && postingEntry && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  छूटी हुई प्रविष्टि बहीखाते में जोड़ें
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMissingEntry} className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">बैंक विवरण:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹{Number(postingEntry.amount).toLocaleString('en-IN')} ({postingEntry.type === 'debit' ? 'डेबिट' : 'क्रेडिट'})
                    </span>
                  </div>
                  <p className="text-slate-600 font-semibold">{postingEntry.description}</p>
                </div>

                {postingEntry.type === 'debit' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">खर्च की श्रेणी (Expense Category) *</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="बैंक चार्ज व अन्य व्यय (Bank Charges & Fees)">बैंक चार्ज व SMS फीस (Bank Charges)</option>
                      <option value="बिजली बिल (Electricity Bill)">बिजली बिल (Electricity Bill)</option>
                      <option value="दुकान किराया (Shop Rent)">दुकान किराया (Shop Rent)</option>
                      <option value="स्टाफ सैलरी (Staff Salary)">स्टाफ वेतन / मजदूरी (Salaries)</option>
                      <option value="ट्रांसपोर्ट/भाड़ा (Freight & Cartage)">ट्रांसपोर्ट / माल भाड़ा</option>
                      <option value="अन्य व्यावसायिक व्यय (General Expenses)">अन्य व्यावसायिक व्यय</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">जमा का प्रकार (Receipt Type) *</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ग्राहक प्रत्यक्ष UPI/बैंक जमा (Customer Direct Deposit)">ग्राहक प्रत्यक्ष UPI/बैंक जमा</option>
                      <option value="बैंक ब्याज आय (Bank Interest Credited)">बैंक बचत/FD ब्याज आय (Interest)</option>
                      <option value="मालिक अतिरिक्त पूंजी जमा (Capital Inflow)">मालिक अतिरिक्त पूंजी जमा</option>
                      <option value="अन्य व्यावसायिक आय (Other Income)">अन्य विविध आय</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">टिप्पणी / विवरण (Notes)</label>
                  <input
                    type="text"
                    value={postForm.notes}
                    onChange={(e) => setPostForm({ ...postForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={savingPost}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    {savingPost ? 'सहेज रहे हैं...' : 'दर्ज करें व मिलान करें'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PRINT BRS A4 REPORT */}
        {showPrintBrs && results && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <span className="font-bold text-slate-800">बैंक समाधान विवरण (BRS Report Preview)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>प्रिंट करें (Print A4)</span>
                  </button>
                  <button onClick={() => setShowPrintBrs(false)} className="p-2 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* A4 PRINTABLE CONTENT */}
              <div className="p-6 bg-white text-slate-900 space-y-4 font-sans text-xs sm:text-sm">
                
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <h1 className="text-2xl font-black uppercase tracking-wide">गणेश हार्डवेयर (Ganesh Hardware)</h1>
                  <p className="text-xs text-slate-600">बैंक समाधान विवरण (Bank Reconciliation Statement - BRS)</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    बैंक: {selectedAccount?.bankName?.toUpperCase()} • खाता संख्या: {selectedAccount?.accountNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    समाधान तिथि: {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* BRS Financial Statement Box */}
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="p-2.5 border-r border-slate-300">विवरण (Particulars)</th>
                      <th className="p-2.5 text-right w-40">राशि (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold">1. बहीखाते अनुसार बैंक शेष (Balance as per Cash Book)</td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        ₹{Number(results.brsSummary.booksBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-600 pl-6">
                        (+) सत्यापित क्रेडिट प्रविष्टियां (Reconciled Bank Deposits)
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">
                        +₹{results.matched.filter(m => m.statementEntry.type === 'credit').reduce((s, m) => s + m.statementEntry.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-600 pl-6">
                        (-) सत्यापित डेबिट प्रविष्टियां (Reconciled Withdrawals & Expenses)
                      </td>
                      <td className="p-2.5 text-right font-mono text-rose-700">
                        -₹{results.matched.filter(m => m.statementEntry.type === 'debit').reduce((s, m) => s + m.statementEntry.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2.5">2. बैंक पासबुक अनुसार अंतिम शेष (Balance as per Bank Statement)</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-900">
                        ₹{Number(results.brsSummary.statementBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className={results.brsSummary.isBalanced ? "bg-emerald-50 font-bold" : "bg-rose-50 font-bold"}>
                      <td className="p-2.5">3. समाधान अंतर (Net Difference)</td>
                      <td className="p-2.5 text-right font-mono font-black">
                        {results.brsSummary.isBalanced ? "₹0.00 (पूर्णतः संतुलित)" : `₹${results.brsSummary.difference}`}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Audit Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold">हस्ताक्षर - अकाउंटेंट / मुंशी</p>
                    <p className="text-[10px] text-slate-400">बैंक समाधान सत्यापित</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold">हस्ताक्षर - प्रोप्राइटर / CA</p>
                    <p className="text-[10px] text-slate-400">गणेश हार्डवेयर</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
