import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, User, Phone } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { auditService } from '../../services/auditService';
import { syncQueue } from '@repo/shared';

export default function PartiesPage() {
  console.log("🔥 DEBUG: PARTIES PAGE COMPONENT MOUNTED / RENDERED");

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    openingBalance: '',
    creditLimit: ''
  });

  const fetchParties = async () => {
    try {
      setLoading(true);
      let partyList = [];
      if (dbService && dbService.getCustomers) {
        partyList = await dbService.getCustomers();
      }
      
      if (!partyList || partyList.length === 0) {
        const res = await api.get('/api/party').catch(() => null);
        partyList = res?.data?.parties || res?.parties || res?.data || [];
      }

      // ULTIMATE ARRAY CHECK (Prevents White Screen)
      let safeParties = [];
      if (Array.isArray(partyList)) safeParties = partyList;
      else if (partyList && Array.isArray(partyList.parties)) safeParties = partyList.parties;
      else if (partyList && Array.isArray(partyList.data)) safeParties = partyList.data;

      setParties(safeParties.filter(Boolean).map(p => ({
        ...p, 
        _id: p._id || p.uuid,
        mobileNumber: p.mobileNumber || p.phone || '', // Crash prevention
        currentBalance: p.currentBalance || p.balance || 0
      })));
    } catch (error) {
      console.error("Error fetching parties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParties(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0
      };

      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `PARTY-${Date.now()}`;
      const finalPayload = { ...payload, _id: newId, uuid: newId };

      // 1. Save Locally (SQLite)
      await dbService.addCustomer(finalPayload);

      // 2. Audit Log
      await auditService.logAction('CREATE', 'party', null, finalPayload);

      // 3. Sync Queue
      await syncQueue.enqueue({ entityId: newId, entity: 'party', method: 'POST', url: '/api/party', data: finalPayload });

      alert('Party added securely offline!');
      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', address: '', partyType: 'customer', openingBalance: '', creditLimit: '' });
      fetchParties();
    } catch (error) {
      alert('Error adding party: ' + error.message);
    }
  };

  const filteredParties = parties.filter(p => {
    if (!p) return false;
    const s = searchTerm.toLowerCase();
    const nMatch = String(p.name || '').toLowerCase().includes(s);
    const mMatch = String(p.mobileNumber || '').includes(s);
    return nMatch || mMatch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* JABARDASTI DEBUG BANNER */}
      <div className="bg-red-600 text-white p-4 font-bold text-xl text-center mb-6 rounded-lg animate-pulse shadow-lg border-4 border-red-800">
        🚨 DEBUG MODE: Parties Page is ALIVE and RENDERED! Agar data nahi aaya toh API/DB me dikkat hai. 🚨
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Parties (Customers & Suppliers)</h1>
            <p className="text-gray-500">Manage your business contacts and their credit limits</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <Plus size={18} /> Add Party
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Search by name or mobile..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">Party Name</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Balance</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-3">No parties found.</p>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 transition-all">
                      <Plus size={18} /> Create Your First Party
                    </button>
                  </td>
                </tr>
              ) : (
                (filteredParties || []).map(p => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2"><User size={16} className="text-gray-400"/> {p?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 capitalize"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p?.partyType === 'supplier' ? 'bg-purple-100 text-purple-700' : p?.partyType === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{p?.partyType || 'customer'}</span></td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><Phone size={14}/> {p?.mobileNumber || 'N/A'}</td>
                    <td className={`px-6 py-4 font-bold ${(p.currentBalance ?? p.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{p.currentBalance ?? p.balance ?? 0}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{(p?.creditLimit || 0) > 0 ? `₹${p.creditLimit}` : 'No Limit'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Add New Party</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input required type="text" maxLength="10" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
                    <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.partyType} onChange={e => setFormData({...formData, partyType: e.target.value})}>
                      <option value="customer">Customer</option>
                      <option value="supplier">Supplier</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                    <input type="number" placeholder="₹ 0.00" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input type="number" placeholder="₹ 0.00 (0 = No Limit)" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Save Party</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}