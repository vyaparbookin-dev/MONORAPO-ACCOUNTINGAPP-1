import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, AlertCircle } from 'lucide-react';

export default function AgingReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAging = async () => {
      try {
        setLoading(true);
        let agingData = [];

        // WEB ONLY: Direct API Call from Server
        const res = await api.get('/api/aging').catch(() => null);
        agingData = res?.data?.data || res?.data || res || [];

        if (Array.isArray(agingData)) {
          setData(agingData.sort((a, b) => (b.totalPending || 0) - (a.totalPending || 0)));
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Failed to load aging report", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAging();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Aging Analysis (Outstanding)</h1>
            <p className="text-gray-500 mt-1">Track pending payments grouped by the number of days outstanding.</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
            <FileText size={18} /> Export PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Customer Name</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center">0 - 30 Days</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center">31 - 60 Days</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center">61 - 90 Days</th>
                <th className="px-6 py-4 font-semibold text-red-600 text-center flex items-center justify-center gap-1"><AlertCircle size={14}/> 90+ Days</th>
                <th className="px-6 py-4 font-bold text-gray-900 text-right">Total Pending</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading Report...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No outstanding payments found. Great job!</td></tr>
              ) : (
          data.map((row, idx) => (
            <tr key={row.partyId || idx} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                <div className="font-semibold text-gray-800">{row.partyName || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{row.mobileNumber || '-'}</div>
                    </td>
              <td className="px-6 py-4 text-center font-medium text-green-600">{(row['0_30'] || 0) > 0 ? `₹${row['0_30']}` : '-'}</td>
              <td className="px-6 py-4 text-center font-medium text-yellow-600">{(row['31_60'] || 0) > 0 ? `₹${row['31_60']}` : '-'}</td>
              <td className="px-6 py-4 text-center font-medium text-orange-500">{(row['61_90'] || 0) > 0 ? `₹${row['61_90']}` : '-'}</td>
              <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50">{(row['90_plus'] || 0) > 0 ? `₹${row['90_plus']}` : '-'}</td>
              <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">₹{row.totalPending || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}