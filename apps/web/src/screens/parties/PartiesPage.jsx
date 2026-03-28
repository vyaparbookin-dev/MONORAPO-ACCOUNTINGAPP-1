import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, User, Phone } from 'lucide-react';
import { syncQueue } from "@repo/shared";

export default function PartiesPage() {
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
      // Local-First: डेस्कटॉप ऐप के लिए लोकल SQLite से डेटा लें
      if (window.electron && window.electron.db) {
        const localParties = await window.electron.db.getCustomers();
        setParties(localParties || []);
      } else {
        const res = await api.get('/api/party');
        setParties(res.data?.parties || res.parties || (Array.isArray(res) ? res : []));
      }
    } catch (error) {
      console.error("Error fetching parties", error);
      // क्रैश होने से बचाएं
      if (!window.electron) setParties([]);
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

      // Desktop: लोकल SQLite में तुरंत सेव करें (Offline Guarantee)
      if (window.electron && window.electron.db) {
        await window.electron.db.addCustomer({
          name: payload.name,
          gstin: '', // अगर GST है तो यहाँ पास कर सकते हैं
          phone: payload.mobileNumber,
          email: '',
          address: payload.address
        });
      }

      try {
        await api.post('/api/party', payload);
        alert('Party added successfully!');
      } catch (apiErr) {
        if (!navigator.onLine || apiErr.message === "Network Error") {
          syncQueue.enqueue({ method: "POST", url: "/api/party", data: payload });
          alert("You are offline. Party saved safely locally and will sync automatically!");
        } else throw apiErr;
      }

      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', address: '', partyType: 'customer', openingBalance: '', creditLimit: '' });
      fetchParties();
    } catch (error) {
      alert('Error adding party: ' + (error.response?.data?.error || error.message));
    }
  };

  // CRASH FIX: Agar customer ka naam null hoga to app crash nahi hogi
  const filteredParties = parties.filter(p => String(p?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(p?.mobileNumber || '').includes(searchTerm));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No parties found.</td></tr>
              ) : (
                filteredParties.map(p => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2"><User size={16} className="text-gray-400"/> {p.name}</td>
                    <td className="px-6 py-4 capitalize"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.partyType === 'supplier' ? 'bg-purple-100 text-purple-700' : p.partyType === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{p.partyType}</span></td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><Phone size={14}/> {p.mobileNumber}</td>
                    <td className={`px-6 py-4 font-bold ${(p.currentBalance ?? p.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{p.currentBalance ?? p.balance ?? 0}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{p.creditLimit > 0 ? `₹${p.creditLimit}` : 'No Limit'}</td>
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
