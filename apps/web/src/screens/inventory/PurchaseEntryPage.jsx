import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, FileText, Package, ArrowLeft, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function PurchaseEntryPage() {
  const navigate = useNavigate();
  const [entryMode, setEntryMode] = useState("lumpsum"); // "lumpsum" | "itemized"
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Common Form Fields
  const [partyId, setPartyId] = useState("");
  const [purchaseNumber, setPurchaseNumber] = useState(`PUR-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [notes, setNotes] = useState("");

  // Lump-sum Mode Fields
  const [lumpSumAmount, setLumpSumAmount] = useState("");
  const [lumpSumTitle, setLumpSumTitle] = useState("सप्लायर माल खरीद बिल (Direct Goods Purchase)");

  // Itemized Mode Fields
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: 1, rate: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partyRes, invRes] = await Promise.all([
          api.get("/api/party"),
          api.get("/api/inventory").catch(() => ({ data: { products: [] } }))
        ]);
        const allParties = partyRes.data?.parties || [];
        // Active suppliers or both
        setSuppliers(allParties.filter(p => !p.isDeleted && p.isActive !== false && (p.partyType === "supplier" || p.partyType === "both" || !p.partyType)));
        setProducts(invRes.data?.products || []);
      } catch (err) {
        console.error("Error fetching suppliers/inventory:", err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) return;
    const product = products.find(p => p._id === newItem.productId);
    const itemTotal = Number(newItem.quantity) * Number(newItem.rate);
    
    setItems(prev => [
      ...prev,
      {
        productId: newItem.productId,
        name: product?.name || newItem.name || "Item",
        quantity: Number(newItem.quantity),
        rate: Number(newItem.rate),
        price: Number(newItem.rate),
        total: itemTotal
      }
    ]);
    setNewItem({ productId: "", name: "", quantity: 1, rate: 0 });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculatedTotal = entryMode === "lumpsum"
    ? Number(lumpSumAmount) || 0
    : items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const selectedSupplier = suppliers.find(s => s._id === partyId);
  const currentSupplierBalance = Number(selectedSupplier?.currentBalance || selectedSupplier?.openingBalance || 0);
  const balancePending = Math.max(0, calculatedTotal - Number(amountPaid || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!partyId) {
      setErrorMsg("कृपया सप्लायर (पार्टी) का चयन करें।");
      return;
    }

    if (entryMode === "lumpsum") {
      if (!lumpSumAmount || Number(lumpSumAmount) <= 0) {
        setErrorMsg("कृपया वैध खरीद बिल राशि (₹) दर्ज करें।");
        return;
      }
    } else {
      if (items.length === 0) {
        setErrorMsg("कृपया कम से कम एक सामान जोड़ें या सीधा लम्पसम बिल चुनें।");
        return;
      }
    }

    setLoading(true);
    try {
      const finalItems = entryMode === "lumpsum"
        ? [{
            name: lumpSumTitle || "सप्लायर माल खरीद बिल",
            quantity: 1,
            rate: Number(lumpSumAmount),
            price: Number(lumpSumAmount),
            total: Number(lumpSumAmount)
          }]
        : items.map(it => ({
            productId: it.productId,
            name: it.name,
            quantity: Number(it.quantity),
            rate: Number(it.rate),
            price: Number(it.rate),
            total: Number(it.total)
          }));

      const payload = {
        partyId,
        supplierName: selectedSupplier?.name || "Supplier",
        purchaseNumber: purchaseNumber || `PUR-${Date.now()}`,
        date,
        items: finalItems,
        totalAmount: calculatedTotal,
        finalAmount: calculatedTotal,
        amountPaid: Number(amountPaid) || 0,
        paymentMethod: Number(amountPaid) >= calculatedTotal ? paymentMethod : (Number(amountPaid) > 0 ? "partial" : "credit"),
        notes: notes ? `${notes} | Entry Mode: ${entryMode}` : `Entry Mode: ${entryMode}`
      };

      await api.post("/api/purchase", payload);
      setSuccessMsg("सप्लायर खरीद बिल सफलतापूर्वक दर्ज हो गया और पार्टी खाते में जुड़ गया! ✅");
      setTimeout(() => {
        navigate("/inventory");
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || "खरीद बिल सहेजने में विफल। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
            title="वापस जाएं"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Building2 className="text-emerald-700" size={24} />
              <span>नया सप्लायर खरीद बिल (Purchase Inward)</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              सामान खरीद का बिल दर्ज करें — सीधा लम्पसम चालान या सामान-वार इन्वेंट्री
            </p>
          </div>
        </div>
      </div>

      {/* Entry Mode Switcher Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex gap-2">
        <button
          type="button"
          onClick={() => setEntryMode("lumpsum")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            entryMode === "lumpsum"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FileText size={18} />
          <span>📄 सीधा बिल / लम्पसम खरीद (Quick Lump-sum Bill)</span>
        </button>
        <button
          type="button"
          onClick={() => setEntryMode("itemized")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            entryMode === "itemized"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Package size={18} />
          <span>📦 सामान-वार इन्वेंट्री खरीद (Item-wise Entry)</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200 space-y-6">
        {/* Supplier & Bill Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              सप्लायर चुनें (Supplier Party) *
            </label>
            <select
              className="w-full border border-gray-300 p-2.5 rounded-xl mt-1 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              value={partyId}
              onChange={e => setPartyId(e.target.value)}
              required
            >
              <option value="">-- सप्लायर चुनें (Select Supplier) --</option>
              {suppliers.map(s => {
                const bal = Number(s.currentBalance || 0);
                const balText = bal < 0 ? ` (₹${Math.abs(bal).toLocaleString("en-IN")} देने हैं)` : bal > 0 ? ` (₹${bal.toLocaleString("en-IN")} लेने हैं)` : "";
                return (
                  <option key={s._id} value={s._id}>
                    {s.name}{balText}
                  </option>
                );
              })}
            </select>
            {selectedSupplier && (
              <p className="text-[11px] text-gray-500 mt-1">
                वर्तमान खाता स्थिति:{" "}
                <strong className={currentSupplierBalance < 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                  {currentSupplierBalance < 0 ? `₹${Math.abs(currentSupplierBalance).toLocaleString("en-IN")} देने हैं` : currentSupplierBalance > 0 ? `₹${currentSupplierBalance.toLocaleString("en-IN")} जमा` : "शून्य (₹0)"}
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              खरीद बिल नंबर (Bill / Invoice No.) *
            </label>
            <input
              className="w-full border border-gray-300 p-2.5 rounded-xl mt-1 text-sm focus:outline-none focus:border-emerald-600 font-medium"
              value={purchaseNumber}
              onChange={e => setPurchaseNumber(e.target.value)}
              required
              placeholder="सप्लायर का बिल नंबर जैसे INV-4501"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              बिल दिनांक (Invoice Date) *
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 p-2.5 rounded-xl mt-1 text-sm focus:outline-none focus:border-emerald-600 font-medium"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* MODE 1: LUMPSUM PURCHASE */}
        {entryMode === "lumpsum" ? (
          <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="text-emerald-700" size={20} />
              <h3 className="font-bold text-emerald-950 text-sm">
                सीधा खरीद बिल विवरण (Lump-sum Bill Amount)
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              यदि आप प्रत्येक सामान अलग-अलग नहीं जोड़ना चाहते, तो सप्लायर के बिल की कुल राशि सीधे यहाँ दर्ज करें। यह राशि सीधे P&L और सप्लायर के बहीखाते में दर्ज होगी।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  खरीद विवरण / मद (Description)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 bg-white p-2.5 rounded-xl mt-1 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                  value={lumpSumTitle}
                  onChange={e => setLumpSumTitle(e.target.value)}
                  placeholder="उदा. हार्डवेयर व सैनिटरी सामान खरीद"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  कुल खरीद बिल राशि (Total Amount ₹) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="w-full border-2 border-emerald-600 bg-white pl-8 pr-3 py-2 rounded-xl text-lg font-black text-emerald-950 focus:outline-none"
                    value={lumpSumAmount}
                    onChange={e => setLumpSumAmount(e.target.value)}
                    placeholder="उदा. 50000"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: ITEMIZED PURCHASE */
          <div className="border border-gray-200 p-4 sm:p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Package className="text-emerald-700" size={18} />
              <span>सामान इन्वेंट्री जोड़ें (Add Products to Purchase)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-6">
                <label className="text-xs font-bold text-gray-600">सामान चुनें (Product)</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded-xl text-xs mt-1 bg-white"
                  value={newItem.productId}
                  onChange={e => {
                    const p = products.find(prod => prod._id === e.target.value);
                    setNewItem({
                      ...newItem,
                      productId: e.target.value,
                      name: p?.name || "",
                      rate: p?.costPrice || p?.purchasePrice || p?.price || 0
                    });
                  }}
                >
                  <option value="">-- सामान चुनें --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (स्टॉक: {p.currentStock || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-600">मात्रा (Qty)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 p-2 rounded-xl text-xs mt-1"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-gray-600">खरीद दर (Rate ₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full border border-gray-300 p-2 rounded-xl text-xs mt-1"
                  value={newItem.rate}
                  onChange={e => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer shadow-xs"
                  title="सामान जोड़ें"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-gray-700 font-bold">
                    <tr>
                      <th className="p-2.5 border-b">सामान (Item)</th>
                      <th className="p-2.5 border-b text-center">मात्रा</th>
                      <th className="p-2.5 border-b text-right">दर (₹)</th>
                      <th className="p-2.5 border-b text-right">कुल (₹)</th>
                      <th className="p-2.5 border-b text-center">हटाएं</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-gray-900">{item.name}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right font-medium">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-800">₹{Number(item.total).toLocaleString("en-IN")}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                अभी कोई सामान नहीं जोड़ा गया है। ऊपर से सामान चुनकर '+' दबाएं।
              </p>
            )}
          </div>
        )}

        {/* Payment & Settlement Details */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wide">
            भुगतान एवं उधारी निपटान (Payment & Credit Settlement)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700">तुरंत दिया गया भुगतान (₹ Paid Now)</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full border border-gray-300 bg-white p-2.5 rounded-xl mt-1 text-sm font-bold focus:outline-none focus:border-emerald-600"
                value={amountPaid}
                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                placeholder="0 (पूरा उधार है तो 0 रखें)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">भुगतान का माध्यम (Mode)</label>
              <select
                className="w-full border border-gray-300 bg-white p-2.5 rounded-xl mt-1 text-sm focus:outline-none focus:border-emerald-600"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="credit">उधार (Credit / Pending)</option>
                <option value="cash">नकद (Cash)</option>
                <option value="online">ऑनलाइन / UPI / बैंक ट्रांसफर</option>
                <option value="cheque">चेक (Cheque)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">टिप्पणी / साइट / विवरण (Notes)</label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-white p-2.5 rounded-xl mt-1 text-sm focus:outline-none focus:border-emerald-600"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="साइट का नाम, चालान संदर्भ इत्यादि"
              />
            </div>
          </div>

          {/* Real-time Financial Impact Ledger Preview */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-500 font-medium">कुल खरीद राशि:</span>
              <p className="text-base font-black text-gray-900">₹{calculatedTotal.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">तुरंत नकद भुगतान:</span>
              <p className="text-base font-black text-emerald-700">₹{(Number(amountPaid) || 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">सप्लायर खाते में बकाया (देने हैं):</span>
              <p className="text-base font-black text-rose-700">₹{balancePending.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end items-center pt-2">
          <Button type="secondary" onClick={() => navigate("/inventory")}>
            रद्द करें (Cancel)
          </Button>
          <button
            type="submit"
            disabled={loading || calculatedTotal <= 0}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white font-bold py-2.5 px-6 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm text-sm"
          >
            <Save size={18} />
            <span>{loading ? "सहेजा जा रहा है..." : "खरीद बिल सुरक्षित करें (Save Bill)"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}