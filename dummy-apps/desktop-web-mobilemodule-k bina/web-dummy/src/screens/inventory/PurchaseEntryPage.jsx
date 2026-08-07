import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function PurchaseEntryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    partyId: "",
    purchaseNumber: `PUR-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    items: [],
    finalAmount: 0,
    amountPaid: 0,
  });
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1, rate: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partyRes, invRes] = await Promise.all([
          api.get("/api/party"),
          api.get("/api/inventory")
        ]);
        const allParties = partyRes.data?.parties || [];
        setSuppliers(allParties.filter(p => p.partyType === "supplier" || p.partyType === "both"));
        setProducts(invRes.data?.products || []);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) return;
    const product = products.find(p => p._id === newItem.productId);
    const itemTotal = newItem.quantity * newItem.rate;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: newItem.productId, name: product.name, quantity: newItem.quantity, rate: newItem.rate, total: itemTotal }],
      finalAmount: prev.finalAmount + itemTotal
    }));
    setNewItem({ productId: "", name: "", quantity: 1, rate: 0 });
  };

  const handleRemoveItem = (index) => {
    const item = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      finalAmount: prev.finalAmount - item.total
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || formData.items.length === 0) return alert("Please select a supplier and add at least one item.");
    setLoading(true);
    try {
      const supplierObj = suppliers.find(s => s._id === formData.partyId);
      await api.post("/api/purchase", { ...formData, supplierName: supplierObj.name, paymentMethod: formData.amountPaid > 0 ? 'cash' : 'credit' });
      alert("Purchase entry saved & stock updated successfully!");
      navigate("/inventory");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save purchase entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">New Purchase Entry (Supplier Bill)</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Supplier</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={formData.partyId}
              onChange={e => setFormData({...formData, partyId: e.target.value})}
              required
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Bill Number</label>
            <input
              className="w-full border p-2 rounded mt-1"
              value={formData.purchaseNumber}
              onChange={e => setFormData({...formData, purchaseNumber: e.target.value})}
              required
              placeholder="Supplier Bill No."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="w-full border p-2 rounded mt-1"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Add Items</h3>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Product</label>
              <select
                className="w-full border p-2 rounded"
                value={newItem.productId}
                onChange={e => {
                  const p = products.find(prod => prod._id === e.target.value);
                  setNewItem({...newItem, productId: e.target.value, name: p?.name, rate: p?.costPrice || 0});
                }}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500">Qty</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={newItem.quantity}
                onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500">Rate</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={newItem.rate}
                onChange={e => setNewItem({...newItem, rate: parseFloat(e.target.value)})}
              />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              <Plus size={20} />
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.name}</td>
                  <td className="p-2 border">{item.quantity}</td>
                  <td className="p-2 border">₹{item.rate}</td>
                  <td className="p-2 border">₹{item.total}</td>
                  <td className="p-2 border">
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-end mt-4 gap-2">
            <div className="text-right font-bold text-lg">
              Grand Total: ₹{formData.finalAmount}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Amount Paid Now (₹):</label>
              <input type="number" className="border p-2 rounded w-32" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="secondary" onClick={() => navigate("/inventory")}>
            Cancel
          </Button>
          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center gap-2">
            <Save size={18} /> {loading ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}