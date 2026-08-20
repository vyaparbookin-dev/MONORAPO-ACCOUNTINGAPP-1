import React, { useState } from "react";
import { X, Utensils, Plus, CheckCircle, Clock, ChefHat, Printer } from "lucide-react";

const TABLES_LIST = [
  { id: "T1", name: "Table 1 (Dine-in)", zone: "AC Hall", capacity: 4, status: "vacant" },
  { id: "T2", name: "Table 2 (Dine-in)", zone: "AC Hall", capacity: 4, status: "occupied" },
  { id: "T3", name: "Table 3 (Dine-in)", zone: "AC Hall", capacity: 6, status: "vacant" },
  { id: "T4", name: "Table 4 (Family)", zone: "Garden", capacity: 8, status: "vacant" },
  { id: "T5", name: "Table 5 (Garden)", zone: "Garden", capacity: 4, status: "vacant" },
  { id: "P1", name: "Parcel / Takeaway", zone: "Counter", capacity: 1, status: "vacant" },
  { id: "SW", name: "Swiggy / Zomato", zone: "Delivery", capacity: 1, status: "vacant" },
];

export default function RestaurantKotModal({ isOpen, onClose, onApplyKot, inventory = [] }) {
  const [selectedTable, setSelectedTable] = useState(TABLES_LIST[0]);
  const [waiterName, setWaiterName] = useState("");
  const [cookingNotes, setCookingNotes] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState("");
  const [kotItems, setKotItems] = useState([
    { id: 1, name: "Paneer Butter Masala", quantity: 2, rate: 240, total: 480, notes: "Medium Spicy" },
    { id: 2, name: "Butter Tandoori Roti", quantity: 6, rate: 25, total: 150, notes: "Crispy" },
  ]);

  if (!isOpen) return null;

  const handleAddItemToKot = () => {
    if (!selectedItemName.trim()) return alert("कृपया मेनू आइटम चुनें!");
    const rate = parseFloat(itemRate) || 0;
    const qty = parseFloat(itemQty) || 1;
    const newItem = {
      id: Date.now(),
      name: selectedItemName.trim(),
      quantity: qty,
      rate: rate,
      total: Math.round(rate * qty),
      notes: cookingNotes.trim()
    };
    setKotItems([...kotItems, newItem]);
    setSelectedItemName("");
    setCookingNotes("");
    setItemQty(1);
    setItemRate("");
  };

  const handleRemoveItem = (id) => {
    setKotItems(kotItems.filter(i => i.id !== id));
  };

  const totalKotAmount = kotItems.reduce((sum, i) => sum + i.total, 0);

  const handleApplyToBill = () => {
    if (kotItems.length === 0) return alert("KOT में कम से कम 1 आइटम होना चाहिए!");
    
    // Add all KOT items to main bill
    onApplyKot({
      table: selectedTable.name,
      waiter: waiterName || "Counter",
      items: kotItems.map(i => ({
        name: `${i.name} [${selectedTable.name}]`,
        category: "Restaurant",
        quantity: i.quantity,
        rate: i.rate,
        total: i.total,
        unit: "PLT",
        notes: i.notes ? `Kitchen Note: ${i.notes}` : ""
      }))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-xl border border-amber-400/30">
              <Utensils className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>रेस्टोरेंट व कैफे KOT / टेबल मैनेजमेंट</span>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Kitchen Order Ticket</span>
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                डाइन-इन टेबल चयन, किचन ऑर्डर टिकट व कुकिंग निर्देश
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Table Selector */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-2">1. टेबल या पार्सल चुनें (Select Table / Order Type)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TABLES_LIST.map((tbl) => {
                const isSelected = selectedTable.id === tbl.id;
                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTable(tbl)}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-md"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400"
                    }`}
                  >
                    <div className="text-xs font-black">{tbl.name}</div>
                    <div className={`text-[10px] font-medium ${isSelected ? "text-amber-100" : "text-slate-500"}`}>
                      {tbl.zone} • {tbl.capacity} Seater
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Menu Item to KOT */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 space-y-3">
            <label className="text-xs font-black text-amber-950 uppercase tracking-wide block">2. मेनू आइटम व कुकिंग निर्देश जोड़ें</label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  list="rest-menu-list"
                  value={selectedItemName}
                  onChange={(e) => {
                    setSelectedItemName(e.target.value);
                    const matched = inventory.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matched) setItemRate(matched.sellingPrice || matched.price || 0);
                  }}
                  placeholder="आइटम चुनें (e.g. Butter Naan, Biryani)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
                <datalist id="rest-menu-list">
                  {inventory.map((p) => <option key={p._id || p.id} value={p.name} />)}
                </datalist>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Qty"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={itemRate}
                  onChange={(e) => setItemRate(e.target.value)}
                  placeholder="₹ Rate"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItemToKot}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> KOT में जोड़ें
                </button>
              </div>
            </div>

            <input
              type="text"
              value={cookingNotes}
              onChange={(e) => setCookingNotes(e.target.value)}
              placeholder="कुकिंग निर्देश (e.g. Less Spicy, No Onion, Extra Crispy)"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            />
          </div>

          {/* KOT Items List */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-b pb-1">
              <span>ऑर्डर आइटम्स ({selectedTable.name})</span>
              <span>कुल: ₹{totalKotAmount}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {kotItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-slate-500 font-mono ml-2">× {item.quantity}</span>
                    {item.notes && <p className="text-[10px] text-amber-700 font-medium">📝 {item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 font-mono">₹{item.total}</span>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-400 font-bold">
                {selectedTable.name} • {kotItems.length} आइटम्स
              </div>
              <div className="text-sm font-black">
                कुल KOT रकम: <span className="text-amber-400 font-mono text-base">₹{totalKotAmount}</span>
              </div>
            </div>

            <button
              onClick={handleApplyToBill}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              <span>🧾 मुख्य बिल में ट्रांसफर करें (+ Add to Bill)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
