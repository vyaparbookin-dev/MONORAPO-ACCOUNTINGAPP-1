import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { PackageX, RefreshCw, Calendar } from "lucide-react";

const NonMovingStockPage = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(90);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/reports/non-moving-items?days=${days}`);
      setReportData(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch non-moving stock report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [days]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Non-Moving Stock Report</h1>
          <p className="text-gray-500">Items that have not been sold in the selected period.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
            </select>
          </div>
          <button onClick={fetchReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center p-10"><Loader /></div>}
      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-600">Item Name</th>
                <th className="p-3 text-center font-semibold text-gray-600">Current Stock</th>
                <th className="p-3 text-right font-semibold text-gray-600">Stock Value</th>
                <th className="p-3 text-center font-semibold text-gray-600">Last Sale Date</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{item.name}</td>
                  <td className="p-3 text-center font-bold text-orange-600">{item.currentStock} {item.unit}</td>
                  <td className="p-3 text-right">₹{(item.currentStock * item.costPrice).toFixed(2)}</td>
                  <td className="p-3 text-center text-gray-500">
                    {item.lastSaleDate ? new Date(item.lastSaleDate).toLocaleDateString() : 'Never Sold'}
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500 flex items-center justify-center gap-2"><PackageX size={20}/> No non-moving items found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NonMovingStockPage;