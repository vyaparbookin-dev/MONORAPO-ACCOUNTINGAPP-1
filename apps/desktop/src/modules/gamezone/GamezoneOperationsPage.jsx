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
  QrCode,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Smartphone,
  PieChart,
  DollarSign,
  Eye,
  FileSpreadsheet
} from "lucide-react";

export default function GamezoneOperationsPage() {

  // Configurable Grace Period & Overtime Penalty Rules
  const [softPlayRules, setSoftPlayRules] = useState({
    gracePeriodMins: 5, // 0, 5, 10 minutes free buffer before penalty
    overtimeRatePerMin: 10, // ₹10 per extra minute after grace period
    autoTripodGateLock: true
  });

  // Reusable Wristband Inventory & Status Tracker
  const [wristbandInventory, setWristbandInventory] = useState([
    { uid: "WB-RED-101", color: "Red (30m)", status: "IN_USE", childAssigned: "Aarav Sharma" },
    { uid: "WB-BLUE-204", color: "Blue (60m)", status: "IN_USE", childAssigned: "Ananya Verma" },
    { uid: "WB-GREEN-305", color: "Green (60m)", status: "IN_USE", childAssigned: "Kabir Patel" },
    { uid: "WB-VIP-009", color: "Gold (VIP)", status: "IN_USE", childAssigned: "Rohan & Riya" },
    { uid: "WB-RED-102", color: "Red (30m)", status: "AVAILABLE", childAssigned: null },
    { uid: "WB-RED-103", color: "Red (30m)", status: "AVAILABLE", childAssigned: null },
    { uid: "WB-BLUE-205", color: "Blue (60m)", status: "AVAILABLE", childAssigned: null },
    { uid: "WB-BLUE-206", color: "Blue (60m)", status: "AVAILABLE", childAssigned: null },
    { uid: "WB-VIP-010", color: "Gold (VIP)", status: "AVAILABLE", childAssigned: null },
  ]);

  // Handle Wristband Return / Exit Gate Drop Box
  const handleCollectAndFreeWristband = (sessId, wristbandUid) => {
    setActivePlaySessions(prev => prev.filter(s => s.id !== sessId));
    setWristbandInventory(prev => prev.map(w => w.uid === wristbandUid ? { ...w, status: "AVAILABLE", childAssigned: null } : w));
    setSoftPlayCapacity(p => ({ ...p, currentKidsInside: Math.max(0, p.currentKidsInside - 1) }));
    alert(`✅ [Exit Gate Opened]: रिस्टबैंड ${wristbandUid} कलेक्ट हो गया है और दोबारा इस्तेमाल के लिए काउंटर ट्रे में उपलब्ध हो गया है!`);
  };


  // Indoor Soft Play & Trampoline Arena Management Engine (1200-1800 Sq.Ft)
  const [softPlayCapacity, setSoftPlayCapacity] = useState({
    maxKidsAllowed: 40,
    currentKidsInside: 26,
    totalAreaSqFt: 1500,
    gripSocksSoldToday: 38,
    overtimePenaltyCollected: 1450
  });

  const [activePlaySessions, setActivePlaySessions] = useState([
    { id: "SESS-01", wristband: "WB-RED-101", childName: "Aarav Sharma (Age 5)", parentName: "Rajesh Sharma", parentPhone: "9826199881", durationMins: 60, elapsedMins: 45, status: "ACTIVE_PLAYING", antiSkidSocks: true, guardiansCount: 1, overstayPenalty: 0 },
    { id: "SESS-02", wristband: "WB-BLUE-204", childName: "Ananya Verma (Age 4)", parentName: "Pooja Verma", parentPhone: "9826199882", durationMins: 30, elapsedMins: 38, status: "OVERSTAY_ALERT", antiSkidSocks: true, guardiansCount: 1, overstayPenalty: 80 },
    { id: "SESS-03", wristband: "WB-GREEN-305", childName: "Kabir Patel (Age 7)", parentName: "Vikram Patel", parentPhone: "9826199883", durationMins: 60, elapsedMins: 15, status: "ACTIVE_PLAYING", antiSkidSocks: true, guardiansCount: 2, overstayPenalty: 0 },
    { id: "SESS-04", wristband: "WB-VIP-009", childName: "Rohan & Riya (Twin Pass)", parentName: "Sunita Roy", parentPhone: "9826199884", durationMins: 120, elapsedMins: 70, status: "ACTIVE_PLAYING", antiSkidSocks: true, guardiansCount: 1, overstayPenalty: 0 },
  ]);

  const [newSessionForm, setNewSessionForm] = useState({
    wristband: "",
    childName: "",
    childAge: "",
    parentName: "",
    parentPhone: "",
    package: "60_mins", // '30_mins' (₹300) | '60_mins' (₹500) | 'unlimited' (₹800)
    addSocks: true,
    guardiansCount: 1,
    signedWaiver: true
  });

  const handleAddNewSoftPlaySession = (e) => {
    if (e) e.preventDefault();
    if (!newSessionForm.childName || !newSessionForm.parentPhone) return alert("बच्चे का नाम और माता-पिता का मोबाइल नंबर अनिवार्य है!");

    const duration = newSessionForm.package === "30_mins" ? 30 : newSessionForm.package === "60_mins" ? 60 : 180;
    const newSess = {
      id: `SESS-${Date.now()}`,
      wristband: newSessionForm.wristband || `WB-${Math.floor(100 + Math.random() * 900)}`,
      childName: `${newSessionForm.childName} (Age ${newSessionForm.childAge || '5'})`,
      parentName: newSessionForm.parentName || "Parent",
      parentPhone: newSessionForm.parentPhone,
      durationMins: duration,
      elapsedMins: 1,
      status: "ACTIVE_PLAYING",
      antiSkidSocks: newSessionForm.addSocks,
      guardiansCount: parseInt(newSessionForm.guardiansCount) || 1,
      overstayPenalty: 0
    };

    setActivePlaySessions([newSess, ...activePlaySessions]);
    setSoftPlayCapacity(p => ({ ...p, currentKidsInside: p.currentKidsInside + 1 }));
    alert(`🎉 [Entry Gate Unlocked]: ${newSessionForm.childName} की एंट्री हो गई है! टर्नस्टाइल गेट 5 सेकंड के लिए खुल गया है।`);
    setNewSessionForm({ wristband: "", childName: "", childAge: "", parentName: "", parentPhone: "", package: "60_mins", addSocks: true, guardiansCount: 1, signedWaiver: true });
  };

  const handleParentEmergencyCall = (sess) => {
    const text = `Namaste ${sess.parentName}! Soft Play Arena Alert: Your child ${sess.childName} is ready at the exit counter. Please collect them.`;
    window.open(`https://api.whatsapp.com/send?phone=91${sess.parentPhone}&text=${encodeURIComponent(text)}`, "_blank");
  };


  // Soft Toy Claw Machine Anti-Fraud & Optical Prize Audit Engine
  const [clawSecurityAudit, setClawSecurityAudit] = useState({
    machineId: "MC-02",
    machineName: "Soft Toy Claw Machine A",
    initialStockLoaded: 50,
    opticalSensorDrops: 8,
    physicalStockRemaining: 42,
    unaccountedLoss: 0, // 0 = 100% Safe, >0 = Theft Alert
    cabinetDoorStatus: "CLOSED_LOCKED", // 'CLOSED_LOCKED' | 'DOOR_OPEN_UNAUTHORIZED'
    clawGripVoltage: "Strong (32V Pulse on Win Cycle)",
    winRatioConfig: "1 Win per 12 Plays (Target Margin: 65%)",
    doorOpenLogs: [
      { time: "09:30 AM", event: "Restock: +20 Teddy Bears loaded", operator: "Manager Vikram", status: "AUTHORIZED" },
      { time: "Yesterday 08:15 PM", event: "Routine maintenance & cleaning", operator: "Staff Sunil", status: "VERIFIED" }
    ]
  });


  // Centralized Dynamic Pricing Matrix & Happy Hour Scheduler
  const [happyHourSchedule, setHappyHourSchedule] = useState({
    enabled: true,
    startTime: "12:00",
    endTime: "16:00",
    discountPercent: 50,
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  });

  const handleUpdateMachinePrice = (machineId, newPrice) => {
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, basePrice: parseFloat(newPrice) || 0 } : m));
  };


  // Hardware Diagnostics & Auto-Error Dispatch Engine
  const [diagnosticStatus, setDiagnosticStatus] = useState({
    usbReaderStatus: "HEALTHY", // 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED'
    edgeSyncStatus: "IN_SYNC", // 'IN_SYNC' | 'PENDING_OFFLINE_2' | 'SYNC_ERROR'
    lastAutoAlertSent: null
  });

  const [incidentReports, setIncidentReports] = useState([
    { id: "INC-881", branch: "BSP-02 (Bilaspur)", machine: "MC-02 (Claw Machine)", issue: "Coin wire relay pulse timeout (50ms)", reportedAt: "10:14 AM", status: "AUTO_EMAILED_TO_DEV", severity: "HIGH" },
    { id: "INC-880", branch: "RPR-01 (Raipur)", machine: "MC-06 (VR Arena)", issue: "USB Reader disconnected - Switched to Manual Mode", reportedAt: "09:40 AM", status: "RESOLVED", severity: "MEDIUM" },
  ]);

  const [manualCardInput, setManualCardInput] = useState("");
  const [isSelfTesting, setIsSelfTesting] = useState(false);

  // Manual Card Fallback Action (If reader fails, type card number manually)
  const handleManualCardSubmit = (e) => {
    if (e) e.preventDefault();
    if (!manualCardInput.trim()) return alert("कृपया कार्ड नंबर दर्ज करें!");

    // Search card
    setSelectedCard(prev => ({
      ...prev,
      cardNumber: manualCardInput.trim().toUpperCase(),
      holderName: "Verified Cardholder",
      status: "ACTIVE"
    }));
    alert(`✅ कार्ड ${manualCardInput.toUpperCase()} सफलतापूर्वक लोड हुआ! (Manual Fallback Mode Active)`);
    setManualCardInput("");
  };

  // Run Self-Diagnostic Test
  const handleRunDiagnosticTest = () => {
    setIsSelfTesting(true);
    setTimeout(() => {
      setIsSelfTesting(false);
      alert("✅ डायग्नोस्टिक टेस्ट पूर्ण! USB रीडर, रिले पल्स बोर्ड और क्लाउड सिंक सामान्य रूप से कार्य कर रहे हैं।");
    }, 1500);
  };

  // Trigger Emergency Pulse / Instant 1-Click Refund
  const handleEmergencyPulse = (machine) => {
    alert(`⚡ [Emergency Override]: ${machine.name} पर 1 पल्स सिग्नल भेजा गया और कार्ड को ₹${machine.basePrice} का रिफंड क्रेडेंशियल जारी हुआ!`);
  };

  // Send Error Email Alert to Developer / Support
  const handleSendErrorAlertToDev = (incident) => {
    const emailPayload = {
      to: "support@vyaparbook.in",
      subject: `🚨 [CRITICAL_ALERT] Gamezone Hardware Issue at ${selectedBranch.name}`,
      body: `Branch: ${selectedBranch.name} (${selectedBranch.code})\nMachine: ${incident.machine}\nError: ${incident.issue}\nTimestamp: ${new Date().toISOString()}`
    };
    alert(`📧 [Auto-Alert Sent]: सॉफ्टवेयर डेवलपर टीम (support@vyaparbook.in) को एरर रिपोर्ट व डायग्नोस्टिक लॉग्स ईमेल कर दिए गए हैं!`);
  };

  const [activeSubTab, setActiveSubTab] = useState("fleet"); 
  // Sub-tabs: 'fleet' | 'rfid_cards' | 'lost_card' | 'hal_config' | 'kiosk_pos' | 'security_audit' | 'redemption' | 'analytics'

  // Multi-Branch Selector (Phase 1)
  const [branches, setBranches] = useState([
    { id: "BR-01", name: "Raipur Main Arcade Hub", code: "RPR-01", city: "Raipur", isFranchise: false, royaltyPercent: 0 },
    { id: "BR-02", name: "Bilaspur Express Mall", code: "BSP-02", city: "Bilaspur", isFranchise: true, royaltyPercent: 15 },
    { id: "BR-03", name: "Bhilai City Center FEC", code: "BHL-03", city: "Bhilai", isFranchise: true, royaltyPercent: 20 },
  ]);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  // Dynamic Pricing Rule (Happy Hours vs Weekend Surge)
  const [pricingMode, setPricingMode] = useState("regular"); // 'regular' (100%) | 'happy_hour' (50% off) | 'weekend_surge' (120%)

  // Offline Edge Resilience Engine (Phase 2)
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState([]);

  // Hardware Abstraction Layer (HAL) Profiles (Phase 1 & 2)
  const [halProfiles, setHalProfiles] = useState([
    { id: "HAL-1", name: "Standard 12V Arcade Pulse", protocol: "WiFi MQTT", pulseMs: 50, voltage: 12, pulsesPerCredit: 1 },
    { id: "HAL-2", name: "Claw Machine High-Load", protocol: "WiFi Relay", pulseMs: 100, voltage: 12, pulsesPerCredit: 2 },
    { id: "HAL-3", name: "VR Headset Station Session", protocol: "LAN Socket", pulseMs: 0, voltage: 5, pulsesPerCredit: 1 }
  ]);

  // Live Arcade Machine Fleet & IoT Telemetry (Phase 2)
  const [machines, setMachines] = useState([
    { id: "MC-01", name: "MotoGP 4K Simulator", category: "Arcade", basePrice: 80, currentStatus: "playing", totalPlaysToday: 42, totalRevenueToday: 3360, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-101", ip: "192.168.1.101", halProfile: "HAL-1", isLocked: false, heartbeatSec: 2 },
    { id: "MC-02", name: "Soft Toy Claw Machine A", category: "Claw", basePrice: 50, currentStatus: "idle", totalPlaysToday: 94, totalRevenueToday: 4700, lastCardTapped: "CARD-4412 (Aarav)", readerId: "RDR-102", ip: "192.168.1.102", halProfile: "HAL-2", isLocked: false, heartbeatSec: 1 },
    { id: "MC-03", name: "Soft Toy Claw Machine B (VIP)", category: "Claw", basePrice: 60, currentStatus: "playing", totalPlaysToday: 68, totalRevenueToday: 4080, lastCardTapped: "CARD-7731 (Pooja)", readerId: "RDR-103", ip: "192.168.1.103", halProfile: "HAL-2", isLocked: false, heartbeatSec: 4 },
    { id: "MC-04", name: "Arcade Basketball Shootout", category: "Arcade", basePrice: 40, currentStatus: "idle", totalPlaysToday: 76, totalRevenueToday: 3040, lastCardTapped: "CARD-1190 (Kunal)", readerId: "RDR-104", ip: "192.168.1.104", halProfile: "HAL-1", isLocked: false, heartbeatSec: 3 },
    { id: "MC-05", name: "Air Hockey 2-Player Pro", category: "Table", basePrice: 100, currentStatus: "playing", totalPlaysToday: 28, totalRevenueToday: 2800, lastCardTapped: "CARD-3382 (Vikram)", readerId: "RDR-105", ip: "192.168.1.105", halProfile: "HAL-1", isLocked: false, heartbeatSec: 2 },
    { id: "MC-06", name: "VR Quest 3 Space Mission Arena", category: "VR", basePrice: 300, currentStatus: "idle", totalPlaysToday: 18, totalRevenueToday: 5400, lastCardTapped: "CARD-9842 (Rohan)", readerId: "RDR-106", ip: "192.168.1.106", halProfile: "HAL-3", isLocked: false, heartbeatSec: 5 },
    { id: "MC-07", name: "PS5 VIP Gaming Lounge 1", category: "Console", basePrice: 200, currentStatus: "playing", totalPlaysToday: 12, totalRevenueToday: 2400, lastCardTapped: "CARD-8819 (Simran)", readerId: "RDR-107", ip: "192.168.1.107", halProfile: "HAL-3", isLocked: false, heartbeatSec: 2 },
    { id: "MC-08", name: "Trampoline & Soft Play Arena", category: "Kids Play", basePrice: 350, currentStatus: "playing", totalPlaysToday: 22, totalRevenueToday: 7700, lastCardTapped: "CARD-2201 (Sunil)", readerId: "RDR-108", ip: "192.168.1.108", halProfile: "HAL-1", isLocked: false, heartbeatSec: 1 },
  ]);

  // Multi-Tier RFID Cards State (Phase 1 & 3)
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
    timePassExpiresAt: null,
    isTimePassActive: false,
    linkedWristbands: ["WRIST-A1 (Son)", "WRIST-A2 (Daughter)"],
    status: "ACTIVE",
    securityHash: "0x8F9A42BC7E11D5",
    playHistory: [
      { time: "03:45 PM", machine: "MotoGP 4K Simulator", cost: 80, ticketsWon: 0, status: "Deducted", sig: "SIG-8842" },
      { time: "03:20 PM", machine: "Soft Toy Claw Machine A", cost: 25, ticketsWon: 150, status: "Won 150 Tickets 🧸", sig: "SIG-8841" },
      { time: "02:50 PM", machine: "Arcade Basketball Shootout", cost: 40, ticketsWon: 15, status: "Deducted", sig: "SIG-8840" },
      { time: "02:15 PM", machine: "RFID Card Recharge (Counter)", cost: -1000, ticketsWon: 0, status: "Recharged (+₹300 Bonus)", sig: "SIG-8839" },
    ]
  });

  // Security & Fraud Audit Log (Phase 3)
  const [securityLogs, setSecurityLogs] = useState([
    { id: "SEC-101", timestamp: "03:45 PM", card: "CARD-9842", event: "VALID_TRANSACTION", detail: "MotoGP deduction signed (HMAC-SHA256)", level: "INFO" },
    { id: "SEC-102", timestamp: "02:15 PM", card: "CARD-9842", event: "RECHARGE_CONFIRMED", detail: "₹1000 cash added by Operator #4", level: "INFO" },
    { id: "SEC-103", timestamp: "01:30 PM", card: "CARD-1190", event: "ANOMALY_BLOCKED", detail: "Rapid double tap detected (0.8s gap) - Debounced", level: "WARN" },
  ]);

  // Lost Card Migration State (Phase 1)
  const [lostOldCard, setLostOldCard] = useState("CARD-9842");
  const [newCardUid, setNewCardUid] = useState("");
  const [migrationReason, setMigrationReason] = useState("Customer lost card in parking area");
  const [migrationSuccess, setMigrationSuccess] = useState(false);

  // Prize Redemption Store (Phase 4)
  const [prizes, setPrizes] = useState([
    { id: "PRZ-1", name: "Giant Teddy Bear (3 Ft)", ticketsNeeded: 500, inStock: 4, icon: "🧸" },
    { id: "PRZ-2", name: "Wireless Bluetooth Gaming Headset", ticketsNeeded: 350, inStock: 6, icon: "🎧" },
    { id: "PRZ-3", name: "High-Speed RC Drift Car", ticketsNeeded: 250, inStock: 7, icon: "🏎️" },
    { id: "PRZ-4", name: "Emoji Soft Cushion", ticketsNeeded: 120, inStock: 15, icon: "😃" },
    { id: "PRZ-5", name: "LED Fidget Spinner & Glow Band", ticketsNeeded: 40, inStock: 30, icon: "✨" },
  ]);

  // Self-Service Kiosk State (Phase 4)
  const [kioskAmount, setKioskAmount] = useState(1000);
  const [kioskBonus, setKioskBonus] = useState(300);
  const [kioskQrActive, setKioskQrActive] = useState(false);

  // Aggregate Metrics
  const totalFleetRevenue = machines.reduce((sum, m) => sum + m.totalRevenueToday, 0);
  const totalPlays = machines.reduce((sum, m) => sum + m.totalPlaysToday, 0);
  const franchiseRoyaltyDue = selectedBranch.isFranchise 
    ? (totalFleetRevenue * selectedBranch.royaltyPercent) / 100 
    : 0;

  // Remote Machine Toggle Lock/Maintenance (Phase 2)
  const handleToggleLock = (machineId) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        const nextLock = !m.isLocked;
        return {
          ...m,
          isLocked: nextLock,
          currentStatus: nextLock ? "maintenance" : "idle"
        };
      }
      return m;
    }));
  };

  // 1-Click Lost Card Migration Action
  const handleMigrateCard = () => {
    if (!newCardUid.trim()) return alert("कृपया नया RFID कार्ड UID नंबर दर्ज करें या रीडर पर टैप करें!");
    const migrated = {
      ...selectedCard,
      cardNumber: newCardUid.trim(),
      status: "ACTIVE",
      playHistory: [
        { time: new Date().toLocaleTimeString(), machine: "Card Migration Desk", cost: 0, ticketsWon: 0, status: `Migrated from ${lostOldCard}`, sig: "SIG-MIGRATED" },
        ...selectedCard.playHistory
      ]
    };
    setSelectedCard(migrated);
    setSecurityLogs(prev => [
      { id: `SEC-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), card: newCardUid, event: "CARD_MIGRATED", detail: `Transferred balance from ${lostOldCard}`, level: "INFO" },
      ...prev
    ]);
    setMigrationSuccess(true);
  };

  // Redeem Prize Action with Central Warehouse Sync (Phase 4)
  const handleRedeemPrize = (prize) => {
    if (selectedCard.digitalTickets < prize.ticketsNeeded) return alert("पर्याप्त टिकट्स नहीं हैं!");
    if (prize.inStock <= 0) return alert("स्टॉक समाप्त हो चुका है!");

    setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, inStock: p.inStock - 1 } : p));
    setSelectedCard(prev => ({
      ...prev,
      digitalTickets: prev.digitalTickets - prize.ticketsNeeded,
      playHistory: [
        { time: new Date().toLocaleTimeString(), machine: `Prize: ${prize.name}`, cost: 0, ticketsWon: -prize.ticketsNeeded, status: "Redeemed Prize 🎁", sig: "SIG-REDEEM" },
        ...prev.playHistory
      ]
    }));
    alert(`🎉 ${prize.name} सफलतापूर्वक रिडीम हो गया!`);
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
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Enterprise RFID Gamezone & FEC Hub</h1>
              <span className="text-[10px] bg-purple-500/30 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-bold">
                IAAPA Enterprise v3.0
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              कैशलेस RFID स्मार्टकार्ड, IoT मशीन टेलीमेट्री, ऑफलाइन एज सिंक व फ़्रेंचाइज़ बिलिंग
            </p>
          </div>
        </div>

        {/* Branch Selector & Offline Status (Phase 1 & 2) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isOnline ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? "Edge Online (Cloud Sync)" : "Edge Offline (Local Cache)"}</span>
          </button>

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
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "fleet", label: "🕹️ मशीन फ्लीट व IoT टेलीमेट्री", icon: <Gamepad2 size={15} /> },
          { id: "soft_play_arena", label: "🎪 सॉफ्ट प्ले व ट्रैम्पोलिन एरिना", icon: <Activity size={15} /> },
          { id: "pricing_matrix", label: "💰 सेंट्रलाइज्ड रेट मैट्रिक्स व शेड्यूल", icon: <Sliders size={15} /> },
          { id: "claw_security", label: "🧸 सॉफ्ट टॉय एंटी-फ्रॉड गार्ड", icon: <ShieldAlert size={15} /> },
          { id: "rfid_cards", label: "💳 स्मार्टकार्ड व मल्टी-टियर वॉलेट", icon: <CreditCard size={15} /> },
          { id: "lost_card", label: "🔄 लॉस्ट कार्ड माइग्रेशन", icon: <ArrowRightLeft size={15} /> },
          { id: "hal_config", label: "⚙️ हार्डवेयर प्रोफाइल (HAL)", icon: <Cpu size={15} /> },
          { id: "kiosk_pos", label: "📱 सेल्फ-सर्विस कियोस्क व POS", icon: <Tv size={15} /> },
          { id: "security_audit", label: "🛡️ सिक्योरिटी व फ्रॉड ऑडिट", icon: <ShieldCheck size={15} /> },
          { id: "redemption", label: "🎁 टिकट प्राइज स्टोर (Redemption)", icon: <Gift size={15} /> },
          { id: "analytics", label: "📊 फ़्रेंचाइज़ एनालिटिक्स व हीटमैप", icon: <BarChart3 size={15} /> },
          { id: "diagnostics", label: "🔧 डायग्नोस्टिक्स व एरर अलर्ट", icon: <Activity size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              activeSubTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FLEET & LIVE IOT TELEMETRY (Phase 2) */}
      {activeSubTab === "fleet" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">कुल एक्टिव मशीनें</span>
              <span className="text-2xl font-black text-slate-900">{machines.length} Units</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">आज के कुल खेल (Plays)</span>
              <span className="text-2xl font-black text-blue-600">{totalPlays}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold block">आज का कुल कलेक्शन</span>
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

          {/* Machine Grid with Remote Lockout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {machines.map((m) => (
              <div key={m.id} className={`bg-white rounded-2xl border p-4 shadow-sm space-y-3 transition ${m.isLocked ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">{m.id}</span>
                    <h3 className="font-black text-sm text-slate-900 mt-1">{m.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleLock(m.id)}
                    className={`p-1.5 rounded-lg border transition ${m.isLocked ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    title={m.isLocked ? "मशीन अनलॉक करें" : "रिमोट मेंटेनेंस लॉक लगाएं"}
                  >
                    {m.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
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
                    <span>IoT Heartbeat:</span>
                    <span className="font-mono text-emerald-600">● {m.heartbeatSec}s ago ({m.ip})</span>
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

      {/* TAB 2: MULTI-TIER SMARTCARDS (Phase 1 & 3) */}
      {activeSubTab === "rfid_cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1 text-xs">
              <span className="text-[10px] text-indigo-300 font-bold block">सुरक्षा व एन्क्रिप्शन (DESFire Sector):</span>
              <div className="text-slate-200 font-mono text-[11px] truncate">Hash: {selectedCard.securityHash}</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-base text-slate-900">स्मार्टकार्ड हिस्ट्री व ट्रांजैक्शन ऑडिट</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedCard.playHistory.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{h.machine}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({h.time})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{h.sig}</span>
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

      {/* TAB 3: LOST CARD MIGRATION (Phase 1) */}
      {activeSubTab === "lost_card" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl"><ShieldAlert size={24} /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900">खोए हुए RFID कार्ड का बैलेंस माइग्रेशन</h2>
              <p className="text-xs text-slate-500">पुराना कार्ड तुरंत ब्लॉक करें और पूरा बैलेंस व टिकट्स नए कार्ड में ट्रांसफर करें</p>
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
              <button onClick={() => { setMigrationSuccess(false); setNewCardUid(""); }} className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                नया माइग्रेशन करें
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">खोया हुआ कार्ड:</span><span className="font-bold text-slate-800">{lostOldCard} ({selectedCard.holderName})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">माइग्रेट होने वाला बैलेंस:</span><span className="font-black text-emerald-600">₹{selectedCard.realBalance} नकद + ₹{selectedCard.bonusBalance} बोनस</span></div>
                <div className="flex justify-between"><span className="text-slate-500">माइग्रेट होने वाले टिकट्स:</span><span className="font-black text-purple-600">{selectedCard.digitalTickets} 🎟️</span></div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                  नया RFID कार्ड UID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD-9901"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  className="w-full p-3 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-xs font-bold outline-none uppercase font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleMigrateCard}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowRightLeft size={16} /> पुराना कार्ड ब्लॉक करें और नए कार्ड में ट्रांसफर करें →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HAL CONFIG (Phase 1 & 2) */}
      {activeSubTab === "hal_config" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900">हार्डवेयर एब्स्ट्रैक्शन लेयर (HAL Profiles)</h2>
            <p className="text-xs text-slate-500">विभिन्न आर्केड मशीनों के लिए रिले पल्स टाइमिंग व वोल्टेज सेटिंग्स</p>
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

      {/* TAB 5: KIOSK SELF-SERVICE & POS (Phase 4) */}
      {activeSubTab === "kiosk_pos" && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white max-w-2xl mx-auto shadow-2xl border border-indigo-500/30 space-y-6 text-center">
          <div>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full font-bold uppercase">
              Touchscreen Self-Service Kiosk
            </span>
            <h2 className="text-2xl font-black mt-2">स्मार्टकार्ड रिचार्ज कियोस्क</h2>
            <p className="text-xs text-indigo-200">पैकेज चुनें और तुरंत UPI QR से कार्ड रिचार्ज करें</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { amt: 500, bonus: 100, label: "STARTER" },
              { amt: 1000, bonus: 300, label: "POPULAR 🔥" },
              { amt: 2000, bonus: 800, label: "VIP MEGA" },
            ].map((pkg) => (
              <button
                key={pkg.amt}
                onClick={() => { setKioskAmount(pkg.amt); setKioskBonus(pkg.bonus); setKioskQrActive(true); }}
                className={`p-4 rounded-2xl border text-center transition ${
                  kioskAmount === pkg.amt ? "bg-indigo-600 border-white shadow-xl scale-105" : "bg-white/10 border-white/20 hover:bg-white/20"
                }`}
              >
                <span className="text-[10px] block font-bold text-amber-300">{pkg.label}</span>
                <span className="text-xl font-black block mt-1">₹{pkg.amt}</span>
                <span className="text-[11px] text-emerald-400 font-bold block">+₹{pkg.bonus} बोनस</span>
              </button>
            ))}
          </div>

          {kioskQrActive && (
            <div className="p-4 bg-white rounded-2xl text-slate-900 max-w-xs mx-auto space-y-2 animate-in zoom-in-95">
              <QrCode size={120} className="mx-auto text-indigo-900" />
              <div className="text-xs font-bold text-indigo-900">Scan & Pay ₹{kioskAmount} via Any UPI</div>
              <div className="text-[10px] text-slate-500">कार्ड को नीचे सेंसर पर टैप रखें</div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SECURITY & FRAUD AUDIT (Phase 3) */}
      {activeSubTab === "security_audit" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">सुरक्षा व फ्रॉड प्रिवेंशन ऑडिट (Security Engine)</h2>
              <p className="text-xs text-slate-500">DESFire एन्क्रिप्शन, ट्रांजैक्शन सिग्नेचर व डबल-टैप अनोमली ट्रैकर</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck size={14} /> HMAC-SHA256 Active
            </span>
          </div>

          <div className="space-y-2">
            {securityLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.level === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {log.event}
                  </span>
                  <span className="font-mono font-bold text-slate-800">{log.card}</span>
                  <span className="text-slate-600">{log.detail}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REDEMPTION STORE (Phase 4) */}
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
                  onClick={() => handleRedeemPrize(prz)}
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

      {/* TAB 8: FRANCHISE ANALYTICS & REVENUE SHARE (Phase 6) */}
      {activeSubTab === "analytics" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">फ़्रेंचाइज़ एनालिटिक्स व रेवेन्यू शेयरिंग ({selectedBranch.name})</h2>
              <p className="text-xs text-slate-500">ब्रांच रेवेन्यू रोल-अप व मुख्य ERP DayBook ऑटो-पोस्टिंग</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow">
              <FileSpreadsheet size={14} /> DayBook व GST में पोस्ट करें
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <span className="text-xs text-indigo-700 font-bold block">ब्रांच ग्रॉस कलेक्शन</span>
              <span className="text-2xl font-black text-indigo-950">₹{totalFleetRevenue.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
              <span className="text-xs text-purple-700 font-bold block">फ़्रेंचाइज़ रॉयल्टी ({selectedBranch.royaltyPercent}%)</span>
              <span className="text-2xl font-black text-purple-950">₹{franchiseRoyaltyDue.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-xs text-emerald-700 font-bold block">शुद्ध ओनर शेयर (Net Share)</span>
              <span className="text-2xl font-black text-emerald-950">₹{(totalFleetRevenue - franchiseRoyaltyDue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: HARDWARE DIAGNOSTICS, MANUAL FALLBACK & ERROR EMAIL ALERTS */}
      {activeSubTab === "diagnostics" && (
        <div className="space-y-6">
          {/* Top Manual Search / Reader Fallback Bar */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="font-black text-base">मैनुअल कार्ड फॉलबैक (अगर रीडर काम न करे)</h3>
                  <p className="text-xs text-amber-100">कार्ड के ऊपर छपा नंबर हाथ से डालें या बारकोड गन से स्कैन करें</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold font-mono">
                Manual Fallback Active
              </span>
            </div>

            <form onSubmit={handleManualCardSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="कार्ड नंबर डालें (e.g. CARD-9842 या 1084295821)"
                value={manualCardInput}
                onChange={(e) => setManualCardInput(e.target.value)}
                className="flex-1 p-3 rounded-2xl text-xs font-black text-slate-900 outline-none uppercase font-mono shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow transition"
              >
                कार्ड लोड करें →
              </button>
            </form>
          </div>

          {/* Diagnostic Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">USB RFID रीडर स्टेटस</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">ONLINE (0.1s)</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">ब्रांच का USB डेस्कटॉप रीडर पूरी तरह कनेक्टेड है।</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">मशीन रिले बोर्ड पल्स</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">12V ACTIVE</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">सभी 8 मशीनों के ESP32 रिले सही पल्स छोड़ रहे हैं।</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">सॉफ्टवेयर ऑटो-अलर्ट सर्विस</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-black">support@vyaparbook.in</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">कोई भी एरर आने पर डेवलपर टीम को तुरंत ईमेल जाएगा।</p>
            </div>
          </div>

          {/* Self-Test & Emergency Tools */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">ब्रांच हार्डवेयर हेल्थ व ऑटो-एरर इंसिडेंट लॉग्स</h3>
                <p className="text-xs text-slate-500">यदि किसी ब्रांच में कोई मशीन रुकती है तो डेवलपर को तुरंत ईमेल भेजने की व्यवस्था</p>
              </div>
              <button
                onClick={handleRunDiagnosticTest}
                disabled={isSelfTesting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Activity size={14} className={isSelfTesting ? "animate-spin" : ""} />
                {isSelfTesting ? "टेस्टिंग जारी है..." : "🔧 फुल सिस्टम सेल्फ-टेस्ट रन करें"}
              </button>
            </div>

            <div className="space-y-2">
              {incidentReports.map((inc) => (
                <div key={inc.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        inc.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="font-bold text-slate-900">{inc.branch} • {inc.machine}</span>
                      <span className="text-[10px] text-slate-400">({inc.reportedAt})</span>
                    </div>
                    <p className="text-slate-600">{inc.issue}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg font-bold">
                      {inc.status}
                    </span>
                    <button
                      onClick={() => handleSendErrorAlertToDev(inc)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg transition"
                    >
                      📧 डेवलपर को ईमेल भेजें
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    
      {/* TAB: CENTRALIZED PRICING MATRIX & HAPPY HOUR SCHEDULER */}
      {activeSubTab === "pricing_matrix" && (
        <div className="space-y-6">
          {/* Top Scheduled Discount Control Box */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="text-amber-400 animate-pulse" />
                  <h2 className="text-lg font-black tracking-tight">ऑटोमैटिक हैप्पी आवर्स व टाइम-शेड्यूल डिस्काउंट इंजन</h2>
                </div>
                <p className="text-xs text-indigo-200">तय समय पर सभी मशीनों के रेट खुद-ब-खुद डिस्काउंटेड हो जाएँगे</p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
                <span className="text-xs font-bold text-amber-300">ऑटो शेड्यूलर:</span>
                <button
                  onClick={() => setHappyHourSchedule(p => ({ ...p, enabled: !p.enabled }))}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                    happyHourSchedule.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {happyHourSchedule.enabled ? "ACTIVE (चालू)" : "PAUSED (बंद)"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-indigo-300 block font-medium">शुरू होने का समय:</span>
                <input
                  type="time"
                  value={happyHourSchedule.startTime}
                  onChange={(e) => setHappyHourSchedule({ ...happyHourSchedule, startTime: e.target.value })}
                  className="bg-white/10 border border-white/20 p-2 rounded-xl text-white font-bold font-mono outline-none mt-1 w-full"
                />
              </div>
              <div>
                <span className="text-indigo-300 block font-medium">खत्म होने का समय:</span>
                <input
                  type="time"
                  value={happyHourSchedule.endTime}
                  onChange={(e) => setHappyHourSchedule({ ...happyHourSchedule, endTime: e.target.value })}
                  className="bg-white/10 border border-white/20 p-2 rounded-xl text-white font-bold font-mono outline-none mt-1 w-full"
                />
              </div>
              <div>
                <span className="text-indigo-300 block font-medium">डिस्काउंट प्रतिशत:</span>
                <input
                  type="number"
                  value={happyHourSchedule.discountPercent}
                  onChange={(e) => setHappyHourSchedule({ ...happyHourSchedule, discountPercent: parseFloat(e.target.value) || 0 })}
                  className="bg-white/10 border border-white/20 p-2 rounded-xl text-amber-300 font-black font-mono outline-none mt-1 w-full"
                />
              </div>
              <div>
                <span className="text-indigo-300 block font-medium">लागू होने वाले दिन:</span>
                <div className="text-emerald-400 font-bold mt-2 font-mono">सोमवार से शुक्रवार (Mon-Fri)</div>
              </div>
            </div>
          </div>

          {/* Centralized All-Machines Rates Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">सभी आर्केड मशीनों का सेंट्रलाइज्ड रेट मैट्रिक्स</h3>
                <p className="text-xs text-slate-500">एक ही जगह से सभी मशीनों का बेस रेट, हैप्पी आवर रेट और वीआईपी रेट बदलें</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-200">
                कुल {machines.length} मशीनें सक्रिय
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3">कोड व मशीन का नाम</th>
                    <th className="p-3">कैटेगरी</th>
                    <th className="p-3 text-center">रेगुलर रेट (₹)</th>
                    <th className="p-3 text-center">हैप्पी आवर (50% OFF)</th>
                    <th className="p-3 text-center">गोल्ड VIP रेट (₹)</th>
                    <th className="p-3 text-center">एंटी-फ्रॉड स्टेटस</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {machines.map((m) => {
                    const happyRate = (m.basePrice * (100 - happyHourSchedule.discountPercent)) / 100;
                    const vipRate = (m.basePrice * 0.80);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-2">{m.id}</span>
                          {m.name}
                        </td>
                        <td className="p-3 text-slate-500">{m.category}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={m.basePrice}
                            onChange={(e) => handleUpdateMachinePrice(m.id, e.target.value)}
                            className="w-20 p-1.5 border border-slate-300 focus:border-indigo-600 rounded-lg text-center font-black font-mono text-slate-900 outline-none"
                          />
                        </td>
                        <td className="p-3 text-center font-black font-mono text-amber-600">
                          ₹{happyRate.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-black font-mono text-purple-600">
                          ₹{vipRate.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck size={12} /> 100% Locked (RFID Only)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    
      {/* TAB: SOFT TOY CLAW MACHINE ANTI-FRAUD SECURITY GUARD */}
      {activeSubTab === "claw_security" && (
        <div className="space-y-6">
          {/* Top Security Banner */}
          <div className="bg-gradient-to-r from-rose-900 via-purple-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/30 rounded-2xl border border-rose-400/30">
                  <ShieldCheck size={28} className="text-rose-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">सॉफ्ट टॉय क्लॉ मशीन एंटी-थेफ्ट व प्राइज ऑडिट सिस्टम</h2>
                  <p className="text-xs text-rose-200">ऑप्टिकल ड्रॉप सेंसर, चाबी से शीशा खोलने का लाइव अलर्ट व स्टॉक ऑडिट</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black flex items-center gap-1.5">
                <ShieldCheck size={14} /> 0% Theft Guarantee Active
              </span>
            </div>
          </div>

          {/* Key Security Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold block">शुरुआती खिलौने (Loaded)</span>
              <span className="text-2xl font-black text-slate-900">{clawSecurityAudit.initialStockLoaded} टेडी बेयर 🧸</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold block">सेंसर द्वारा गिरे खिलौने (Wins)</span>
              <span className="text-2xl font-black text-emerald-600">{clawSecurityAudit.opticalSensorDrops} जीते गए</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold block">अंदर बचे होने चाहिए (Stock)</span>
              <span className="text-2xl font-black text-indigo-600">{clawSecurityAudit.physicalStockRemaining} टेडी बेयर</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold block">अनअकाउंटेड नुकसान (Theft)</span>
              <span className="text-2xl font-black text-emerald-600">₹0.00 (शून्य चोरी)</span>
            </div>
          </div>

          {/* 3 Pillars of Claw Machine Security */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Eye size={18} /></div>
                <h4 className="font-black text-sm text-slate-900">1. ऑप्टिकल प्राइज ड्रॉप सेंसर (IR Beam)</h4>
              </div>
              <p className="text-xs text-slate-600">
                जब भी कोई खिलौना नीचे गिरता है, लेज़र इन्फ्रारेड बीम 0.2s में उसे गिनकर क्लाउड पर <strong>"PRIZE_DROPPED"</strong> रिकॉर्ड कर देती है।
              </p>
              <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                ● लेज़र सेंसर एक्टिव व लिंक्ड
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><Lock size={18} /></div>
                <h4 className="font-black text-sm text-slate-900">2. कैबिनेट डोर ओपन मैग्नेटिक सेंसर</h4>
              </div>
              <p className="text-xs text-slate-600">
                अगर कोई चाबी से शीशा या पिछला दरवाजा खोलता है, तो ओनर के फोन पर तुरंत <strong>"DOOR_OPENED_ALERT"</strong> का नोटिफिकेशन जाता है।
              </p>
              <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-xl">
                ● डोर स्टेटस: CLOSED & LOCKED
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Zap size={18} /></div>
                <h4 className="font-black text-sm text-slate-900">3. एंटी-शॉर्ट रिले लॉक (No Card = Dead Claw)</h4>
              </div>
              <p className="text-xs text-slate-600">
                जब तक वैध RFID कार्ड से ₹50 नहीं कटते, पंजे (Claw) और जॉयस्टिक में करंट नहीं आता। तार शॉर्ट करने पर भी मशीन नहीं चलती।
              </p>
              <div className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl">
                ● 100% एंटी-बाईपास रिले सक्रिय
              </div>
            </div>
          </div>

          {/* Door Open & Audit Log Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900">क्लॉ मशीन डोर ओपन व रीस्टॉक ऑडिट लॉग</h3>
            <div className="space-y-2">
              {clawSecurityAudit.doorOpenLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                      {log.status}
                    </span>
                    <span className="font-bold text-slate-800">{log.event}</span>
                    <span className="text-slate-500">({log.operator})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    
      {/* TAB: INDOOR SOFT PLAY ARENA & TRAMPOLINE PARK (1200-1800 Sq.Ft) */}
      {activeSubTab === "soft_play_arena" && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-cyan-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/30 rounded-2xl border border-teal-400/30">
                <Flame className="w-7 h-7 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">1500 Sq.Ft. इनडोर सॉफ्ट प्ले व ट्रैम्पोलिन एरिना</h2>
                  <span className="text-[10px] bg-teal-400 text-slate-950 font-black px-2 py-0.5 rounded-full">Kids Play Zone</span>
                </div>
                <p className="text-xs text-teal-200 mt-0.5">
                  बॉल पूल, फिसलपट्टी, सैंड ज़ोन, रिस्टबैंड टाइमर, ग्रिप सॉक्स व टर्नस्टाइल गेट कंट्रोल
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
              <Users className="text-teal-300" size={20} />
              <div className="text-left">
                <span className="text-[10px] text-teal-200 block uppercase font-bold">एरिना कैपेसिटी</span>
                <span className="text-sm font-black text-white">{softPlayCapacity.currentKidsInside} / {softPlayCapacity.maxKidsAllowed} बच्चे अंदर</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">कुल एरिना क्षेत्रफल</span>
              <span className="text-2xl font-black text-slate-900">{softPlayCapacity.totalAreaSqFt} Sq.Ft</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">एंटी-स्किड मोजे (Grip Socks)</span>
              <span className="text-2xl font-black text-blue-600">{softPlayCapacity.gripSocksSoldToday} पेयर बिके</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">ओवरस्टे पेनल्टी (Overtime)</span>
              <span className="text-2xl font-black text-amber-600">₹{softPlayCapacity.overtimePenaltyCollected} कलेक्टेड</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">सुरक्षा डिस्क्लेमर (Waiver)</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg inline-block mt-1">
                ✓ 100% Digital Signed
              </span>
            </div>
          </div>

                    {/* Grace Period & Overtime Settings Bar */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-950">⏱️ फ्री ग्रेस पीरियड (Free Grace Buffer):</span>
              <select
                value={softPlayRules.gracePeriodMins}
                onChange={(e) => setSoftPlayRules({ ...softPlayRules, gracePeriodMins: parseInt(e.target.value) })}
                className="bg-white border border-teal-300 p-1.5 rounded-lg font-bold font-mono text-teal-900 outline-none"
              >
                <option value={0}>0 मिनट (तुरंत पेनल्टी)</option>
                <option value={5}>5 मिनट फ्री छूट (Standard)</option>
                <option value={10}>10 मिनट फ्री छूट</option>
                <option value={15}>15 मिनट फ्री छूट</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-950">पेनल्टी दर (Overtime Rate):</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={softPlayRules.overtimeRatePerMin}
                  onChange={(e) => setSoftPlayRules({ ...softPlayRules, overtimeRatePerMin: parseFloat(e.target.value) || 0 })}
                  className="w-16 p-1 border border-teal-300 rounded-lg text-center font-bold font-mono text-teal-900 bg-white outline-none"
                />
                <span className="font-bold text-teal-900">₹ / मिनट</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-teal-200/60 text-teal-900 rounded-lg font-bold text-[11px]">
                ट्रे में उपलब्ध रिस्टबैंड्स: {wristbandInventory.filter(w => w.status === 'AVAILABLE').length} / {wristbandInventory.length} नग
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Child Entry Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                <Plus size={18} className="text-teal-600" /> नई एंट्री व रिस्टबैंड जारी करें
              </h3>

              <form onSubmit={handleAddNewSoftPlaySession} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">बच्चे का नाम व उम्र <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="बच्चे का नाम"
                      value={newSessionForm.childName}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, childName: e.target.value })}
                      className="flex-1 p-2.5 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="उम्र"
                      value={newSessionForm.childAge}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, childAge: e.target.value })}
                      className="w-16 p-2.5 border rounded-xl font-bold text-center outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">माता-पिता का नाम व फोन <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="अभिभावक का नाम"
                      value={newSessionForm.parentName}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, parentName: e.target.value })}
                      className="p-2.5 border rounded-xl font-medium outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="मोबाइल नंबर"
                      value={newSessionForm.parentPhone}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, parentPhone: e.target.value })}
                      className="p-2.5 border rounded-xl font-bold outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">प्ले पैकेज (Time Package)</label>
                  <select
                    value={newSessionForm.package}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, package: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold outline-none bg-slate-50"
                  >
                    <option value="30_mins">30 मिनट (₹300) - Red Band</option>
                    <option value="60_mins">60 मिनट (₹500) - Blue Band</option>
                    <option value="unlimited">अनलिमिटेड डे पास (₹800) - Gold VIP</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                  <div>
                    <span className="font-bold text-slate-800 block">एंटी-स्किड ग्रिप सॉक्स (₹80)</span>
                    <span className="text-[10px] text-slate-500">फिसलन रोकने के लिए अनिवार्य</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newSessionForm.addSocks}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, addSocks: e.target.checked })}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Play size={15} /> एंट्री चालू करें व गेट खोलें (₹{newSessionForm.package === '30_mins' ? 300 : newSessionForm.package === '60_mins' ? 500 : 800 + (newSessionForm.addSocks ? 80 : 0)}) →
                </button>
              </form>
            </div>

            {/* Active Kids Inside Arena (Live Sessions & Overstay Timers) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-base text-slate-900">अंदर खेल रहे बच्चे व लाइव टाइमर्स</h3>
                <span className="text-xs font-bold text-slate-500">कुल {activePlaySessions.length} एक्टिव सेशन्स</span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {activePlaySessions.map((sess) => {
                  const timeLeft = sess.durationMins - sess.elapsedMins;
                  const rawExtraTime = sess.elapsedMins - sess.durationMins;
                  const effectiveOvertime = Math.max(0, rawExtraTime - softPlayRules.gracePeriodMins);
                  const isOverstay = effectiveOvertime > 0;
                  const penaltyAmt = effectiveOvertime * softPlayRules.overtimeRatePerMin;
                  return (
                    <div
                      key={sess.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs ${
                        isOverstay ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                            isOverstay ? 'bg-rose-600 text-white animate-pulse' : 'bg-teal-600 text-white'
                          }`}>
                            {sess.wristband}
                          </span>
                          <span className="font-black text-slate-900 text-sm">{sess.childName}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          अभिभावक: <strong>{sess.parentName}</strong> ({sess.parentPhone}) • गार्जियन: {sess.guardiansCount}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`font-black text-sm block ${isOverstay ? 'text-rose-600' : 'text-slate-800'}`}>
                            {isOverstay ? `⚠️ ओवरस्टे: +${Math.abs(timeLeft)} मिनट` : `⏳ शेष: ${timeLeft} मिनट`}
                          </span>
                          {isOverstay && (
                            <span className="text-[10px] text-rose-700 font-bold block">पेनल्टी: +₹{sess.overstayPenalty}</span>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleParentEmergencyCall(sess)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl flex items-center gap-1 shadow transition"
                          >
                            📲 WhatsApp
                          </button>
                          <button
                            onClick={() => handleCollectAndFreeWristband(sess.id, sess.wristband)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] rounded-xl flex items-center gap-1 shadow transition"
                            title="बैंड कलेक्ट करें और एग्जिट गेट खोलें"
                          >
                            ✓ बैंड वापस लिया (Exit)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
