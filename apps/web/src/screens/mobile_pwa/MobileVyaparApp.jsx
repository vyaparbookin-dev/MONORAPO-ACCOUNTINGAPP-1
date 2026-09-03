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
  Phone
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

  // Mock initial business stats for instant feel
  const [stats, setStats] = useState({
    todaySales: 18450,
    toCollect: 45200,
    toPay: 12800,
    totalStockValue: 342000,
    lowStockCount: 4
  });

  useEffect(() => {
    loadMobileData();
  }, [selectedCompany]);

  const loadMobileData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, bRes] = await Promise.allSettled([
        api.get("/parties").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] })),
        api.get("/billing").catch(() => ({ data: [] }))
      ]);

      const partiesData = pRes.status === "fulfilled" ? (pRes.value.data?.parties || pRes.value.data || []) : [];
      const itemsData = iRes.status === "fulfilled" ? (iRes.value.data?.products || iRes.value.data || []) : [];
      const billsData = bRes.status === "fulfilled" ? (bRes.value.data?.bills || bRes.value.data || []) : [];

      setParties(Array.isArray(partiesData) && partiesData.length > 0 ? partiesData : [
        { id: "1", name: "राजेश ट्रेडर्स (प्लंबिंग)", phone: "9826112345", balance: 14500, type: "customer" },
        { id: "2", name: "वर्मा सैनिटरी & हार्डवेयर", phone: "9425098765", balance: 22000, type: "customer" },
        { id: "3", name: "फ्लोरेक्स पाइप्स डिस्ट्रीब्यूटर", phone: "9893011223", balance: -12800, type: "supplier" },
        { id: "4", name: "बर्जर पेंट्स डिपो", phone: "9755044556", balance: 8700, type: "customer" }
      ]);

      setItems(Array.isArray(itemsData) && itemsData.length > 0 ? itemsData : [
        { id: "1", name: 'UPVC Pipe 25mm (1")', category: "Pipes", mrp: 450, salePrice: 320, stock: 45, unit: "Pcs" },
        { id: "2", name: 'UPVC Elbow 25mm (1")', category: "Fittings", mrp: 35, salePrice: 22, stock: 120, unit: "Pcs" },
        { id: "3", name: "Berger Walmasta White 20L", category: "Paint", mrp: 3200, salePrice: 2450, stock: 8, unit: "Bucket" },
        { id: "4", name: "Submersible Pump 1HP V4", category: "Pumps", mrp: 14500, salePrice: 11800, stock: 3, unit: "Set" }
      ]);

      setBills(Array.isArray(billsData) && billsData.length > 0 ? billsData : [
        { id: "INV-101", customerName: "राजेश ट्रेडर्स", date: "आज, 02:45 PM", amount: 4850, status: "PAID", type: "CASH" },
        { id: "INV-102", customerName: "वर्मा सैनिटरी", date: "आज, 11:20 AM", amount: 13600, status: "CREDIT", type: "UDHAR" },
        { id: "INV-103", customerName: "सुरेश पेंटर", date: "कल, 05:15 PM", amount: 2450, status: "PAID", type: "UPI" }
      ]);
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
    const text = encodeURIComponent(`*नमस्ते ${bill.customerName} जी!*\nआपका VyaparBook इनवॉइस बिल नं. *${bill.id}* तैयार है।\nकुल राशि: *₹${bill.amount.toLocaleString()}* (${bill.type})\nधन्यवाद!`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
            <p className="text-[10px] text-slate-400">Pure Mobile Accounting Suite</p>
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
                <div className="text-xl font-black text-white">₹{stats.toCollect.toLocaleString()}</div>
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
                <div className="text-xl font-black text-white">₹{stats.toPay.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400">1 सप्लायर को पेमेंट</p>
              </div>
            </div>

            {/* Today's Sales Card */}
            <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-purple-500/40 rounded-2xl flex justify-between items-center shadow-lg">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-purple-300">आज की नकद व ऑनलाइन बिक्री</span>
                <div className="text-2xl font-black text-white">₹{stats.todaySales.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400">5 इनवॉइस तैयार हुए</p>
              </div>
              <button 
                onClick={() => navigate("/billing")}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5"
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
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow shrink-0"
                >
                  1-Click Load
                </button>
              </div>
            )}

            {/* Quick 4-Grid Action Buttons (MyBillBook Style) */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
              <div 
                onClick={() => navigate("/billing")}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-purple-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Receipt size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">बिक्री बिल</span>
              </div>

              <div 
                onClick={() => navigate("/inventory/purchase")}
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
                onClick={() => navigate("/expenses")}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-rose-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <DollarSign size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">खर्च एंट्री</span>
              </div>
            </div>

            {/* Recent Bills Stream */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-300">ताज़ा बिल (Recent Invoices)</span>
                <span onClick={() => setActiveTab("bills")} className="text-[11px] font-bold text-purple-400 cursor-pointer">सभी देखें →</span>
              </div>

              <div className="space-y-2">
                {bills.slice(0, 3).map((bill) => (
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
                        className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition"
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
                onClick={() => navigate("/parties")}
                className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow"
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
                onClick={() => navigate("/inventory/add")}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow"
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

                  <div className="text-right">
                    <div className="font-black text-xs text-white">{it.stock} {it.unit}</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${it.stock <= 5 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {it.stock <= 5 ? "कम स्टॉक" : "स्टॉक में"}
                    </span>
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
                onClick={() => navigate("/billing")}
                className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow"
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
                      className="p-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition"
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

              <div onClick={() => navigate("/reports/gst")} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-400" size={18} />
                  <span>🏛️ GST टैक्स रिपोर्ट (GSTR-1 & 3B)</span>
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 shadow-2xl flex justify-around items-center">
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${activeTab === "home" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Home size={18} />
          <span className="text-[10px]">होम</span>
        </button>

        <button 
          onClick={() => setActiveTab("parties")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${activeTab === "parties" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Users size={18} />
          <span className="text-[10px]">पार्टियां</span>
        </button>

        {/* Center Floating Plus Billing Action */}
        <button 
          onClick={() => navigate("/billing")}
          className="w-12 h-12 -mt-5 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-600/50 transform active:scale-95 transition"
        >
          <Plus size={24} />
        </button>

        <button 
          onClick={() => setActiveTab("items")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${activeTab === "items" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Package size={18} />
          <span className="text-[10px]">सामान</span>
        </button>

        <button 
          onClick={() => setActiveTab("more")}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${activeTab === "more" ? "text-purple-400 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Menu size={18} />
          <span className="text-[10px]">मेन्यू</span>
        </button>
      </nav>
    </div>
  );
}
