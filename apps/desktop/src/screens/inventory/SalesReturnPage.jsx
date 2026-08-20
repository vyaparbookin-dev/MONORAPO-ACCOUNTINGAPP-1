import React, { useState, useEffect } from "react";
import { Undo2, Save, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/Button";

const SalesReturnPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplierName: "",
    originalInvoiceNo: "",
    returnDate: new Date().toISOString().split("T")[0],
    reason: "damaged",
    items: [],
  });

  const [newItem, setNewItem] = useState({ productId: "", quantity: 1, price: 0 });

  useEffect(() => {
    api.get("/api/inventory").then((res) => {
      const data = res.data?.products || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    }).catch(err => console.error(err));
  }, []);

  const handleAddItem = () => {
    if (!newItem.productId) return;
    const product = products.find((p) => p._id === newItem.productId);
    
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...newItem,
          name: product.name,
          total: newItem.quantity * newItem.price,
        },
      ],
    }));
    setNewItem({ productId: "", quantity: 1, price: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API endpoint for purchase return (Debit Note)
      await api.post("/inventory/purchase-return", formData);
      alert("Purchase Return (Debit Note) created successfully!");
      navigate("/inventory");
    } catch (error) {
      console.error(error);
      alert("Failed to create return entry.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-600">
        <Undo2 /> Purchase Return (Debit Note)
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
            <input
              className="w-full border p-2 rounded mt-1"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              required
              placeholder="e.g. ABC Traders"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Original Invoice No.</label>
            <input
              className="w-full border p-2 rounded mt-1"
              value={formData.originalInvoiceNo}
              onChange={(e) => setFormData({ ...formData, originalInvoiceNo: e.target.value })}
              placeholder="Ref Invoice #"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Items to Return</h3>
          <div className="flex gap-2 items-end mb-4 bg-gray-50 p-3 rounded">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Product</label>
              <select
                className="w-full border p-2 rounded"
                value={newItem.productId}
                onChange={(e) => {
                  const p = products.find((prod) => prod._id === e.target.value);
                  setNewItem({ ...newItem, productId: e.target.value, price: p?.costPrice || 0 });
                }}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500">Qty</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded">
              <Plus size={20} />
            </button>
          </div>

          <ul className="space-y-2">
            {formData.items.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b pb-2">
                <span>{item.name} (x{item.quantity})</span>
                <span className="font-bold">₹{item.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="secondary" onClick={() => navigate("/inventory")}>Cancel</Button>
          <Button type="danger"><Save size={18} /> Create Return</Button>
        </div>
      </form>
    </div>
  );
};

export default SalesReturnPage;