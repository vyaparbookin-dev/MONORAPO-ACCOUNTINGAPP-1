import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Download } from "lucide-react";
import Loader from "../../components/Loader";
import ProductAnalyticsModal from "../../components/modals/ProductAnalyticsModal.jsx";

const ItemWiseReportPage = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using the correct endpoint for item-wise sales report
      const res = await api.get("/api/report/item-wise-sales");
      setReportData(res.data.report || []);
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

  const handleProductClick = (productId) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Item Wise Report</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Refresh</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300">
            <Download size={18} /> Export
          </button>
        </div>
      </div>
      
      {loading && <div className="flex justify-center p-10"><Loader /></div>}
      {error && <div className="text-red-600">{error}</div>}
      
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-600">Item Name</th>
                <th className="p-3 text-center font-semibold text-gray-600">Quantity Sold</th>
                <th className="p-3 text-right font-semibold text-gray-600">Avg. Sale Price</th>
                <th className="p-3 text-right font-semibold text-gray-600">Total Sales Value</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.productId} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800 cursor-pointer">
                    <button onClick={() => handleProductClick(item.productId)} className="text-blue-600 hover:underline text-left">
                      {item.productName}
                    </button>
                  </td>
                  <td className="p-3 text-center">{item.totalQuantitySold}</td>
                  <td className="p-3 text-right">₹{item.averageSalePrice.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold">₹{item.totalSalesValue.toFixed(2)}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductAnalyticsModal
          productId={selectedProductId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ItemWiseReportPage;