import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  CreditCard,
  Zap,
  TrendingUp,
  Clock,
  Coins,
  Gift,
  Award,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Activity,
  Radio,
  BarChart3,
  Calendar,
  Share2,
  RefreshCw,
  Plus
} from "lucide-react";

export default function GamezoneOperationsPage() {
  const [activeSubTab, setActiveSubTab] = useState("fleet"); // 'fleet' | 'rfid_cards' | 'pricing' | 'redemption' | 'analytics'

  // Dynamic Pricing Rule (Happy Hours vs Weekend Surge)
  const [pricingMode, setPricingMode] = useState("regular"); // 'regular' (100%) | 'happy_hour' (50% off) | 'weekend_surge' (120%)
  const [happyHourActive, setHappyHourActive] = useState(false);

  // Live Arcade Machine Fleet & IoT Telemetry
  const [machines, setMachines] = useState([
    { id: "MC-01", name: "MotoGP 4K Simulator", category: "Arcade", basePrice: 80, currentStatus: "playing", totalPlaysToday: 42, totalRevenueToday: 3360, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-101", ip: "192.168.1.101" },
    { id: "MC-02", name: "Soft Toy Claw Machine A", category: "Claw", basePrice: 50, currentStatus: "idle", totalPlaysToday: 94, totalRevenueToday: 4700, lastCardTapped: "CARD-4412 (Aarav)", readerId: "RDR-102", ip: "192.168.1.102" },
    { id: "MC-03", name: "Soft Toy Claw Machine B (VIP)", category: "Claw", basePrice: 60, currentStatus: "playing", totalPlaysToday: 68, totalRevenueToday: 4080, lastCardTapped: "CARD-7731 (Pooja)", readerId: "RDR-103", ip: "192.168.1.103" },
    { id: "MC-04", name: "Arcade Basketball Shootout", category: "Arcade", basePrice: 40, currentStatus: "idle", totalPlaysToday: 76, totalRevenueToday: 3040, lastCardTapped: "CARD-1190 (Kunal)", readerId: "RDR-104", ip: "192.168.1.104" },
    { id: "MC-05", name: "Air Hockey 2-Player Pro", category: "Table", basePrice: 100, currentStatus: "playing", totalPlaysToday: 28, totalRevenueToday: 2800, lastCardTapped: "CARD-3382 (Vikram)", readerId: "RDR-105", ip: "192.168.1.105" },
    { id: "MC-06", name: "VR Quest 3 Space Mission Arena", category: "VR", basePrice: 300, currentStatus: "idle", totalPlaysToday: 18, totalRevenueToday: 5400, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-106", ip: "192.168.1.106" },
    { id: "MC-07", name: "PS5 VIP Gaming Lounge 1", category: "Console", basePrice: 200, currentStatus: "playing", totalPlaysToday: 12, totalRevenueToday: 2400, lastCardTapped: "CARD-8819 (Simran)", readerId: "RDR-107", ip: "192.168.1.107" },
    { id: "MC-08", name: "Trampoline & Soft Play Arena", category: "Kids Play", basePrice: 350, currentStatus: "playing", totalPlaysToday: 22, totalRevenueToday: 7700, lastCardTapped: "CARD-2201 (Sunil)", readerId: "RDR-108", ip: "192.168.1.108" },
  ]);

  // RFID Card Database & Tap-to-Play Simulation
  const [selectedCard, setSelectedCard] = useState({
    cardNumber: "CARD-9842",
    holderName: "Rohan Kumar",
    phone: "9876543210",
    realBalance: 450,
    bonusBalance: 150,
    digitalTickets: 320,
    totalSpentLifetime: 4800,
    registeredDate: "2026-06-15",
    playHistory: [
      { time: "03:45 PM", machine: "MotoGP 4K Simulator", cost: 80, ticketsWon: 0, status: "Deducted" },
      { time: "03:20 PM", machine: "Soft Toy Claw Machine A", cost: 50, ticketsWon: 25, status: "Won Prize 🧸" },
      { time: "02:50 PM", machine: "Arcade Basketball Shootout", cost: 40, ticketsWon: 15, status: "Deducted" },
      { time: "02:15 PM", machine: "RFID Card Recharge (Counter)", cost: -500, ticketsWon: 0, status: "Recharged (+₹100 Bonus)" },
    ]
  });

  const [rfidSearchInput, setRfidSearchInput] = useState("CARD-9842");
  const [rechargePkg, setRechargePkg] = useState({ amount: 1000, bonus: 300 });

  // Prize Redemption Store
  const [prizes, setPrizes] = useState([
    { id: "PRZ-1", name: "Giant Teddy Bear (3 Ft)", ticketsNeeded: 500, inStock: 4, icon: "🧸" },
    { id: "PRZ-2", name: "Wireless Bluetooth Gaming Headset", ticketsNeeded: 350, inStock: 6, icon: "🎧" },
    { id: "PRZ-3", name: "High-Speed RC Drift Car", ticketsNeeded: 250, inStock: 8, icon: "🏎️" },
    { id: "PRZ-4", name: "Emoji Soft Cushion", ticketsNeeded: 120, inStock: 15, icon: "😃" },
    { id: "PRZ-5", name: "LED Fidget Spinner & Glow Band", ticketsNeeded: 40, inStock: 30, icon: "✨" },
  ]);

  // Aggregate Metrics
  const totalFleetRevenue = machines.reduce((sum, m) => sum + m.totalRevenueToday, 0);
  const totalPlays = machines.reduce((sum, m) => sum + m.totalPlaysToday, 0);
  const activePlayingCount = machines.filter((m) => m.currentStatus === "playing").length;

  // Simulate Hardware RFID Tap on a Machine
  const simulateCardTapOnMachine = (machine) => {
    let effectivePrice = machine.basePrice;
    if (pricingMode === "happy_hour") effectivePrice = Math.round(machine.basePrice * 0.5);
    else if (pricingMode === "weekend_surge") effectivePrice = Math.round(machine.basePrice * 1.2);

    const totalAvailable = selectedCard.realBalance + selectedCard.bonusBalance;
    if (totalAvailable < effectivePrice) {
      alert(`⚠️ Insufficient Balance! Card has ₹${totalAvailable}, Game cost is ₹${effectivePrice}. Please recharge at counter.`);
      return;
    }

    // Deduct from Bonus first, then Real
    let newBonus = selectedCard.bonusBalance;
    let newReal = selectedCard.realBalance;
    if (newBonus >= effectivePrice) {
      newBonus -= effectivePrice;
    } else {
      const remaining = effectivePrice - newBonus;
      newBonus = 0;
      newReal -= remaining;
    }

    // Random tickets won (for claw / arcade)
    const ticketsWon = machine.category === "Claw" || machine.category === "Arcade" ? Math.floor(Math.random() * 20) + 5 : 0;

    const newHistoryItem = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      machine: machine.name,
      cost: effectivePrice,
      ticketsWon,
      status: ticketsWon > 0 ? `Won 🎟️ ${ticketsWon} Tickets` : "Deducted"
    };

    setSelectedCard((prev) => ({
      ...prev,
      realBalance: newReal,
      bonusBalance: newBonus,
      digitalTickets: prev.digitalTickets + ticketsWon,
      playHistory: [newHistoryItem, ...prev.playHistory]
    }));

    // Update Machine State
    setMachines((prev) =>
      prev.map((m) =>
        m.id === machine.id
          ? {
              ...m,
              currentStatus: "playing",
              totalPlaysToday: m.totalPlaysToday + 1,
              totalRevenueToday: m.totalRevenueToday + effectivePrice,
              lastCardTapped: `${selectedCard.cardNumber} (${selectedCard.holderName})`
            }
          : m
      )
    );

    alert(`🟢 TAP-TO-PLAY SUCCESSFUL!\\nReader: ${machine.readerId}\\nMachine: ${machine.name}\\nPrice Deducted: ₹${effectivePrice}\\nTickets Credited: 🎟️ ${ticketsWon}\\nRemaining Card Balance: ₹${newReal + newBonus}`);
  };

  // Recharge Card
  const handleRechargeCard = () => {
    setSelectedCard((prev) => ({
      ...prev,
      realBalance: prev.realBalance + rechargePkg.amount,
      bonusBalance: prev.bonusBalance + rechargePkg.bonus,
      totalSpentLifetime: prev.totalSpentLifetime + rechargePkg.amount,
      playHistory: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          machine: "Counter RFID Smart Recharge",
          cost: -rechargePkg.amount,
          ticketsWon: 0,
          status: `Recharged (+₹${rechargePkg.bonus} Free Bonus)`
        },
        ...prev.playHistory
      ]
    }));
    alert(`🎉 Card ${selectedCard.cardNumber} Recharged with ₹${rechargePkg.amount + rechargePkg.bonus} (including ₹${rechargePkg.bonus} bonus credits)!`);
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-6 rounded-2xl border border-purple-500/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-600/30 rounded-2xl border border-purple-400/30 shadow-inner">
              <Gamepad2 size={32} className="text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  ENTERPRISE GAMEZONE & FEC COMMAND HUB
                </h1>
                <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-400/30 text-[10px] font-black rounded-full uppercase flex items-center gap-1">
                  <Radio size={10} className="animate-pulse text-green-400" /> IoT Readers Online (8 Nodes)
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Semnox / Sacoa Level Cashless RFID Tap-to-Play • Happy Hour Surge Rules • Digital Ticket Redemption
              </p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 bg-white/5 p-3 px-5 rounded-xl border border-white/10 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">Today's Arcade Revenue</span>
              <p className="text-xl font-black text-yellow-300">₹{totalFleetRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <span className="text-gray-400 block text-[10px]">Total Game Plays</span>
              <p className="text-xl font-black text-cyan-300">{totalPlays} Taps</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <span className="text-gray-400 block text-[10px]">Active Playing Now</span>
              <p className="text-xl font-black text-emerald-400">{activePlayingCount} / {machines.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 gap-1.5 flex-wrap">
          {[
            { id: "fleet", label: "🕹️ Machine Fleet & Live Readers", count: machines.length },
            { id: "rfid_cards", label: "💳 Cashless RFID Wallet & Tap Sim", count: "Live" },
            { id: "pricing", label: "⚡ Dynamic Pricing & Happy Hours", count: pricingMode.toUpperCase() },
            { id: "redemption", label: "🎁 Prize & Ticket Redemption", count: prizes.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* TAB 1: Live Machine Fleet & Telemetry Grid */}
        {activeSubTab === "fleet" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 text-xs">
              <span className="font-bold text-gray-300">
                Live IoT Reader Nodes • Click <strong>"Simulate RFID Tap"</strong> on any machine to test instant cashless debit & ticket credit
              </span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30 flex items-center gap-1 text-[10px]">
                  🟢 Active Session
                </span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1 text-[10px]">
                  🔵 Idle (Waiting Tap)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {machines.map((mc) => {
                let currentPrice = mc.basePrice;
                if (pricingMode === "happy_hour") currentPrice = Math.round(mc.basePrice * 0.5);
                else if (pricingMode === "weekend_surge") currentPrice = Math.round(mc.basePrice * 1.2);

                return (
                  <div
                    key={mc.id}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between space-y-3 ${
                      mc.currentStatus === "playing"
                        ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-400"
                        : "bg-slate-800/80 border-slate-700 hover:border-purple-500"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-purple-300 border border-purple-500/30">
                          {mc.readerId} • {mc.category}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                          mc.currentStatus === "playing" ? "bg-emerald-500 text-black font-black animate-pulse" : "bg-blue-500/30 text-blue-300"
                        }`}>
                          {mc.currentStatus}
                        </span>
                      </div>

                      <h4 className="font-black text-white text-sm mt-2">{mc.name}</h4>
                      
                      <div className="my-2 p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Game Fee / Tap:</span>
                          <span className="font-black text-yellow-300">₹{currentPrice} {pricingMode !== "regular" && `(${mc.basePrice})`}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Today Plays:</span>
                          <span className="font-bold text-white">{mc.totalPlaysToday} Plays</span>
                        </div>
                        <div className="flex justify-between text-gray-400 border-t border-white/10 pt-1">
                          <span>Today Collection:</span>
                          <span className="font-black text-green-400">₹{mc.totalRevenueToday.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-400 truncate">
                        Last Player: <strong className="text-purple-300">{mc.lastCardTapped}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => simulateCardTapOnMachine(mc)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <Zap size={14} className="text-yellow-300" /> Tap {selectedCard.cardNumber} (₹{currentPrice})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: RFID Cashless Smart Wallet */}
        {activeSubTab === "rfid_cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card 360 View */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl border-2 border-purple-500/50 shadow-2xl space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">ENTERPRISE SMART PLAYCARD</span>
                    <h3 className="text-2xl font-mono font-black text-white mt-0.5">{selectedCard.cardNumber}</h3>
                  </div>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Radio className="text-green-400 animate-pulse" size={20} />
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Usable Cash Balance</span>
                    <p className="text-3xl font-black text-yellow-300">₹{selectedCard.realBalance + selectedCard.bonusBalance}</p>
                    <p className="text-[10px] text-gray-400">Real: ₹{selectedCard.realBalance} • Free Bonus: ₹{selectedCard.bonusBalance}</p>
                  </div>
                  <div className="text-right border-l border-white/10 pl-4">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Digital Tickets</span>
                    <p className="text-3xl font-black text-emerald-300">🎟️ {selectedCard.digitalTickets}</p>
                    <p className="text-[10px] text-emerald-400">Redeemable at Prize Store</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-purple-200 font-medium">
                  <span>Player: <strong>{selectedCard.holderName}</strong> ({selectedCard.phone})</span>
                  <span>Lifetime Spent: ₹{selectedCard.totalSpentLifetime}</span>
                </div>
              </div>

              {/* Instant Counter Recharge Box */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  <CreditCard size={18} className="text-purple-400" /> Counter Card Top-Up Packages
                </h4>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { amt: 500, bonus: 100 },
                    { amt: 1000, bonus: 300 },
                    { amt: 2000, bonus: 800 },
                  ].map((pkg) => (
                    <button
                      key={pkg.amt}
                      type="button"
                      onClick={() => setRechargePkg({ amount: pkg.amt, bonus: pkg.bonus })}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        rechargePkg.amount === pkg.amt
                          ? "bg-purple-600/30 border-purple-400 text-white shadow"
                          : "bg-black/20 border-slate-700 text-gray-300 hover:border-purple-500"
                      }`}
                    >
                      <p className="font-black text-base text-white">₹{pkg.amt}</p>
                      <span className="text-[10px] text-green-300 font-bold block mt-0.5">
                        +₹{pkg.bonus} Free
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRechargeCard}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition"
                >
                  <Coins size={16} /> Collect ₹{rechargePkg.amount} & Load ₹{rechargePkg.amount + rechargePkg.bonus} Credits
                </button>
              </div>
            </div>

            {/* Right Card Play Audit Logs */}
            <div className="lg:col-span-7 bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="font-black text-white text-base border-b border-slate-700 pb-3 flex items-center justify-between">
                <span>🎮 Complete Tap-to-Play Telemetry Audit Log</span>
                <span className="text-xs text-purple-300 font-mono">Card: {selectedCard.cardNumber}</span>
              </h3>

              <div className="divide-y divide-slate-700/60 max-h-[420px] overflow-y-auto pr-1 text-xs">
                {selectedCard.playHistory.map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center hover:bg-white/5 px-2 rounded-lg transition">
                    <div>
                      <span className="font-bold text-white text-sm">{item.machine}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">Time: {item.time} • Status: <strong className="text-purple-300">{item.status}</strong></p>
                    </div>

                    <div className="text-right">
                      <span className={`font-black text-sm block ${item.cost < 0 ? "text-green-400" : "text-yellow-400"}`}>
                        {item.cost < 0 ? `+ ₹${Math.abs(item.cost)} Topup` : `- ₹${item.cost}`}
                      </span>
                      {item.ticketsWon > 0 && (
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          +🎟️ {item.ticketsWon} Won
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Dynamic Pricing & Happy Hours */}
        {activeSubTab === "pricing" && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="text-amber-400" size={22} />
                Dynamic Pricing Rules & Happy Hours Automation
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                समय और दिन के हिसाब से गेम की दरों में स्वतः छूट या सर्ज लगाना (Semnox & Sacoa Industry Standard)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setPricingMode("regular")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  pricingMode === "regular"
                    ? "bg-purple-900/40 border-purple-500 ring-2 ring-purple-400"
                    : "bg-black/30 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Standard Rate</span>
                  <h4 className="text-lg font-black text-white mt-1">Normal Regular (100%)</h4>
                  <p className="text-xs text-gray-400 mt-1">MotoGP ₹80 • Claw ₹50 • VR ₹300</p>
                </div>
                <span className="text-[10px] font-black text-purple-300 mt-4 block">Standard Weekday</span>
              </div>

              <div
                onClick={() => setPricingMode("happy_hour")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  pricingMode === "happy_hour"
                    ? "bg-amber-950/60 border-amber-400 ring-2 ring-amber-300"
                    : "bg-black/30 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
                    <Sparkles size={12} /> 50% Flat Discount
                  </span>
                  <h4 className="text-lg font-black text-yellow-300 mt-1">Happy Hours (50% Off)</h4>
                  <p className="text-xs text-gray-300 mt-1">MotoGP ₹40 • Claw ₹25 • VR ₹150</p>
                </div>
                <span className="text-[10px] font-black text-amber-300 mt-4 block">Tue-Thu 12PM - 4PM</span>
              </div>

              <div
                onClick={() => setPricingMode("weekend_surge")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  pricingMode === "weekend_surge"
                    ? "bg-rose-950/60 border-rose-400 ring-2 ring-rose-300"
                    : "bg-black/30 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-rose-400 uppercase flex items-center gap-1">
                    <Flame size={12} /> Peak Rush 1.2x
                  </span>
                  <h4 className="text-lg font-black text-rose-300 mt-1">Weekend Surge (+20%)</h4>
                  <p className="text-xs text-gray-300 mt-1">MotoGP ₹96 • Claw ₹60 • VR ₹360</p>
                </div>
                <span className="text-[10px] font-black text-rose-300 mt-4 block">Sat-Sun Evening Peak</span>
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/10 text-xs text-gray-300">
              <strong className="text-white block mb-1">💡 Live IoT Hardware Sync Note:</strong>
              When you change the pricing rule here, all 8 RFID Readers instantly update their display screen to show the new discounted/surge price to players upon tap!
            </div>
          </div>
        )}

        {/* TAB 4: Prize Redemption */}
        {activeSubTab === "redemption" && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Gift className="text-pink-400" size={18} />
                  Ticket Redemption Counter & Prize Inventory POS
                </h3>
                <p className="text-xs text-gray-400">Exchange digital tickets won on games for prizes</p>
              </div>

              <div className="bg-purple-950/80 px-4 py-2 rounded-xl border border-purple-500/40 text-right">
                <span className="text-[10px] text-purple-300 uppercase">Card Tickets Available:</span>
                <p className="text-lg font-black text-emerald-400">🎟️ {selectedCard.digitalTickets} Tickets</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {prizes.map((prz) => (
                <div key={prz.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-md flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl">{prz.icon}</span>
                    <span className="text-xs font-black text-pink-300 bg-pink-950/80 px-2.5 py-1 rounded-lg border border-pink-500/40">
                      🎟️ {prz.ticketsNeeded} Tickets
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{prz.name}</h4>
                    <span className="text-xs text-gray-400">Physical Stock: {prz.inStock} pcs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCard.digitalTickets < prz.ticketsNeeded) {
                        return alert(`Not enough tickets! Need ${prz.ticketsNeeded}, Card has ${selectedCard.digitalTickets}.`);
                      }
                      setSelectedCard((prev) => ({
                        ...prev,
                        digitalTickets: prev.digitalTickets - prz.ticketsNeeded,
                        playHistory: [
                          {
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            machine: `Prize Redeemed: ${prz.name}`,
                            cost: 0,
                            ticketsWon: -prz.ticketsNeeded,
                            status: `Claimed ${prz.name} 🎁`
                          },
                          ...prev.playHistory
                        ]
                      }));
                      alert(`🎁 Redeemed "${prz.name}" for ${prz.ticketsNeeded} tickets from ${selectedCard.cardNumber}!`);
                    }}
                    disabled={selectedCard.digitalTickets < prz.ticketsNeeded}
                    className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Gift size={14} /> {selectedCard.digitalTickets >= prz.ticketsNeeded ? "Redeem Prize" : "Need More Tickets"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
