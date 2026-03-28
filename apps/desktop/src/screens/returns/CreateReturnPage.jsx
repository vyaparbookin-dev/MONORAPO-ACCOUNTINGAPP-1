import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, ArrowLeftRight } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function CreateReturnPage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "sales_return",
    partyId: "",
    returnNumber: `RET-${Date.now()}`,
    reason: "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    totalAmount: 0,
  });
  
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1, rate: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partyRes, invRes] = await Promise.all([
          api.get("/api/party"),
          api.get("/api/inventory")
        ]);
        setParties(partyRes.data?.parties || []);
        setProducts(invRes.data?.products || []);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const filteredParties = parties.filter(p => {
    if (formData.type === 'sales_return') return p.partyType === 'customer' || p.partyType === 'both';
    if (formData.type === 'purchase_return') return p.partyType === 'supplier' || p.partyType === 'both';
    return true;
  });

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) return;
    const product = products.find(p => p._id === newItem.productId);
    const itemTotal = newItem.quantity * newItem.rate;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: newItem.productId, name: product.name, quantity: newItem.quantity, rate: newItem.rate, total: itemTotal }],
      totalAmount: prev.totalAmount + itemTotal
    }));
    setNewItem({ productId: "", name: "", quantity: 1, rate: 0 });
  };

  const handleRemoveItem = (index) => {
    const item = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      totalAmount: prev.totalAmount - item.total
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || formData.items.length === 0) return alert("Please select a Party and add at least one item.");
    setLoading(true);
    try {
      await api.post("/api/return", formData);
      alert(`Return processed & stock adjusted successfully!`);
      navigate(-1); // Go back to the previous page
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to process return.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <ArrowLeftRight className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold">New Return Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="returnType" value="sales_return" checked={formData.type === "sales_return"} onChange={() => setFormData({...formData, type: "sales_return", partyId: ""})} className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Sales Return (Credit Note) - Wapas Aaya</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input type="radio" name="returnType" value="purchase_return" checked={formData.type === "purchase_return"} onChange={() => setFormData({...formData, type: "purchase_return", partyId: ""})} className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Purchase Return (Debit Note) - Wapas Bheja</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select {formData.type === 'sales_return' ? 'Customer' : 'Supplier'}</label>
              <select className="w-full border p-2 rounded mt-1" value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})} required>
                <option value="">-- Choose Party --</option>
                {filteredParties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
              <input className="w-full border p-2 rounded mt-1" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Defective, Wrong Item" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" className="w-full border p-2 rounded mt-1" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Add Items to Return</h3>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Product</label>
              <select
                className="w-full border p-2 rounded"
                value={newItem.productId}
                onChange={e => {
                  const p = products.find(prod => prod._id === e.target.value);
                  const defaultRate = p ? (formData.type === 'sales_return' ? p.sellingPrice : p.costPrice) : 0;
                  setNewItem({...newItem, productId: e.target.value, name: p?.name, rate: defaultRate});
                }}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500">Qty</label>
              <input type="number" className="w-full border p-2 rounded" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500">Rate</label>
              <input type="number" className="w-full border p-2 rounded" value={newItem.rate} onChange={e => setNewItem({...newItem, rate: parseFloat(e.target.value)})} />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Rate</th>
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
                  <td className="p-2 border font-semibold">₹{item.total}</td>
                  <td className="p-2 border text-center">
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="text-right mt-4 font-bold text-xl text-gray-800">
            Total Return Value: <span className={formData.type === 'sales_return' ? 'text-red-600' : 'text-green-600'}>₹{formData.totalAmount}</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button type="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <button type="submit" disabled={loading} className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-md inline-flex items-center gap-2">
            <Save size={18} /> {loading ? "Processing..." : "Confirm & Save Return"}
          </button>
        </div>
      </form>
    </div>
  );
}
