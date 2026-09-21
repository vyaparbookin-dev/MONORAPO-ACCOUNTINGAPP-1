import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Building2, Plus, Download, UploadCloud, CheckCircle2, AlertTriangle, 
  CreditCard, Wallet, RefreshCw, X, ArrowUpRight, ArrowDownRight, QrCode, FileText 
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export default function BankReconciliationPage() {
  const { selectedCompany } = useCompany() || {};
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  // Add Account Modal
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

  // Quick Bank Transaction (Deposit / UPI Inflow / Withdrawal)
  const [selectedBankForTx, setSelectedBankForTx] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    type: 'deposit', // 'deposit' or 'withdrawal'
    amount: '',
    note: '',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [savingTx, setSavingTx] = useState(false);

  // Set Default UPI Account
  const handleSetDefaultUPI = async (bank) => {
    try {
      const id = bank._id || bank.id;
      if (id) {
        await api.put(`/api/bank-accounts/${id}`, { isDefaultUPI: true });
      }
      // Update local cache
      const updated = bankAccounts.map(b => ({
        ...b,
        isDefaultUPI: (b._id === id || b.id === id)
      }));
      setBankAccounts(updated);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vb_local_bank_accounts', JSON.stringify(updated));
      }
      alert(`✅ ${bank.bankName || bank.accountName} को मुख्य UPI खाता सेट कर दिया गया!`);
      fetchBankAccounts();
    } catch (err) {
      console.error("Error setting default UPI:", err);
      alert("मुख्य UPI सेट करने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };

  // Reconciliation Upload State
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Fetch Bank Accounts from Server and Local Storage (Same logic as Mobile)
  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    try {
      let serverAccounts = [];
      try {
        const res = await api.get('/api/bank-accounts');
        serverAccounts = Array.isArray(res?.accounts) ? res.accounts : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch (e) {}

      let localAccounts = [];
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('vb_local_bank_accounts');
          if (stored) localAccounts = JSON.parse(stored) || [];
        }
      } catch (e) {}

      if (serverAccounts.length === 0 && localAccounts.length === 0 && selectedCompany?.bankName) {
        localAccounts.push({
          _id: 'co_bank_default',
          id: 'co_bank_default',
          accountName: selectedCompany.accountName || selectedCompany.bankName,
          bankName: selectedCompany.bankName,
          accountNumber: selectedCompany.accountNumber || '',
          accountType: 'CURRENT',
          openingBalance: 0,
          currentBalance: 0
        });
      }

      const map = new Map();
      serverAccounts.forEach(item => {
        const id = item._id || item.id || item.clientTempId;
        if (id) map.set(String(id), item);
      });
      localAccounts.forEach(item => {
        const id = item._id || item.id || item.clientTempId;
        if (id && !map.has(String(id))) map.set(String(id), item);
      });

      setBankAccounts(Array.from(map.values()));
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [selectedCompany]);

  // Handle Add Bank Account
  const handleSaveBankAccount = async (e) => {
    e.preventDefault();
    if (!newBankData.bankName.trim() || !newBankData.accountName.trim()) {
      alert('कृपया बैंक का नाम और खाता धारक का नाम दर्ज करें!');
      return;
    }
    setSavingBank(true);
    try {
      const payload = {
        ...newBankData,
        openingBalance: parseFloat(newBankData.openingBalance) || 0,
        currentBalance: parseFloat(newBankData.openingBalance) || 0,
        sanctionedLimit: parseFloat(newBankData.sanctionedLimit) || 0
      };
      await api.post('/api/bank-accounts', payload);
      alert('✅ नया बैंक खाता सफलतापूर्वक जुड़ गया!');
      setShowAddBankModal(false);
      setNewBankData({
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        accountType: 'CURRENT',
        openingBalance: '',
        sanctionedLimit: '',
        hasCcLimit: false
      });
      fetchBankAccounts();
    } catch (err) {
      alert('बैंक खाता जोड़ने में त्रुटि: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingBank(false);
    }
  };

  // Open Quick Transaction Modal (Deposit/Withdraw/UPI)
  const handleOpenTxModal = (acc, type = 'deposit') => {
    setSelectedBankForTx(acc);
    setTxForm({
      type,
      amount: '',
      note: type === 'deposit' ? 'UPI कलेक्शन / नकद जमा' : 'UPI से भुगतान / खर्च',
      referenceNo: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowTxModal(true);
  };

  // Save Transaction to Bank Account
  const handleSaveTx = async (e) => {
    e.preventDefault();
    if (!selectedBankForTx) return;
    const amt = parseFloat(txForm.amount);
    if (!txForm.amount || isNaN(amt) || amt <= 0) {
      alert('कृपया मान्य राशि दर्ज करें!');
      return;
    }
    setSavingTx(true);
    try {
      const accId = selectedBankForTx._id || selectedBankForTx.id;
      await api.post(`/api/bank-accounts/${accId}/transaction`, {
        type: txForm.type,
        amount: amt,
        note: txForm.note,
        referenceNo: txForm.referenceNo,
        date: txForm.date
      });
      alert(`✅ ₹${amt.toLocaleString('en-IN')} का लेन-देन (${txForm.type === 'deposit' ? 'जमा / UPI Inflow' : 'निकासी / Payout'}) सफलतापूर्वक दर्ज हो गया!`);
      setShowTxModal(false);
      setSelectedBankForTx(null);
      fetchBankAccounts();
    } catch (err) {
      alert('लेन-देन दर्ज करने में त्रुटि: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingTx(false);
    }
  };

  // Download Ready-made Sample CSV for Reconciliation
  const handleDownloadSampleCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleRows = [
      'Date,Description,Debit,Credit',
      `${today},NEFT / UPI Customer Payment,,4500.00`,
      `${today},Supplier Raw Material Payout,2500.00,`,
      `${today},Bank Monthly SMS Charges,17.70,`,
      `${today},Direct Cash Deposit at Branch,,10000.00`
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

  // Handle CSV File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  // Parse CSV File and Run Auto-Tally
  const handleUploadAndReconcile = () => {
    if (!file) return alert('कृपया पहले बैंक की CSV स्टेटमेंट फ़ाइल चुनें!');

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const statementEntries = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (cols.length >= 4) {
          const date = cols[0].trim();
          const description = cols[1].trim();
          const debit = parseFloat(cols[2]) || 0;
          const credit = parseFloat(cols[3]) || 0;

          if (debit > 0) {
            statementEntries.push({ date, description, amount: debit, type: 'debit' });
          } else if (credit > 0) {
            statementEntries.push({ date, description, amount: credit, type: 'credit' });
          }
        }
      }

      if (statementEntries.length === 0) {
        alert('CSV फ़ाइल में कोई मान्य डेटा नहीं मिला। कृपया फॉर्मेट जांचें!');
        setLoading(false);
        return;
      }

      try {
        const response = await api.post('/api/bank-rec/reconcile', { statementEntries });
        const resData = response?.data || response;
        if (resData?.success || resData?.matched) {
          setResults({
            matched: Array.isArray(resData?.matched) ? resData.matched : [],
            unmatched: Array.isArray(resData?.unmatched) ? resData.unmatched : []
          });
        }
      } catch (error) {
        console.error(error);
        alert('Reconciliation Error: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + Number(b.currentBalance ?? b.balance ?? b.openingBalance ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Building2 className="text-indigo-600" size={26} /> बैंक खाते व स्टेटमेंट रिकॉन्सिलिएशन (Banking & Auto-Tally)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              मोबाइल व वेब के सभी बैंक खातों, CC लिमिट व स्टेटमेंट का ऑटोमैटिक मिलान
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBankAccounts}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
              title="रिफ्रेश करें"
            >
              <RefreshCw size={16} className={loadingAccounts ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddBankModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
            >
              <Plus size={16} /> + नया बैंक खाता जोड़ें
            </button>
          </div>
        </div>

        {/* Bank Accounts Section (Directly visible from Mobile sync) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="text-indigo-600" size={18} /> आपके पंजीकृत बैंक खाते (Your Bank Accounts)
              </h2>
              <span className="text-[11px] text-slate-400">
                कुल बैंक बैलेंस: <strong className="text-emerald-700">₹{totalBankBalance.toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
              {bankAccounts.length} बैंक खाते सक्रिय
            </span>
          </div>

          {loadingAccounts ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">बैंक खाते लोड हो रहे हैं...</div>
          ) : bankAccounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-3">अभी कोई बैंक खाता पंजीकृत नहीं है।</p>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                + पहला बैंक खाता जोड़ें
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((acc, idx) => {
                const bal = Number(acc.currentBalance ?? acc.balance ?? acc.openingBalance ?? 0);
                const isCc = acc.accountType === 'CC_OVERDRAFT' || acc.hasCcLimit;

                return (
                  <div key={acc._id || acc.id || idx} className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-3 relative overflow-hidden border border-indigo-500/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                          {isCc ? '💳 CC / OD लिमिट खाता' : '🏛️ ' + (acc.accountType || 'CURRENT')}
                        </span>
                        <h3 className="text-base font-black text-white mt-0.5">{acc.bankName}</h3>
                        <p className="text-xs text-indigo-200">{acc.accountName}</p>
                      </div>
                      <span className="p-2 bg-white/10 rounded-xl">
                        <CreditCard size={18} className="text-indigo-300" />
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-gray-400 block">खाता संख्या</span>
                        <p className="text-xs font-mono font-bold text-gray-200">
                          {acc.accountNumber ? `•••• ${String(acc.accountNumber).slice(-4)}` : 'उपलब्ध नहीं'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">वर्तमान बैलेंस</span>
                        <p className={`text-base font-black ${bal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{bal.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {acc.ifscCode && (
                      <div className="text-[10px] text-indigo-300 font-mono">
                        IFSC: {acc.ifscCode} {acc.upiId ? `• UPI: ${acc.upiId}` : ''}
                      </div>
                    )}

                    {/* Primary UPI Badge or Action */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10">
                      {acc.isDefaultUPI ? (
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          ⚡ मुख्य UPI खाता (Auto-Debit Linked)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultUPI(acc)}
                          className="text-amber-300 hover:text-amber-100 text-[10px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          title="इस खाते को डिफ़ॉल्ट UPI खाता बनाएं ताकि काउंटर QR सेल व UPI खर्च सीधे इसी से कटें"
                        >
                          ⚡ मुख्य UPI बनाएं
                        </button>
                      )}
                    </div>

                    {/* Quick Deposit / Withdrawal Buttons */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenTxModal(acc, 'deposit')}
                        className="flex-1 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                        title="UPI कलेक्शन या नकद जमा करें"
                      >
                        <Plus size={13} /> + UPI / जमा
                      </button>
                      <button
                        onClick={() => handleOpenTxModal(acc, 'withdrawal')}
                        className="flex-1 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                        title="UPI से भुगतान या निकासी दर्ज करें"
                      >
                        - निकासी / खर्च
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bank Reconciliation Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} /> बैंक स्टेटमेंट ऑटो-टैली (Bank Statement Auto-Reconciliation)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                बैंक से डाउनलोड की गई CSV स्टेटमेंट अपलोड करें और सॉफ्टवेयर की प्रविष्टियों से 1-क्लिक में मिलान करें
              </p>
            </div>
            <button
              onClick={handleDownloadSampleCsv}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition shrink-0"
              title="सैंपल CSV टेम्पलेट डाउनलोड करें"
            >
              <Download size={14} /> 📥 सैंपल CSV डाउनलोड करें
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 space-y-1">
            <p className="font-bold">💡 निर्देश (CSV Format Guide):</p>
            <p>
              बैंक स्टेटमेंट CSV फ़ाइल में 4 कॉलम होने चाहिए: <strong>Date (YYYY-MM-DD), Description (विवरण), Debit (पैसे कटे), Credit (पैसे आए)</strong>।
              यदि समझ न आए, तो ऊपर दिए गए बटन से <strong>सैंपल CSV</strong> डाउनलोड करके देखें।
            </p>
          </div>

          {/* Upload Box */}
          <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <UploadCloud size={24} />
              </span>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बैंक स्टेटमेंट CSV फ़ाइल चुनें</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleUploadAndReconcile}
              disabled={loading || !file}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-2xl text-xs disabled:opacity-50 transition cursor-pointer shadow"
            >
              {loading ? 'मिलान हो रहा है...' : '⚡ ऑटो-टैली रन करें (Run Auto-Tally)'}
            </button>
          </div>

          {/* Reconciliation Results */}
          {results && (
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> सफलतापूर्वक मिले (Matched Entries)
                  </span>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{results.matched.length}</p>
                  <p className="text-[11px] text-emerald-700">सॉफ्टवेयर और बैंक दोनों में रिकॉर्ड मौजूद हैं</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> सॉफ्टवेयर में छूटे हुए (Unmatched Entries)
                  </span>
                  <p className="text-2xl font-black text-rose-900 mt-1">{results.unmatched.length}</p>
                  <p className="text-[11px] text-rose-700">बैंक में हैं पर सॉफ्टवेयर में दर्ज नहीं हैं</p>
                </div>
              </div>

              {/* Unmatched Table */}
              {results.unmatched.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    ⚠️ ये प्रविष्टियां सॉफ्टवेयर में गायब हैं (Bank entries missing in books):
                  </h3>
                  <div className="overflow-x-auto border border-rose-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-rose-100/70 text-rose-900 font-bold border-b border-rose-200">
                        <tr>
                          <th className="p-3">दिनांक (Date)</th>
                          <th className="p-3">विवरण (Description)</th>
                          <th className="p-3 text-right">राशि (Amount ₹)</th>
                          <th className="p-3 text-center">प्रकार (Type)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 bg-white">
                        {results.unmatched.map((item, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/50">
                            <td className="p-3 whitespace-nowrap">{item.date}</td>
                            <td className="p-3 font-medium text-slate-700">{item.description}</td>
                            <td className="p-3 text-right font-black text-slate-900">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.type === 'credit' ? '🟢 जमा (Credit)' : '🔴 निकासी (Debit)'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ADD BANK ACCOUNT MODAL */}
        {showAddBankModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b mb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" /> नया बैंक खाता जोड़ें (Add Bank)
                </h3>
                <button onClick={() => setShowAddBankModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBankAccount} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक का नाम (Bank Name) *</label>
                  <input
                    required
                    type="text"
                    placeholder="उदा. State Bank of India, HDFC Bank"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newBankData.bankName}
                    onChange={(e) => setNewBankData({ ...newBankData, bankName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">खाता धारक का नाम (Account Holder) *</label>
                  <input
                    required
                    type="text"
                    placeholder="फर्म / दुकान या मालिक का नाम"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newBankData.accountName}
                    onChange={(e) => setNewBankData({ ...newBankData, accountName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">खाता संख्या (A/C No)</label>
                    <input
                      type="text"
                      placeholder="उदा. 34829100293"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBankData.accountNumber}
                      onChange={(e) => setNewBankData({ ...newBankData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="उदा. SBIN0001234"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBankData.ifscCode}
                      onChange={(e) => setNewBankData({ ...newBankData, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">खाता प्रकार (Type)</label>
                    <select
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBankData.accountType}
                      onChange={(e) => setNewBankData({ ...newBankData, accountType: e.target.value })}
                    >
                      <option value="CURRENT">करंट (Current)</option>
                      <option value="SAVINGS">बचत (Savings)</option>
                      <option value="CC_OVERDRAFT">CC / OD लिमिट</option>
                      <option value="PERSONAL_BUSINESS">पर्सनल (Business Use)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">शुरूआती बैलेंस (Opening ₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBankData.openingBalance}
                      onChange={(e) => setNewBankData({ ...newBankData, openingBalance: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (QR पेमेंट के लिए)</label>
                  <input
                    type="text"
                    placeholder="उदा. username@upi"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newBankData.upiId}
                    onChange={(e) => setNewBankData({ ...newBankData, upiId: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    id="isDefaultUPICheck"
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    checked={newBankData.isDefaultUPI}
                    onChange={(e) => setNewBankData({ ...newBankData, isDefaultUPI: e.target.checked })}
                  />
                  <label htmlFor="isDefaultUPICheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                    ⚡ मुख्य UPI खाता बनाएं (Primary UPI for QR & Auto-Debit)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddBankModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow"
                  >
                    {savingBank ? 'सेव हो रहा है...' : 'सुरक्षित करें (Save Bank)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ⚡ QUICK TRANSACTION MODAL (DEPOSIT / UPI INFLOW / WITHDRAWAL) */}
        {showTxModal && selectedBankForTx && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    {txForm.type === 'deposit' ? '🟢 बैंक में जमा / UPI Inflow' : '🔴 बैंक से निकासी / UPI Payout'}
                  </h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedBankForTx.bankName} ({selectedBankForTx.accountName})</p>
                </div>
                <button onClick={() => setShowTxModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTx} className="space-y-4">
                {/* Transaction Type Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'deposit', note: 'UPI कलेक्शन / नकद जमा' })}
                    className={`py-2 rounded-lg transition cursor-pointer ${
                      txForm.type === 'deposit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    🟢 जमा (Deposit / UPI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'withdrawal', note: 'UPI से भुगतान / खर्च' })}
                    className={`py-2 rounded-lg transition cursor-pointer ${
                      txForm.type === 'withdrawal' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    🔴 निकासी (Withdraw / Pay)
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रकम (Amount ₹) *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="₹ 0.00"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  />
                </div>

                {/* Description / Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">विवरण / नोट (Description)</label>
                  <input
                    type="text"
                    placeholder="उदा. आज का कुल UPI कलेक्शन, ग्राहक से ऑनलाइन"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={txForm.note}
                    onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  />
                </div>

                {/* Reference No / UPI Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI Ref No / UTR (वैकल्पिक)</label>
                  <input
                    type="text"
                    placeholder="उदा. 423981290342"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={txForm.referenceNo}
                    onChange={(e) => setTxForm({ ...txForm, referenceNo: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTxModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={savingTx}
                    className={`px-5 py-2 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow ${
                      txForm.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {savingTx ? 'सेव हो रहा है...' : 'सुरक्षित करें (Save Transaction)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}