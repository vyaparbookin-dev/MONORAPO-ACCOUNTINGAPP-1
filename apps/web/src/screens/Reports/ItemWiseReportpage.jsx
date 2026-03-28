import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const ItemWiseReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/report/generate", { type: "itemwise" });
      const d = res.reports || res.data?.reports;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Item Wise Report</h1>
        <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded">Refresh</button>
      </div>
      
      {loading && <Loader />}
      {error && <div className="text-red-600">{error}</div>}
      
      {!loading && !error && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Item Name</th>
                <th className="p-3 text-right">Quantity Sold</th>
                <th className="p-3 text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name || "Unknown"}</td>
                  <td className="p-3 text-right">{item.qtySold || 0}</td>
                  <td className="p-3 text-right">₹{(item.taxableValue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ItemWiseReportPage;