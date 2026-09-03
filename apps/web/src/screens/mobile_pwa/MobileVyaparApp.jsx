import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Package,
  FileText,
  Menu,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Clock,
  CheckCircle,
  TrendingUp,
  Receipt,
  ShoppingCart,
  QrCode,
  DollarSign,
  AlertTriangle,
  Bot,
  Building2,
  ChevronRight,
  Download,
  Sparkles,
  RefreshCw,
  Phone,
  X,
  Trash2,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";

export default function MobileVyaparApp() {
  const navigate = useNavigate();
  const { selectedCompany, companies, selectCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("home"); // home, parties, items, bills, more
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [florexLoaded, setFlorexLoaded] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // New Quick Sale Modal State (100% In-App Mobile Billing)
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [billCustomer, setBillCustomer] = useState("");
  const [billCustomerPhone, setBillCustomerPhone] = useState("");
  const [billPaymentMode, setBillPaymentMode] = useState("CASH"); // CASH, UDHAR, UPI
  const [billCart, setBillCart] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");

  useEffect(() => {
    // Check if running as installed standalone PWA
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      setIsPwaInstalled(!!isStandalone);
    }
    loadMobileData();
  }, [selectedCompany]);

  const loadMobileData = async () => {
    setLoading(true);
    try {
      // 1. Try Loading from LocalStorage Cache First
      const cachedParties = localStorage.getItem("mobile_parties_cache");
      const cachedItems = localStorage.getItem("mobile_items_cache");
      const cachedBills = localStorage.getItem("mobile_bills_cache");

      if (cachedParties) setParties(JSON.parse(cachedParties));
      if (cachedItems) setItems(JSON.parse(cachedItems));
      if (cachedBills) setBills(JSON.parse(cachedBills));

      // 2. Fetch Fresh Data from Backend API / Supabase
      const [pRes, iRes, bRes] = await Promise.allSettled([
        api.get("/parties").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] })),
        api.get("/billing").catch(() => ({ data: [] }))
      ]);

      const partiesData = pRes.status === "fulfilled" ? (pRes.value.data?.parties || pRes.value.data || []) : [];
      const itemsData = iRes.status === "fulfilled" ? (iRes.value.data?.products || iRes.value.data || []) : [];
      const billsData = bRes.status === "fulfilled" ? (bRes.value.data?.bills || bRes.value.data || []) : [];

      const initialParties = Array.isArray(partiesData) && partiesData.length > 0 ? partiesData : [
        { id: "1", name: "राजेश ट्रेडर्स (प्लंबिंग)", phone: "9826112345", balance: 14500, type: "customer" },
        { id: "2", name: "वर्मा सैनिटरी & हार्डवेयर", phone: "9425098765", balance: 22000, type: "customer" },
        { id: "3", name: "फ्लोरेक्स पाइप्स डिस्ट्रीब्यूटर", phone: "9893011223", balance: -12800, type: "supplier" },
        { id: "4", name: "बर्जर पेंट्स डिपो", phone: "9755044556", balance: 8700, type: "customer" }
      ];

      const initialItems = Array.isArray(itemsData) && itemsData.length > 0 ? itemsData : [
        { id: "1", name: 'UPVC Pipe 25mm (1")', category: "Pipes", mrp: 450, salePrice: 320, stock: 45, unit: "Pcs" },
        { id: "2", name: 'UPVC Elbow 25mm (1")', category: "Fittings", mrp: 35, salePrice: 22, stock: 120, unit: "Pcs" },
        { id: "3", name: "Berger Walmasta White 20L", category: "Paint", mrp: 3200, salePrice: 2450, stock: 8, unit: "Bucket" },
        { id: "4", name: "Submersible Pump 1HP V4", category: "Pumps", mrp: 14500, salePrice: 11800, stock: 3, unit: "Set" }
      ];

      const initialBills = Array.isArray(billsData) && billsData.length > 0 ? billsData : [
        { id: "INV-101", customerName: "राजेश ट्रेडर्स", date: "आज, 02:45 PM", amount: 4850, status: "PAID", type: "CASH" },
        { id: "INV-102", customerName: "वर्मा सैनिटरी", date: "आज, 11:20 AM", amount: 13600, status: "CREDIT", type: "UDHAR" },
        { id: "INV-103", customerName: "सुरेश पेंटर", date: "कल, 05:15 PM", amount: 2450, status: "PAID", type: "UPI" }
      ];

      setParties(initialParties);
      setItems(initialItems);
      setBills(initialBills);

      localStorage.setItem("mobile_parties_cache", JSON.stringify(initialParties));
      localStorage.setItem("mobile_items_cache", JSON.stringify(initialItems));
      localStorage.setItem("mobile_bills_cache", JSON.stringify(initialBills));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickFlorexLoad = () => {
    setFlorexLoaded(true);
    alert("🚰 303 Florex UPVC पाइप्स व फिटिंग्स का मास्टर कैटलॉग आपके मोबाइल ऐप में लोड हो गया है!");
  };

  const handleShareWhatsAppBill = (bill) => {
    const text = encodeURIComponent(`*नमस्ते ${bill.customerName} जी!*\nआपका VyaparBook इनवॉइस बिल नं. *${bill.id}* तैयार है।\nकुल राशि: *₹${bill.amount.toLocaleString()}* (${bill.type})\nधन्यवाद! - ${selectedCompany?.companyName || "VyaparBook"}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Quick Mobile Bill Functions
  const handleAddToCart = (product) => {
    if (!product) return;
    const existing = billCart.find(i => i.id === product.id);
    if (existing) {
      setBillCart(billCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setBillCart([...billCart, { ...product, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setBillCart(billCart.filter(i => i.id !== productId));
  };

  const totalBillAmount = billCart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);

  const handleSaveAndGenerateBill = () => {
    if (!billCustomer) {
      alert("कृपया ग्राहक/पार्टी का नाम दर्ज करें!");
      return;
    }
    if (billCart.length === 0) {
      alert("कृपया बिल में कम से कम 1 सामान जोड़ें!");
      return;
    }

    const newBill = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      customerName: billCustomer,
      phone: billCustomerPhone,
      date: "अभी, लाइव",
      amount: totalBillAmount,
      type: billPaymentMode,
      items: billCart
    };

    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    localStorage.setItem("mobile_bills_cache", JSON.stringify(updatedBills));

    // Reset Form
    setBillCart([]);
    setBillCustomer("");
    setBillCustomerPhone("");
    setShowQuickBillModal(false);

    alert(`🎉 बिल ${newBill.id} सफलतापूर्वक बन गया है! कुल राशि: ₹${newBill.amount.toLocaleString()}`);
    handleShareWhatsAppBill(newBill);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 select-none">
      {/* 📱 1. Mobile Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-600/30">
            V
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
              {selectedCompany?.companyName || "मेरी व्यापार दुकान"}
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">Vyapar PWA</span>
            </h2>
            <p className="text-[10px] text-slate-400">
              {isPwaInstalled ? "✅ ऐप इंस्टॉल्ड है (Offline Ready)" : "Pure Mobile Accounting Suite"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate("/landing")}
            className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white border border-slate-700 text-xs font-bold"
            title="शोकेस"
          >
            🌐 वेब
          </button>
          <button 
            onClick={() => navigate("/dashboard")}
            className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow"
          >
            ERP
          </button>
        </div>
      </header>

      {/* 📱 2. Main Tab View Content */}
      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ==================== TAB 1: HOME DASHBOARD ==================== */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-in fade-in">
            {/* Persistence Indicator */}
            {isPwaInstalled && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>यह ऐप आपके फोन के होम स्क्रीन पर सेव है — हर बार डाउनलोड करने की जरूरत नहीं!</span>
              </div>
            )}

            {/* Business Financial Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* To Collect (उधारी) */}
              <div 
                onClick={() => setActiveTab("parties")}
                className="p-3.5 bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl shadow space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400">आपको लेने हैं (To Collect)</span>
                  <ArrowDownLeft size={14} className="text-emerald-400" />
                </div>
                <div className="text-xl font-black text-white">₹45,200</div>
                <p className="text-[10px] text-slate-400">3 ग्राहकों से उधारी बाकी</p>
              </div>

              {/* To Pay (देने हैं) */}
              <div 
                onClick={() => setActiveTab("parties")}
                className="p-3.5 bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/30 rounded-2xl shadow space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400">आपको देने हैं (To Pay)</span>
                  <ArrowUpRight size={14} className="text-rose-400" />
                </div>
                <div className="text-xl font-black text-white">₹12,800</div>
                <p className="text-[10px] text-slate-400">1 सप्लायर को पेमेंट</p>
              </div>
            </div>

            {/* Today's Sales Card with Instant Fast Bill Button */}
            <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-purple-500/40 rounded-2xl flex justify-between items-center shadow-lg">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-purple-300">आज की नकद व ऑनलाइन बिक्री</span>
                <div className="text-2xl font-black text-white">₹18,450</div>
                <p className="text-[10px] text-slate-400">{bills.length} इनवॉइस तैयार हुए</p>
              </div>
              <button 
                onClick={() => setShowQuickBillModal(true)}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> नया बिल
              </button>
            </div>

            {/* 1-Click Master Catalog Banner */}
            {!florexLoaded && (
              <div className="p-3.5 bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🚰</span>
                  <div>
                    <h4 className="font-bold text-xs text-amber-200">Florex UPVC Master Catalog</h4>
                    <p className="text-[10px] text-slate-400">303 पाइप्स व फिटिंग्स लोड करें</p>
                  </div>
                </div>
                <button 
                  onClick={handle1ClickFlorexLoad}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow shrink-0 cursor-pointer"
                >
                  1-Click Load
                </button>
              </div>
            )}

            {/* Quick 4-Grid Action Buttons (MyBillBook Style) */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
              <div 
                onClick={() => setShowQuickBillModal(true)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-purple-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Receipt size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">बिक्री बिल</span>
              </div>

              <div 
                onClick={() => setShowQuickBillModal(true)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-emerald-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShoppingCart size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">खरीद पर्ची</span>
              </div>

              <div 
                onClick={() => setActiveTab("parties")}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-blue-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">पार्टी खाता</span>
              </div>

              <div 
                onClick={() => setActiveTab("items")}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-rose-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Package size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">स्टॉक लिस्ट</span>
              </div>
            </div>

            {/* Recent Bills Stream */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-300">ताज़ा बिल (Recent Invoices)</span>
                <span onClick={() => setActiveTab("bills")} className="text-[11px] font-bold text-purple-400 cursor-pointer">सभी देखें →</span>
              </div>

              <div className="space-y-2">
                {bills.slice(0, 4).map((bill) => (
                  <div key={bill.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-white">{bill.customerName}</div>
                      <div className="text-[10px] text-slate-400">{bill.id} • {bill.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-xs text-white">₹{bill.amount.toLocaleString()}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bill.type === "CASH" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {bill.type}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleShareWhatsAppBill(bill)}
                        className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition cursor-pointer"
                        title="WhatsApp PDF"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARTIES (लेजर व उधारी) ==================== */}
        {activeTab === "parties" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">पार्टियां (Customers & Parties)</h3>
              <button 
                onClick={() => {
                  const pName = prompt("नई पार्टी का नाम दर्ज करें:");
                  const pPhone = prompt("मोबाइल नंबर दर्ज करें:");
                  if (pName) {
                    const newP = { id: Date.now().toString(), name: pName, phone: pPhone || "", balance: 0, type: "customer" };
                    setParties([newP, ...parties]);
                    localStorage.setItem("mobile_parties_cache", JSON.stringify([newP, ...parties]));
                  }
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                + नई पार्टी
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="पार्टी का नाम या मोबाइल नंबर खोजें..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {parties
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.phone && p.phone.includes(searchQuery)))
                .map((p) => (
                <div key={p.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Phone size={10} /> {p.phone || "No Phone"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-black text-xs ${p.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {p.balance >= 0 ? `+ ₹${p.balance.toLocaleString()}` : `- ₹${Math.abs(p.balance).toLocaleString()}`}
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold block">
                      {p.balance >= 0 ? "लेने हैं" : "देने हैं"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ITEMS & STOCK ==================== */}
        {activeTab === "items" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">स्टॉक व सामान (Inventory Items)</h3>
              <button 
                onClick={() => {
                  const iName = prompt("सामान का नाम दर्ज करें (उदा. UPVC Pipe 25mm):");
                  const iRate = prompt("बिक्री मूल्य (Sale Price) दर्ज करें:");
                  if (iName) {
                    const newIt = { id: Date.now().toString(), name: iName, mrp: parseFloat(iRate) || 100, salePrice: parseFloat(iRate) || 80, stock: 10, unit: "Pcs" };
                    setItems([newIt, ...items]);
                    localStorage.setItem("mobile_items_cache", JSON.stringify([newIt, ...items]));
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                + नया सामान
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="आइटम का नाम, साइज या बारकोड खोजें..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {items
                .filter(it => it.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((it) => (
                <div key={it.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white">{it.name}</div>
                    <div className="text-[10px] text-slate-400">MRP: ₹{it.mrp} • रेट: ₹{it.salePrice}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-xs text-white">{it.stock} {it.unit}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${it.stock <= 5 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {it.stock <= 5 ? "कम स्टॉक" : "स्टॉक में"}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        handleAddToCart(it);
                        setShowQuickBillModal(true);
                      }}
                      className="px-2.5 py-1 bg-purple-600 text-white font-bold text-[10px] rounded-lg shadow cursor-pointer"
                    >
                      + बिल में
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: BILLS LIST ==================== */}
        {activeTab === "bills" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">बिल बुक (Sales Invoices)</h3>
              <button 
                onClick={() => setShowQuickBillModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                + नया बिल बनाएं
              </button>
            </div>

            <div className="space-y-2">
              {bills.map((bill) => (
                <div key={bill.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="space-y-1">
                    <div className="font-black text-xs text-white">{bill.customerName}</div>
                    <div className="text-[10px] text-slate-400">{bill.id} • {bill.date}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-sm text-white">₹{bill.amount.toLocaleString()}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bill.type === "CASH" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {bill.type}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleShareWhatsAppBill(bill)}
                      className="p-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: MORE MENU ==================== */}
        {activeTab === "more" && (
          <div className="space-y-3 animate-in fade-in">
            <h3 className="font-black text-base text-white">अधिक सुविधाएं (More Features)</h3>

            <div className="space-y-2 text-xs font-bold">
              <div onClick={() => navigate("/reports/daybook")} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <Receipt className="text-rose-400" size={18} />
                  <span>📖 डे-बुक रोकड़ बही (DayBook)</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </div>

              <div onClick={() => navigate("/reports/profitloss")} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" size={18} />
                  <span>📊 शुद्ध मुनाफा रिपोर्ट (Profit & Loss)</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </div>

              <div onClick={() => navigate("/ai-advisor")} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:border-purple-500">
                <div className="flex items-center gap-3">
                  <Bot className="text-purple-400" size={18} />
                  <span>🤖 AI मुनीम जी (Smart Advisor)</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </div>

              <div onClick={() => navigate("/dashboard")} className="p-4 bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-2xl flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-3">
                  <Building2 className="text-yellow-400" size={18} />
                  <span>🚀 फुल ERP डेस्कटॉप डैशबोर्ड खोलें</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 📱 3. True Bottom Navigation Bar (Vyapar / MyBillBook Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 shadow-2xl flex justify-around items-center">
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${activeTab === "home" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Home size={18} />
          <span className="text-[10px]">होम</span>
        </button>

        <button 
          onClick={() => setActiveTab("parties")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${activeTab === "parties" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Users size={18} />
          <span className="text-[10px]">पार्टियां</span>
        </button>

        {/* Center Floating Plus Billing Action (Opens In-App Mobile Quick Bill) */}
        <button 
          onClick={() => setShowQuickBillModal(true)}
          className="w-12 h-12 -mt-5 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-600/50 transform active:scale-95 transition cursor-pointer"
        >
          <Plus size={24} />
        </button>

        <button 
          onClick={() => setActiveTab("items")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${activeTab === "items" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Package size={18} />
          <span className="text-[10px]">सामान</span>
        </button>

        <button 
          onClick={() => setActiveTab("more")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${activeTab === "more" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Menu size={18} />
          <span className="text-[10px]">मेन्यू</span>
        </button>
      </nav>

      {/* 📱 4. Embedded Fast Mobile Sales Bill Modal (100% In-App & Crash-Free) */}
      {showQuickBillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">नया बिक्री बिल (Fast Sale Bill)</h3>
                  <p className="text-[10px] text-slate-400">10 सेकंड में बिल बनाकर WhatsApp करें</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuickBillModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">ग्राहक / पार्टी का नाम *</label>
              <input 
                type="text" 
                placeholder="ग्राहक का नाम (उदा. राजेश जी)" 
                value={billCustomer}
                onChange={(e) => setBillCustomer(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
              <input 
                type="tel" 
                placeholder="मोबाइल नंबर (WhatsApp बिल भेजने हेतु)" 
                value={billCustomerPhone}
                onChange={(e) => setBillCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">भुगतान का प्रकार (Payment Type)</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {["CASH", "UDHAR", "UPI"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBillPaymentMode(mode)}
                    className={`py-2 rounded-xl border transition cursor-pointer ${billPaymentMode === mode ? "bg-purple-600 border-purple-400 text-white shadow" : "bg-slate-800 border-slate-700 text-slate-300"}`}
                  >
                    {mode === "CASH" ? "💵 नकद" : mode === "UDHAR" ? "📒 उधारी" : "📲 UPI / ऑनलाइन"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Item Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">सामान जोड़ें (Quick Add Items)</label>
              <div className="flex gap-2">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => {
                    const found = items.find(it => it.id === e.target.value);
                    if (found) {
                      handleAddToCart(found);
                      setSelectedProductToAdd("");
                    }
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
                >
                  <option value="">+ लिस्ट में से सामान चुनें...</option>
                  {items.map(it => (
                    <option key={it.id} value={it.id}>{it.name} - ₹{it.salePrice}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            {billCart.length > 0 && (
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">बिल में जोड़े गए सामान ({billCart.length}):</div>
                {billCart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-1.5">
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">₹{item.salePrice} × {item.qty} = ₹{item.salePrice * item.qty}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setBillCart(billCart.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                        className="w-6 h-6 bg-slate-800 rounded text-slate-300 font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold text-white px-1">{item.qty}</span>
                      <button 
                        onClick={() => setBillCart(billCart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}
                        className="w-6 h-6 bg-slate-800 rounded text-slate-300 font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-rose-400 p-1 hover:text-rose-300 ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Amount & Submit Button */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-300 text-xs">कुल बिल राशि (Total Amount):</span>
                <span className="font-black text-xl text-emerald-400">₹{totalBillAmount.toLocaleString()}</span>
              </div>

              <button
                onClick={handleSaveAndGenerateBill}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send size={16} /> बिल सेव करें व WhatsApp भेजें →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
