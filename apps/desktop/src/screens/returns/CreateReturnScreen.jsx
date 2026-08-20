import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function CreateReturnScreen() {
  const [parties, setParties] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  const [returnType, setReturnType] = useState('sales_return'); // 'sales_return' or 'purchase_return'
  const [selectedParty, setSelectedParty] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('खराब माल / वारंटी रिप्लेसमेंट (Defective / Warranty Claim)');
  const [isWarrantyRma, setIsWarrantyRma] = useState(true);
  const [rmaStatus, setRmaStatus] = useState('sent_to_manufacturer');
  const [manufacturerName, setManufacturerName] = useState('');
  const [courierFreightCost, setCourierFreightCost] = useState(150);
  const [courierPaidBy, setCourierPaidBy] = useState('shopkeeper'); // 'shopkeeper', 'manufacturer', 'customer'
  const [courierTrackingNo, setCourierTrackingNo] = useState('');
  
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    name: '',
    rate: '',
    quantity: '1'
  });
  
  const [returnNumber, setReturnNumber] = useState(`RET-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [partyRes, invRes] = await Promise.all([
        api.get('/party'),
        api.get('/inventory')
      ]);
      setParties(partyRes.data?.parties || (Array.isArray(partyRes.data) ? partyRes.data : []));
      setInventory(invRes.data?.products || invRes.data?.items || (Array.isArray(invRes.data) ? invRes.data : []));
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load parties or inventory.");
    } finally {
      setFetching(false);
    }
  };

  const filteredParties = parties.filter(p => {
    if (returnType === 'sales_return') return p.partyType === 'customer' || p.partyType === 'both';
    if (returnType === 'purchase_return') return p.partyType === 'supplier' || p.partyType === 'both';
    return true;
  });

  const handleAddItem = () => {
    if (!currentItem.productId || parseFloat(currentItem.quantity) <= 0) {
      alert('Please select a product and enter valid quantity.');
      return;
    }

    const product = inventory.find(p => p._id === currentItem.productId);
    const qty = parseFloat(currentItem.quantity);
    const rate = parseFloat(currentItem.rate || (returnType === 'sales_return' ? product.sellingPrice : product.costPrice) || 0);
    const total = qty * rate;

    setReturnItems([...returnItems, {
      productId: product._id,
      name: product.name,
      quantity: qty,
      rate: rate,
      total: total
    }]);

    setCurrentItem({ productId: '', name: '', rate: '', quantity: '1' });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...returnItems];
    newItems.splice(index, 1);
    setReturnItems(newItems);
  };

  const calculateGrandTotal = () => {
    return returnItems.reduce((acc, item) => acc + item.total, 0);
  };

  const handleSaveReturn = async () => {
    if (!selectedParty) return alert('Please select a Party.');
    if (returnItems.length === 0) return alert('Please add at least one item.');

    setLoading(true);
    try {
      const payload = {
        returnNumber,
        partyId: selectedParty,
        type: returnType,
        items: returnItems,
        totalAmount: calculateGrandTotal(),
        reason,
        date: new Date().toISOString()
      };

      await api.post('/return', payload);
      alert(`Success: ${returnType === 'sales_return' ? 'Sales' : 'Purchase'} Return processed successfully!`);
      window.history.back();
    } catch (error) {
      console.error("Save Return Error:", error);
      alert(error.response?.data?.message || 'Failed to process return.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-6">Create Return Entry</h2>

      <div className="space-y-6">
        
        {/* RMA / Warranty & Manufacturer Return Logistics Section */}
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>🛡️ वारंटी क्लेम एवं मैन्युफैक्चरर को भेजने का भाड़ा/कूरियर खर्च</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isWarrantyRma}
                onChange={(e) => setIsWarrantyRma(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>कंपनी / फैक्ट्री को वारंटी में भेजना है?</span>
            </label>
          </div>

          {isWarrantyRma && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">RMA स्टेटस</label>
                <select
                  value={rmaStatus}
                  onChange={(e) => setRmaStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 font-bold bg-white"
                >
                  <option value="received_from_customer">1. ग्राहक से प्राप्त हुआ (In Shop)</option>
                  <option value="sent_to_manufacturer">2. कंपनी/फैक्ट्री को भेजा गया (In Transit)</option>
                  <option value="received_from_factory">3. कंपनी से नया/रिपेयर होकर आया (Ready)</option>
                  <option value="delivered_to_customer">4. ग्राहक को सौंप दिया गया (Resolved)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">कंपनी / मैन्युफैक्चरर का नाम</label>
                <input
                  type="text"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  placeholder="e.g. Havells Service Center, Crompton"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">भाड़ा / कूरियर खर्च (₹)</label>
                <input
                  type="number"
                  value={courierFreightCost}
                  onChange={(e) => setCourierFreightCost(e.target.value)}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white font-mono text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">भाड़ा कौन देगा?</label>
                <select
                  value={courierPaidBy}
                  onChange={(e) => setCourierPaidBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="shopkeeper">दुकानदार द्वारा वहन (Shop Expense)</option>
                  <option value="manufacturer">कंपनी से क्लेम (Claim from Company)</option>
                  <option value="customer">ग्राहक द्वारा देय (Customer Paid)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="returnType" value="sales_return" checked={returnType === "sales_return"} onChange={() => { setReturnType("sales_return"); setSelectedParty(""); }} className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Sales Return</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input type="radio" name="returnType" value="purchase_return" checked={returnType === "purchase_return"} onChange={() => { setReturnType("purchase_return"); setSelectedParty(""); }} className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Purchase Return</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select {returnType === 'sales_return' ? 'Customer' : 'Supplier'}</label>
              <select className="w-full border p-2 rounded mt-1" value={selectedParty} onChange={e => setSelectedParty(e.target.value)} required>
                <option value="">-- Choose Party --</option>
                {filteredParties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
              <input className="w-full border p-2 rounded mt-1" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Defective, Wrong Item" />
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
                value={currentItem.productId}
                onChange={e => {
                  const val = e.target.value;
                  const prod = inventory.find(p => p._id === val);
                  const defaultRate = prod ? (returnType === 'sales_return' ? prod.sellingPrice : prod.costPrice) : 0;
                  setCurrentItem({ ...currentItem, productId: val, rate: String(defaultRate || 0) });
                }}
              >
                <option value="">Select Item</option>
                {inventory.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500">Qty</label>
              <input type="number" className="w-full border p-2 rounded" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500">Rate</label>
              <input type="number" className="w-full border p-2 rounded" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: e.target.value})} />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white p-2 px-4 rounded hover:bg-blue-700 font-bold text-xl">+</button>
          </div>

          {returnItems.length > 0 ? (
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">Rate</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">{item.quantity}</td>
                    <td className="p-2 border">₹{item.rate}</td>
                    <td className="p-2 border font-semibold">₹{item.total}</td>
                    <td className="p-2 border text-center">
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800 font-bold">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 mt-4">No items added yet.</div>
          )}
          
          <div className="text-right mt-4 font-bold text-xl text-gray-800">
            Total Return Value: <span className={returnType === 'sales_return' ? 'text-red-600' : 'text-green-600'}>₹{calculateGrandTotal()}</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <button onClick={handleSaveReturn} disabled={loading} className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-md inline-flex items-center gap-2">
            {loading ? "Processing..." : "Process Return"}
          </button>
        </div>
      </div>
    </div>
  );
}