import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Scan } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import BarcodeScanner from "../../components/BarcodeScanner";

export default function PurchaseEntryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

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
        // Fetch Parties
        let allParties = [];
        try {
          allParties = await dbService.getCustomers(); // Fetch offline first
          if (!allParties || allParties.length === 0) {
            const partyRes = await api.get("/api/party");
            allParties = partyRes.data?.parties || [];
          }
        } catch (e) {
          console.warn("Offline: Could not fetch suppliers from API");
        }
        setSuppliers((allParties || []).filter(p => p.partyType === "supplier" || p.partyType === "both"));
        
        // Fetch Products (Offline First)
        let allProducts = [];
        allProducts = await dbService.getInventory();
        if (!allProducts || allProducts.length === 0) {
          const invRes = await api.get("/api/inventory").catch(() => null);
          if (invRes) {
            allProducts = invRes.data?.products || [];
          }
        }
        setProducts(allProducts || []);
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

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    const product = products.find(p => p.barcode === decodedText || p.sku === decodedText);
    if (product) {
      setNewItem({ ...newItem, productId: product._id, name: product.name, rate: product.costPrice || 0 });
      // Auto-focus quantity field after scan
      setTimeout(() => document.getElementById('purchase-qty')?.focus(), 100);
    } else {
      alert("Product not found in inventory! Please add it to inventory first.");
    }
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
      const newId = crypto.randomUUID ? crypto.randomUUID() : `PUR-${Date.now()}`;
      
      const payload = { 
        ...formData, 
        _id: newId, 
        uuid: newId,
        supplierName: supplierObj?.name || 'Offline Supplier', 
        paymentMethod: formData.amountPaid > 0 ? 'cash' : 'credit' 
      };
      
      // 1. Save locally and update stock
      if (dbService.savePurchase) await dbService.savePurchase(payload);
      
      for (const item of payload.items) {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          const updatedProduct = { ...product, currentStock: (parseFloat(product.currentStock) || 0) + item.quantity };
          await dbService.updateProduct(product._id, updatedProduct);
        }
      }

      // --- LOCAL SUPPLIER LEDGER UPDATE (ACCOUNTS PAYABLE) ---
      if (supplierObj && dbService.updateCustomer) {
        const pendingAmount = payload.finalAmount - (payload.amountPaid || 0);

        if (pendingAmount > 0) {
          const updatedBal = (parseFloat(supplierObj.currentBalance ?? supplierObj.balance ?? 0)) + pendingAmount;
          await dbService.updateCustomer(supplierObj._id || supplierObj.uuid, { ...supplierObj, currentBalance: updatedBal, balance: updatedBal });

          if (dbService.saveTransaction) {
            await dbService.saveTransaction({
              uuid: `TX-PUR-${Date.now()}`, partyId: supplierObj._id || supplierObj.uuid, type: 'purchase',
              debit: 0, credit: pendingAmount, date: payload.date || new Date().toISOString(),
              details: `Purchase Bill #${payload.purchaseNumber}`, status: 'completed'
            });
          }
        }
        if (payload.amountPaid > 0 && dbService.saveTransaction) {
            await dbService.saveTransaction({
              uuid: `TX-PAY-${Date.now()}`, partyId: supplierObj._id || supplierObj.uuid, type: 'payment_given',
              debit: payload.amountPaid, credit: 0, date: payload.date || new Date().toISOString(),
              details: `Advance Payment for Purchase #${payload.purchaseNumber}`, status: 'completed'
            });
        }
      }

      await auditService.logAction('CREATE', 'purchase', null, payload);

      // 2. Queue for Cloud Sync
      await syncQueue.enqueue({ entityId: newId, entity: 'purchase', method: "POST", url: "/api/purchase", data: payload });

      alert("Purchase entry saved & stock updated offline successfully!");
      navigate("/inventory");
    } catch (err) {
      console.error(err);
      alert("Failed to save purchase entry: " + err.message);
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Add Items</h3>
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition text-sm font-medium border border-blue-200"
            >
              <Scan size={16} />
              {showScanner ? "Close Scanner" : "Scan Barcode"}
            </button>
          </div>
          
          {showScanner && (
            <div className="mb-4">
              <BarcodeScanner onScanSuccess={handleScanSuccess} onScanFailure={(err) => console.log(err)} />
            </div>
          )}

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
                id="purchase-qty"
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