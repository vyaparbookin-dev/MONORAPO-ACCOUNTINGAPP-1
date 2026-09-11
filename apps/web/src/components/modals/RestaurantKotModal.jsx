import React, { useState, useEffect } from "react";
import { X, Utensils, Plus, CheckCircle, Clock, ChefHat, Printer, Users, PlusCircle, Trash2, Edit3, Sparkles } from "lucide-react";

const INITIAL_DEFAULT_TABLES = [
  { id: "P1", name: "🛍️ Parcel / Takeaway (No Table)", zone: "Counter", capacity: 1, status: "vacant" },
  { id: "SW", name: "🛵 Swiggy / Zomato Delivery", zone: "Delivery", capacity: 1, status: "vacant" },
  { id: "T1", name: "Table 1 (Dine-in)", zone: "AC Hall", capacity: 2, status: "vacant" },
  { id: "T2", name: "Table 2 (Dine-in)", zone: "AC Hall", capacity: 4, status: "occupied" },
  { id: "T3", name: "Table 3 (Dine-in)", zone: "AC Hall", capacity: 6, status: "vacant" },
  { id: "T4", name: "Table 4 (Family)", zone: "Garden", capacity: 8, status: "vacant" },
  { id: "T5", name: "Table 5 (Garden)", zone: "Garden", capacity: 4, status: "vacant" },
  { id: "T6", name: "Table 6 (Rooftop View)", zone: "Rooftop", capacity: 4, status: "vacant" },
  { id: "M1", name: "🔗 Table 3 + Table 4 (Merged 12 Pax)", zone: "AC Hall Combined", capacity: 12, status: "vacant" },
];

export default function RestaurantKotModal({ isOpen, onClose, onApplyKot, inventory = [] }) {
  const [tablesList, setTablesList] = useState(() => {
    const saved = localStorage.getItem("vb_restaurant_tables");
    return saved ? JSON.parse(saved) : INITIAL_DEFAULT_TABLES;
  });

  const [selectedTable, setSelectedTable] = useState(tablesList[0] || INITIAL_DEFAULT_TABLES[0]);
  const [waiterName, setWaiterName] = useState("");
  const [cookingNotes, setCookingNotes] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState("");
  const [kotItems, setKotItems] = useState([
    { id: 1, name: "Paneer Butter Masala", quantity: 2, rate: 240, total: 480, notes: "Medium Spicy" },
    { id: 2, name: "Butter Tandoori Roti", quantity: 6, rate: 25, total: 150, notes: "Crispy" },
  ]);

  // Add / Manage Table Modal State
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableForm, setNewTableForm] = useState({
    name: "",
    capacity: 4,
    zone: "AC Hall"
  });

  useEffect(() => {
    localStorage.setItem("vb_restaurant_tables", JSON.stringify(tablesList));
  }, [tablesList]);

  if (!isOpen) return null;

  // Web Audio API Kitchen Bell / Chime Synthesizer
  const playKitchenChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const handleAddNewTable = (e) => {
    e.preventDefault();
    if (!newTableForm.name.trim()) return alert("कृपया टेबल का नाम दर्ज करें!");
    const newTbl = {
      id: `tbl_${Date.now()}`,
      name: newTableForm.name.trim(),
      capacity: parseInt(newTableForm.capacity) || 4,
      zone: newTableForm.zone || "AC Hall",
      status: "vacant"
    };
    const updated = [...tablesList, newTbl];
    setTablesList(updated);
    setSelectedTable(newTbl);
    setShowAddTableModal(false);
    setNewTableForm({ name: "", capacity: 4, zone: "AC Hall" });
  };

  const handleDeleteTable = (tblId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("क्या आप इस टेबल को हटाना चाहते हैं?")) {
      const filtered = tablesList.filter(t => t.id !== tblId);
      setTablesList(filtered);
      if (selectedTable.id === tblId && filtered.length > 0) {
        setSelectedTable(filtered[0]);
      }
    }
  };

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
    
    playKitchenChime();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-2xl border border-amber-400/30">
              <Utensils className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>रेस्टोरेंट KOT & डाइन-इन टेबल मैनेजमेंट</span>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Live Kitchen KOT</span>
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                सीटर क्षमता (2/4/6/8 Seater) सेट करें, नई टेबल जोड़ें व KOT बिल बनाएं
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Table Selector & Dynamic Add Table Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Users size={14} className="text-amber-600" />
                <span>1. टेबल / सीटर चुनें (Select Table & Seater Capacity)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddTableModal(true)}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
              >
                <Plus size={13} /> नई टेबल जोड़ें (+ Add Table)
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tablesList.map((tbl) => {
                const isSelected = selectedTable.id === tbl.id;
                return (
                  <div
                    key={tbl.id}
                    onClick={() => setSelectedTable(tbl)}
                    className={`p-2.5 rounded-2xl text-left border transition cursor-pointer relative group ${
                      isSelected
                        ? "bg-gradient-to-br from-amber-600 to-orange-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-black line-clamp-1">{tbl.name}</div>
                      {tbl.id.startsWith("tbl_") && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTable(tbl.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition"
                          title="टेबल हटाएं"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className={`text-[10px] font-bold mt-1 flex items-center justify-between ${isSelected ? "text-amber-100" : "text-slate-500"}`}>
                      <span>📍 {tbl.zone}</span>
                      <span className={`px-1.5 py-0.5 rounded font-black ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"}`}>
                        👤 {tbl.capacity} Seater
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waiter Name & Order Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">वेटर / कैप्टन का नाम (Captain/Waiter)</label>
              <input
                type="text"
                placeholder="e.g. रोहन / राहुल"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">चुनी गई टेबल विवरण</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between">
                <span>{selectedTable.name}</span>
                <span className="text-amber-700 font-mono">👤 {selectedTable.capacity} Seater</span>
              </div>
            </div>
          </div>

          {/* Add Menu Item to KOT */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
            <label className="text-xs font-black text-amber-950 uppercase tracking-wide block">2. मेनू आइटम व कुकिंग निर्देश जोड़ें</label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  list="rest-menu-list"
                  value={selectedItemName}
                  onChange={(e) => {
                    setSelectedItemName(e.target.value);
                    const matched = inventory.find(p => p.name?.toLowerCase() === e.target.value.toLowerCase());
                    if (matched) setItemRate(matched.sellingPrice || matched.price || 0);
                  }}
                  placeholder="आइटम चुनें (e.g. Butter Naan, Paneer)"
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-b pb-1">
              <span>ऑर्डर आइटम्स ({selectedTable.name})</span>
              <span>कुल: ₹{totalKotAmount}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {kotItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-xl border text-xs">
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
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
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

      {/* ➕ MODAL: ADD DYNAMIC TABLE WITH SEATER CAPACITY */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  🍽️
                </div>
                <h3 className="font-black text-slate-900 text-sm">नई टेबल व सीटर क्षमता जोड़ें</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddNewTable} className="py-3 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-black mb-1">टेबल का नाम (Table Name)*</label>
                <input
                  type="text"
                  placeholder="उदा: Table 7, VIP Cabin 2, Rooftop Corner"
                  required
                  value={newTableForm.name}
                  onChange={(e) => setNewTableForm({ ...newTableForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">सीटर क्षमता (Capacity)*</label>
                  <select
                    value={newTableForm.capacity}
                    onChange={(e) => setNewTableForm({ ...newTableForm, capacity: parseInt(e.target.value) || 4 })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  >
                    <option value={2}>👤 2 Seater (Couple)</option>
                    <option value={4}>👤 4 Seater (Standard)</option>
                    <option value={6}>👤 6 Seater (Group)</option>
                    <option value={8}>👤 8 Seater (Family)</option>
                    <option value={10}>👤 10 Seater (Large)</option>
                    <option value={12}>👤 12 Seater (VIP)</option>
                    <option value={16}>👤 16+ Seater (Banquet Hall)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ज़ोन / सेक्शन (Zone)*</label>
                  <select
                    value={newTableForm.zone}
                    onChange={(e) => setNewTableForm({ ...newTableForm, zone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  >
                    <option value="AC Hall">❄️ AC Hall</option>
                    <option value="Garden">🌳 Garden Area</option>
                    <option value="Rooftop">🌇 Rooftop Lounge</option>
                    <option value="Family Section">👨‍👩‍👧 Family Section</option>
                    <option value="Poolside">🏊 Poolside</option>
                    <option value="Counter Takeaway">🛍️ Counter Takeaway</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  ✓ टेबल सेव करें (+ Save Table)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
