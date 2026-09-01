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
  CreditCard,
  Gift,
  Award,
  Search,
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

  // Prize & Ticket Redemption Items
  const redemptionPrizes = [
    { id: "PRZ-1", name: "Giant Teddy Bear (3 Ft)", ticketsNeeded: 500, inStock: 4, icon: "🧸" },
    { id: "PRZ-2", name: "Wireless Bluetooth Gaming Headset", ticketsNeeded: 350, inStock: 6, icon: "🎧" },
    { id: "PRZ-3", name: "High-Speed RC Drift Car", ticketsNeeded: 250, inStock: 8, icon: "🏎️" },
    { id: "PRZ-4", name: "Emoji Soft Pillow / Cushion", ticketsNeeded: 120, inStock: 15, icon: "😃" },
    { id: "PRZ-5", name: "LED Fidget Spinner & Glow Band", ticketsNeeded: 40, inStock: 30, icon: "✨" },
  ];

  const [activeTab, setActiveTab] = useState("stations"); // 'stations' | 'tokens' | 'rfid_wallet' | 'redemption'
  const [stations, setStations] = useState(() => {
    const saved = localStorage.getItem("gamezone_stations");
    return saved ? JSON.parse(saved) : defaultStations;
  });

  const [tokenCart, setTokenCart] = useState([]);
  const [selectedStationForFood, setSelectedStationForFood] = useState(null);
  const [foodSearch, setFoodSearch] = useState("");

  // RFID Card Wallet Recharge State
  const [cardNumber, setCardNumber] = useState("CARD-9842");
  const [guestName, setGuestName] = useState("Rohan Kumar");
  const [walletBalance, setWalletBalance] = useState(450);
  const [digitalTickets, setDigitalTickets] = useState(280);
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [bonusCredit, setBonusCredit] = useState(100);

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
    const timeCharge = Math.round((minutes / 60) * station.ratePerHour);
    const foodCharge = (station.foodItems || []).reduce((sum, f) => sum + f.quantity * f.rate, 0);
    return { minutes, timeCharge, foodCharge, grandTotal: timeCharge + foodCharge };
  };

  // Checkout station to Bill
  const handleCheckoutStation = (station) => {
    const bill = calculateStationBill(station);
    const lineItem = {
      name: `${station.name} (${formatTime(station.elapsedSeconds)})`,
      category: "Gaming & VR",
      quantity: 1,
      rate: bill.timeCharge,
      unit: "SESSION",
      total: bill.timeCharge,
      notes: `Player: ${station.customer || "Walk-in"} | Elapsed: ${formatTime(station.elapsedSeconds)} | Rate: ₹${station.ratePerHour}/hr`
    };

    const finalItems = [lineItem, ...station.foodItems];
    onApplyItems(finalItems);
    resetStationTimer(station.id);
    onClose();
  };

  // Add Token to Cart
  const addTokenToCart = (activity) => {
    setTokenCart((prev) => {
      const existing = prev.find((t) => t.id === activity.id);
      if (existing) {
        return prev.map((t) => (t.id === activity.id ? { ...t, quantity: t.quantity + 1 } : t));
      }
      return [...prev, { ...activity, quantity: 1 }];
    });
  };

  const checkoutTokens = () => {
    if (tokenCart.length === 0) return alert("Select at least 1 token game activity!");
    const items = tokenCart.map((t) => ({
      name: t.name,
      category: "Arcade & Tokens",
      quantity: t.quantity,
      rate: t.price,
      unit: "TOKEN",
      total: t.quantity * t.price
    }));
    onApplyItems(items);
    setTokenCart([]);
    onClose();
  };

  // Process RFID Card Recharge
  const handleCardRecharge = () => {
    const totalAdded = rechargeAmount + bonusCredit;
    setWalletBalance((prev) => prev + totalAdded);
    const billItem = {
      name: `RFID Card / Wristband Recharge (${cardNumber}) - ${guestName}`,
      category: "Arcade Wallet Recharge",
      quantity: 1,
      rate: rechargeAmount,
      unit: "RECHARGE",
      total: rechargeAmount,
      notes: `Recharge: ₹${rechargeAmount} + Free Bonus: ₹${bonusCredit} | Card Balance: ₹${walletBalance + totalAdded}`
    };
    onApplyItems([billItem]);
    alert(`🎉 Card ${cardNumber} Recharged with ₹${totalAdded} (including ₹${bonusCredit} bonus)!`);
    onClose();
  };

  // Process Prize Redemption
  const handleRedeemPrize = (prize) => {
    if (digitalTickets < prize.ticketsNeeded) {
      return alert(`Not enough tickets! Need ${prize.ticketsNeeded} tickets, customer has ${digitalTickets}.`);
    }
    setDigitalTickets((prev) => prev - prize.ticketsNeeded);
    alert(`🎁 Redeemed "${prize.name}" for ${prize.ticketsNeeded} Tickets! Remaining: ${digitalTickets - prize.ticketsNeeded}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden border border-purple-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-4 px-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/30 rounded-xl border border-purple-400/30">
              <Gamepad2 className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                🎮 GAMEZONE, VR ARENA, RFID CARDS & TOKEN REDEMPTION HUB
              </h2>
              <p className="text-xs text-purple-200">
                PS5 VIP Timers • Cashless RFID Wristband Wallet • Ticket Redemption Counter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/20 p-1 rounded-lg text-xs font-bold gap-1">
              <button
                onClick={() => setActiveTab("stations")}
                className={`px-3 py-1 rounded-md transition ${activeTab === "stations" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                ⏱️ Stations & Timers
              </button>
              <button
                onClick={() => setActiveTab("tokens")}
                className={`px-3 py-1 rounded-md transition ${activeTab === "tokens" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🪙 Arcade Tokens
              </button>
              <button
                onClick={() => setActiveTab("rfid_wallet")}
                className={`px-3 py-1 rounded-md transition ${activeTab === "rfid_wallet" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                💳 Cashless RFID Wallet
              </button>
              <button
                onClick={() => setActiveTab("redemption")}
                className={`px-3 py-1 rounded-md transition ${activeTab === "redemption" ? "bg-white text-purple-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🎁 Prize Redemption
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          {/* TAB 1: Live Stations & Timers */}
          {activeTab === "stations" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stations.map((st) => {
                const bill = calculateStationBill(st);
                return (
                  <div
                    key={st.id}
                    className={`p-4 rounded-xl border-2 transition flex flex-col justify-between ${
                      st.isRunning
                        ? "bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {st.type === "time" ? "Hourly Station" : "Activity"}
                          </span>
                          <h4 className="font-black text-gray-900 text-sm mt-1">{st.name}</h4>
                        </div>
                        <span className="text-xs font-black text-gray-700">₹{st.ratePerHour}/hr</span>
                      </div>

                      {/* Timer Display */}
                      <div className="my-4 text-center p-3 bg-slate-900 text-white rounded-xl">
                        <span className="text-2xl font-black font-mono tracking-wider text-green-400">
                          {formatTime(st.elapsedSeconds)}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {st.isRunning ? "🟢 Active Session Running" : "⚪ Stopped / Idle"}
                        </p>
                      </div>

                      {/* Bill Summary */}
                      <div className="space-y-1 text-xs border-t pt-2">
                        <div className="flex justify-between text-gray-600">
                          <span>Time Charge ({bill.minutes} min):</span>
                          <span className="font-bold">₹{bill.timeCharge}</span>
                        </div>
                        {bill.foodCharge > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>In-Game Food/Drinks:</span>
                            <span className="font-bold">₹{bill.foodCharge}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-purple-900 border-t pt-1">
                          <span>Total Amount:</span>
                          <span>₹{bill.grandTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-2 border-t flex justify-between items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStationTimer(st.id)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          st.isRunning
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {st.isRunning ? <Pause size={13} /> : <Play size={13} />}
                        {st.isRunning ? "Pause" : "Start"}
                      </button>

                      <button
                        type="button"
                        onClick={() => resetStationTimer(st.id)}
                        className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition"
                        title="Reset Timer"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCheckoutStation(st)}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 shadow"
                      >
                        <CheckCircle size={13} /> Bill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Arcade Tokens */}
          {activeTab === "tokens" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tokenActivities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => addTokenToCart(act)}
                    className="p-4 bg-white border-2 border-gray-200 hover:border-purple-500 rounded-xl cursor-pointer transition flex flex-col justify-between hover:shadow-md group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{act.icon}</span>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        ₹{act.price}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs mt-3">{act.name}</h4>
                    <span className="text-[10px] text-purple-600 font-bold mt-2">+ Tap to Add Token</span>
                  </div>
                ))}
              </div>

              {/* Token Cart */}
              <div className="md:col-span-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                    <Coins className="text-amber-500" size={18} /> Token Cart ({tokenCart.length} Activities)
                  </h3>

                  <div className="divide-y max-h-60 overflow-y-auto mt-2 text-xs">
                    {tokenCart.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <span className="text-gray-500">{item.quantity} x ₹{item.price}</span>
                        </div>
                        <span className="font-black text-purple-900">₹{item.quantity * item.price}</span>
                      </div>
                    ))}
                    {tokenCart.length === 0 && (
                      <div className="py-8 text-center text-gray-400">Click activities on left to add tokens</div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-black text-base text-gray-900 mb-3">
                    <span>Total Token Value:</span>
                    <span className="text-purple-800">
                      ₹{tokenCart.reduce((sum, t) => sum + t.quantity * t.price, 0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={checkoutTokens}
                    disabled={tokenCart.length === 0}
                    className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                  >
                    <CheckCircle size={15} /> Apply Tokens to Invoice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Cashless RFID Wallet Recharge */}
          {activeTab === "rfid_wallet" && (
            <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm max-w-2xl mx-auto space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <CreditCard className="text-purple-700" size={20} />
                  Cashless RFID Card / Wristband Smart Wallet
                </h3>
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  Tap-to-Play Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Card / Wristband RFID No.</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full font-mono font-bold text-sm px-3 py-2 border rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Player / Guest Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full font-bold text-sm px-3 py-2 border rounded-lg mt-1"
                  />
                </div>
              </div>

              {/* Current Card Balance Card */}
              <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white p-5 rounded-2xl flex justify-between items-center shadow">
                <div>
                  <span className="text-xs text-purple-300">Live Card Credits Balance</span>
                  <p className="text-3xl font-black text-yellow-300 mt-1">₹{walletBalance}</p>
                </div>
                <div className="text-right border-l border-purple-800/80 pl-6">
                  <span className="text-xs text-purple-300">Digital Tickets Won</span>
                  <p className="text-3xl font-black text-green-300 mt-1">🎟️ {digitalTickets}</p>
                </div>
              </div>

              {/* Recharge Packages */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Select Recharge Amount (with Free Bonus Credits)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { amt: 500, bonus: 100 },
                    { amt: 1000, bonus: 300 },
                    { amt: 2000, bonus: 800 },
                  ].map((pkg) => (
                    <button
                      key={pkg.amt}
                      type="button"
                      onClick={() => { setRechargeAmount(pkg.amt); setBonusCredit(pkg.bonus); }}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        rechargeAmount === pkg.amt
                          ? "bg-purple-50 border-purple-600 ring-2 ring-purple-300"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <p className="font-black text-gray-900 text-sm">₹{pkg.amt}</p>
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 block mt-1">
                        +₹{pkg.bonus} Free Bonus
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCardRecharge}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <CreditCard size={15} /> Collect ₹{rechargeAmount} & Recharge RFID Card
              </button>
            </div>
          )}

          {/* TAB 4: Ticket Redemption & Prize Store */}
          {activeTab === "redemption" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <Gift className="text-pink-600" size={18} />
                    Prize Store & Ticket Redemption Counter
                  </h3>
                  <p className="text-xs text-gray-500">Exchange digital tickets won on arcade machines for gifts & soft toys</p>
                </div>
                <div className="text-right bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-900">Card Tickets Available:</span>
                  <p className="text-lg font-black text-purple-800">🎟️ {digitalTickets} Tickets</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {redemptionPrizes.map((prz) => (
                  <div key={prz.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-3xl">{prz.icon}</span>
                      <span className="text-xs font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                        🎟️ {prz.ticketsNeeded} Tickets
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{prz.name}</h4>
                      <span className="text-[10px] text-gray-500">In Stock: {prz.inStock} pcs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRedeemPrize(prz)}
                      disabled={digitalTickets < prz.ticketsNeeded}
                      className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Gift size={13} /> {digitalTickets >= prz.ticketsNeeded ? "Redeem Prize" : "Need More Tickets"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
