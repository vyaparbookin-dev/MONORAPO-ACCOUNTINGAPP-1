import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function TdsTcsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'TDS_PAYABLE',
    section: '',
    baseAmount: '',
    rate: '',
    notes: ''
  });

  const fetchEntries = async () => {
    try {
      const res = await api.get('/api/tds-tcs');
      if (res.data.success) {
        setEntries(res.data.entries);
      }
    } catch (error) {
      console.error("Error fetching TDS/TCS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taxAmount = (parseFloat(formData.baseAmount) * parseFloat(formData.rate)) / 100;
      const payload = { ...formData, taxAmount };

      const res = await api.post('/api/tds-tcs', payload);
      if (res.data.success) {
        alert("Entry added successfully!");
        setShowModal(false);
        setFormData({ type: 'TDS_PAYABLE', section: '', baseAmount: '', rate: '', notes: '' });
        fetchEntries();
      }
    } catch (error) {
      alert("Error adding entry: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">TDS & TCS Register</h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-semibold"
          >
            + Add New Entry
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-left">Type</th>
                  <th className="py-3 px-4 border-b text-left">Section</th>
                  <th className="py-3 px-4 border-b text-right">Base Amount (₹)</th>
                  <th className="py-3 px-4 border-b text-right">Rate (%)</th>
                  <th className="py-3 px-4 border-b text-right text-red-600">Tax Amount (₹)</th>
                  <th className="py-3 px-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-6 text-gray-500">No TDS/TCS records found.</td></tr>
                )}
                {entries.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b font-medium text-gray-700">{item.type.replace('_', ' ')}</td>
                    <td className="py-2 px-4 border-b">{item.section}</td>
                    <td className="py-2 px-4 border-b text-right">{item.baseAmount}</td>
                    <td className="py-2 px-4 border-b text-right">{item.rate}%</td>
                    <td className="py-2 px-4 border-b text-right font-bold text-red-600">{item.taxAmount}</td>
                    <td className="py-2 px-4 border-b text-center">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Tax Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded">
                  <option value="TDS_PAYABLE">TDS Payable (You deducted)</option>
                  <option value="TDS_RECEIVABLE">TDS Receivable (Party deducted)</option>
                  <option value="TCS_PAYABLE">TCS Payable (You collected)</option>
                  <option value="TCS_RECEIVABLE">TCS Receivable (Party collected)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section (e.g. 194J, 194C)</label>
                <input type="text" name="section" required value={formData.section} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Base Amount (₹)</label>
                  <input type="number" name="baseAmount" required value={formData.baseAmount} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Rate (%)</label>
                  <input type="number" step="0.1" name="rate" required value={formData.rate} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}