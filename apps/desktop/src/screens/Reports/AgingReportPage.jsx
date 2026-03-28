import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Search, AlertCircle } from 'lucide-react';

export default function AgingReportPage() {
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAgingReport();
  }, []);

  const fetchAgingReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/aging');
      if (res.data?.success) {
        setAgingData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch aging report", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = agingData.filter(d => 
    d.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.mobileNumber?.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="text-rose-500" /> Aging Analysis Report
            </h1>
            <p className="text-gray-500 mt-1">Track outstanding payments based on how long they are overdue.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer name or mobile..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Customer Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Mobile Number</th>
                  <th className="px-6 py-4 font-semibold text-green-700 text-right">0 - 30 Days</th>
                  <th className="px-6 py-4 font-semibold text-yellow-600 text-right">31 - 60 Days</th>
                  <th className="px-6 py-4 font-semibold text-orange-600 text-right">61 - 90 Days</th>
                  <th className="px-6 py-4 font-semibold text-red-600 text-right">90+ Days</th>
                  <th className="px-6 py-4 font-bold text-gray-900 text-right">Total Pending</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-12 text-gray-500">Loading aging data...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                      No pending payments found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(row => (
                    <tr key={row.partyId} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.partyName}</td>
                      <td className="px-6 py-4 text-gray-600">{row.mobileNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-right text-gray-700">₹{row['0_30']?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-gray-700">₹{row['31_60']?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-gray-700">₹{row['61_90']?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">₹{row['90_plus']?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 bg-gray-50">₹{row.totalPending?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}