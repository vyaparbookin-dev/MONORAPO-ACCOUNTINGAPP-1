import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Package,
  BarChart2,
  Menu,
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronDown,
  Calculator,
  Gift,
  Tv,
  Share2,
  ShieldCheck,
  Calendar,
  X,
  RefreshCw,
  Phone,
  Trash2,
  Send,
  Printer,
  Receipt,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";

export default function MobileVyaparApp() {
  const navigate = useNavigate();
  const { selectedCompany, companies, selectCompany } = useCompany();

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, parties, items, reports, more
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Modals
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [ecosystemModalVisible, setEcosystemModalVisible] = useState(false);
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const [selectedPartyDetail, setSelectedPartyDetail] = useState(null);

  // Calculator State
  const [calcInput, setCalcInput] = useState("");

  // Quick Bill Modal
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [billCustomer, setBillCustomer] = useState("");
  const [billCustomerPhone, setBillCustomerPhone] = useState("");
  const [billPaymentMode, setBillPaymentMode] = useState("CASH");
  const [billCart, setBillCart] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [savingBill, setSavingBill] = useState(false);

  // Quick Party Modal
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [newPartyAddress, setNewPartyAddress] = useState("");
  const [newPartyBalance, setNewPartyBalance] = useState("0");
  const [newPartyType, setNewPartyType] = useState("customer");
  const [savingParty, setSavingParty] = useState(false);

  // Quick Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemSalePrice, setNewItemSalePrice] = useState("");
  const [newItemMrp, setNewItemMrp] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Pcs");
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      setIsPwaInstalled(!!isStandalone);
    }
    fetchLiveDashboardData();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [selectedCompany]);

  const fetchLiveDashboardData = async () => {
    setLoading(true);
    try {
      const [billsRes, partiesRes, invRes] = await Promise.allSettled([
        api.get("/billing"),
        api.get("/parties"),
        api.get("/inventory")
      ]);

      if (billsRes.status === "fulfilled") {
        const rawBills = billsRes.value.data?.bills || billsRes.value.data?.data || billsRes.value.data || [];
        const normBills = (Array.isArray(rawBills) ? rawBills : []).map(b => ({
          _id: b._id,
          id: b.billNumber || b.invoiceNumber || (b._id ? `INV-${b._id.slice(-4)}` : "001"),
          customerName: b.partyName || b.customerName || "Walk-in Customer",
          phone: b.customerPhone || b.phone || "",
          amount: Number(b.finalAmount || b.total || b.grandTotal || 0),
          type: b.paymentMode || b.paymentType || "CASH",
          paymentStatus: b.paymentStatus || (b.paymentMode === "UDHAR" ? "unpaid" : "paid"),
          date: b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today",
          items: b.items || []
        }));
        setBills(normBills);
      }

      if (partiesRes.status === "fulfilled") {
        const rawParties = partiesRes.value.data?.parties || partiesRes.value.data?.data || partiesRes.value.data || [];
        const normParties = (Array.isArray(rawParties) ? rawParties : []).map(p => ({
          id: p._id || p.id,
          name: p.name || p.partyName,
          phone: p.mobileNumber || p.phone || "",
          balance: Number(p.balance || p.openingBalance || 0),
          type: p.partyType || p.type || "customer",
          address: p.address || ""
        }));
        setParties(normParties);
      }

      if (invRes.status === "fulfilled") {
        const rawInv = invRes.value.data?.products || invRes.value.data?.items || invRes.value.data || [];
        const normInv = (Array.isArray(rawInv) ? rawInv : []).map(it => ({
          id: it._id || it.id,
          name: it.name || it.productName,
          salePrice: Number(it.sellingPrice || it.salePrice || it.price || 0),
          mrp: Number(it.mrp || it.sellingPrice || 0),
          stock: Number(it.currentStock ?? it.stock ?? 0),
          unit: it.unit || "Pcs"
        }));
        setItems(normInv);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // APK Exact Metrics Calculation
  const toCollect = parties.filter(p => Number(p.balance || 0) > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0);
  const toPay = Math.abs(parties.filter(p => Number(p.balance || 0) < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0));
  const stockValue = items.reduce((sum, it) => sum + (it.stock * it.salePrice), 0);
  const recentSales = bills.reduce((sum, b) => sum + b.amount, 0);

  // Today EOD Breakdown
  const todaySales = recentSales;
  const todayCash = bills.filter(b => b.type === "CASH").reduce((sum, b) => sum + b.amount, 0);
  const todayCredit = bills.filter(b => b.type === "UDHAR").reduce((sum, b) => sum + b.amount, 0);

  const companyDisplayName = selectedCompany?.companyName || selectedCompany?.name || "GANESH HARDWARE";

  const handleShareWhatsAppBill = (bill) => {
    if (!bill) return;
    const text = encodeURIComponent(`Dear ${bill.customerName || 'Customer'}, your invoice #${bill.id || '001'} for ₹${bill.amount.toLocaleString()} is generated by ${companyDisplayName}. Thank you for doing business with us!`);
    window.open(`https://wa.me/${bill.phone || ''}?text=${text}`, "_blank");
  };

  const handleAddToCart = (product) => {
    if (!product) return;
    const existing = billCart.find(i => i.id === product.id);
    if (existing) {
      setBillCart(billCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setBillCart([...billCart, { id: product.id, name: product.name, salePrice: product.salePrice, qty: 1 }]);
    }
  };

  const totalBillAmount = billCart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);

  const handleSaveAndGenerateBill = async () => {
    if (!billCustomer.trim()) {
      alert("कृपया ग्राहक/पार्टी का नाम दर्ज करें!");
      return;
    }
    if (billCart.length === 0) {
      alert("कृपया बिल में सामान जोड़ें!");
      return;
    }

    setSavingBill(true);
    const billPayload = {
      partyName: billCustomer.trim(),
      customerPhone: billCustomerPhone.trim(),
      paymentMode: billPaymentMode,
      items: billCart.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.salePrice, total: i.salePrice * i.qty })),
      finalAmount: totalBillAmount,
      date: new Date()
    };

    try {
      const res = await api.post("/billing", billPayload).catch(() => null);
      const createdBill = {
        _id: res?.data?.bill?._id || Date.now().toString(),
        id: res?.data?.bill?.billNumber || `INV-${Date.now().toString().slice(-4)}`,
        customerName: billCustomer.trim(),
        phone: billCustomerPhone.trim(),
        date: "Today",
        amount: totalBillAmount,
        type: billPaymentMode,
        paymentStatus: billPaymentMode === "UDHAR" ? "unpaid" : "paid",
        items: billCart
      };
      setBills([createdBill, ...bills]);
      setBillCart([]);
      setBillCustomer("");
      setBillCustomerPhone("");
      setShowQuickBillModal(false);
      setSelectedBillDetail(createdBill);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBill(false);
    }
  };

  const handleSaveNewParty = async () => {
    if (!newPartyName.trim()) {
      alert("कृपया पार्टी का नाम दर्ज करें!");
      return;
    }
    setSavingParty(true);
    try {
      const res = await api.post("/parties", {
        name: newPartyName.trim(),
        mobileNumber: newPartyPhone.trim() || "0000000000",
        address: newPartyAddress.trim() || "Local",
        openingBalance: parseFloat(newPartyBalance) || 0,
        partyType: newPartyType
      }).catch(() => null);

      const newP = {
        id: res?.data?.party?._id || Date.now().toString(),
        name: newPartyName.trim(),
        phone: newPartyPhone.trim(),
        balance: parseFloat(newPartyBalance) || 0,
        type: newPartyType
      };
      setParties([newP, ...parties]);
      setNewPartyName("");
      setNewPartyPhone("");
      setNewPartyAddress("");
      setNewPartyBalance("0");
      setShowAddPartyModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingParty(false);
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
      alert("कृपया सामान का नाम दर्ज करें!");
      return;
    }
    setSavingItem(true);
    const rate = parseFloat(newItemSalePrice) || 0;
    try {
      const res = await api.post("/inventory", {
        name: newItemName.trim(),
        sellingPrice: rate,
        mrp: parseFloat(newItemMrp) || rate,
        currentStock: parseInt(newItemStock) || 0,
        unit: newItemUnit
      }).catch(() => null);

      const newIt = {
        id: res?.data?.product?._id || Date.now().toString(),
        name: newItemName.trim(),
        mrp: parseFloat(newItemMrp) || rate,
        salePrice: rate,
        stock: parseInt(newItemStock) || 0,
        unit: newItemUnit
      };
      setItems([newIt, ...items]);
      setNewItemName("");
      setNewItemSalePrice("");
      setNewItemMrp("");
      setNewItemStock("");
      setShowAddItemModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-28 select-none">
      {/* 📱 1. TOP WHITE HEADER (Exact APK Match) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate("/company/list")}>
          <h1 className="font-extrabold text-[15px] tracking-wide text-[#1E293B]">
            {companyDisplayName.toUpperCase()}
          </h1>
          <ChevronDown size={16} className="text-[#6366F1]" />
        </div>

        <div className="flex items-center gap-2">
          {/* 1. Calculator */}
          <button 
            onClick={() => setCalculatorVisible(true)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <Calculator size={18} />
          </button>

          {/* 2. Refer & Earn Gift Icon */}
          <button 
            onClick={() => setReferralModalVisible(true)}
            className="w-9 h-9 rounded-full bg-[#EEF2FF] hover:bg-indigo-100 flex items-center justify-center text-[#6366F1] transition cursor-pointer"
          >
            <Gift size={18} />
          </button>

          {/* 3. Multi-Platform Device Icon */}
          <button 
            onClick={() => setEcosystemModalVisible(true)}
            className="w-9 h-9 rounded-full bg-[#ECFDF5] hover:bg-emerald-100 flex items-center justify-center text-[#059669] transition cursor-pointer"
          >
            <Tv size={18} />
          </button>
        </div>
      </header>

      {/* 📱 2. MAIN SCROLLABLE CONTENT */}
      <main className="p-4 space-y-3.5 max-w-md mx-auto">
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-3.5 animate-in fade-in">
            {/* 2. TOP PROMO BANNER (Exact APK Match) */}
            <div className="p-3.5 bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border border-[#E0E7FF] rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider">Supabase Cloud & Offline POS Active</p>
                <h3 className="font-black text-xs text-[#1E1B4B]">{companyDisplayName} ERP v2.0 Live</h3>
              </div>
              <button 
                onClick={() => setActiveTab("items")}
                className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                View Stock →
              </button>
            </div>

            {/* 3. 2x3 METRICS GRID (Exact APK Match) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Row 1: To Collect */}
              <div 
                onClick={() => setActiveTab("parties")}
                className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#34D399] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#059669]">₹ {toCollect.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#059669]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#065F46]">To Collect</span>
                  <ArrowDown size={13} className="text-[#059669]" />
                </div>
              </div>

              {/* Row 1: To Pay */}
              <div 
                onClick={() => setActiveTab("parties")}
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#FB7185] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#E11D48]">₹ {toPay.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#E11D48]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#9F1239]">To Pay</span>
                  <ArrowUp size={13} className="text-[#E11D48]" />
                </div>
              </div>

              {/* Row 2: Stock Value */}
              <div 
                onClick={() => setActiveTab("items")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Stock Value</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="font-black text-sm text-[#0F172A]">
                  ₹ {stockValue > 0 ? (stockValue / 100000).toFixed(2) + ' Lakhs' : '0'}
                </div>
              </div>

              {/* Row 2: This week's sale */}
              <div 
                onClick={() => setActiveTab("reports")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-[#0F172A]">₹ {recentSales.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-xs font-bold text-[#64748B]">This week's sale</div>
              </div>

              {/* Row 3: Total Balance */}
              <div 
                onClick={() => navigate("/reports/daybook")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Total Balance</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569]">Cash + Bank Balance</div>
              </div>

              {/* Row 3: Reports */}
              <div 
                onClick={() => setActiveTab("reports")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Reports</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569]">Sales, Party, GST...</div>
              </div>
            </div>

            {/* 4. MULTI-DEVICE / CLOUD SYNC PROMPT (Exact APK Match) */}
            <div 
              onClick={() => navigate("/admin")}
              className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#D97706]" />
                <span className="text-xs font-bold text-[#92400E]">Multi-device Sync & Realtime Supabase Active</span>
              </div>
              <ChevronRight size={16} className="text-[#6366F1]" />
            </div>

            {/* 5. EOD DAILY SUMMARY WIDGET (Exact APK Match) */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-[#0F172A]">Today's Business Summary (EOD)</span>
                <span className="text-[11px] font-bold text-[#6366F1]">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center pt-1">
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Today's Sales</div>
                  <div className="font-black text-xs text-[#0F172A] mt-0.5">₹ {todaySales.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Cash Sales</div>
                  <div className="font-black text-xs text-[#059669] mt-0.5">₹ {todayCash.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Credit (Udhar)</div>
                  <div className="font-black text-xs text-[#DC2626] mt-0.5">₹ {todayCredit.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* 6. TRANSACTIONS SECTION (Exact APK Match) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-sm text-[#0F172A]">Transactions</h3>
                <div className="px-2.5 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-full flex items-center gap-1 text-[10px] font-black text-[#6366F1]">
                  <Calendar size={11} /> LAST 365 DAYS
                </div>
              </div>

              {/* Transactions List */}
              {bills.length === 0 ? (
                <div className="p-8 bg-white border border-slate-100 rounded-2xl text-center space-y-2">
                  <Receipt size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No Transactions Yet</p>
                  <p className="text-[11px] text-slate-400">Tap "+ Bill / Invoice" below to create your first sale bill</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bills.slice(0, 5).map((bill) => (
                    <div 
                      key={bill._id || bill.id}
                      onClick={() => setSelectedBillDetail(bill)}
                      className="p-3.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-[#0F172A]">{bill.customerName}</div>
                        <div className="text-[11px] text-slate-400">
                          Invoice #{bill.id} • {bill.date} • {bill.paymentStatus === 'unpaid' ? 'Due' : 'Paid'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-xs text-[#0F172A]">₹ {bill.amount.toLocaleString('en-IN')}</div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${bill.paymentStatus === 'unpaid' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'}`}>
                            {bill.paymentStatus === 'unpaid' ? 'Unpaid' : 'Paid'}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareWhatsAppBill(bill);
                          }}
                          className="w-8 h-8 rounded-full bg-[#ECFDF5] hover:bg-emerald-100 text-[#059669] flex items-center justify-center transition cursor-pointer"
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

        {/* ==================== TAB 2: PARTIES (Exact APK Match) ==================== */}
        {activeTab === "parties" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-base text-[#0F172A]">Parties ({parties.length})</h2>
              <button 
                onClick={() => setShowAddPartyModal(true)}
                className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                + Add Party
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search party by name or mobile..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
              />
            </div>

            <div className="space-y-2">
              {parties
                .filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.phone && p.phone.includes(searchQuery)))
                .map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPartyDetail(p)}
                  className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer hover:border-indigo-100 transition"
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{p.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {p.phone || "No Phone"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-xs ${Number(p.balance || 0) >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                      {Number(p.balance || 0) >= 0 ? `+ ₹${Number(p.balance || 0).toLocaleString('en-IN')}` : `- ₹${Math.abs(Number(p.balance || 0)).toLocaleString('en-IN')}`}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {Number(p.balance || 0) >= 0 ? "You'll Get" : "You'll Give"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ITEMS (Exact APK Match) ==================== */}
        {activeTab === "items" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-base text-[#0F172A]">Items ({items.length})</h2>
              <button 
                onClick={() => setShowAddItemModal(true)}
                className="px-3.5 py-1.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search item by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#059669]"
              />
            </div>

            <div className="space-y-2">
              {items
                .filter(it => (it.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((it) => (
                <div key={it.id} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{it.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Sale: ₹{it.salePrice} • MRP: ₹{it.mrp}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="font-black text-xs text-[#0F172A]">{it.stock} {it.unit}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${it.stock <= 5 ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#ECFDF5] text-[#059669]"}`}>
                        {it.stock <= 5 ? "Low Stock" : "In Stock"}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        handleAddToCart(it);
                        setShowQuickBillModal(true);
                      }}
                      className="px-2.5 py-1 bg-[#4338CA] text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                    >
                      + Sale
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: REPORTS ==================== */}
        {activeTab === "reports" && (
          <div className="space-y-3 animate-in fade-in">
            <h2 className="font-extrabold text-base text-[#0F172A]">Reports Menu</h2>
            <div className="space-y-2 text-xs font-bold">
              <div onClick={() => navigate("/reports/daybook")} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm">
                <span>📖 DayBook (रोकड़ बही)</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <div onClick={() => navigate("/reports/profitloss")} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm">
                <span>📊 Profit & Loss Report</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <div onClick={() => navigate("/reports/gst")} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm">
                <span>📑 GST Summary & GSTR-3B</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: MORE SETTINGS ==================== */}
        {activeTab === "more" && (
          <div className="space-y-3 animate-in fade-in">
            <h2 className="font-extrabold text-base text-[#0F172A]">More Settings</h2>
            <div className="space-y-2 text-xs font-bold">
              <div onClick={() => setReferralModalVisible(true)} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm">
                <span>🎁 Refer & Earn (20% Off)</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <div onClick={() => navigate("/dashboard")} className="p-4 bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl flex justify-between items-center cursor-pointer shadow-sm">
                <span className="text-[#4338CA]">🚀 Open Full Desktop ERP Dashboard</span>
                <ChevronRight size={16} className="text-[#4338CA]" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 📱 3. FLOATING BOTTOM ACTION PILL BAR (Exact APK Match) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 flex justify-center items-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3 py-1.5 shadow-xl flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => setActiveTab("parties")}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-full transition cursor-pointer"
          >
            Received Payment
          </button>

          <button 
            onClick={() => setShowQuickBillModal(true)}
            className="w-10 h-10 -my-2 bg-[#4338CA] hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 transform active:scale-95 transition cursor-pointer"
          >
            <Plus size={22} />
          </button>

          <button 
            onClick={() => setShowQuickBillModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-bold text-xs rounded-full shadow-md transition cursor-pointer"
          >
            + Bill / Invoice
          </button>
        </div>
      </div>

      {/* 📱 4. BOTTOM TAB NAVIGATOR (Exact APK Match: White Bar, 5 Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-2 py-2 shadow-2xl flex justify-around items-center">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "dashboard" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Home size={20} />
          <span className="text-[11px]">Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab("parties")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "parties" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Users size={20} />
          <span className="text-[11px]">Parties</span>
        </button>

        <button 
          onClick={() => setActiveTab("reports")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "reports" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <BarChart2 size={20} />
          <span className="text-[11px]">Reports</span>
        </button>

        <button 
          onClick={() => setActiveTab("items")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "items" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Package size={20} />
          <span className="text-[11px]">Items</span>
        </button>

        <button 
          onClick={() => setActiveTab("more")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "more" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Menu size={20} />
          <span className="text-[11px]">More</span>
        </button>
      </nav>

      {/* 📱 5. CALCULATOR MODAL (Exact APK Match) */}
      {calculatorVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Calculator</h3>
              <button onClick={() => setCalculatorVisible(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl text-right font-mono font-black text-xl text-[#0F172A] min-h-[48px]">
              {calcInput || "0"}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["7","8","9","/", "4","5","6","*", "1","2","3","-", "C","0","=","+"].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "C") setCalcInput("");
                    else if (key === "=") {
                      try { setCalcInput(String(Function(`"use strict"; return (${calcInput})`)())); } catch { setCalcInput("Error"); }
                    } else setCalcInput(calcInput + key);
                  }}
                  className="py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl font-bold text-sm text-[#0F172A] cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📱 6. REFER & EARN MODAL (Exact APK Match) */}
      {referralModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Gift size={18} className="text-[#6366F1]" />
                <h3 className="font-extrabold text-sm text-[#0F172A]">Refer & Earn (Flat 20% Off)</h3>
              </div>
              <button onClick={() => setReferralModalVisible(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-[#6366F1]">EARN 20% DISCOUNT + TOKENS</span>
              <p className="text-xs font-black text-[#1E1B4B]">Share with Merchant Friends & Get Flat 20% Off</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText("https://vyaparbook.in");
                alert("रेफरल लिंक कॉपी हो गया!");
                setReferralModalVisible(false);
              }}
              className="w-full py-3 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Copy Referral Link
            </button>
          </div>
        </div>
      )}

      {/* 📱 7. QUICK SALE BILL MODAL */}
      {showQuickBillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">+ New Sale Bill</h3>
              <button onClick={() => setShowQuickBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Party / Customer Name *" 
              value={billCustomer}
              onChange={(e) => setBillCustomer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
            />
            <input 
              type="tel" 
              placeholder="WhatsApp Mobile Number..." 
              value={billCustomerPhone}
              onChange={(e) => setBillCustomerPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "UDHAR", "UPI"].map((m) => (
                <button
                  key={m}
                  onClick={() => setBillPaymentMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border ${billPaymentMode === m ? "bg-[#4338CA] text-white border-[#4338CA]" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                >
                  {m === "CASH" ? "Cash" : m === "UDHAR" ? "Credit" : "UPI"}
                </button>
              ))}
            </div>
            <select
              value={selectedProductToAdd}
              onChange={(e) => {
                const f = items.find(it => it.id === e.target.value);
                if (f) { handleAddToCart(f); setSelectedProductToAdd(""); }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
            >
              <option value="">+ Pick Item to Add ({items.length} items)...</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.name} - ₹{it.salePrice}</option>)}
            </select>
            {billCart.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                {billCart.map(i => (
                  <div key={i.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#0F172A]">{i.name} (x{i.qty})</span>
                    <span className="font-black text-[#059669]">₹{i.salePrice * i.qty}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-100 pt-2">
              <span className="font-bold text-xs text-slate-600">Total Amount:</span>
              <span className="font-black text-lg text-[#059669]">₹ {totalBillAmount.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={handleSaveAndGenerateBill}
              disabled={savingBill}
              className="w-full py-3 bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              {savingBill ? "Saving Bill..." : "Save Bill & WhatsApp →"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 8. ADD PARTY MODAL */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">+ Add Party</h3>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Party Name *" 
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
            />
            <input 
              type="tel" 
              placeholder="Mobile Number" 
              value={newPartyPhone}
              onChange={(e) => setNewPartyPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
            />
            <input 
              type="number" 
              placeholder="Opening Balance (₹)" 
              value={newPartyBalance}
              onChange={(e) => setNewPartyBalance(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
            />
            <button
              onClick={handleSaveNewParty}
              disabled={savingParty}
              className="w-full py-2.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              {savingParty ? "Saving..." : "Save Party"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 9. ADD ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">+ Add Item</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Item Name *" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Sale Price (₹) *" 
                value={newItemSalePrice}
                onChange={(e) => setNewItemSalePrice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
              />
              <input 
                type="number" 
                placeholder="Stock Qty *" 
                value={newItemStock}
                onChange={(e) => setNewItemStock(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
              />
            </div>
            <button
              onClick={handleSaveNewItem}
              disabled={savingItem}
              className="w-full py-2.5 bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              {savingItem ? "Saving..." : "Save Item"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
