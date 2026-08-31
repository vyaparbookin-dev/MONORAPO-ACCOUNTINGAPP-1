import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Coffee,
  Sparkles,
  Timer,
  Coins,
  X
} from "lucide-react";

export default function GamezoneStationModal({ isOpen, onClose, onApplyItems, inventory = [] }) {
  if (!isOpen) return null;

  // Pre-configured Station Types
  const defaultStations = [
    { id: "PS5-1", name: "PS5 Console 1 (4K VIP)", type: "time", ratePerHour: 200, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
    { id: "PS5-2", name: "PS5 Console 2", type: "time", ratePerHour: 150, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
    { id: "VR-1", name: "VR Meta Quest 3 Arena", type: "time", ratePerHour: 300, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
    { id: "POOL-1", name: "8-Ball Pool Table 1", type: "time", ratePerHour: 250, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
    { id: "SNOOKER-1", name: "French Snooker Table", type: "time", ratePerHour: 300, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
    { id: "TRAMP-1", name: "Trampoline & Soft Play Area", type: "time", ratePerHour: 350, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] },
  ];

  // Token / Per-Game Activities
  const tokenActivities = [
    { id: "CLAW-1", name: "Soft Toy Claw Machine (Per Token)", price: 50, icon: "🧸" },
    { id: "BASKET-1", name: "Arcade Basketball Shoot (Per Game)", price: 40, icon: "🏀" },
    { id: "BIKE-1", name: "MotoGP Simulator Ride", price: 80, icon: "🏍️" },
    { id: "AIRHOCKEY-1", name: "Air Hockey 2-Player (Per Match)", price: 100, icon: "🏒" },
    { id: "BOWLING-1", name: "Mini Bowling Lane (10 Frames)", price: 150, icon: "🎳" },
    { id: "LASER-1", name: "Laser Tag Arena (15 Min Mission)", price: 200, icon: "🔫" },
  ];

  const [activeTab, setActiveTab] = useState("stations"); // 'stations' | 'tokens' | 'wallet'
  const [stations, setStations] = useState(() => {
    const saved = localStorage.getItem("gamezone_stations");
    return saved ? JSON.parse(saved) : defaultStations;
  });

  const [tokenCart, setTokenCart] = useState([]);
  const [selectedStationForFood, setSelectedStationForFood] = useState(null);
  const [foodSearch, setFoodSearch] = useState("");

  // Live Timer Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setStations((prev) => {
        const updated = prev.map((st) => {
          if (st.isRunning) {
            return { ...st, elapsedSeconds: st.elapsedSeconds + 1 };
          }
          return st;
        });
        localStorage.setItem("gamezone_stations", JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleStationTimer = (id) => {
    setStations((prev) =>
      prev.map((st) => (st.id === id ? { ...st, isRunning: !st.isRunning } : st))
    );
  };

  const resetStationTimer = (id) => {
    if (window.confirm("Reset timer for this station?")) {
      setStations((prev) =>
        prev.map((st) => (st.id === id ? { ...st, isRunning: false, elapsedSeconds: 0, foodItems: [] } : st))
      );
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const calculateStationBill = (station) => {
    const minutes = Math.max(1, Math.ceil(station.elapsedSeconds / 60));
    // Minimum 15 min slab or actual pro-rata
    const timeCharge = Math.round((minutes / 60) * station.ratePerHour);
    const foodCharge = (station.foodItems || []).reduce((sum, f) => sum + f.quantity * f.rate, 0);
    return { minutes, timeCharge, foodCharge, grandTotal: timeCharge + foodCharge };
  };

  // Checkout station to Bill
  const handleCheckoutStation = (station) => {
    const bill = calculateStationBill(station);
    const itemsToAdd = [
      {
        name: `${station.name} (${formatTime(station.elapsedSeconds)})`,
        category: "Gamezone Slot",
        quantity: 1,
        rate: bill.timeCharge,
        unit: "slot",
        total: bill.timeCharge,
        notes: `Customer: ${station.customer || "Walk-in"} | Elapsed: ${bill.minutes} mins`
      },
      ...(station.foodItems || []).map((f) => ({
        name: `${f.name} (Gamezone Cafe)`,
        category: "Food & Beverage",
        quantity: f.quantity,
        rate: f.rate,
        unit: f.unit || "pcs",
        total: f.quantity * f.rate
      }))
    ];

    onApplyItems(itemsToAdd);
    // Reset station
    setStations((prev) =>
      prev.map((st) =>
        st.id === station.id ? { ...st, isRunning: false, elapsedSeconds: 0, customer: "", foodItems: [] } : st
      )
    );
    onClose();
  };

  // Add Token Activity
  const addTokenToCart = (act) => {
    setTokenCart((prev) => {
      const exists = prev.find((item) => item.id === act.id);
      if (exists) {
        return prev.map((item) =>
          item.id === act.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item
        );
      }
      return [...prev, { ...act, quantity: 1, total: act.price }];
    });
  };

  const handleApplyTokenCart = () => {
    if (tokenCart.length === 0) return alert("Please select activities first.");
    const itemsToAdd = tokenCart.map((t) => ({
      name: t.name,
      category: "Arcade & Tokens",
      quantity: t.quantity,
      rate: t.price,
      unit: "token",
      total: t.total
    }));
    onApplyItems(itemsToAdd);
    setTokenCart([]);
    onClose();
  };

  // Food Filter for Station
  const cafeProducts = inventory.filter(
    (p) =>
      (p.category || "").toLowerCase().includes("food") ||
      (p.category || "").toLowerCase().includes("beverage") ||
      (p.category || "").toLowerCase().includes("cafe") ||
      (p.name || "").toLowerCase().includes("burger") ||
      (p.name || "").toLowerCase().includes("pizza") ||
      (p.name || "").toLowerCase().includes("coffee") ||
      (p.name || "").toLowerCase().includes("shake") ||
      (p.name || "").toLowerCase().includes("snack") ||
      (p.name || "").toLowerCase().includes("coke")
  );

  const addFoodToStation = (stationId, prod) => {
    setStations((prev) =>
      prev.map((st) => {
        if (st.id === stationId) {
          const currentFoods = st.foodItems || [];
          const existing = currentFoods.find((f) => f.productId === prod._id);
          let updatedFoods;
          if (existing) {
            updatedFoods = currentFoods.map((f) =>
              f.productId === prod._id ? { ...f, quantity: f.quantity + 1 } : f
            );
          } else {
            updatedFoods = [
              ...currentFoods,
              { productId: prod._id, name: prod.name, rate: prod.sellingPrice || prod.price || 0, quantity: 1, unit: prod.unit || "pcs" }
            ];
          }
          return { ...st, foodItems: updatedFoods };
        }
        return st;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Gamepad2 size={24} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                🎮 GAMEZONE & ENTERTAINMENT HUB
              </h2>
              <p className="text-xs text-purple-200">
                PS5, VR Arena, Pool/Snooker Timers, Soft Toy Arcade & In-Game Cafe Billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/20 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActiveTab("stations")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "stations" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                ⏱️ Gaming Stations (Timers)
              </button>
              <button
                onClick={() => setActiveTab("tokens")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "tokens" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🧸 Arcade & Token Games
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === "stations" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((st) => {
                const bill = calculateStationBill(st);
                return (
                  <div
                    key={st.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm transition flex flex-col justify-between ${
                      st.isRunning ? "border-green-500 ring-2 ring-green-100" : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div>
                      {/* Station Top Bar */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                            {st.id}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base mt-1">{st.name}</h3>
                          <p className="text-xs text-gray-500 font-semibold">₹{st.ratePerHour} / hour</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            st.isRunning ? "bg-green-100 text-green-700 animate-pulse" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {st.isRunning ? "● Playing" : "Idle"}
                        </span>
                      </div>

                      {/* Customer Input */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Customer / Player Name"
                          value={st.customer || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, customer: val } : s)));
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none bg-slate-50"
                        />
                      </div>

                      {/* Live Timer Display */}
                      <div className="bg-slate-900 text-white rounded-xl p-3 text-center my-2 shadow-inner">
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Elapsed Time</p>
                        <p className="text-2xl font-black font-mono text-green-400 tracking-wider">
                          {formatTime(st.elapsedSeconds)}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-300 mt-1 pt-1 border-t border-gray-800">
                          <span>Game Charge:</span>
                          <span className="font-bold text-white">₹{bill.timeCharge}</span>
                        </div>
                      </div>

                      {/* In-Game Food Ordered */}
                      {st.foodItems && st.foodItems.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 my-2 text-xs space-y-1">
                          <p className="font-bold text-amber-900 flex items-center gap-1">
                            <Coffee size={12} /> Cafe Items ({st.foodItems.length}):
                          </p>
                          {st.foodItems.map((f, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-amber-800">
                              <span>{f.name} x {f.quantity}</span>
                              <span className="font-bold">₹{f.quantity * f.rate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="space-y-2 pt-2 border-t mt-3">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStationTimer(st.id)}
                          className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                            st.isRunning
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                              : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          }`}
                        >
                          {st.isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStationForFood(st.id)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                          title="Add Food / Drink to this Station"
                        >
                          <Coffee size={14} /> + Food
                        </button>

                        <button
                          type="button"
                          onClick={() => resetStationTimer(st.id)}
                          className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                          title="Reset Timer"
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>

                      {st.elapsedSeconds > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCheckoutStation(st)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow"
                        >
                          <CheckCircle size={14} /> Checkout (Total: ₹{bill.grandTotal})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tokens & Arcade Games Tab */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tokenActivities.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => addTokenToCart(act)}
                    className="p-4 bg-white border border-purple-200 rounded-xl hover:border-purple-500 hover:shadow-md transition text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-purple-50 rounded-xl group-hover:scale-110 transition">
                        {act.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{act.name}</h4>
                        <p className="text-xs text-purple-700 font-extrabold mt-0.5">₹{act.price} per play</p>
                      </div>
                    </div>
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                      <Plus size={16} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Token Activity Cart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                    <Coins className="text-yellow-500" size={18} /> Selected Tokens / Rides
                  </h3>
                  {tokenCart.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">Click on games to add tokens to bill</p>
                  ) : (
                    <div className="space-y-2">
                      {tokenCart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-purple-50 p-2 rounded-lg text-xs">
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-gray-500">₹{item.price} x {item.quantity}</p>
                          </div>
                          <span className="font-extrabold text-purple-800">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {tokenCart.length > 0 && (
                  <div className="pt-4 border-t mt-4 space-y-3">
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total Token Amount:</span>
                      <span className="text-purple-700 font-black">
                        ₹{tokenCart.reduce((sum, item) => sum + item.total, 0)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyTokenCart}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-xs shadow"
                    >
                      Add Tokens to Bill
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal for Adding Cafe Food to Station */}
        {selectedStationForFood && (
          <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-4 border shadow-2xl">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Coffee className="text-amber-600" size={18} /> Add Food to Station {selectedStationForFood}
                </h3>
                <button onClick={() => setSelectedStationForFood(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Search Burger, Pizza, Shake, Cold Drink..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {(cafeProducts.length > 0 ? cafeProducts : inventory)
                  .filter((p) => (p.name || "").toLowerCase().includes(foodSearch.toLowerCase()))
                  .slice(0, 15)
                  .map((prod) => (
                    <div key={prod._id} className="flex justify-between items-center p-2 hover:bg-purple-50 rounded-lg border text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{prod.name}</p>
                        <p className="text-gray-500">₹{prod.sellingPrice || prod.price || 0}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addFoodToStation(selectedStationForFood, prod);
                          alert(`Added ${prod.name} to station!`);
                        }}
                        className="px-2.5 py-1 bg-purple-600 text-white rounded font-bold hover:bg-purple-700"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => setSelectedStationForFood(null)}
                className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
