import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Plus, Trash2, Save } from "lucide-react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

export default function StockTransferPage() {
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fromBranchId: "",
    fromWarehouseId: "",
    toBranchId: "",
    toWarehouseId: "",
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1 });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let localBranches = await dbService.getBranches?.() || [];
        let localWarehouses = await dbService.getWarehouses?.() || [];
        let localProducts = await dbService.getInventory?.() || [];

        if (localBranches.length === 0) {
            const branchRes = await api.get("/api/branch").catch(()=>({data:{}}));
            localBranches = branchRes.data?.branches || branchRes.data?.data || [];
        }
        if (localWarehouses.length === 0) {
            const whRes = await api.get("/api/warehouse").catch(()=>({data:{}}));
            localWarehouses = whRes.data?.warehouses || whRes.data?.data || [];
        }
        if (localProducts.length === 0) {
            const prodRes = await api.get("/api/inventory").catch(()=>({data:{}}));
            localProducts = prodRes.data?.products || [];
        }

        setBranches(localBranches);
        setWarehouses(localWarehouses);
        setProducts(localProducts);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) return alert("Select product and valid quantity");
    const product = products.find((p) => p._id === newItem.productId);
    
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: newItem.productId, name: product.name, quantity: parseFloat(newItem.quantity) }],
    }));
    setNewItem({ productId: "", name: "", quantity: 1 });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromBranchId || !formData.toBranchId) return alert("Source and Destination Branches are required!");
    if (formData.items.length === 0) return alert("Please add at least one product to transfer.");

    setLoading(true);
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `TRF-${Date.now()}`;
      const payload = { ...formData, _id: newId, uuid: newId, date: new Date().toISOString() };

      if (dbService.saveStockTransfer) await dbService.saveStockTransfer(payload);
      
      await auditService.logAction('CREATE', 'stock_transfer', null, payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'stock_transfer', method: "POST", url: "/api/stock-transfer", data: payload });

      alert("Stock Transfer Initiated Offline Successfully!");
      // Reset form after success
      setFormData({ ...formData, notes: "", items: [] });
    } catch (err) {
      console.error(err);
      alert("Failed to transfer stock: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter warehouses based on selected branches
  const fromWarehouses = warehouses.filter(w => w.branchId?._id === formData.fromBranchId || w.branchId === formData.fromBranchId);
  const toWarehouses = warehouses.filter(w => w.branchId?._id === formData.toBranchId || w.branchId === formData.toBranchId);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <ArrowRightLeft className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Transfer</h1>
          <p className="text-gray-500 text-sm">Move inventory between Branches or Warehouses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Location */}
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <h2 className="text-lg font-bold text-red-800 mb-4 border-b border-red-200 pb-2">Send From (Source)</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Branch *</label>
            <select className="w-full border p-2 rounded mb-4" value={formData.fromBranchId} onChange={e => setFormData({...formData, fromBranchId: e.target.value, fromWarehouseId: ""})} required>
              <option value="">-- Select Branch --</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse (Optional)</label>
            <select className="w-full border p-2 rounded" value={formData.fromWarehouseId} onChange={e => setFormData({...formData, fromWarehouseId: e.target.value})}>
              <option value="">-- Select Warehouse --</option>
              {fromWarehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>

          {/* To Location */}
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h2 className="text-lg font-bold text-green-800 mb-4 border-b border-green-200 pb-2">Receive At (Destination)</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Branch *</label>
            <select className="w-full border p-2 rounded mb-4" value={formData.toBranchId} onChange={e => setFormData({...formData, toBranchId: e.target.value, toWarehouseId: ""})} required>
              <option value="">-- Select Branch --</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse (Optional)</label>
            <select className="w-full border p-2 rounded" value={formData.toWarehouseId} onChange={e => setFormData({...formData, toWarehouseId: e.target.value})}>
              <option value="">-- Select Warehouse --</option>
              {toWarehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold mb-2">Items to Transfer</h3>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Product</label>
              <select className="w-full border p-2 rounded" value={newItem.productId} onChange={e => setNewItem({...newItem, productId: e.target.value})}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} (In Stock: {p.currentStock})</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500">Transfer Qty</label>
              <input type="number" className="w-full border p-2 rounded" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
          </div>

          <table className="w-full text-left border-collapse mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border text-center">Transfer Quantity</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.name}</td>
                  <td className="p-2 border text-center font-bold text-blue-600">{item.quantity}</td>
                  <td className="p-2 border text-center"><button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-end gap-4">
          <textarea className="w-full border p-2 rounded" rows="2" placeholder="Transfer Notes / Reason (Optional)" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md inline-flex items-center gap-2">
            <Save size={18} /> {loading ? "Processing..." : "Confirm Stock Transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}