import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const BillWiseReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/report/generate", { type: "billwise" });
      const d = res.reports;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch report");
      // क्रैश होने से बचाएं
      setData([]);
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
        <div>
          <h1 className="text-3xl font-bold">Invoice / Bill Details</h1>
          <p className="text-sm text-gray-600">Detailed invoice view with item breakdown</p>
        </div>
        <div>
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded">Refresh</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading && <Loader />}

      <div className="space-y-4">
        {data.length === 0 && !loading && (
          <div className="p-6 bg-white rounded text-center text-gray-500">No invoices found</div>
        )}

        {data.map((inv) => (
          <div key={inv._id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">Invoice: {inv.invoiceNo}</h3>
                <p className="text-sm text-gray-600">Customer: {inv.customer || 'Walk-in'}</p>
                <p className="text-sm text-gray-500">Date: {inv.date ? new Date(inv.date).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₹{(inv.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-gray-600">GST: ₹{(inv.totalGst || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Taxable</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items && inv.items.length > 0 ? (
                    inv.items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{it.name || it.productId || 'Item'}</td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">₹{(it.price || 0).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">₹{(it.taxable || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">No items on this invoice</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillWiseReportPage;
