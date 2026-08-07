import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";

export default function CreateB2bDocumentPage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "quotation",
    partyId: "",
    documentNumber: `QTN-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
    totalAmount: 0,
    freightCharges: 0,
    packingForwardingCharges: 0,
  });
  
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1, rate: 0, serialNumber: "", warranty: "", batchNumber: "", mfgDate: "", expiryDate: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Party Offline/Online
        let allParties = [];
        allParties = await dbService.getCustomers();
        if (!allParties.length) {
          const partyRes = await api.get("/api/party").catch(() => null);
          if (partyRes) allParties = partyRes.data?.parties || [];
        }
        setParties(allParties.filter(p => p.partyType === 'customer' || p.partyType === 'both'));
        
        // Products Offline/Online
        let allProducts = [];
        allProducts = await dbService.getInventory();
        if (!allProducts.length) {
          const invRes = await api.get("/api/inventory").catch(() => null);
          if (invRes) allProducts = invRes.data?.products || [];
        }
        setProducts(allProducts);
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
      items: [...prev.items, { productId: newItem.productId, name: product.name, quantity: newItem.quantity, rate: newItem.rate, serialNumber: newItem.serialNumber, warranty: newItem.warranty, batchNumber: newItem.batchNumber, mfgDate: newItem.mfgDate, expiryDate: newItem.expiryDate, total: itemTotal }],
      totalAmount: prev.totalAmount + itemTotal
    }));
    setNewItem({ productId: "", name: "", quantity: 1, rate: 0, serialNumber: "", warranty: "", batchNumber: "", mfgDate: "", expiryDate: "" });
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
    if (!formData.partyId || formData.items.length === 0) return alert("Please select a Customer and add items.");
    setLoading(true);
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `B2B-${Date.now()}`;
      const payload = {
        ...formData,
        _id: newId,
        uuid: newId,
        finalAmount: formData.totalAmount + (formData.freightCharges || 0) + (formData.packingForwardingCharges || 0),
      };
      
      // 1. Save Locally
      if (dbService.saveB2bDocument) await dbService.saveB2bDocument(payload);

      // 2. Reduce Stock if Delivery Challan
      if (formData.type === 'delivery_challan') {
        for (const item of payload.items) {
          const product = products.find(p => p._id === item.productId);
          if (product) {
            const updatedProduct = { ...product, currentStock: (parseFloat(product.currentStock) || 0) - item.quantity };
            await dbService.updateProduct(product._id, updatedProduct);
          }
        }
      }

      await auditService.logAction('CREATE', 'b2b_document', null, payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'b2b_document', method: "POST", url: "/api/b2b", data: payload });

      alert(`${formData.type.replace('_', ' ').toUpperCase()} created offline successfully!`);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Create B2B Document</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Document Type</label>
              <select className="w-full border p-2 rounded mt-1 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="quotation">Quotation / Estimate</option>
                <option value="sales_order">Sales Order</option>
                <option value="delivery_challan">Delivery Challan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Document Number</label>
              <input className="w-full border p-2 rounded mt-1 bg-white" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Customer</label>
              <select className="w-full border p-2 rounded mt-1 bg-white" value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})} required>
                <option value="">-- Choose Party --</option>
                {parties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" className="w-full border p-2 rounded mt-1 bg-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Add Products</h3>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Product</label>
              <select
                className="w-full border p-2 rounded bg-white"
                value={newItem.productId}
                onChange={e => {
                  const p = products.find(prod => prod._id === e.target.value);
                  setNewItem({...newItem, productId: e.target.value, name: p?.name, rate: p?.sellingPrice || 0, warranty: p?.warrantyMonths ? `${p.warrantyMonths} Months` : "", expiryDate: p?.expiryDate || ""});
                }}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <div className="flex gap-2 mt-1">
                 <input type="text" placeholder="IMEI/Serial No" className="w-full text-xs border p-1 rounded focus:ring-blue-500 text-blue-700 placeholder-blue-300" value={newItem.serialNumber || ''} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} />
                 <input type="text" placeholder="Warranty" className="w-full text-xs border p-1 rounded focus:ring-green-500 text-green-700 placeholder-green-300" value={newItem.warranty || ''} onChange={e => setNewItem({...newItem, warranty: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-1">
                 <input type="text" placeholder="Batch No" className="w-full text-xs border p-1 rounded focus:ring-purple-500 text-purple-700 placeholder-purple-300" value={newItem.batchNumber || ''} onChange={e => setNewItem({...newItem, batchNumber: e.target.value})} />
                 <input type="text" placeholder="Mfg Date" className="w-full text-xs border p-1 rounded focus:ring-purple-500 text-purple-700 placeholder-purple-300" value={newItem.mfgDate || ''} onChange={e => setNewItem({...newItem, mfgDate: e.target.value})} />
                 <input type="text" placeholder="Exp Date" className="w-full text-xs border p-1 rounded focus:ring-red-500 text-red-700 placeholder-red-300" value={newItem.expiryDate || ''} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
              </div>
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

          <table className="w-full text-left border-collapse mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border text-center">Qty</th>
                <th className="p-2 border text-right">Rate</th>
                <th className="p-2 border text-right">Total</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">
                    <div className="font-medium">{item.name}</div>
                    {(item.serialNumber || item.warranty) && (
                      <div className="text-xs text-gray-500 flex gap-2 mt-1">
                        {item.serialNumber && <span><strong className="text-gray-700">SN:</strong> {item.serialNumber}</span>}
                        {item.warranty && <span><strong className="text-gray-700">Wty:</strong> {item.warranty}</span>}
                      </div>
                    )}
                    {(item.batchNumber || item.mfgDate || item.expiryDate) && (
                      <div className="text-xs text-gray-500 flex gap-2 mt-1">
                        {item.batchNumber && <span><strong className="text-gray-700">Batch:</strong> {item.batchNumber}</span>}
                        {item.mfgDate && <span><strong className="text-gray-700">Mfg:</strong> {item.mfgDate}</span>}
                        {item.expiryDate && <span><strong className="text-red-600">Exp:</strong> {item.expiryDate}</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border text-center">{item.quantity}</td>
                  <td className="p-2 border text-right">₹{item.rate}</td>
                  <td className="p-2 border text-right font-semibold">₹{item.total}</td>
                  <td className="p-2 border text-center">
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-end gap-6 mt-6">
            <div className="text-right">
               <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Freight / Transport (₹)</label>
               <input type="number" className="border border-gray-300 p-2 w-32 text-right rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.freightCharges || ''} onChange={e => setFormData({...formData, freightCharges: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
            <div className="text-right">
               <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Packing & Forwarding (₹)</label>
               <input type="number" className="border border-gray-300 p-2 w-32 text-right rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.packingForwardingCharges || ''} onChange={e => setFormData({...formData, packingForwardingCharges: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
          </div>

          <div className="text-right mt-4 font-bold text-2xl text-gray-800 border-t pt-4">
            Grand Total: <span className="text-blue-600">₹{formData.totalAmount + (formData.freightCharges || 0) + (formData.packingForwardingCharges || 0)}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between border-t pt-4 items-center">
          {formData.type === 'delivery_challan' && (
            <p className="text-red-600 text-sm font-semibold">* Inventory stock will be reduced upon saving a Delivery Challan.</p>
          )}
          <div className="flex-1"></div>
          <button type="submit" disabled={loading} className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-md inline-flex items-center gap-2">
            <Save size={18} /> {loading ? "Processing..." : `Save ${formData.type.replace('_', ' ').toUpperCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}