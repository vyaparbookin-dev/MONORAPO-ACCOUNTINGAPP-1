import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, User, Phone, Edit, Trash2, Calendar, DollarSign, X, CreditCard } from 'lucide-react';
import { syncQueue } from "@repo/shared";
import CreditLimitHubModal from '../../components/modals/CreditLimitHubModal';

export default function PartiesPage() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreditLimitHub, setShowCreditLimitHub] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'to_collect', 'to_pay', 'customer', 'supplier', 'personal'

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    priceLevel: 'retail',
    openingBalance: '',
    creditLimit: ''
  });

  // Edit Party State
  const [editingParty, setEditingParty] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    priceLevel: 'retail',
    creditLimit: ''
  });

  // Payment / Installment Entry Modal State
  const [paymentParty, setPaymentParty] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('paid'); // 'paid' (मैंने दिए) or 'received' (मुझे मिले)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, BANK
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchParties = async () => {
    try {
      setLoading(true);
      // Local-First: डेस्कटॉप ऐप के लिए लोकल SQLite से डेटा लें
      if (window.electron && window.electron.db) {
        const localParties = await window.electron.db.getCustomers();
        setParties(localParties || []);
      } else {
        const res = await api.get('/api/party').catch(() => api.get('/api/parties'));
        setParties(res.data?.parties || res.parties || (Array.isArray(res) ? res : []));
      }
    } catch (error) {
      console.error("Error fetching parties", error);
      if (!window.electron) setParties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParties(); }, []);

  // Add Party Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedName = formData.name.trim();
      const trimmedAddr = formData.address.trim() || "Local";

      // Duplicate Check: Same name and same address
      const normName = trimmedName.toLowerCase();
      const normAddr = trimmedAddr.toLowerCase();
      const isDuplicate = parties.some(p => {
        const existingName = (p.name || "").trim().toLowerCase();
        const existingAddr = (p.address || "Local").trim().toLowerCase();
        return existingName === normName && existingAddr === normAddr;
      });

      if (isDuplicate) {
        alert(`⚠️ इस नाम ("${trimmedName}") और पते ("${trimmedAddr}") से पहले से एक पार्टी मौजूद है!\nकृपया अलग नाम या पता दर्ज करें।`);
        return;
      }

      const payload = {
        ...formData,
        name: trimmedName,
        address: trimmedAddr,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0
      };

      // Desktop: लोकल SQLite में तुरंत सेव करें (Offline Guarantee)
      if (window.electron && window.electron.db) {
        await window.electron.db.addCustomer({
          name: payload.name,
          gstin: '',
          phone: payload.mobileNumber,
          email: '',
          address: payload.address
        });
      }

      try {
        await api.post('/api/party', payload);
        alert(`✅ पार्टी '${payload.name}' सफलतापूर्वक जुड़ गई!`);
      } catch (apiErr) {
        if (!navigator.onLine || apiErr.message === "Network Error") {
          syncQueue.enqueue({ method: "POST", url: "/api/party", data: payload });
          alert("You are offline. Party saved safely locally and will sync automatically!");
        } else throw apiErr;
      }

      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', address: '', partyType: 'customer', priceLevel: 'retail', openingBalance: '', creditLimit: '' });
      fetchParties();
    } catch (error) {
      alert('Error adding party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Open Edit Party
  const handleOpenEdit = (party) => {
    setEditingParty(party);
    setEditFormData({
      name: party.name || '',
      mobileNumber: party.mobileNumber || party.phone || '',
      address: party.address || '',
      partyType: party.partyType || party.type || 'customer',
      priceLevel: party.priceLevel || 'retail',
      creditLimit: party.creditLimit || ''
    });
    setShowEditModal(true);
  };

  // Submit Edit Party
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingParty) return;
    try {
      const pId = editingParty._id || editingParty.id;
      const trimmedName = editFormData.name.trim();
      const trimmedAddr = editFormData.address.trim() || "Local";

      // Duplicate Check
      const normName = trimmedName.toLowerCase();
      const normAddr = trimmedAddr.toLowerCase();
      const isDuplicate = parties.some(p => {
        const id = p._id || p.id;
        if (String(id) === String(pId)) return false;
        const existingName = (p.name || "").trim().toLowerCase();
        const existingAddr = (p.address || "Local").trim().toLowerCase();
        return existingName === normName && existingAddr === normAddr;
      });

      if (isDuplicate) {
        alert(`⚠️ इस नाम ("${trimmedName}") और पते ("${trimmedAddr}") से पहले से एक पार्टी मौजूद है!\nकृपया अलग नाम या पता दर्ज करें।`);
        return;
      }

      const payload = {
        name: trimmedName,
        mobileNumber: editFormData.mobileNumber.trim(),
        address: trimmedAddr,
        partyType: editFormData.partyType,
        priceLevel: editFormData.priceLevel,
        creditLimit: parseFloat(editFormData.creditLimit) || 0
      };

      await api.put(`/api/party/${pId}`, payload).catch(() => api.put(`/api/parties/${pId}`, payload));
      alert(`✅ पार्टी '${payload.name}' सफलतापूर्वक अपडेट हो गई!`);
      setShowEditModal(false);
      setEditingParty(null);
      fetchParties();
    } catch (error) {
      alert('Error updating party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Delete Party
  const handleDeleteParty = async (party) => {
    const pId = party._id || party.id;
    if (!pId) return;
    if (!window.confirm(`क्या आप वाकई पार्टी '${party.name}' को हटाना चाहते हैं?`)) return;
    try {
      await api.delete(`/api/party/${pId}`).catch(() => api.delete(`/api/parties/${pId}`));
      setParties(prev => prev.filter(p => (p._id || p.id) !== pId));
      alert(`🗑️ पार्टी '${party.name}' सफलतापूर्वक हटा दी गई!`);
    } catch (error) {
      alert('Error deleting party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Open Payment / Installment Entry Modal
  const handleOpenPayment = (party, type = 'paid') => {
    setPaymentParty(party);
    setPaymentType(type);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('CASH');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Submit Payment / Installment Entry
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentParty) return;
    const amt = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य राशि (₹) दर्ज करें!");
      return;
    }
    setSavingPayment(true);
    try {
      const partyId = paymentParty._id || paymentParty.id;
      const txDate = paymentDate ? new Date(paymentDate) : new Date();
      const defaultNotes = paymentType === 'paid' ? 'किस्त भुगतान (Payment Given)' : 'किस्त वसूली (Payment Received)';
      const notes = paymentNotes.trim() || defaultNotes;

      await api.post("/api/payment/entry", {
        partyId,
        amount: amt,
        type: paymentType,
        date: txDate.toISOString(),
        paymentMethod: paymentMode,
        notes
      });

      // Update party in local state
      const diff = paymentType === 'paid' ? amt : -amt;
      setParties(prev => prev.map(p => {
        const id = p._id || p.id;
        if (id === partyId) {
          const currentBal = Number(p.currentBalance ?? p.balance ?? 0);
          return { ...p, currentBalance: currentBal + diff, balance: currentBal + diff };
        }
        return p;
      }));

      const formattedDate = txDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      alert(`✅ ₹${amt.toLocaleString('en-IN')} का भुगतान (${paymentType === 'paid' ? 'मैंने दिए / किस्त' : 'मुझे मिले / किस्त'}) दिनांक ${formattedDate} को सफलतापूर्वक दर्ज हुआ!`);
      setShowPaymentModal(false);
      setPaymentParty(null);
    } catch (error) {
      alert('Error recording payment: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingPayment(false);
    }
  };

  // Filtered Parties calculation
  const filteredParties = parties.filter(p => {
    const matchesSearch = String(p?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(p?.mobileNumber || p?.phone || '').includes(searchTerm);
    const pType = (p?.partyType || p?.type || 'customer').toLowerCase();
    const bal = Number(p?.currentBalance ?? p?.balance ?? 0);

    let matchesType = true;
    if (filterType === 'to_collect') matchesType = bal > 0;
    else if (filterType === 'to_pay') matchesType = bal < 0;
    else if (filterType === 'customer') matchesType = pType === 'customer' || pType === 'both';
    else if (filterType === 'supplier') matchesType = pType === 'supplier' || pType === 'both';
    else if (filterType === 'personal') matchesType = pType === 'personal';
    return matchesSearch && matchesType;
  });

  const totalToCollect = parties.filter(p => Number(p.currentBalance ?? p.balance ?? 0) > 0).reduce((sum, p) => sum + Number(p.currentBalance ?? p.balance ?? 0), 0);
  const totalToPay = Math.abs(parties.filter(p => Number(p.currentBalance ?? p.balance ?? 0) < 0).reduce((sum, p) => sum + Number(p.currentBalance ?? p.balance ?? 0), 0));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">खाता बही व पार्टियां (Parties & Ledger)</h1>
            <p className="text-gray-500 text-sm">ग्राहकों, सप्लायरों व पर्सनल खातों की किस्त, उधारी व लेन-देन का संपूर्ण हिसाब</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCreditLimitHub(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition text-xs sm:text-sm"
            >
              <CreditCard size={17} /> 💳 क्रेडिट लिमिट हब
            </button>
            <button onClick={() => setShowModal(true)} className="bg-[#4338CA] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md transition text-xs sm:text-sm">
              <Plus size={18} /> + नया खाता जोड़ें
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="पार्टी का नाम या मोबाइल नंबर खोजें..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: `सभी (${parties.length})` },
              { id: 'to_collect', label: `🟢 लेने हैं (₹${totalToCollect.toLocaleString('en-IN')})` },
              { id: 'to_pay', label: `🔴 देने हैं (₹${totalToPay.toLocaleString('en-IN')})` },
              { id: 'customer', label: '🛒 ग्राहक' },
              { id: 'supplier', label: '🏢 सप्लायर' },
              { id: 'personal', label: '👤 पर्सनल खाता' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === tab.id
                    ? tab.id === 'to_collect' ? 'bg-emerald-600 text-white shadow-sm'
                    : tab.id === 'to_pay' ? 'bg-rose-600 text-white shadow-sm'
                    : tab.id === 'personal' ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#4338CA] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Parties */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="px-5 py-3.5">पार्टी का नाम (Party)</th>
                  <th className="px-4 py-3.5">खाता प्रकार</th>
                  <th className="px-4 py-3.5">रेट लेवल</th>
                  <th className="px-4 py-3.5">मोबाइल व पता</th>
                  <th className="px-4 py-3.5">बाकी हिसाब (Balance)</th>
                  <th className="px-4 py-3.5 text-center">किस्त / भुगतान</th>
                  <th className="px-4 py-3.5 text-right">कार्रवाई (Action)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-500">लोड हो रहा है...</td></tr>
                ) : filteredParties.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">कोई पार्टी नहीं मिली।</td></tr>
                ) : (
                  filteredParties.map(p => {
                    const pId = p._id || p.id;
                    const bal = Number(p.currentBalance ?? p.balance ?? 0);
                    const isPersonal = (p.partyType || p.type) === 'personal';
                    const isSupplier = (p.partyType || p.type) === 'supplier';

                    return (
                      <tr key={pId} className="border-b hover:bg-gray-50/80 transition">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <User size={16} className={isPersonal ? 'text-amber-500' : 'text-indigo-600'}/> 
                            <span>{p.name}</span>
                            {isPersonal && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold border border-amber-300">पर्सनल</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 capitalize">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPersonal ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            isSupplier ? 'bg-purple-100 text-purple-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {isPersonal ? '👤 पर्सनल' : isSupplier ? '🏢 सप्लायर' : '🛒 ग्राहक'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isPersonal ? (
                            <span className="text-xs text-gray-400 italic">पर्सनल खाता</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              p.priceLevel === 'wholesale' ? 'bg-blue-100 text-blue-800' : p.priceLevel === 'special' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {p.priceLevel === 'wholesale' ? 'Rate B (Wholesale)' : p.priceLevel === 'special' ? 'Rate C (Dealer)' : 'Rate A (Retail)'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Phone size={13} className="text-gray-400" />
                            <span>{p.mobileNumber || p.phone || '-'}</span>
                          </div>
                          {p.address && <div className="text-[11px] text-gray-400 mt-0.5">📍 {p.address}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={`font-black text-sm ${bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                            {bal > 0 ? `+ ₹${bal.toLocaleString('en-IN')}` : bal < 0 ? `- ₹${Math.abs(bal).toLocaleString('en-IN')}` : '₹ 0'}
                          </div>
                          <span className={`text-[10px] font-bold block ${bal > 0 ? 'text-emerald-700' : bal < 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                            {bal > 0 ? '🟢 लेने हैं' : bal < 0 ? '🔴 देने हैं' : 'हिसाब चुकता'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenPayment(p, 'paid')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="मैंने दिए (किस्त भुगतान)"
                            >
                              🔴 दिए (Paid)
                            </button>
                            <button
                              onClick={() => handleOpenPayment(p, 'received')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="मुझे मिले (किस्त वसूली)"
                            >
                              🟢 मिले (Got)
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="पार्टी विवरण संपादित करें"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteParty(p)}
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="पार्टी हटाएं"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD PARTY MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-black text-gray-900">+ नया खाता जोड़ें (Add Party)</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पार्टी का नाम *</label>
                  <input required type="text" placeholder="नाम दर्ज करें" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">मोबाइल नंबर *</label>
                    <input required type="text" maxLength="10" placeholder="10-अंक मोबाइल" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">खाता प्रकार</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-medium" value={formData.partyType} onChange={e => setFormData({...formData, partyType: e.target.value})}>
                      <option value="customer">🛒 Customer (ग्राहक)</option>
                      <option value="supplier">🏢 Supplier (सप्लायर)</option>
                      <option value="both">Both (ग्राहक व सप्लायर)</option>
                      <option value="personal">👤 Personal (पर्सनल खाता)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पता / शहर (Address) *</label>
                  <input required type="text" placeholder="पता या शहर दर्ज करें" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">शुरुआती बाकी (Opening Bal)</label>
                    <input type="number" placeholder="₹ 0.00" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">क्रेडिट लिमिट (Credit Limit)</label>
                    <input type="number" placeholder="₹ 0.00" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">रद्द करें</button>
                  <button type="submit" className="px-4 py-2 bg-[#4338CA] text-white rounded-xl hover:bg-indigo-700 font-bold text-xs cursor-pointer shadow">सहेजें (Save)</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PARTY MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-black text-gray-900">✏️ पार्टी विवरण संपादित करें (Edit Party)</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पार्टी का नाम *</label>
                  <input required type="text" className="w-full border rounded-xl px-3 py-2 text-sm font-bold" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">मोबाइल नंबर</label>
                    <input type="text" maxLength="10" className="w-full border rounded-xl px-3 py-2 text-sm" value={editFormData.mobileNumber} onChange={e => setEditFormData({...editFormData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">खाता प्रकार</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm font-medium" value={editFormData.partyType} onChange={e => setEditFormData({...editFormData, partyType: e.target.value})}>
                      <option value="customer">🛒 Customer (ग्राहक)</option>
                      <option value="supplier">🏢 Supplier (सप्लायर)</option>
                      <option value="both">Both (ग्राहक व सप्लायर)</option>
                      <option value="personal">👤 Personal (पर्सनल)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पता / शहर (Address)</label>
                  <input type="text" className="w-full border rounded-xl px-3 py-2 text-sm" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">रद्द करें</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-xs cursor-pointer shadow">अपडेट करें (Update)</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PAYMENT / INSTALLMENT ENTRY MODAL */}
        {showPaymentModal && paymentParty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    💰 किस्त / भुगतान प्रविष्टि ({paymentParty.name})
                  </h2>
                  <p className="text-xs text-slate-500">
                    मौजूदा बाकी: <strong>{Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0) >= 0 ? `+ ₹${Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0).toLocaleString('en-IN')} (लेने हैं)` : `- ₹${Math.abs(Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0)).toLocaleString('en-IN')} (देने हैं)`}</strong>
                  </p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">लेन-देन प्रकार (Type)</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentType('paid')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                        paymentType === 'paid' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔴 मैंने दिए (You Gave / किस्त)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('received')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                        paymentType === 'received' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🟢 मुझे मिले (You Got / किस्त)
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">राशि (Amount ₹) *</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="₹ 0.00 *" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    autoFocus
                  />
                </div>

                {/* Date Input */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>तारीख (Payment Date) *</span>
                  </label>
                  <input 
                    required 
                    type="date" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">भुगतान माध्यम (Payment Mode)</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: 'CASH', label: '💵 नकद (Cash)' },
                      { id: 'UPI', label: '📱 ऑनलाइन (UPI)' },
                      { id: 'BANK', label: '🏛️ बैंक (Bank)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          paymentMode === m.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">विवरण / नोट (Description)</label>
                  <input 
                    type="text" 
                    placeholder="उदा. किस्त 1, चेक नंबर, सामान का भुगतान" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentNotes} 
                    onChange={e => setPaymentNotes(e.target.value)} 
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">
                    रद्द करें
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingPayment}
                    className={`px-5 py-2 text-white rounded-xl font-bold text-xs cursor-pointer shadow transition ${
                      paymentType === 'paid' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {savingPayment ? 'सेव हो रहा है...' : 'सुरक्षित करें (Save Payment)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 💳 Dedicated Credit Limit & Mandate Hub Modal */}
        <CreditLimitHubModal
          isOpen={showCreditLimitHub}
          onClose={() => setShowCreditLimitHub(false)}
          onPartyUpdated={fetchParties}
        />
      </div>
    </div>
  );
}
