import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const ItemWiseReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/report/generate", { type: "itemwise" });
      const d = res?.reports || res?.data?.reports || res?.data || (Array.isArray(res) ? res : []);
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/m')}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer shrink-0"
            title="वापस मोबाइल ऐप पर जाएं"
          >
            <ArrowLeft size={16} />
            <span>वापस</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Item-wise GST & Stock</h1>
            <p className="text-xs sm:text-sm text-gray-600">GST and sales aggregated per item</p>
          </div>
        </div>
        <div>
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition">Refresh</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading && <Loader />}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-right">Qty Sold</th>
              <th className="px-4 py-3 text-right">Taxable Value</th>
              <th className="px-4 py-3 text-right">GST Rate</th>
              <th className="px-4 py-3 text-right">GST Collected</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No data available</td>
              </tr>
            )}
            {data.map((row) => (
              <tr key={row.productId} className="border-t">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-right">{row.qtySold}</td>
                <td className="px-4 py-3 text-right">₹{(row.taxableValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right">{row.gstRate}%</td>
                <td className="px-4 py-3 text-right">₹{(row.gstCollected || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemWiseReport;
