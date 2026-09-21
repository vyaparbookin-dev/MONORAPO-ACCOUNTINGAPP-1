import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Edit, Calendar } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function LeadListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/leads');
        setLeads(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch leads", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.mobileNumber?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-purple-600" /> Leads Management
        </h1>
        <Link to="/leads/create" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus size={18} /> Add New Lead
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or mobile number..."
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filteredLeads.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">No leads found. Start by adding a new one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Contact</th>
                <th className="p-4 font-semibold text-gray-600">Source</th>
                <th className="p-4 font-semibold text-gray-600">Follow-up Date</th>
                <th className="p-4 text-center font-semibold text-gray-600">Status</th>
                <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{lead.name}</td>
                  <td className="p-4">{lead.mobileNumber || lead.email}</td>
                  <td className="p-4">{lead.source}</td>
                  <td className="p-4">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{lead.status.toUpperCase()}</span></td>
                  <td className="p-4 text-center">
                    <Link to={`/leads/edit/${lead._id}`} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></Link>
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