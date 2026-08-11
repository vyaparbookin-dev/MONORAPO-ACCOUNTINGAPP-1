import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { ShoppingCart, RefreshCw } from "lucide-react";

const LowStockReportPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLowStockReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/reports/low-stock-items");
      setLowStockItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch low stock report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockReport();
  }, []);

  const handleCreatePurchaseOrder = (item) => {
    // This will be implemented in the next feature (Quick Purchase Order)
    alert(`Creating Purchase Order for: ${item.name}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Low Stock Report</h1>
          <p className="text-gray-500">Items that have fallen below their minimum stock level.</p>
        </div>
        <button onClick={fetchLowStockReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
          <RefreshCw size={18} /> Refresh
        </button>
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
                <th className="p-3 text-center font-semibold text-gray-600">Min. Stock Level</th>
                <th className="p-3 text-center font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{item.name}</td>
                  <td className="p-3 text-center font-bold text-red-600">{item.currentStock} {item.unit}</td>
                  <td className="p-3 text-center text-gray-500">{item.minimumStock} {item.unit}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleCreatePurchaseOrder(item)} 
                      className="flex items-center justify-center gap-2 px-3 py-1 bg-green-100 text-green-800 font-semibold rounded-md hover:bg-green-200 text-xs"
                    >
                      <ShoppingCart size={14} />
                      Create PO
                    </button>
                  </td>
                </tr>
              ))}
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    Great! No items are currently low on stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LowStockReportPage;