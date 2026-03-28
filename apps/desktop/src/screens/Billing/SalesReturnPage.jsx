import React, { useState } from "react";
import { Search, Save, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";

export default function SalesReturnPage() {
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState("");
  const [bill, setBill] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!billNumber) return;
    setLoading(true);
    try {
      let foundBill = null;
      
      // Try offline first
      const localBills = await dbService.getInvoices?.() || [];
      foundBill = localBills.find(b => b.billNumber === billNumber || b.invoice_number === billNumber);

      // Fallback to API if not found locally and online
      if (!foundBill && navigator.onLine) {
        const res = await api.get(`/api/billing?search=${billNumber}`).catch(() => null);
        if (res) {
            foundBill = res.bills?.find(b => b.billNumber === billNumber) || res.bills?.[0];
        }
      }

      if (foundBill) {
        setBill(foundBill);
        // Initialize return items with 0 quantity
        setReturnItems(foundBill.items.map(item => ({
          ...item,
          returnQty: 0,
          maxQty: item.quantity
        })));
      } else {
        alert("Invoice not found");
        setBill(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error searching invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (index, value) => {
    const newItems = [...returnItems];
    const val = parseFloat(value) || 0;
    if (val > newItems[index].maxQty) {
      alert(`Cannot return more than purchased quantity (${newItems[index].maxQty})`);
      return;
    }
    newItems[index].returnQty = val;
    setReturnItems(newItems);
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQty * (item.rate || item.price)), 0);
  };

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      alert("Please select at least one item to return");
      return;
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : `RET-SALES-${Date.now()}`;
    const payload = {
      _id: newId,
      uuid: newId,
      type: "sales_return",
      originalBillId: bill._id,
      items: itemsToReturn.map(i => ({
        itemId: i._id || i.id,
        name: i.name,
        quantity: i.returnQty,
        rate: i.rate || i.price
      })),
      totalRefund: calculateTotalRefund(),
      reason
    };

    try {
      // Save locally
      if (dbService.saveReturn) await dbService.saveReturn(payload);

      // Increase local stock since it's a sales return
      const localProducts = await dbService.getInventory?.() || [];
      for (const item of itemsToReturn) {
        const product = localProducts.find(p => p._id === (item._id || item.id));
        if (product) {
          const updatedProduct = { ...product, currentStock: (parseFloat(product.currentStock) || 0) + item.quantity };
          await dbService.updateProduct(product._id, updatedProduct);
        }
      }

      await auditService.logAction('CREATE', 'sales_return', null, payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'sales_return', method: "POST", url: "/api/billing/return", data: payload });

      alert("Sales return processed offline successfully (Credit Note Created)");
      navigate("/billing");
    } catch (err) {
      console.error(err);
      alert("Failed to process return");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/billing")} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Sales Return (Credit Note)</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Invoice Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="e.g. INV-202310-1234"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="self-end px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Searching..." : "Find Invoice"}
          </button>
        </form>
      </div>

      {bill && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4 border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold">{bill.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{new Date(bill.date || bill.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <h3 className="font-semibold mb-3">Select Items to Return</h3>
          <table className="w-full mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-right">Sold Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Return Qty</th>
                <th className="p-3 text-right">Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              {returnItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-right">{item.maxQty}</td>
                  <td className="p-3 text-right">₹{item.rate || item.price}</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min="0"
                      max={item.maxQty}
                      className="w-20 border p-1 rounded text-right"
                      value={item.returnQty}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                    />
                  </td>
                  <td className="p-3 text-right font-medium">
                    ₹{(item.returnQty * (item.rate || item.price)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="text-right">
              <p className="text-gray-600">Total Refund Amount</p>
              <p className="text-2xl font-bold text-red-600">₹{calculateTotalRefund().toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
            <textarea
              className="w-full border p-2 rounded-lg"
              rows="2"
              placeholder="e.g. Damaged goods, Wrong item sent"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setBill(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Save size={18} /> Process Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}