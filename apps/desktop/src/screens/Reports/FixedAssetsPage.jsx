import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Building2, Landmark, Plus, Trash2, RefreshCw, Calculator, 
  TrendingUp, Wrench
} from 'lucide-react';

export default function FixedAssetsPage() {
  const [activeTab, setActiveTab] = useState('capital');
  const [loading, setLoading] = useState(true);
  
  const [assets, setAssets] = useState([]);
  const [capitalEntries, setCapitalEntries] = useState([]);
  const [capitalSummary, setCapitalSummary] = useState({
    totalOpeningCash: 0,
    totalOpeningBank: 0,
    totalOwnerCapital: 0,
    totalPartnerCapital: 0,
    totalUnsecuredLoans: 0,
    totalStartupExpenses: 0,
    totalGrossCapital: 0,
    netCapitalIntroduced: 0
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [showStartupModal, setShowStartupModal] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [assetForm, setAssetForm] = useState({
    assetName: '',
    description: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    depreciationRate: '10',
    depreciationMethod: 'WDV'
  });

  const [capitalForm, setCapitalForm] = useState({
    entryType: 'owner_capital',
    title: '',
    contributorName: 'Owner / प्रोपराइटर',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'bank',
    bankName: '',
    accountNumber: '',
    notes: ''
  });

  const [startupForm, setStartupForm] = useState({
    entryType: 'startup_renovation',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetRes, capitalRes] = await Promise.all([
        api.get('/api/fixed-assets'),
        api.get('/api/capital')
      ]);

      if (assetRes.data.success) {
        setAssets(assetRes.data.assets || []);
      }
      if (capitalRes.data.success) {
        setCapitalEntries(capitalRes.data.data?.entries || []);
        setCapitalSummary(capitalRes.data.data?.summary || {});
      }
    } catch (error) {
      console.error("Error fetching capital/assets data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOriginalAssetCost = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalCurrentAssetValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.assetName || !assetForm.purchaseCost) {
      alert("कृपया संपत्ति का नाम और लागत भरें।");
      return;
    }
    try {
      const res = await api.post('/api/fixed-assets', {
        ...assetForm,
        purchaseCost: parseFloat(assetForm.purchaseCost),
        depreciationRate: parseFloat(assetForm.depreciationRate || 0)
      });
      if (res.data.success) {
        alert("✅ स्थायी संपत्ति (Asset) सफलतापूर्वक दर्ज हो गई!");
        setShowAssetModal(false);
        setAssetForm({ assetName: '', description: '', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: '', depreciationRate: '10', depreciationMethod: 'WDV' });
        fetchData();
      }
    } catch (error) {
      alert("Error adding asset: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCapitalSubmit = async (e) => {
    e.preventDefault();
    if (!capitalForm.title || !capitalForm.amount) {
      alert("कृपया विवरण और राशि भरें।");
      return;
    }
    try {
      const res = await api.post('/api/capital', {
        ...capitalForm,
        amount: parseFloat(capitalForm.amount)
      });
      if (res.data.success) {
        alert("✅ पूंजी (Capital) एंट्री सफलतापूर्वक सेव हो गई!");
        setShowCapitalModal(false);
        setCapitalForm({ entryType: 'owner_capital', title: '', contributorName: 'Owner / प्रोपराइटर', amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'bank', bankName: '', accountNumber: '', notes: '' });
        fetchData();
      }
    } catch (error) {
      alert("Error adding capital: " + (error.response?.data?.message || error.message));
    }
  };

  const handleStartupSubmit = async (e) => {
    e.preventDefault();
    if (!startupForm.title || !startupForm.amount) {
      alert("कृपया खर्च का नाम और राशि भरें।");
      return;
    }
    try {
      const res = await api.post('/api/capital', {
        ...startupForm,
        amount: parseFloat(startupForm.amount)
      });
      if (res.data.success) {
        alert("✅ प्रारंभिक स्थापना खर्च सफलतापूर्वक सेव हो गया!");
        setShowStartupModal(false);
        setStartupForm({ entryType: 'startup_renovation', title: '', amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'cash', notes: '' });
        fetchData();
      }
    } catch (error) {
      alert("Error adding startup expense: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCalculateDepreciation = async () => {
    if (!window.confirm("क्या आप सभी सक्रिय संपत्तियों पर वार्षिक घिसावट (Depreciation) लगाना चाहते हैं? इससे बुक वैल्यू कम होगी।")) return;
    setCalculating(true);
    try {
      const res = await api.post('/api/fixed-assets/calculate-depreciation');
      if (res.data.success) {
        alert("✅ Depreciation सफलतापूर्वक लागू हो गई!");
        fetchData();
      }
    } catch (error) {
      alert("Error calculating depreciation: " + (error.response?.data?.message || error.message));
    } finally {
      setCalculating(false);
    }
  };

  const handleDeleteCapital = async (id) => {
    if (!window.confirm("क्या आप इस एंट्री को हटाना चाहते हैं?")) return;
    try {
      await api.delete('/api/capital/' + id);
      fetchData();
    } catch (err) {
      alert("Failed to delete entry");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Landmark className="text-blue-600" size={26} />
            Capital, Assets & Business Setup Hub
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            प्रारंभिक पूंजी, दुकान की स्थायी संपत्ति (रैक/काउंटर/कंप्यूटर) और नए बिजनेस स्थापना खर्चे का संपूर्ण रजिस्टर
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Capital (कुल पूंजी)</span>
            <Landmark size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            ₹{(capitalSummary.totalGrossCapital || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">
            Cash: ₹{(capitalSummary.totalOpeningCash || 0).toLocaleString('en-IN')} | Bank: ₹{(capitalSummary.totalOpeningBank || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Fixed Assets (स्थायी संपत्ति)</span>
            <Building2 size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">
            ₹{totalCurrentAssetValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            Original Cost: ₹{totalOriginalAssetCost.toLocaleString('en-IN')} ({assets.length} Assets)
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Setup & Renovation (स्थापना खर्च)</span>
            <Wrench size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            ₹{(capitalSummary.totalStartupExpenses || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">
            Interior, Painting, Wiring & Opening Pooja
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 p-5 rounded-2xl border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Working Capital (कार्यशील पूंजी)</span>
            <TrendingUp size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            ₹{((capitalSummary.totalGrossCapital || 0) - (capitalSummary.totalStartupExpenses || 0) - totalOriginalAssetCost).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-purple-700 mt-1 font-medium">
            उपलब्ध व्यापारिक नकदी व बैंक फंड
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white p-2 rounded-2xl shadow-sm">
        {[
          { id: 'capital', label: '🏛️ Capital & Opening Balances (पूंजी खाता)', count: capitalEntries.filter(e => !['startup_renovation', 'legal_license_setup'].includes(e.entryType)).length },
          { id: 'assets', label: '🏢 Fixed Assets Register (स्थायी संपत्ति)', count: assets.length },
          { id: 'startup', label: '🏗️ Setup & Renovation Costs (कच्चा/पक्का स्थापना खर्च)', count: capitalEntries.filter(e => ['startup_renovation', 'legal_license_setup'].includes(e.entryType)).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={'px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ' + (
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>{tab.label}</span>
            <span className={'px-2 py-0.5 rounded-full text-[10px] font-black ' + (
              activeTab === tab.id ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: CAPITAL & OPENING BALANCES */}
      {activeTab === 'capital' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-gray-900">Capital & Opening Balance Register</h2>
              <p className="text-xs text-gray-500">प्रारंभिक गल्ला कैश, बैंक बैलेंस, मालिक/पार्टनर की पूंजी और अनसिक्योर्ड लोन</p>
            </div>
            <button
              onClick={() => setShowCapitalModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus size={16} /> + Add Capital / Opening Balance
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase font-black tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title / Contributor</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {capitalEntries.filter(e => !['startup_renovation', 'legal_license_setup'].includes(e.entryType)).map(e => (
                  <tr key={e._id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 text-gray-500">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold">
                        {e.entryType === 'opening_cash' ? '💵 Opening Cash (गल्ला)' :
                         e.entryType === 'opening_bank' ? '🏦 Opening Bank' :
                         e.entryType === 'owner_capital' ? '👑 Owner Capital' :
                         e.entryType === 'partner_capital' ? '👥 Partner Capital' :
                         e.entryType === 'unsecured_loan' ? '🤝 Family/Friend Loan' : '💼 Additional Capital'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{e.title}</div>
                      <div className="text-[11px] text-gray-500">{e.contributorName} {e.notes ? '• ' + e.notes : ''}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-gray-600 font-bold">{e.paymentMode}</td>
                    <td className="py-3 px-4 text-right font-black text-blue-900 text-sm">₹{e.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDeleteCapital(e._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {capitalEntries.filter(e => !['startup_renovation', 'legal_license_setup'].includes(e.entryType)).length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400 font-medium">
                      कोई पूंजी एंट्री नहीं मिली। ऊपर <b>+ Add Capital</b> पर क्लिक करके अपनी प्रारंभिक पूंजी दर्ज करें।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FIXED ASSETS REGISTER */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Fixed Assets Register (स्थायी संपत्ति)</h2>
              <p className="text-xs text-gray-500">दुकान का फर्नीचर, रैक, काउंटर, कंप्यूटर, बारकोड स्कैनर, प्रिंटर, डिलीवरी वाहन व मशीनरी</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCalculateDepreciation}
                disabled={calculating || assets.length === 0}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Calculator size={16} /> {calculating ? "Calculating..." : "Run Yearly Depreciation"}
              </button>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus size={16} /> + Add Fixed Asset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase font-black tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Asset Name / Details</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4 text-right">Original Cost (₹)</th>
                  <th className="py-3 px-4 text-center">Depreciation Rate</th>
                  <th className="py-3 px-4 text-right">Current Book Value (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {assets.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{a.assetName}</div>
                      <div className="text-[11px] text-gray-500">{a.description || 'Shop Equipment / Asset'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(a.purchaseDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-700">₹{a.purchaseCost.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-bold">
                        {a.depreciationRate}% ({a.depreciationMethod})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">₹{a.currentValue.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400 font-medium">
                      कोई स्थायी संपत्ति दर्ज नहीं है। ऊपर <b>+ Add Fixed Asset</b> पर क्लिक करें।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STARTUP & RENOVATION COSTS */}
      {activeTab === 'startup' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-gray-900">New Business Setup & Renovation Costs (कच्चा व पक्का खर्च)</h2>
              <p className="text-xs text-gray-500">दुकान की पुताई, इंटीरियर, लकड़ी का काम, बिजली वायरिंग, ग्लास फिटिंग, उद्घाटन, पूजा व लाइसेंस खर्च</p>
            </div>
            <button
              onClick={() => setShowStartupModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus size={16} /> + Add Setup / Renovation Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase font-black tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Type</th>
                  <th className="py-3 px-4">Details / विवरण</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {capitalEntries.filter(e => ['startup_renovation', 'legal_license_setup'].includes(e.entryType)).map(e => (
                  <tr key={e._id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 text-gray-500">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                        {e.entryType === 'startup_renovation' ? '🏗️ Interior & Renovation' : '📜 Legal & Licenses'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{e.title}</div>
                      <div className="text-[11px] text-gray-500">{e.notes || 'Pre-commencement Setup'}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-gray-600 font-bold">{e.paymentMode}</td>
                    <td className="py-3 px-4 text-right font-black text-amber-900 text-sm">₹{e.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDeleteCapital(e._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {capitalEntries.filter(e => ['startup_renovation', 'legal_license_setup'].includes(e.entryType)).length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400 font-medium">
                      कोई प्रारंभिक स्थापना खर्च दर्ज नहीं है। ऊपर <b>+ Add Setup Expense</b> पर क्लिक करें।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ASSET */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              Add Fixed Asset / स्थायी संपत्ति जोड़ें
            </h3>

            <form onSubmit={handleAssetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Asset Name (उदा. Counter, Display Racks, Computer, Printer) *</label>
                <input
                  type="text"
                  placeholder="उदा. Shop Main Counter & Display Racks"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Purchase Cost (₹) / लागत *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Purchase Date / खरीद तारीख</label>
                  <input
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Depreciation Rate (% p.a.)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={assetForm.depreciationRate}
                    onChange={(e) => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Depreciation Method</label>
                  <select
                    value={assetForm.depreciationMethod}
                    onChange={(e) => setAssetForm({ ...assetForm, depreciationMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="WDV">WDV (Written Down Value)</option>
                    <option value="SLM">SLM (Straight Line Method)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / विवरण</label>
                <textarea
                  rows={2}
                  placeholder="आइटम का मॉडल, वारंटी या लोकेशन..."
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAssetModal(false)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CAPITAL */}
      {showCapitalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Landmark size={20} className="text-blue-600" />
              Add Capital / Opening Balance (पूंजी दर्ज करें)
            </h3>

            <form onSubmit={handleCapitalSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Capital Entry Type / प्रकार *</label>
                <select
                  value={capitalForm.entryType}
                  onChange={(e) => setCapitalForm({ ...capitalForm, entryType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="owner_capital">👑 Owner Capital (मालिक/प्रोपराइटर की पूंजी)</option>
                  <option value="opening_cash">💵 Opening Cash in Hand (गल्ले में प्रारंभिक रोकड़)</option>
                  <option value="opening_bank">🏦 Opening Bank Balance (बैंक खाते का ओपनिंग बैलेंस)</option>
                  <option value="partner_capital">👥 Partner Capital (पार्टनर का निवेश)</option>
                  <option value="additional_capital">💼 Additional Capital (अतिरिक्त पूंजी निवेश)</option>
                  <option value="unsecured_loan">🤝 Unsecured Loan (परिवार/मित्रों से लिया गया लोन)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title / विवरण *</label>
                <input
                  type="text"
                  placeholder="उदा. प्रारंभिक पूंजी निवेश / SBI बैंक ओपनिंग बैलेंस"
                  value={capitalForm.title}
                  onChange={(e) => setCapitalForm({ ...capitalForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Amount (₹) / राशि *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={capitalForm.amount}
                    onChange={(e) => setCapitalForm({ ...capitalForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contributor Name / नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. Ganesh Agrawal"
                    value={capitalForm.contributorName}
                    onChange={(e) => setCapitalForm({ ...capitalForm, contributorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Date / तारीख</label>
                  <input
                    type="date"
                    value={capitalForm.date}
                    onChange={(e) => setCapitalForm({ ...capitalForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={capitalForm.paymentMode}
                    onChange={(e) => setCapitalForm({ ...capitalForm, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="bank">🏦 Bank Transfer / Cheque</option>
                    <option value="cash">💵 Cash (गल्ला)</option>
                    <option value="upi">📱 UPI / Online</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCapitalModal(false)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm">Save Capital Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD STARTUP EXPENSE */}
      {showStartupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Wrench size={20} className="text-amber-600" />
              Add Setup & Renovation Cost (स्थापना खर्च)
            </h3>

            <form onSubmit={handleStartupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category / श्रेणी *</label>
                <select
                  value={startupForm.entryType}
                  onChange={(e) => setStartupForm({ ...startupForm, entryType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="startup_renovation">🏗️ Shop Painting, Wiring & Interior (पुताई/वायरिंग/फिनिशिंग)</option>
                  <option value="legal_license_setup">📜 GST, Gumasta, Trade License & CA Setup Fees</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title / विवरण *</label>
                <input
                  type="text"
                  placeholder="उदा. दुकान पुताई, बिजली वायरिंग, उद्घाटन पूजा व मिठाई"
                  value={startupForm.title}
                  onChange={(e) => setStartupForm({ ...startupForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Amount (₹) / राशि *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={startupForm.amount}
                    onChange={(e) => setStartupForm({ ...startupForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={startupForm.paymentMode}
                    onChange={(e) => setStartupForm({ ...startupForm, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="cash">💵 Cash (नकद)</option>
                    <option value="bank">🏦 Bank Transfer / Cheque</option>
                    <option value="upi">📱 UPI / Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Date / तारीख</label>
                <input
                  type="date"
                  value={startupForm.date}
                  onChange={(e) => setStartupForm({ ...startupForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowStartupModal(false)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm">Save Setup Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
