import React, { useState, useEffect } from "react";
import { Settings2, Save, ArrowDown, ArrowUp } from "lucide-react";
import api from "../../services/api";

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    type: "reduction",
    quantity: "",
    reason: "damaged",
    notes: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, adjRes] = await Promise.all([
        api.get("/api/inventory"),
        api.get("/api/inventory/adjustments")
      ]);
      setProducts(prodRes.data?.products || []);
      setAdjustments(adjRes.data?.adjustments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) return alert("Please select a product and enter quantity.");

    setLoading(true);
    try {
      await api.post("/api/inventory/adjust", formData);
      alert("Stock Adjusted Successfully!");
      setFormData({ productId: "", type: "reduction", quantity: "", reason: "damaged", notes: "" });
      fetchInitialData(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductInfo = products.find(p => p._id === formData.productId);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Settings2 className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Adjustment</h1>
          <p className="text-gray-500 text-sm">Manually add or reduce stock (e.g. for damages, internal use)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">New Adjustment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              <select className="w-full border p-2 rounded" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} required>
                <option value="">-- Choose Product --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.currentStock})</option>)}
              </select>
              {selectedProductInfo && (
                 <p className="text-xs text-blue-600 mt-1 font-medium">Current Stock: {selectedProductInfo.currentStock} {selectedProductInfo.unit}</p>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-red-50 p-2 rounded flex-1 border border-red-200">
                <input type="radio" name="adjType" value="reduction" checked={formData.type === "reduction"} onChange={() => setFormData({...formData, type: "reduction"})} />
                <span className="text-red-700 font-medium text-sm flex items-center gap-1"><ArrowDown size={14}/> Reduce (-)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-green-50 p-2 rounded flex-1 border border-green-200">
                <input type="radio" name="adjType" value="addition" checked={formData.type === "addition"} onChange={() => setFormData({...formData, type: "addition"})} />
                <span className="text-green-700 font-medium text-sm flex items-center gap-1"><ArrowUp size={14}/> Add (+)</span>
              </label>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="0.01" step="0.01" className="w-full border p-2 rounded" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select className="w-full border p-2 rounded" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                  <option value="damaged">Damaged / Expired</option>
                  <option value="lost">Lost / Stolen</option>
                  <option value="correction">Manual Correction</option>
                  <option value="internal_use">Internal Use</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full border p-2 rounded" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..."></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex justify-center items-center gap-2">
              <Save size={18} /> {loading ? "Adjusting..." : "Apply Adjustment"}
            </button>
          </form>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Adjustment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map(adj => (
                  <tr key={adj._id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3">{new Date(adj.date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-gray-800">{adj.productId?.name || "Unknown"}</td>
                    <td className="p-3">
                      {adj.type === 'addition' 
                        ? <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded">Added (+)</span> 
                        : <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded">Reduced (-)</span>}
                    </td>
                    <td className="p-3 font-bold">{adj.quantity}</td>
                    <td className="p-3 capitalize text-gray-600">{adj.reason.replace('_', ' ')}</td>
                  </tr>
                ))}
                {adjustments.length === 0 && (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">No stock adjustments recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}