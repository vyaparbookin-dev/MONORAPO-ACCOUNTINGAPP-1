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
  Send,
  Printer,
  Eye
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
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Selected Item / Bill / Party Modal Details
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const [selectedPartyDetail, setSelectedPartyDetail] = useState(null);

  // New Quick Sale Modal State (100% In-App Mobile Billing)
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [billCustomer, setBillCustomer] = useState("");
  const [billCustomerPhone, setBillCustomerPhone] = useState("");
  const [billPaymentMode, setBillPaymentMode] = useState("CASH"); // CASH, UDHAR, UPI
  const [billCart, setBillCart] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");

  // New Party Modal State
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [newPartyBalance, setNewPartyBalance] = useState("0");
  const [newPartyType, setNewPartyType] = useState("customer");

  // New Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemSalePrice, setNewItemSalePrice] = useState("");
  const [newItemMrp, setNewItemMrp] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Pcs");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      setIsPwaInstalled(!!isStandalone);
    }
    loadRealData();
  }, [selectedCompany]);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // 1. Try Loading from LocalStorage Cache First
      const cachedParties = localStorage.getItem("real_parties_cache");
      const cachedItems = localStorage.getItem("real_items_cache");
      const cachedBills = localStorage.getItem("real_bills_cache");

      if (cachedParties) setParties(JSON.parse(cachedParties));
      if (cachedItems) setItems(JSON.parse(cachedItems));
      if (cachedBills) setBills(JSON.parse(cachedBills));

      // 2. Fetch Real Live Data from API
      const [pRes, iRes, bRes] = await Promise.allSettled([
        api.get("/parties").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] })),
        api.get("/billing").catch(() => ({ data: [] }))
      ]);

      const realParties = pRes.status === "fulfilled" ? (pRes.value.data?.parties || pRes.value.data || []) : [];
      const realItems = iRes.status === "fulfilled" ? (iRes.value.data?.products || iRes.value.data || []) : [];
      const realBills = bRes.status === "fulfilled" ? (bRes.value.data?.bills || bRes.value.data || []) : [];

      if (Array.isArray(realParties) && realParties.length > 0) {
        setParties(realParties);
        localStorage.setItem("real_parties_cache", JSON.stringify(realParties));
      }
      if (Array.isArray(realItems) && realItems.length > 0) {
        setItems(realItems);
        localStorage.setItem("real_items_cache", JSON.stringify(realItems));
      }
      if (Array.isArray(realBills) && realBills.length > 0) {
        setBills(realBills);
        localStorage.setItem("real_bills_cache", JSON.stringify(realBills));
      }
    } catch (e) {
      console.error("Error loading real data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Real Dynamic Calculations (Zero Fake Numbers)
  const totalToCollect = parties
    .filter(p => Number(p.balance || p.openingBalance || 0) > 0)
    .reduce((sum, p) => sum + Number(p.balance || p.openingBalance || 0), 0);

  const totalToPay = Math.abs(parties
    .filter(p => Number(p.balance || p.openingBalance || 0) < 0)
    .reduce((sum, p) => sum + Number(p.balance || p.openingBalance || 0), 0));

  const totalTodaySales = bills
    .filter(b => b.date && (b.date.includes("आज") || b.date.includes(new Date().toISOString().slice(0, 10)) || b.date.includes("लाइव")))
    .reduce((sum, b) => sum + Number(b.amount || b.grandTotal || b.totalAmount || 0), 0);

  const lowStockItems = items.filter(it => Number(it.stock ?? it.currentStock ?? 0) <= (it.minStock || 5));

  const handleShareWhatsAppBill = (bill) => {
    if (!bill) return;
    const billItemsText = (bill.items || []).map(i => `• ${i.name || i.productName} (x${i.qty || 1}) - ₹${(i.salePrice || i.price || 0) * (i.qty || 1)}`).join("\n");
    const text = encodeURIComponent(`*🧾 इनवॉइस बिल नं: ${bill.id || bill.billNumber || 'BILL-01'}*\n*दुकान:* ${selectedCompany?.companyName || 'VyaparBook'}\n*ग्राहक:* ${bill.customerName || bill.partyName || 'ग्राहक'}\n*तारीख:* ${bill.date || 'आज'}\n\n*सामान विवरण:*\n${billItemsText || 'बिल उत्पाद'}\n\n*कुल राशि:* ₹${(bill.amount || bill.grandTotal || 0).toLocaleString()}\n*भुगतान प्रकार:* ${bill.type || bill.paymentMode || 'CASH'}\n\n*धन्यवाद! फिर पधारें!*`);
    window.open(`https://wa.me/${bill.phone || bill.customerPhone || ''}?text=${text}`, "_blank");
  };

  // Quick Mobile Bill Functions
  const handleAddToCart = (product) => {
    if (!product) return;
    const pId = product.id || product._id || product.uuid;
    const pPrice = Number(product.salePrice || product.price || product.mrp || 0);
    const existing = billCart.find(i => i.id === pId);
    if (existing) {
      setBillCart(billCart.map(i => i.id === pId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setBillCart([...billCart, { id: pId, name: product.name || product.title, salePrice: pPrice, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setBillCart(billCart.filter(i => i.id !== productId));
  };

  const totalBillAmount = billCart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);

  const handleSaveAndGenerateBill = () => {
    if (!billCustomer.trim()) {
      alert("कृपया ग्राहक/पार्टी का नाम दर्ज करें!");
      return;
    }
    if (billCart.length === 0) {
      alert("कृपया बिल में कम से कम 1 सामान जोड़ें!");
      return;
    }

    const newBill = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      customerName: billCustomer.trim(),
      phone: billCustomerPhone.trim(),
      date: `आज, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      amount: totalBillAmount,
      type: billPaymentMode,
      items: billCart
    };

    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    localStorage.setItem("real_bills_cache", JSON.stringify(updatedBills));

    // Reset Form
    setBillCart([]);
    setBillCustomer("");
    setBillCustomerPhone("");
    setShowQuickBillModal(false);

    alert(`🎉 बिल ${newBill.id} सफलतापूर्वक बन गया है! कुल राशि: ₹${newBill.amount.toLocaleString()}`);
    setSelectedBillDetail(newBill);
  };

  const handleSaveNewParty = () => {
    if (!newPartyName.trim()) {
      alert("कृपया पार्टी का नाम दर्ज करें!");
      return;
    }
    const newP = {
      id: Date.now().toString(),
      name: newPartyName.trim(),
      phone: newPartyPhone.trim(),
      balance: parseFloat(newPartyBalance) || 0,
      type: newPartyType
    };
    const updated = [newP, ...parties];
    setParties(updated);
    localStorage.setItem("real_parties_cache", JSON.stringify(updated));
    setNewPartyName("");
    setNewPartyPhone("");
    setNewPartyBalance("0");
    setShowAddPartyModal(false);
    alert(`✅ पार्टी "${newP.name}" जोड़ दी गई है!`);
  };

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) {
      alert("कृपया सामान का नाम दर्ज करें!");
      return;
    }
    const rate = parseFloat(newItemSalePrice) || 0;
    const newIt = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      mrp: parseFloat(newItemMrp) || rate,
      salePrice: rate,
      stock: parseInt(newItemStock) || 0,
      unit: newItemUnit
    };
    const updated = [newIt, ...items];
    setItems(updated);
    localStorage.setItem("real_items_cache", JSON.stringify(updated));
    setNewItemName("");
    setNewItemSalePrice("");
    setNewItemMrp("");
    setNewItemStock("");
    setShowAddItemModal(false);
    alert(`✅ सामान "${newIt.name}" स्टॉक में जोड़ दिया गया है!`);
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
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">Vyapar Live</span>
            </h2>
            <p className="text-[10px] text-slate-400">
              {items.length} सामान • {parties.length} पार्टियां
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadRealData}
            className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer"
            title="रीफ्रेश"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => navigate("/dashboard")}
            className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
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
            {/* Real Financial Summary Cards */}
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
                <div className="text-xl font-black text-white">₹{totalToCollect.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400">{parties.filter(p => p.balance > 0).length} ग्राहकों से बाकी</p>
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
                <div className="text-xl font-black text-white">₹{totalToPay.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400">{parties.filter(p => p.balance < 0).length} सप्लायर को पेमेंट</p>
              </div>
            </div>

            {/* Today's Sales Card */}
            <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-purple-500/40 rounded-2xl flex justify-between items-center shadow-lg">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-purple-300">आज की नकद व कुल बिक्री</span>
                <div className="text-2xl font-black text-white">₹{totalTodaySales.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400">{bills.length} कुल बिल बने</p>
              </div>
              <button 
                onClick={() => setShowQuickBillModal(true)}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> नया बिल
              </button>
            </div>

            {/* Quick 4-Grid Action Buttons */}
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
                onClick={() => setShowAddItemModal(true)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-emerald-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Plus size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">नया सामान</span>
              </div>

              <div 
                onClick={() => setShowAddPartyModal(true)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-blue-500 cursor-pointer shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-200">नई पार्टी</span>
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
                <span onClick={() => setActiveTab("bills")} className="text-[11px] font-bold text-purple-400 cursor-pointer">सभी {bills.length} बिल देखें →</span>
              </div>

              {bills.length === 0 ? (
                <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center space-y-2">
                  <Receipt size={28} className="mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400 font-bold">अभी तक कोई बिल नहीं बना है</p>
                  <button 
                    onClick={() => setShowQuickBillModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow"
                  >
                    + पहला बिल बनाएं
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bills.slice(0, 4).map((bill) => (
                    <div 
                      key={bill.id || bill._id} 
                      onClick={() => setSelectedBillDetail(bill)}
                      className="p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-white">{bill.customerName || bill.partyName || "नकद ग्राहक"}</div>
                        <div className="text-[10px] text-slate-400">{bill.id || bill.billNumber} • {bill.date || "आज"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-xs text-white">₹{(bill.amount || bill.grandTotal || 0).toLocaleString()}</div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bill.type === "CASH" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                            {bill.type || "CASH"}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareWhatsAppBill(bill);
                          }}
                          className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition cursor-pointer"
                          title="WhatsApp PDF"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARTIES (लेजर व उधारी) ==================== */}
        {activeTab === "parties" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">पार्टियां ({parties.length})</h3>
              <button 
                onClick={() => setShowAddPartyModal(true)}
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

            {parties.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
                <Users size={32} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-bold">कोई पार्टी नहीं है</p>
                <button 
                  onClick={() => setShowAddPartyModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  + पहली पार्टी जोड़ें
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {parties
                  .filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.phone && p.phone.includes(searchQuery)))
                  .map((p) => (
                  <div 
                    key={p.id || p._id} 
                    onClick={() => setSelectedPartyDetail(p)}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {p.phone || "No Phone"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-black text-xs ${Number(p.balance || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {Number(p.balance || 0) >= 0 ? `+ ₹${Number(p.balance || 0).toLocaleString()}` : `- ₹${Math.abs(Number(p.balance || 0)).toLocaleString()}`}
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold block">
                        {Number(p.balance || 0) >= 0 ? "लेने हैं" : "देने हैं"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ITEMS & STOCK ==================== */}
        {activeTab === "items" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">स्टॉक व सामान ({items.length})</h3>
              <button 
                onClick={() => setShowAddItemModal(true)}
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

            {items.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
                <Package size={32} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-bold">स्टॉक में कोई सामान नहीं है</p>
                <button 
                  onClick={() => setShowAddItemModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  + पहला सामान जोड़ें
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {items
                  .filter(it => (it.name || it.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((it) => (
                  <div key={it.id || it._id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-white">{it.name || it.title}</div>
                      <div className="text-[10px] text-slate-400">MRP: ₹{it.mrp || it.salePrice} • बिक्री रेट: ₹{it.salePrice || it.price}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-xs text-white">{it.stock ?? it.currentStock ?? 0} {it.unit || "Pcs"}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${(it.stock ?? 0) <= 5 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {(it.stock ?? 0) <= 5 ? "कम स्टॉक" : "स्टॉक में"}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          handleAddToCart(it);
                          setShowQuickBillModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-purple-600 text-white font-bold text-[10px] rounded-lg shadow cursor-pointer"
                      >
                        + बिल
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: BILLS LIST ==================== */}
        {activeTab === "bills" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white">बिल बुक ({bills.length} बिल)</h3>
              <button 
                onClick={() => setShowQuickBillModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                + नया बिल
              </button>
            </div>

            {bills.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
                <Receipt size={32} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-bold">कोई बिल नहीं मिला</p>
                <button 
                  onClick={() => setShowQuickBillModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  + पहला बिल बनाएं
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {bills.map((bill) => (
                  <div 
                    key={bill.id || bill._id} 
                    onClick={() => setSelectedBillDetail(bill)}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-xs text-white">{bill.customerName || bill.partyName || "नकद ग्राहक"}</div>
                      <div className="text-[10px] text-slate-400">{bill.id || bill.billNumber} • {bill.date}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-sm text-white">₹{(bill.amount || bill.grandTotal || 0).toLocaleString()}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bill.type === "CASH" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {bill.type || "CASH"}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareWhatsAppBill(bill);
                        }}
                        className="p-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition cursor-pointer"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* 📱 3. True Bottom Navigation Bar */}
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

        {/* Center Floating Plus Billing Action */}
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

      {/* 📱 4. Embedded Fast Mobile Sales Bill Modal */}
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
                placeholder="ग्राहक का नाम दर्ज करें..." 
                value={billCustomer}
                onChange={(e) => setBillCustomer(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
              <input 
                type="tel" 
                placeholder="WhatsApp मोबाइल नंबर..." 
                value={billCustomerPhone}
                onChange={(e) => setBillCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">भुगतान प्रकार</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {["CASH", "UDHAR", "UPI"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBillPaymentMode(mode)}
                    className={`py-2 rounded-xl border transition cursor-pointer ${billPaymentMode === mode ? "bg-purple-600 border-purple-400 text-white shadow" : "bg-slate-800 border-slate-700 text-slate-300"}`}
                  >
                    {mode === "CASH" ? "💵 नकद" : mode === "UDHAR" ? "📒 उधारी" : "📲 UPI"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Item Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">सामान जोड़ें</label>
              <select
                value={selectedProductToAdd}
                onChange={(e) => {
                  const found = items.find(it => (it.id || it._id) === e.target.value);
                  if (found) {
                    handleAddToCart(found);
                    setSelectedProductToAdd("");
                  }
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
              >
                <option value="">+ लिस्ट में से सामान चुनें ({items.length} उपलब्ध)...</option>
                {items.map(it => (
                  <option key={it.id || it._id} value={it.id || it._id}>{it.name || it.title} - ₹{it.salePrice || it.price}</option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            {billCart.length > 0 && (
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">जोड़े गए सामान ({billCart.length}):</div>
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
                <span className="font-bold text-slate-300 text-xs">कुल बिल राशि:</span>
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

      {/* 📱 5. Interactive Bill Detail Modal */}
      {selectedBillDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-100 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white">बिल विवरण ({selectedBillDetail.id || selectedBillDetail.billNumber})</h3>
                <p className="text-[10px] text-slate-400">{selectedBillDetail.date || "आज"}</p>
              </div>
              <button 
                onClick={() => setSelectedBillDetail(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ग्राहक:</span>
                <span className="font-bold text-white">{selectedBillDetail.customerName || selectedBillDetail.partyName || "नकद"}</span>
              </div>
              {selectedBillDetail.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-400">फोन:</span>
                  <span className="font-bold text-slate-300">{selectedBillDetail.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">भुगतान:</span>
                <span className="font-bold text-emerald-400">{selectedBillDetail.type || "CASH"}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="font-bold text-slate-300">कुल राशि:</span>
                <span className="font-black text-base text-emerald-400">₹{(selectedBillDetail.amount || selectedBillDetail.grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={() => handleShareWhatsAppBill(selectedBillDetail)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Share2 size={14} /> WhatsApp
              </button>
              <button 
                onClick={() => window.print()}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Printer size={14} /> प्रिंट बिल
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 6. Add Party Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-black text-sm text-white">+ नई पार्टी / ग्राहक जोड़ें</h3>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <input 
                type="text" 
                placeholder="पार्टी का नाम *" 
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
              />
              <input 
                type="tel" 
                placeholder="मोबाइल नंबर" 
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
              />
              <input 
                type="number" 
                placeholder="पिछली उधारी / बैलेंस (₹)" 
                value={newPartyBalance}
                onChange={(e) => setNewPartyBalance(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
              />
            </div>

            <button 
              onClick={handleSaveNewParty}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow mt-2"
            >
              पार्टी सेव करें
            </button>
          </div>
        </div>
      )}

      {/* 📱 7. Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-black text-sm text-white">+ नया सामान / स्टॉक जोड़ें</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <input 
                type="text" 
                placeholder="सामान का नाम (उदा. UPVC Elbow 1') *" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="बिक्री रेट (₹) *" 
                  value={newItemSalePrice}
                  onChange={(e) => setNewItemSalePrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
                />
                <input 
                  type="number" 
                  placeholder="प्रारंभिक स्टॉक *" 
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveNewItem}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow mt-2"
            >
              सामान स्टॉक में जोड़ें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
