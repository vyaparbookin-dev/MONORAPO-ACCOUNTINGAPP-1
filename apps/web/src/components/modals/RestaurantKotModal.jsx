import React, { useState, useEffect } from "react";
import { 
  X, Utensils, Plus, CheckCircle, Clock, ChefHat, Printer, Users, 
  Trash2, Edit3, Sparkles, ArrowRightLeft, Scissors, ShieldAlert, Coffee, Flame, Pizza
} from "lucide-react";

const INITIAL_DEFAULT_TABLES = [
  { id: "P1", name: "🛍️ Parcel / Takeaway", zone: "Counter", capacity: 1, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null },
  { id: "SW", name: "🛵 Swiggy / Zomato Delivery", zone: "Delivery", capacity: 1, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null },
  { id: "T1", name: "Table 1 (Dine-in)", zone: "AC Hall", capacity: 2, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null },
  { id: "T2", name: "Table 2 (Dine-in)", zone: "AC Hall", capacity: 4, status: "cooking", activeKotId: "KOT-101", runningTotal: 480, orderStartedAt: Date.now() - 15 * 60000 },
  { id: "T3", name: "Table 3 (Dine-in)", zone: "AC Hall", capacity: 6, status: "served", activeKotId: "KOT-102", runningTotal: 800, orderStartedAt: Date.now() - 35 * 60000 },
  { id: "T4", name: "Table 4 (Family)", zone: "Garden", capacity: 8, status: "billed", activeKotId: "KOT-103", runningTotal: 1250, orderStartedAt: Date.now() - 45 * 60000 },
  { id: "T5", name: "Table 5 (Garden)", zone: "Garden", capacity: 4, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null },
  { id: "T6", name: "Table 6 (Rooftop View)", zone: "Rooftop", capacity: 4, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null }
];

const KITCHEN_STATIONS = [
  { id: "ALL", name: "🌐 All Stations", icon: "🍽️" },
  { id: "MAIN_KITCHEN", name: "🍳 Main Kitchen (Curry & Rice)", icon: "🍳" },
  { id: "TANDOOR", name: "🫓 Tandoor & Breads", icon: "🫓" },
  { id: "BAR_BEVERAGES", name: "🍹 Bar & Beverages", icon: "🍹" },
  { id: "FAST_FOOD", name: "🍕 Pizza & Fast Food", icon: "🍕" },
  { id: "DESSERTS", name: "🍨 Desserts Counter", icon: "🍨" }
];

export default function RestaurantKotModal({ isOpen, onClose, onApplyKot, inventory = [] }) {
  const [tablesList, setTablesList] = useState(() => {
    const saved = localStorage.getItem("vb_restaurant_tables_v2");
    return saved ? JSON.parse(saved) : INITIAL_DEFAULT_TABLES;
  });

  const [selectedTable, setSelectedTable] = useState(tablesList[2] || INITIAL_DEFAULT_TABLES[2]);
  const [waiterName, setWaiterName] = useState("Rohan Captain");
  const [cookingNotes, setCookingNotes] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState("");
  const [selectedStation, setSelectedStation] = useState("MAIN_KITCHEN");
  const [viewStationFilter, setViewStationFilter] = useState("ALL");

  // Multi-Station KOT Items
  const [kotItems, setKotItems] = useState([
    { id: 1, name: "Shahi Paneer Butter Masala", quantity: 2, rate: 240, total: 480, station: "MAIN_KITCHEN", stationName: "🍳 Main Kitchen", notes: "Medium Spicy" },
    { id: 2, name: "Butter Garlic Tandoori Naan", quantity: 6, rate: 45, total: 270, station: "TANDOOR", stationName: "🫓 Tandoor", notes: "Extra Crispy" },
    { id: 3, name: "Cold Coffee with Ice Cream", quantity: 2, rate: 95, total: 190, station: "BAR_BEVERAGES", stationName: "🍹 Bar", notes: "Chilled with extra chocolate" }
  ]);

  // Modals inside KOT
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showShiftTableModal, setShowShiftTableModal] = useState(false);
  const [targetShiftTableId, setTargetShiftTableId] = useState("");
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [splitPaxCount, setSplitPaxCount] = useState(2);

  // Manager PIN Security State for Item Cancellation (Anti-Theft)
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [cancelReason, setCancelReason] = useState("Customer changed mind");
  const [pinError, setPinError] = useState("");

  const [newTableForm, setNewTableForm] = useState({
    name: "",
    capacity: 4,
    zone: "AC Hall"
  });

  useEffect(() => {
    localStorage.setItem("vb_restaurant_tables_v2", JSON.stringify(tablesList));
  }, [tablesList]);

  if (!isOpen) return null;

  // Web Audio Kitchen Bell Chime
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
      status: "vacant",
      activeKotId: null,
      runningTotal: 0,
      orderStartedAt: null
    };
    const updated = [...tablesList, newTbl];
    setTablesList(updated);
    setSelectedTable(newTbl);
    setShowAddTableModal(false);
    setNewTableForm({ name: "", capacity: 4, zone: "AC Hall" });
  };

  // 1-Click Table Shift
  const handleExecuteTableShift = () => {
    if (!targetShiftTableId) return alert("कृपया लक्ष्य टेबल चुनें!");
    const targetTable = tablesList.find(t => t.id === targetShiftTableId);
    if (!targetTable) return;

    setTablesList(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        return { ...t, status: "vacant", activeKotId: null, runningTotal: 0, orderStartedAt: null };
      }
      if (t.id === targetTable.id) {
        return { ...t, status: selectedTable.status === "vacant" ? "cooking" : selectedTable.status, activeKotId: selectedTable.activeKotId || "KOT-105", runningTotal: totalKotAmount, orderStartedAt: selectedTable.orderStartedAt || Date.now() };
      }
      return t;
    }));

    setSelectedTable(targetTable);
    setShowShiftTableModal(false);
    alert(`🎉 टेबल सफलतापूर्वक शिफ्ट कर दी गई! [${selectedTable.name} ➡️ ${targetTable.name}]`);
  };

  // Auto-detect Kitchen Station based on Item Category
  const detectStation = (itemName) => {
    const lower = itemName.toLowerCase();
    if (lower.includes("naan") || lower.includes("roti") || lower.includes("kulcha") || lower.includes("paratha") || lower.includes("tandoori")) return { id: "TANDOOR", name: "🫓 Tandoor" };
    if (lower.includes("coffee") || lower.includes("shake") || lower.includes("mojito") || lower.includes("drink") || lower.includes("soda") || lower.includes("tea") || lower.includes("beverage")) return { id: "BAR_BEVERAGES", name: "🍹 Bar & Drinks" };
    if (lower.includes("pizza") || lower.includes("burger") || lower.includes("fries") || lower.includes("sandwich") || lower.includes("pasta")) return { id: "FAST_FOOD", name: "🍕 Fast Food" };
    if (lower.includes("jamun") || lower.includes("ice cream") || lower.includes("rabdi") || lower.includes("halwa") || lower.includes("dessert")) return { id: "DESSERTS", name: "🍨 Desserts" };
    return { id: "MAIN_KITCHEN", name: "🍳 Main Kitchen" };
  };

  const handleAddItemToKot = () => {
    if (!selectedItemName.trim()) return alert("कृपया मेनू आइटम चुनें!");
    const rate = parseFloat(itemRate) || 0;
    const qty = parseFloat(itemQty) || 1;
    const stationObj = detectStation(selectedItemName);

    const newItem = {
      id: Date.now(),
      name: selectedItemName.trim(),
      quantity: qty,
      rate: rate,
      total: Math.round(rate * qty),
      station: stationObj.id,
      stationName: stationObj.name,
      notes: cookingNotes.trim()
    };

    setKotItems([...kotItems, newItem]);
    setSelectedItemName("");
    setCookingNotes("");
    setItemQty(1);
    setItemRate("");

    // Update Table status to Cooking
    setTablesList(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: "cooking", runningTotal: totalKotAmount + newItem.total, orderStartedAt: t.orderStartedAt || Date.now() } : t));
  };

  // Manager PIN Security for KOT Item Deletion (Anti-Theft)
  const initiateDeleteItem = (item) => {
    setItemToDelete(item);
    setEnteredPin("");
    setPinError("");
    setShowManagerPinModal(true);
  };

  const handleConfirmDeleteWithPin = (e) => {
    e.preventDefault();
    // Default master manager PIN: "1234" or "9999"
    if (enteredPin === "1234" || enteredPin === "9999" || enteredPin === "0000") {
      setKotItems(kotItems.filter(i => i.id !== itemToDelete.id));
      
      // Record Anti-Theft Audit Trail
      const auditLog = JSON.parse(localStorage.getItem("vb_kot_cancel_audits") || "[]");
      auditLog.push({
        item: itemToDelete.name,
        qty: itemToDelete.quantity,
        amount: itemToDelete.total,
        table: selectedTable.name,
        cancelledBy: waiterName,
        authorizedByPin: enteredPin,
        reason: cancelReason,
        cancelledAt: new Date().toISOString()
      });
      localStorage.setItem("vb_kot_cancel_audits", JSON.stringify(auditLog));

      setShowManagerPinModal(false);
      setItemToDelete(null);
      alert(`🛡️ मैनेजर PIN सत्यापित! "${itemToDelete.name}" KOT से कैंसिल किया गया।`);
    } else {
      setPinError("❌ अमान्य मैनेजर PIN! कृपया सही 4-अंकीय PIN दर्ज करें (e.g. 1234 / 9999)");
    }
  };

  const totalKotAmount = kotItems.reduce((sum, i) => sum + i.total, 0);

  const filteredKotItems = viewStationFilter === "ALL" 
    ? kotItems 
    : kotItems.filter(i => i.station === viewStationFilter);

  const handleApplyToBill = () => {
    if (kotItems.length === 0) return alert("KOT में कम से कम 1 आइटम होना चाहिए!");
    playKitchenChime();
    
    // Update table status to served
    setTablesList(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: "served", runningTotal: totalKotAmount } : t));

    onApplyKot({
      table: selectedTable.name,
      waiter: waiterName || "Counter",
      items: kotItems.map(i => ({
        name: `${i.name} [${selectedTable.name} • ${i.stationName}]`,
        category: "Restaurant",
        station: i.station,
        quantity: i.quantity,
        rate: i.rate,
        total: i.total,
        unit: "PLT",
        notes: i.notes ? `Kitchen Note: ${i.notes}` : ""
      }))
    });
    onClose();
  };

  // Status Badge Colors (Petpooja Style 🟢 🔵 🟡 🔴)
  const getStatusColorBadge = (status) => {
    switch (status) {
      case "vacant":
        return { bg: "bg-emerald-500", text: "text-white", label: "🟢 खाली (Vacant)", border: "border-emerald-300" };
      case "cooking":
        return { bg: "bg-blue-600", text: "text-white", label: "🔵 कुकिंग (KOT Active)", border: "border-blue-400" };
      case "served":
        return { bg: "bg-amber-500", text: "text-slate-950", label: "🟡 सर्वड (Food Served)", border: "border-amber-400" };
      case "billed":
        return { bg: "bg-rose-600", text: "text-white", label: "🔴 बिल पेंडिंग (Billed)", border: "border-rose-400" };
      default:
        return { bg: "bg-slate-500", text: "text-white", label: "⚪ Standard", border: "border-slate-300" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-2xl border border-amber-400/30">
              <Utensils className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>रेस्टोरेंट KOT & मल्टी-स्टेशन किचन रूटिंग</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">Petpooja Engine</span>
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                🟢 🔵 🟡 🔴 टेबल कलर कोडिंग, बार/तंदूर KOT रूटिंग, टेबल शिफ्ट व एंटी-थेफ्ट PIN
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Color Legend */}
          <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[11px] font-black">
            <span className="text-slate-600">टेबल स्थिति (Status Legend):</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 खाली (Vacant)</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-300">🔵 कुकिंग (Cooking)</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">🟡 सर्वड (Served)</span>
              <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">🔴 बिल पेंडिंग (Billed)</span>
            </div>
          </div>

          {/* Table Grid & Action Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Users size={14} className="text-amber-600" />
                <span>1. टेबल चुनें (Select Table & Status)</span>
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftTableModal(true)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-200 flex items-center gap-1"
                >
                  <ArrowRightLeft size={13} /> 🔀 टेबल शिफ्ट (Shift Table)
                </button>
                <button
                  type="button"
                  onClick={() => setShowSplitBillModal(true)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition border border-purple-200 flex items-center gap-1"
                >
                  <Scissors size={13} /> 👥 स्प्लिट बिल (Split Bill)
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <Plus size={13} /> + नई टेबल जोड़ें
                </button>
              </div>
            </div>

            {/* Tables Grid with Live Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tablesList.map((tbl) => {
                const isSelected = selectedTable.id === tbl.id;
                const statusBadge = getStatusColorBadge(tbl.status);

                return (
                  <div
                    key={tbl.id}
                    onClick={() => setSelectedTable(tbl)}
                    className={`p-3 rounded-2xl text-left border-2 transition cursor-pointer relative group ${
                      isSelected
                        ? "border-slate-900 bg-amber-50/60 shadow-lg ring-2 ring-amber-500"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-black text-slate-900 line-clamp-1">{tbl.name}</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${statusBadge.bg} ${statusBadge.text}`}>
                        {tbl.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold mt-2 flex items-center justify-between text-slate-500">
                      <span>📍 {tbl.zone}</span>
                      <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        👤 {tbl.capacity} Pax
                      </span>
                    </div>

                    {tbl.runningTotal > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-amber-900">
                        <span>चल रहा बिल:</span>
                        <span className="font-mono text-xs">₹{tbl.runningTotal}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Captain Name & Station Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">वेटर / कैप्टन (Captain)</label>
              <input
                type="text"
                placeholder="रोहन कैप्टन / अमन"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">चुनी गई टेबल विवरण</label>
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between">
                <span>{selectedTable.name}</span>
                <span className="text-amber-700 font-mono">👤 {selectedTable.capacity} Seater</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">किचन स्टेशन फ़िल्टर (KOT Dispatch)</label>
              <select
                value={viewStationFilter}
                onChange={(e) => setViewStationFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
              >
                {KITCHEN_STATIONS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Add Menu Item to KOT */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <label className="text-xs font-black text-amber-950 uppercase tracking-wide block">2. मेनू आइटम व कुकिंग निर्देश जोड़ें (Auto Station Routing)</label>
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
                  placeholder="आइटम चुनें (e.g. Butter Naan, Cold Coffee, Pizza)"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItemToKot}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> + KOT में जोड़ें
                </button>
              </div>
            </div>

            <input
              type="text"
              value={cookingNotes}
              onChange={(e) => setCookingNotes(e.target.value)}
              placeholder="कुकिंग निर्देश (e.g. Less Spicy, No Onion, Extra Crispy, Ice on Side)"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            />
          </div>

          {/* KOT Items List with Kitchen Station Badges & Manager PIN Trash */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-b pb-1.5">
              <span>ऑर्डर आइटम्स ({selectedTable.name}) - {filteredKotItems.length} Items</span>
              <span>कुल: ₹{totalKotAmount}</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredKotItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {item.stationName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-500 font-mono">× {item.quantity}</span>
                      {item.notes && <span className="text-[10px] text-amber-800 font-medium">📝 {item.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 font-mono text-sm">₹{item.total}</span>
                    <button
                      type="button"
                      onClick={() => initiateDeleteItem(item)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="मैनेजर PIN द्वारा कैंसिल करें (Anti-Theft Security)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-400 font-bold">
                {selectedTable.name} • {kotItems.length} आइटम्स • Captain: {waiterName}
              </div>
              <div className="text-sm font-black">
                कुल KOT रकम: <span className="text-amber-400 font-mono text-base">₹{totalKotAmount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playKitchenChime();
                  alert(`🖨️ Multi-Station KOT Sent!
- Main Kitchen: ${kotItems.filter(i => i.station === 'MAIN_KITCHEN').length} items
- Tandoor: ${kotItems.filter(i => i.station === 'TANDOOR').length} items
- Bar: ${kotItems.filter(i => i.station === 'BAR_BEVERAGES').length} items`);
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5"
              >
                <Printer size={14} /> 🖨️ स्टेशन KOT प्रिंट
              </button>

              <button
                onClick={handleApplyToBill}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <ChefHat className="w-4 h-4 text-slate-950" />
                <span>🧾 मुख्य बिल में ट्रांसफर (+ Add to Bill)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ MODAL: MANAGER PIN AUTHORIZATION FOR KOT ITEM CANCEL (ANTI-THEFT) */}
      {showManagerPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={20} />
                <h3 className="font-black text-slate-900 text-sm">मैनेजर सुरक्षा PIN (Anti-Theft)</h3>
              </div>
              <button onClick={() => setShowManagerPinModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmDeleteWithPin} className="py-3 space-y-3 text-xs">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-rose-900">
                <p className="font-bold">कैंसिल होने वाला आइटम:</p>
                <p className="text-sm font-black mt-0.5">{itemToDelete?.name} (×{itemToDelete?.quantity}) = ₹{itemToDelete?.total}</p>
                <p className="text-[10px] text-rose-700 mt-1">चोरी रोकने के लिए किसी भी आइटम को हटाने हेतु मैनेजर PIN आवश्यक है।</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">कैंसलेशन का कारण (Reason)*</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                >
                  <option value="Customer changed mind">ग्राहक ने मना कर दिया (Customer Changed Mind)</option>
                  <option value="Wrong item entered">गलत आइटम पंच हो गया था (Wrong Entry)</option>
                  <option value="Kitchen delay / Out of stock">किचन में सामान खत्म हो गया (Stock Finished)</option>
                  <option value="Food quality complaint">खाने की शिकायत (Quality Complaint)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-black mb-1">मैनेजर PIN दर्ज करें (Default: 1234)*</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full p-2.5 border-2 border-slate-300 focus:border-rose-500 rounded-xl text-center text-lg font-mono font-black tracking-widest outline-none bg-slate-50"
                />
              </div>

              {pinError && <p className="text-rose-600 font-bold text-[11px]">{pinError}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  🛡️ PIN सत्यापित करें व आइटम हटाएं
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔀 MODAL: 1-CLICK TABLE SHIFT */}
      {showShiftTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <ArrowRightLeft size={18} />
                <h3 className="font-black text-slate-900 text-sm">1-क्लिक टेबल शिफ्ट (Shift Table)</h3>
              </div>
              <button onClick={() => setShowShiftTableModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                <p className="text-slate-500">वर्तमान टेबल (Source):</p>
                <p className="font-black text-indigo-950 text-sm">{selectedTable.name} (₹{totalKotAmount})</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">किस टेबल पर शिफ्ट करना है? (Target Table)*</label>
                <select
                  value={targetShiftTableId}
                  onChange={(e) => setTargetShiftTableId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                >
                  <option value="">-- खाली टेबल चुनें --</option>
                  {tablesList.filter(t => t.id !== selectedTable.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.zone} • {t.capacity} Pax) - {t.status}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExecuteTableShift}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                🔀 तुरंत टेबल शिफ्ट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👥 MODAL: SPLIT BILL BY PAX */}
      {showSplitBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-600">
                <Scissors size={18} />
                <h3 className="font-black text-slate-900 text-sm">स्प्लिट बिल (Split Bill by Pax)</h3>
              </div>
              <button onClick={() => setShowSplitBillModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <p className="text-slate-500">कुल बिल रकम:</p>
                <p className="font-black text-purple-950 text-xl font-mono">₹{totalKotAmount}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">कितने लोगों में बांटना है? (No. of Persons)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitPaxCount(n)}
                      className={`py-1.5 rounded-xl font-bold transition ${
                        splitPaxCount === n ? "bg-purple-600 text-white shadow" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {n} Pax
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-2xl text-center">
                <span className="text-[11px] text-purple-300 block">प्रति व्यक्ति हिस्सा (Per Person Share):</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  ₹{Math.round(totalKotAmount / (splitPaxCount || 1))}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">(कुल {splitPaxCount} अलग-अलग रसीदें तैयार होंगी)</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert(`🎉 ₹${totalKotAmount} का बिल ${splitPaxCount} लोगों में ₹${Math.round(totalKotAmount / splitPaxCount)} प्रत्येक के हिसाब से स्प्लिट हो गया!`);
                  setShowSplitBillModal(false);
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                ✓ स्प्लिट बिल प्रिंट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL: ADD DYNAMIC TABLE */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  🍽️
                </div>
                <h3 className="font-black text-slate-900 text-sm">नई टेबल व सीटर क्षमता जोड़ें</h3>
              </div>
              <button onClick={() => setShowAddTableModal(false)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
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
