import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Search, Edit, Trash2, Send } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/quotations');
      setQuotations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filteredQuotations = quotations.filter(q =>
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.partyId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await api.patch(`/api/quotations/${id}/status`, { status });
      fetchQuotations();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Quotations
        </h1>
        <Link to="/quotations/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Create New Quotation
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by quotation number or customer name..."
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filteredQuotations.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">No quotations found. Start by creating a new one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Quotation No.</th>
                <th className="p-4 font-semibold text-gray-600">Customer</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
                <th className="p-4 text-right font-semibold text-gray-600">Amount</th>
                <th className="p-4 text-center font-semibold text-gray-600">Status</th>
                <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr key={q._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{q.quotationNumber}</td>
                  <td className="p-4">{q.partyId?.name || 'N/A'}</td>
                  <td className="p-4">{new Date(q.date).toLocaleDateString()}</td>
                  <td className="p-4 text-right">₹{q.totalAmount.toFixed(2)}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${q.status === 'accepted' ? 'bg-green-100 text-green-800' : q.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{q.status.toUpperCase()}</span></td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <Link to={`/quotations/edit/${q._id}`} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></Link>
                    <button onClick={() => updateStatus(q._id, 'sent')} className="text-green-600 hover:text-green-800"><Send size={18} /></button>
                    <button onClick={() => updateStatus(q._id, 'rejected')} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}