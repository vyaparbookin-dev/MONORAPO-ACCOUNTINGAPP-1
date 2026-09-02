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
  Plus,
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  Cpu,
  Tv,
  QrCode
} from "lucide-react";

export default function GamezoneOperationsPage() {
  const [activeSubTab, setActiveSubTab] = useState("fleet"); // 'fleet' | 'rfid_cards' | 'lost_card' | 'hal_config' | 'redemption' | 'analytics'

  // Multi-Branch Selector
  const [branches, setBranches] = useState([
    { id: "BR-01", name: "Raipur Main Arcade Hub", code: "RPR-01", city: "Raipur", isMain: true },
    { id: "BR-02", name: "Bilaspur Express Mall", code: "BSP-02", city: "Bilaspur", isMain: false },
    { id: "BR-03", name: "Bhilai City Center FEC", code: "BHL-03", city: "Bhilai", isMain: false },
  ]);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  // Dynamic Pricing Rule (Happy Hours vs Weekend Surge)
  const [pricingMode, setPricingMode] = useState("regular"); // 'regular' (100%) | 'happy_hour' (50% off) | 'weekend_surge' (120%)

  // Hardware Abstraction Layer (HAL) Profiles
  const [halProfiles, setHalProfiles] = useState([
    { id: "HAL-1", name: "Standard 12V Arcade Pulse", protocol: "WiFi MQTT", pulseMs: 50, voltage: 12, pulsesPerCredit: 1 },
    { id: "HAL-2", name: "Claw Machine High-Load", protocol: "WiFi Relay", pulseMs: 100, voltage: 12, pulsesPerCredit: 2 },
    { id: "HAL-3", name: "VR Headset Station Session", protocol: "LAN Socket", pulseMs: 0, voltage: 5, pulsesPerCredit: 1 }
  ]);

  // Live Arcade Machine Fleet & IoT Telemetry
  const [machines, setMachines] = useState([
    { id: "MC-01", name: "MotoGP 4K Simulator", category: "Arcade", basePrice: 80, currentStatus: "playing", totalPlaysToday: 42, totalRevenueToday: 3360, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-101", ip: "192.168.1.101", halProfile: "HAL-1" },
    { id: "MC-02", name: "Soft Toy Claw Machine A", category: "Claw", basePrice: 50, currentStatus: "idle", totalPlaysToday: 94, totalRevenueToday: 4700, lastCardTapped: "CARD-4412 (Aarav)", readerId: "RDR-102", ip: "192.168.1.102", halProfile: "HAL-2" },
    { id: "MC-03", name: "Soft Toy Claw Machine B (VIP)", category: "Claw", basePrice: 60, currentStatus: "playing", totalPlaysToday: 68, totalRevenueToday: 4080, lastCardTapped: "CARD-7731 (Pooja)", readerId: "RDR-103", ip: "192.168.1.103", halProfile: "HAL-2" },
    { id: "MC-04", name: "Arcade Basketball Shootout", category: "Arcade", basePrice: 40, currentStatus: "idle", totalPlaysToday: 76, totalRevenueToday: 3040, lastCardTapped: "CARD-1190 (Kunal)", readerId: "RDR-104", ip: "192.168.1.104", halProfile: "HAL-1" },
    { id: "MC-05", name: "Air Hockey 2-Player Pro", category: "Table", basePrice: 100, currentStatus: "playing", totalPlaysToday: 28, totalRevenueToday: 2800, lastCardTapped: "CARD-3382 (Vikram)", readerId: "RDR-105", ip: "192.168.1.105", halProfile: "HAL-1" },
    { id: "MC-06", name: "VR Quest 3 Space Mission Arena", category: "VR", basePrice: 300, currentStatus: "idle", totalPlaysToday: 18, totalRevenueToday: 5400, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-106", ip: "192.168.1.106", halProfile: "HAL-3" },
    { id: "MC-07", name: "PS5 VIP Gaming Lounge 1", category: "Console", basePrice: 200, currentStatus: "playing", totalPlaysToday: 12, totalRevenueToday: 2400, lastCardTapped: "CARD-8819 (Simran)", readerId: "RDR-107", ip: "192.168.1.107", halProfile: "HAL-3" },
    { id: "MC-08", name: "Trampoline & Soft Play Arena", category: "Kids Play", basePrice: 350, currentStatus: "playing", totalPlaysToday: 22, totalRevenueToday: 7700, lastCardTapped: "CARD-2201 (Sunil)", readerId: "RDR-108", ip: "192.168.1.108", halProfile: "HAL-1" },
  ]);

  // Multi-Tier RFID Cards State
  const [selectedCard, setSelectedCard] = useState({
    cardNumber: "CARD-9842",
    holderName: "Rohan Kumar",
    phone: "9876543210",
    cardType: "pay_per_play", // 'pay_per_play' | 'time_based' | 'family_group' | 'vip_membership'
    membershipTier: "GOLD_VIP",
    realBalance: 1450,
    bonusBalance: 450,
    digitalTickets: 470,
    totalSpentLifetime: 8500,
    timePassExpiresAt: null, // e.g. "2026-09-02T12:30:00"
    isTimePassActive: false,
    linkedWristbands: ["WRIST-A1 (Son)", "WRIST-A2 (Daughter)"],
    status: "ACTIVE",
    playHistory: [
      { time: "03:45 PM", machine: "MotoGP 4K Simulator", cost: 80, ticketsWon: 0, status: "Deducted" },
      { time: "03:20 PM", machine: "Soft Toy Claw Machine A", cost: 25, ticketsWon: 150, status: "Won 150 Tickets 🧸" },
      { time: "02:50 PM", machine: "Arcade Basketball Shootout", cost: 40, ticketsWon: 15, status: "Deducted" },
      { time: "02:15 PM", machine: "RFID Card Recharge (Counter)", cost: -1000, ticketsWon: 0, status: "Recharged (+₹300 Bonus)" },
    ]
  });

  const [rfidSearchInput, setRfidSearchInput] = useState("CARD-9842");

  // Lost Card Migration State
  const [lostOldCard, setLostOldCard] = useState("CARD-9842");
  const [newCardUid, setNewCardUid] = useState("");
  const [migrationReason, setMigrationReason] = useState("Customer lost card in parking area");
  const [migrationSuccess, setMigrationSuccess] = useState(false);

  // Prize Redemption Store
  const [prizes, setPrizes] = useState([
    { id: "PRZ-1", name: "Giant Teddy Bear (3 Ft)", ticketsNeeded: 500, inStock: 4, icon: "🧸" },
    { id: "PRZ-2", name: "Wireless Bluetooth Gaming Headset", ticketsNeeded: 350, inStock: 6, icon: "🎧" },
    { id: "PRZ-3", name: "High-Speed RC Drift Car", ticketsNeeded: 250, inStock: 7, icon: "🏎️" },
    { id: "PRZ-4", name: "Emoji Soft Cushion", ticketsNeeded: 120, inStock: 15, icon: "😃" },
    { id: "PRZ-5", name: "LED Fidget Spinner & Glow Band", ticketsNeeded: 40, inStock: 30, icon: "✨" },
  ]);

  // Aggregate Metrics
  const totalFleetRevenue = machines.reduce((sum, m) => sum + m.totalRevenueToday, 0);
  const totalPlays = machines.reduce((sum, m) => sum + m.totalPlaysToday, 0);

  // 1-Click Lost Card Migration Action
  const handleMigrateCard = () => {
    if (!newCardUid.trim()) return alert("कृपया नया RFID कार्ड UID नंबर दर्ज करें या रीडर पर टैप करें!");
    
    // Perform migration
    const migrated = {
      ...selectedCard,
      cardNumber: newCardUid.trim(),
      status: "ACTIVE",
      playHistory: [
        { time: new Date().toLocaleTimeString(), machine: "Card Migration Desk", cost: 0, ticketsWon: 0, status: `Migrated from ${lostOldCard}` },
        ...selectedCard.playHistory
      ]
    };
    setSelectedCard(migrated);
    setMigrationSuccess(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner & Multi-Branch Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-2xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg border border-indigo-400/30">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">NextGen RFID Gamezone & FEC Operations Hub</h1>
              <span className="text-[10px] bg-purple-500/30 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-bold">
                Enterprise Multi-Branch v2.0
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              कैशलेस RFID स्मार्टकार्ड, IoT मशीन टेलीमेट्री, मल्टी-टियर पासेस व टिकट रिडेम्पशन
            </p>
          </div>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-md">
          <Building2 size={16} className="text-indigo-300" />
          <div className="text-left">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">सक्रिय ब्रांच (Branch)</span>
            <select
              value={selectedBranch.id}
              onChange={(e) => setSelectedBranch(branches.find(b => b.id === e.target.value) || branches[0])}
              className="bg-transparent text-xs font-black text-white outline-none cursor-pointer"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id} className="text-slate-900">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "fleet", label: "🕹️ लाइव मशीन फ्लीट (Arcade Fleet)", icon: <Gamepad2 size={15} /> },
          { id: "rfid_cards", label: "💳 स्मार्टकार्ड व मल्टी-टियर पासेस", icon: <CreditCard size={15} /> },
          { id: "lost_card", label: "🔄 लॉस्ट कार्ड बैलेंस माइग्रेशन", icon: <ArrowRightLeft size={15} /> },
          { id: "hal_config", label: "⚙️ हार्डवेयर प्रोफाइल (HAL Config)", icon: <Cpu size={15} /> },
          { id: "redemption", label: "🎁 टिकट प्राइज स्टोर (Redemption)", icon: <Gift size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeSubTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FLEET & LIVE TELEMETRY */}
      {activeSubTab === "fleet" && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">कुल मशीनें (Fleet)</span>
              <span className="text-2xl font-black text-slate-900">{machines.length} Units</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">आज के कुल खेल (Plays)</span>
              <span className="text-2xl font-black text-blue-600">{totalPlays}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">आज की कुल कमाई (Revenue)</span>
              <span className="text-2xl font-black text-emerald-600">₹{totalFleetRevenue.toLocaleString()}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">प्राइसिंग मोड</span>
              <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg inline-block mt-1 ${
                pricingMode === 'happy_hour' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {pricingMode === 'happy_hour' ? '⚡ Happy Hour (50% OFF)' : 'Regular (100%)'}
              </span>
            </div>
          </div>

          {/* Machine Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {machines.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">{m.id}</span>
                    <h3 className="font-black text-sm text-slate-900 mt-1">{m.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    m.currentStatus === 'playing' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {m.currentStatus === 'playing' ? '● PLAYING' : 'IDLE'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>बेस प्राइस:</span>
                    <span className="font-bold text-slate-900">₹{m.basePrice} / खेल</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>आज की कमाई:</span>
                    <span className="font-bold text-emerald-600">₹{m.totalRevenueToday} ({m.totalPlaysToday} Plays)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>HAL Profile:</span>
                    <span className="font-mono">{m.halProfile}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  आखरी टैप: <span className="font-bold text-indigo-600">{m.lastCardTapped}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-TIER SMARTCARDS */}
      {activeSubTab === "rfid_cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Details Card */}
          <div className="lg:col-span-1 bg-gradient-to-tr from-slate-900 via-indigo-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl space-y-6 border border-indigo-400/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="text-indigo-400" />
                <span className="text-xs font-black tracking-widest">SMART PLAYCARD</span>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px]">
                {selectedCard.membershipTier}
              </span>
            </div>

            <div>
              <span className="text-xs text-indigo-200 block font-mono font-bold">{selectedCard.cardNumber}</span>
              <h2 className="text-xl font-black text-white mt-0.5">{selectedCard.holderName}</h2>
              <span className="text-xs text-indigo-300 font-mono">{selectedCard.phone}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/10 p-3.5 rounded-2xl backdrop-blur-md text-center">
              <div>
                <span className="text-[10px] text-indigo-200 block">नकद बैलेंस</span>
                <span className="font-black text-sm text-emerald-400">₹{selectedCard.realBalance}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-200 block">बोनस</span>
                <span className="font-black text-sm text-amber-400">₹{selectedCard.bonusBalance}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-200 block">टिकट्स</span>
                <span className="font-black text-sm text-purple-400">{selectedCard.digitalTickets} 🎟️</span>
              </div>
            </div>

            {selectedCard.linkedWristbands.length > 0 && (
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1 text-xs">
                <span className="text-[10px] text-indigo-300 font-bold block">लिंक्ड फैमिली रिस्टबैंड्स (Linked Wristbands):</span>
                {selectedCard.linkedWristbands.map((wb, idx) => (
                  <div key={idx} className="text-slate-200 font-mono text-[11px]">• {wb}</div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & History */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-base text-slate-900">स्मार्टकार्ड हिस्ट्री व ट्रांजैक्शन लॉग</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedCard.playHistory.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{h.machine}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({h.time})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700">{h.status}</span>
                    {h.cost !== 0 && (
                      <span className={`font-black font-mono ${h.cost > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {h.cost > 0 ? `-₹${h.cost}` : `+₹${Math.abs(h.cost)}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOST CARD MIGRATION (1-CLICK REPLACEMENT) */}
      {activeSubTab === "lost_card" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">खोए हुए RFID कार्ड का बैलेंस माइग्रेशन</h2>
              <p className="text-xs text-slate-500 font-medium">
                पुराना कार्ड तुरंत ब्लॉक करें और पूरा बैलेंस व टिकट्स नए कार्ड में ट्रांसफर करें
              </p>
            </div>
          </div>

          {migrationSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in">
              <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
              <h3 className="font-black text-emerald-900 text-base">बैलेंस माइग्रेशन 100% सफल रहा!</h3>
              <p className="text-xs text-emerald-700">
                पुराना कार्ड ({lostOldCard}) हमेशा के लिए <strong>LOCKED</strong> हो गया है। <br />
                नया कार्ड ({newCardUid}) पर कुल ₹{selectedCard.realBalance + selectedCard.bonusBalance} और {selectedCard.digitalTickets} टिकट्स लोड हो चुके हैं।
              </p>
              <button
                onClick={() => { setMigrationSuccess(false); setNewCardUid(""); }}
                className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                नया माइग्रेशन करें
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">खोया हुआ कार्ड (Old Card):</span>
                  <span className="font-bold text-slate-800">{lostOldCard} ({selectedCard.holderName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">माइग्रेट होने वाला बैलेंस:</span>
                  <span className="font-black text-emerald-600">₹{selectedCard.realBalance} नकद + ₹{selectedCard.bonusBalance} बोनस</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">माइग्रेट होने वाले टिकट्स:</span>
                  <span className="font-black text-purple-600">{selectedCard.digitalTickets} 🎟️</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                  नया RFID कार्ड UID (टैप करें या नंबर डालें) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD-9901 (टैप करते ही भर जाएगा)"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  className="w-full p-3 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-xs font-bold outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                  माइग्रेशन का कारण (Reason for Audit Log)
                </label>
                <input
                  type="text"
                  value={migrationReason}
                  onChange={(e) => setMigrationReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleMigrateCard}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <ArrowRightLeft size={16} /> पुराना कार्ड ब्लॉक करें और नए कार्ड में ट्रांसफर करें →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HARDWARE ABSTRACTION LAYER (HAL CONFIG) */}
      {activeSubTab === "hal_config" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">हार्डवेयर एब्स्ट्रैक्शन लेयर (HAL Profiles)</h2>
              <p className="text-xs text-slate-500">विभिन्न आर्केड मशीनों के लिए रिले पल्स टाइमिंग व वोल्टेज सेटिंग्स</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {halProfiles.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700">{p.name}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">{p.id}</span>
                </div>
                <div className="space-y-1 text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between"><span>प्रोटोकॉल:</span><span className="font-bold">{p.protocol}</span></div>
                  <div className="flex justify-between"><span>पल्स अवधि:</span><span className="font-bold font-mono">{p.pulseMs} ms</span></div>
                  <div className="flex justify-between"><span>वोल्टेज:</span><span className="font-bold font-mono">{p.voltage}V DC</span></div>
                  <div className="flex justify-between"><span>पल्स/क्रेडिट:</span><span className="font-bold font-mono">{p.pulsesPerCredit}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REDEMPTION STORE */}
      {activeSubTab === "redemption" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">डिजिटल टिकट रिडेम्पशन प्राइज स्टोर</h2>
              <p className="text-xs text-slate-500">टिकट्स से गिफ्ट एक्सचेंज व इन्वेंट्री ऑटो-डिडक्शन</p>
            </div>
            <div className="px-4 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-black">
              उपलब्ध टिकट्स: {selectedCard.digitalTickets} 🎟️
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {prizes.map((prz) => (
              <div key={prz.id} className="p-4 bg-slate-50 rounded-2xl border text-center space-y-2">
                <span className="text-4xl block">{prz.icon}</span>
                <h3 className="font-bold text-xs text-slate-900">{prz.name}</h3>
                <span className="text-xs font-black text-purple-600 block">{prz.ticketsNeeded} टिकट्स</span>
                <span className="text-[10px] text-slate-400 block">स्टॉक: {prz.inStock} नग</span>
                <button
                  disabled={selectedCard.digitalTickets < prz.ticketsNeeded || prz.inStock <= 0}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition"
                >
                  रिडीम करें (Redeem)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
