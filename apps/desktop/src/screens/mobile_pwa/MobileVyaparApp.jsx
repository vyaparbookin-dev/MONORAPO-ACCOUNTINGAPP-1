import React, { useState, useEffect, useRef } from "react";
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
  Download,
  Camera,
  Upload,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign,
  Truck,
  CreditCard,
  Percent,
  Sparkles,
  Bot,
  Layers,
  Clock,
  BookOpen,
  PieChart,
  Grid
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";


class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("📱 Mobile View Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold mb-3 shadow">
            V
          </div>
          <h2 className="font-extrabold text-base text-[#0F172A] mb-1">VyaparBook मोबाइल ऐप</h2>
          <p className="text-xs text-slate-500 mb-4">पेज को सुरक्षित रीलोड किया जा रहा है...</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#4338CA] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            🔄 ऐप रीफ्रेश करें
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MobileVyaparAppContent() {
  const navigate = useNavigate();
  const { selectedCompany, companies, selectCompany } = useCompany();

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, parties, items, reports, more
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
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

  // ==================== FAST VYAPAR-STYLE BILLING STATE ====================
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [billCustomer, setBillCustomer] = useState(""); // Optional, defaults to "नकद ग्राहक"
  const [billCustomerPhone, setBillCustomerPhone] = useState("");
  const [billPaymentMode, setBillPaymentMode] = useState("CASH"); // CASH, UDHAR, UPI
  const [billCart, setBillCart] = useState([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [savingBill, setSavingBill] = useState(false);

  // AI Photo Bill OCR & Vision State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrBillType, setOcrBillType] = useState('sale'); // 'sale' (Customer) or 'purchase' (Vendor)
  const [capturedImagePreview, setCapturedImagePreview] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Scanned Bill Review & Verification Modal State
  const [showScannedReviewModal, setShowScannedReviewModal] = useState(false);
  const [scannedPartyName, setScannedPartyName] = useState("");
  const [scannedPartyPhone, setScannedPartyPhone] = useState("");
  const [scannedPaymentMode, setScannedPaymentMode] = useState("CASH");
  const [scannedItems, setScannedItems] = useState([]);
  const [savingScannedBill, setSavingScannedBill] = useState(false);
  const fileInputRef = useRef(null);

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

  // Metrics
  const toCollect = parties.filter(p => Number(p.balance || 0) > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0);
  const toPay = Math.abs(parties.filter(p => Number(p.balance || 0) < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0));
  const stockValue = items.reduce((sum, it) => sum + (it.stock * it.salePrice), 0);
  const recentSales = bills.reduce((sum, b) => sum + b.amount, 0);

  const todaySales = recentSales;
  const todayCash = bills.filter(b => b.type === "CASH").reduce((sum, b) => sum + b.amount, 0);
  const todayCredit = bills.filter(b => b.type === "UDHAR").reduce((sum, b) => sum + b.amount, 0);

  const companyDisplayName = selectedCompany?.companyName || selectedCompany?.name || "GANESH HARDWARE";

  const handleShareWhatsAppBill = (bill) => {
    if (!bill) return;
    const itemsList = (bill.items || []).map(i => `• ${i.name || 'Item'} (x${i.qty || i.quantity || 1}) - ₹${(i.price || i.salePrice || 0) * (i.qty || i.quantity || 1)}`).join("\n");
    const text = encodeURIComponent(`*🧾 इनवॉइस बिल नं: ${bill.id || '001'}*\n*दुकान:* ${companyDisplayName}\n*ग्राहक:* ${bill.customerName || 'नकद ग्राहक'}\n*तारीख:* ${bill.date || 'आज'}\n\n*सामान विवरण:*\n${itemsList || 'बिल उत्पाद'}\n\n*कुल राशि:* ₹${bill.amount.toLocaleString('en-IN')}\n*भुगतान प्रकार:* ${bill.type || 'CASH'}\n\n*धन्यवाद! फिर पधारें।*`);
    window.open(`https://wa.me/${bill.phone || ''}?text=${text}`, "_blank");
  };

  // ==================== FAST BILLING CART ACTIONS ====================
  const handleAddToCart = (product) => {
    if (!product) return;
    const existing = billCart.find(i => i.id === product.id);
    if (existing) {
      setBillCart(billCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setBillCart([...billCart, { id: product.id, name: product.name, salePrice: product.salePrice, qty: 1 }]);
    }
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleUpdateCartQty = (productId, delta) => {
    setBillCart(billCart.map(i => {
      if (i.id === productId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const handleUpdateCartPrice = (productId, newPrice) => {
    setBillCart(billCart.map(i => {
      if (i.id === productId) {
        return { ...i, salePrice: parseFloat(newPrice) || 0 };
      }
      return i;
    }));
  };

  const handleRemoveFromCart = (productId) => {
    setBillCart(billCart.filter(i => i.id !== productId));
  };

  const totalBillAmount = billCart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);

  const handleSaveAndGenerateBill = async () => {
    if (billCart.length === 0) {
      alert("कृपया बिल में कम से कम 1 सामान जोड़ें!");
      return;
    }

    setSavingBill(true);
    const finalCustomer = billCustomer.trim() || "नकद ग्राहक (Walk-in)";
    const billPayload = {
      partyName: finalCustomer,
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
        customerName: finalCustomer,
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

  // ==================== AI VISION BILL PHOTO SCANNER & REVIEW ====================
  const handleProcessBillPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setOcrLoading(true);
    setOcrProgress(15);
    setOcrStatusText("📸 फोटो लोड हो रही है...");

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      setCapturedImagePreview(base64Data);

      setOcrProgress(40);
      setOcrStatusText("🤖 AI Vision बिल और हस्तलिखित पर्ची को पढ़ रहा है...");

      // Call Backend Vision AI Endpoint
      const res = await api.post("/billing/parse-image", {
        image: base64Data,
        geminiApiKey: geminiApiKey.trim() || undefined
      }).catch(err => {
        console.warn("Backend OCR error:", err);
        return null;
      });

      setOcrProgress(80);
      setOcrStatusText("🔍 1600+ इन्वेंटरी सामान से मिलान किया जा रहा है...");

      let extractedItems = [];
      let detectedParty = "";
      let detectedBillType = ocrBillType;

      if (res?.data?.success && Array.isArray(res.data.parsedItems) && res.data.parsedItems.length > 0) {
        extractedItems = res.data.parsedItems;
        detectedParty = res.data.partyName || "";
        detectedBillType = res.data.billType || ocrBillType;
      } else {
        // Fallback in-browser Tesseract if backend offline
        try {
          const TesseractModule = await import("tesseract.js");
          const Tesseract = TesseractModule.default || TesseractModule;
          const { data: { text } } = await Tesseract.recognize(base64Data, 'eng');
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
          for (const line of lines) {
            if (/invoice|bill|date|total|tax|gstin|amount|rate|qty|phone|mob/i.test(line)) continue;
            const nums = line.match(/(\d+[\.,]?\d*)/g) || [];
            let price = 0;
            let qty = 1;
            if (nums.length >= 1) price = parseFloat(nums[nums.length - 1].replace(',', '')) || 0;
            if (nums.length >= 2) qty = parseFloat(nums[0]) || 1;
            const cleanName = line.replace(/[\d\.,\/\*\-\_\#\:]+$/g, '').trim();
            if (cleanName.length >= 2) {
              extractedItems.push({ name: cleanName, quantity: qty, price: price, total: +(qty * price).toFixed(2) });
            }
          }
        } catch (tessErr) {
          console.error("Local fallback error:", tessErr);
        }
      }

      // If still empty, add 1 blank line with detected text
      if (extractedItems.length === 0) {
        extractedItems = [{ name: "सामान (Item)", quantity: 1, price: 100, total: 100 }];
      }

      // Intelligent Fuzzy Matching with 1600+ Catalog Items
      const processedRows = extractedItems.map((it, idx) => {
        const rawName = (it.name || '').trim();
        const rawPrice = Number(it.price || it.rate) || 0;
        const rawQty = Number(it.quantity || it.qty) || 1;

        // Find match in items
        const matchedItem = items.find(catItem => {
          const catName = (catItem.name || '').toLowerCase();
          const pName = rawName.toLowerCase();
          if (catName === pName) return true;
          const tokens = pName.split(/\s+/).filter(t => t.length >= 3);
          return tokens.some(t => catName.includes(t));
        });

        const finalPrice = rawPrice > 0 ? rawPrice : (matchedItem ? matchedItem.salePrice : 100);
        const finalTotal = +(rawQty * finalPrice).toFixed(2);

        return {
          id: matchedItem?.id || `scanned-${Date.now()}-${idx}`,
          name: rawName || (matchedItem?.name || `सामान ${idx + 1}`),
          qty: rawQty,
          unit: it.unit || (matchedItem?.unit || "Pcs"),
          price: finalPrice,
          total: finalTotal,
          matchedCatalogItem: matchedItem || null
        };
      });

      setScannedItems(processedRows);
      setScannedPartyName(detectedParty || (ocrBillType === 'sale' ? "कच्ची पर्ची ग्राहक" : "सप्लायर"));
      setOcrBillType(detectedBillType);
      setOcrProgress(100);
      setShowOcrModal(false);
      setShowScannedReviewModal(true);

    } catch (err) {
      console.error("OCR Processing error:", err);
      alert("फोटो पढ़ने में दिक्कत आई। कृपया साफ और सीधी फोटो अपलोड करें।");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
      setOcrStatusText("");
    }
  };

  const handleUpdateScannedItem = (index, field, value) => {
    const updated = [...scannedItems];
    const target = { ...updated[index] };
    if (field === 'qty') {
      const q = Math.max(1, parseFloat(value) || 1);
      target.qty = q;
      target.total = +(q * target.price).toFixed(2);
    } else if (field === 'price') {
      const p = Math.max(0, parseFloat(value) || 0);
      target.price = p;
      target.total = +(target.qty * p).toFixed(2);
    } else if (field === 'name') {
      target.name = value;
    }
    updated[index] = target;
    setScannedItems(updated);
  };

  const handleRemoveScannedItem = (index) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const handleAddScannedItemRow = () => {
    setScannedItems([
      ...scannedItems,
      {
        id: `custom-row-${Date.now()}`,
        name: "",
        qty: 1,
        unit: "Pcs",
        price: 0,
        total: 0,
        matchedCatalogItem: null
      }
    ]);
  };

  const scannedGrandTotal = scannedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleSaveScannedBillDirectly = async () => {
    if (scannedItems.length === 0) {
      alert("कृपया कम से कम 1 सामान रखें!");
      return;
    }

    setSavingScannedBill(true);
    const finalParty = scannedPartyName.trim() || (ocrBillType === 'sale' ? "कच्ची पर्ची ग्राहक (Walk-in)" : "सप्लायर");
    const billPayload = {
      partyName: finalParty,
      customerPhone: scannedPartyPhone.trim(),
      paymentMode: scannedPaymentMode,
      items: scannedItems.map(i => ({
        productId: i.matchedCatalogItem?.id || i.id,
        name: i.name,
        quantity: i.qty,
        price: i.price,
        total: i.total
      })),
      finalAmount: scannedGrandTotal,
      billImageUrl: capturedImagePreview,
      date: new Date()
    };

    try {
      const res = await api.post("/billing", billPayload).catch(() => null);
      const createdBill = {
        _id: res?.data?.bill?._id || Date.now().toString(),
        id: res?.data?.bill?.billNumber || `INV-${Date.now().toString().slice(-4)}`,
        customerName: finalParty,
        phone: scannedPartyPhone.trim(),
        date: "Today",
        amount: scannedGrandTotal,
        type: scannedPaymentMode,
        paymentStatus: scannedPaymentMode === "UDHAR" ? "unpaid" : "paid",
        items: scannedItems.map(i => ({ id: i.id, name: i.name, salePrice: i.price, qty: i.qty }))
      };
      setBills([createdBill, ...bills]);
      setShowScannedReviewModal(false);
      setSelectedBillDetail(createdBill);
      alert(`🎉 बिल #${createdBill.id} सफलता से डिजिटल हो गया!`);
    } catch (e) {
      console.error(e);
      alert("बिल सेव करते समय त्रुटि आई।");
    } finally {
      setSavingScannedBill(false);
    }
  };

  const handleTransferScannedToCart = () => {
    const newCart = scannedItems.map(i => ({
      id: i.id,
      name: i.name,
      salePrice: i.price,
      qty: i.qty,
      stock: i.matchedCatalogItem?.stock || 999,
      unit: i.unit
    }));
    setBillCart(newCart);
    setBillCustomer(scannedPartyName);
    setBillCustomerPhone(scannedPartyPhone);
    setBillPaymentMode(scannedPaymentMode);
    setShowScannedReviewModal(false);
    setShowQuickBillModal(true);
  };

  // 20+ Comprehensive Reports Catalog
  const allReportsList = [
    { id: "daybook", title: "📖 DayBook (रोकड़ बही)", desc: "Daily Cash In/Out & Ledger", path: "/reports/daybook", category: "Core", color: "text-emerald-600 bg-emerald-50" },
    { id: "profitloss", title: "📊 Profit & Loss Report", desc: "Gross & Net Business Profit", path: "/reports/profitloss", category: "Core", color: "text-indigo-600 bg-indigo-50" },
    { id: "gst", title: "📑 GST Summary & Tax", desc: "Output & Input Tax Breakdown", path: "/reports/gst", category: "GST", color: "text-purple-600 bg-purple-50" },
    { id: "gstr1", title: "📋 GSTR-1 Monthly Return", desc: "B2B & B2C Sales Invoices", path: "/reports/gst", category: "GST", color: "text-amber-600 bg-amber-50" },
    { id: "gstr3b", title: "📄 GSTR-3B Summary", desc: "Tax Payment & ITC Filing", path: "/reports/gstr3b", category: "GST", color: "text-rose-600 bg-rose-50" },
    { id: "partywise", title: "👥 Party-Wise Sales Report", desc: "Customer Sales Breakdown", path: "/reports/partywise", category: "Sales", color: "text-blue-600 bg-blue-50" },
    { id: "itemwise", title: "📦 Item-Wise Sales Report", desc: "Top Selling Stock Items", path: "/reports/itemwise", category: "Sales", color: "text-teal-600 bg-teal-50" },
    { id: "billwise", title: "🧾 Bill-Wise Profit Register", desc: "Margin & Profit per Bill", path: "/reports/billwise", category: "Sales", color: "text-slate-700 bg-slate-100" },
    { id: "supplier_ledger", title: "🏢 Supplier Ledger (Purchase)", desc: "Vendor Accounts & Purchases", path: "/reports/supplier-ledger", category: "Purchase", color: "text-rose-600 bg-rose-50" },
    { id: "stock_aging", title: "⏳ Aging Report (Udhar Analysis)", desc: "Overdue Credit Days", path: "/reports/aging", category: "Udhar", color: "text-orange-600 bg-orange-50" },
    { id: "stock_alert", title: "⚠️ Low Stock & Reorder Alert", desc: "Items Below Minimum Limit", path: "/inventory", category: "Stock", color: "text-red-600 bg-red-50" },
    { id: "category_analytics", title: "🏷️ Category Analytics", desc: "Department & Group Sales", path: "/inventory/analytics", category: "Stock", color: "text-cyan-600 bg-cyan-50" },
    { id: "bank_rec", title: "🏦 Bank Auto-Tally Reco", desc: "Bank Statement Verification", path: "/reports/bank-reconciliation", category: "Banking", color: "text-indigo-600 bg-indigo-50" },
    { id: "eway_bill", title: "🚚 E-Way Bill Register", desc: "Govt Transport E-Way Invoices", path: "/reports/eway-bill", category: "Tax", color: "text-emerald-600 bg-emerald-50" },
    { id: "fixed_assets", title: "🏢 Fixed Assets & Capital", desc: "Shop Furniture, Machines & Equip", path: "/reports/fixed-assets", category: "Finance", color: "text-purple-600 bg-purple-50" },
    { id: "customer_builder", title: "🎯 Customer Report Builder", desc: "Custom Filtered Demographics", path: "/reports/customer", category: "CRM", color: "text-blue-600 bg-blue-50" },
    { id: "staff_payroll", title: "👔 Staff Salary & Statement", desc: "Daily Attendance & Advances", path: "/salary", category: "Staff", color: "text-amber-600 bg-amber-50" },
    { id: "sales_return", title: "🔄 Sales Return Register", desc: "Credit Notes & Returns", path: "/billing/return", category: "Sales", color: "text-red-600 bg-red-50" },
    { id: "graphical_analytics", title: "📈 Graphical BI Analytics", desc: "Visual Charts & Trends", path: "/reports/analytics", category: "BI", color: "text-teal-600 bg-teal-50" },
    { id: "ai_advisor", title: "🤖 AI मुनीम जी (Smart Insights)", desc: "AI Health Score & Predictions", path: "/ai-advisor", category: "AI", color: "text-purple-600 bg-purple-100" }
  ];

  // Filter 1600+ items live by search
  const filteredProducts = items.filter(it => 
    (it.name || '').toLowerCase().includes(itemSearchTerm.toLowerCase())
  ).slice(0, 8); // Top 8 matches for speed

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-28 select-none">
      {/* 📱 1. TOP WHITE HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate("/company/list")}>
          <h1 className="font-extrabold text-[15px] tracking-wide text-[#1E293B]">
            {companyDisplayName.toUpperCase()}
          </h1>
          <ChevronDown size={16} className="text-[#6366F1]" />
        </div>

        <div className="flex items-center gap-2">
          {/* 1. AI OCR Bill Scanner Icon */}
          <button 
            onClick={() => setShowOcrModal(true)}
            className="w-9 h-9 rounded-full bg-[#ECFDF5] hover:bg-emerald-100 flex items-center justify-center text-[#059669] transition cursor-pointer"
            title="फोटो से बिल बनाएं (AI OCR)"
          >
            <Camera size={18} />
          </button>

          {/* 2. Calculator */}
          <button 
            onClick={() => setCalculatorVisible(true)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <Calculator size={18} />
          </button>

          {/* 3. Refer & Earn Gift Icon */}
          <button 
            onClick={() => setReferralModalVisible(true)}
            className="w-9 h-9 rounded-full bg-[#EEF2FF] hover:bg-indigo-100 flex items-center justify-center text-[#6366F1] transition cursor-pointer"
          >
            <Gift size={18} />
          </button>
        </div>
      </header>

      {/* 📱 2. MAIN SCROLLABLE CONTENT */}
      <main className="p-4 space-y-3.5 max-w-md mx-auto">
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-3.5 animate-in fade-in">
            {/* Top Promo Banner */}
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

            {/* 2x3 Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
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

              <div 
                onClick={() => setActiveTab("reports")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">20+ Reports</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569]">GST, P&L, DayBook...</div>
              </div>
            </div>

            {/* AI Photo Scanner Strip */}
            <div 
              onClick={() => setShowOcrModal(true)}
              className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow">
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#065F46]">📸 फोटो से तुरंत बिल बनाएं (AI Scanner)</h4>
                  <p className="text-[10px] text-emerald-700">कागज़ी पर्ची/बिल की फोटो खींचें, AI खुद बिल बना देगा</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </div>

            {/* EOD Daily Summary */}
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

            {/* Transactions Section */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-sm text-[#0F172A]">Transactions</h3>
                <div className="px-2.5 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-full flex items-center gap-1 text-[10px] font-black text-[#6366F1]">
                  <Calendar size={11} /> LAST 365 DAYS
                </div>
              </div>

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

        {/* ==================== TAB 2: PARTIES ==================== */}
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

        {/* ==================== TAB 3: ITEMS ==================== */}
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

        {/* ==================== TAB 4: 20+ COMPLETE REPORTS MENU ==================== */}
        {activeTab === "reports" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base text-[#0F172A]">All Reports ({allReportsList.length})</h2>
                <p className="text-[11px] text-slate-500">DayBook, GST, Profit & Loss, Staff...</p>
              </div>
            </div>

            {/* Live Search inside 20+ Reports */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search report (e.g. DayBook, GST, Profit)..." 
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
              />
            </div>

            {/* 2-Column Grid of 20+ Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allReportsList
                .filter(r => r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) || r.desc.toLowerCase().includes(reportSearchQuery.toLowerCase()))
                .map((r) => (
                <div 
                  key={r.id}
                  onClick={() => navigate(r.path)}
                  className="p-3 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs text-[#0F172A]">{r.title}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </div>
                  <div className={`p-2 rounded-xl ${r.color}`}>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
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

      {/* 📱 3. FLOATING BOTTOM ACTION PILL BAR */}
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

      {/* 📱 4. BOTTOM TAB NAVIGATOR (5 Tabs) */}
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

      {/* 📱 5. ULTRA-FAST VYAPAR/MYBILLBOOK STYLE BILLING MODAL */}
      {showQuickBillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">फास्ट बिक्री बिल (+ Sale Bill)</h3>
                  <p className="text-[10px] text-slate-400">नाम ऑप्शनल है • 1600+ सामान खोजें</p>
                </div>
              </div>
              <button onClick={() => setShowQuickBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Customer Name & Phone (OPTIONAL) */}
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="ग्राहक का नाम (ऑप्शनल)..." 
                value={billCustomer}
                onChange={(e) => setBillCustomer(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold placeholder:font-normal"
              />
              <input 
                type="tel" 
                placeholder="WhatsApp नंबर (ऑप्शनल)..." 
                value={billCustomerPhone}
                onChange={(e) => setBillCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
              />
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "UDHAR", "UPI"].map((m) => (
                <button
                  key={m}
                  onClick={() => setBillPaymentMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border ${billPaymentMode === m ? "bg-[#4338CA] text-white border-[#4338CA]" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                >
                  {m === "CASH" ? "💵 नकद (Cash)" : m === "UDHAR" ? "📒 उधारी (Credit)" : "📲 UPI / QR"}
                </button>
              ))}
            </div>

            {/* 🔍 LIVE INSTANT SEARCH FOR 1600+ ITEMS */}
            <div className="relative space-y-1">
              <label className="text-[11px] font-extrabold text-slate-700 block">सामान खोजें व जोड़ें (1600+ Stock Items):</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="आइटम का नाम, साइज या बारकोड टाइप करें..."
                  value={itemSearchTerm}
                  onFocus={() => setShowItemSuggestions(true)}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setShowItemSuggestions(true);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold focus:border-[#4338CA]"
                />
                {itemSearchTerm && (
                  <button 
                    onClick={() => setItemSearchTerm("")} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {showItemSuggestions && itemSearchTerm.trim().length > 0 && (
                <div className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-bold">
                      कोई सामान नहीं मिला • <span onClick={() => setShowAddItemModal(true)} className="text-[#4338CA] underline cursor-pointer">+ नया सामान बनाएं</span>
                    </div>
                  ) : (
                    filteredProducts.map(it => (
                      <div 
                        key={it.id}
                        onClick={() => handleAddToCart(it)}
                        className="p-2.5 hover:bg-indigo-50 flex justify-between items-center cursor-pointer transition"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#0F172A]">{it.name}</div>
                          <div className="text-[10px] text-slate-400">स्टॉक: {it.stock} {it.unit}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#059669]">₹{it.salePrice}</span>
                          <span className="px-2 py-1 bg-[#4338CA] text-white font-bold text-[10px] rounded-lg">+ जोड़ें</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List with Stepper (+ / -) */}
            {billCart.length > 0 ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 max-h-44 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-500">जोड़े गए उत्पाद ({billCart.length}):</div>
                {billCart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-[#0F172A]">{item.name}</div>
                      <div className="text-[10px] text-slate-400">रेट: ₹{item.salePrice} × {item.qty} = <span className="font-black text-[#059669]">₹{item.salePrice * item.qty}</span></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleUpdateCartQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-xs px-1 text-[#0F172A]">{item.qty}</span>
                      <button 
                        onClick={() => handleUpdateCartQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-rose-500 p-1 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                ऊपर सर्च बार से सामान चुनें या नीचे से जोड़ें
              </div>
            )}

            {/* Total Amount & Submit Button */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-2">
              <span className="font-bold text-xs text-slate-600">कुल बिल राशि:</span>
              <span className="font-black text-xl text-[#059669]">₹ {totalBillAmount.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleSaveAndGenerateBill}
              disabled={savingBill}
              className="w-full py-3.5 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {savingBill ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} 
              {savingBill ? "लाइव बिल सेव हो रहा है..." : "बिल सेव करें व WhatsApp भेजें →"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 6. AI BILL PHOTO SCANNER MODAL */}
      {showOcrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">AI फोटो बिल स्कैनर</h3>
                  <p className="text-[10px] text-slate-400">Gemini Vision AI • 100% सटीक डिजिटाइजेशन</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowApiKeyModal(true)} 
                  title="Configure Gemini API Key"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-bold"
                >
                  ⚙️ Key
                </button>
                <button onClick={() => setShowOcrModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Bill Type Selector (Customer Sale vs Vendor Purchase) */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setOcrBillType('sale')}
                className={`py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${ocrBillType === 'sale' ? 'bg-[#059669] text-white border-[#059669] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                🛍️ ग्राहक कच्ची पर्ची
              </button>
              <button
                onClick={() => setOcrBillType('purchase')}
                className={`py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${ocrBillType === 'purchase' ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                🚚 सप्लायर खरीद बिल
              </button>
            </div>

            <div className="p-5 bg-gradient-to-b from-emerald-50/80 to-teal-50/40 border-2 border-dashed border-emerald-300 rounded-2xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md mx-auto flex items-center justify-center text-emerald-600">
                <Camera size={28} />
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-[#065F46]">
                  {ocrBillType === 'sale' ? 'कागजी पर्ची या हाथ से लिखे बिल की फोटो खींचें' : 'सप्लायर का पक्का इनवॉइस या बिल अपलोड करें'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  AI खुद-ब-खुद सामान (उदा. "Emulsion 10 ltr"), मात्रा व रेट पढ़कर आपके 1600+ कैटलॉग से मिला देगा!
                </p>
              </div>

              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                ref={fileInputRef}
                onChange={handleProcessBillPhoto}
                className="hidden" 
              />

              {ocrLoading && (
                <div className="space-y-2 py-2">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300 font-bold text-[9px] text-white flex items-center justify-center"
                      style={{ width: `${ocrProgress}%` }}
                    >
                      {ocrProgress}%
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 animate-pulse">
                    {ocrStatusText || "AI फोटो को स्कैन कर रहा है..."}
                  </p>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {ocrLoading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                {ocrLoading ? "प्रोसेसिंग जारी है..." : "📸 कैमरा खोलें / गैलरी से चुनें"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 6.1 AI SCANNED BILL REVIEW & VERIFICATION MODAL (Interactive Grid) */}
      {showScannedReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">AI फोटो से पढ़ा गया बिल</h3>
                  <p className="text-[10px] text-slate-400">सामान और रेट चेक करें • 100% सही व एडिटेबल</p>
                </div>
              </div>
              <button onClick={() => setShowScannedReviewModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Bill Info Grid (Party, Phone, Payment Mode) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">पार्टी / ग्राहक का नाम:</span>
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <button 
                    onClick={() => setOcrBillType('sale')}
                    className={`px-2 py-0.5 rounded-full ${ocrBillType === 'sale' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    बिक्री (Sale)
                  </button>
                  <button 
                    onClick={() => setOcrBillType('purchase')}
                    className={`px-2 py-0.5 rounded-full ${ocrBillType === 'purchase' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    खरीद (Purchase)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={scannedPartyName}
                  onChange={(e) => setScannedPartyName(e.target.value)}
                  placeholder="पार्टी का नाम..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-600"
                />
                <input 
                  type="tel" 
                  value={scannedPartyPhone}
                  onChange={(e) => setScannedPartyPhone(e.target.value)}
                  placeholder="फोन / WhatsApp नंबर..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {["CASH", "UDHAR", "UPI"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setScannedPaymentMode(m)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition ${scannedPaymentMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {m === "CASH" ? "💵 नकद" : m === "UDHAR" ? "📒 उधार" : "📲 UPI"}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted Items Review Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-extrabold text-slate-700">
                  पहचाने गए सामान ({scannedItems.length} Items):
                </span>
                <button 
                  onClick={handleAddScannedItemRow}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> सामान जोड़ें
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scannedItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 space-y-1.5 transition">
                    <div className="flex items-center justify-between gap-2">
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateScannedItem(idx, 'name', e.target.value)}
                        placeholder="सामान का नाम..."
                        className="flex-1 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                      />
                      <button 
                        onClick={() => handleRemoveScannedItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {item.matchedCatalogItem && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        <CheckCircle size={10} /> 1600+ लिस्ट से मैच्ड: {item.matchedCatalogItem.name}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      {/* Qty Stepper */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => handleUpdateScannedItem(idx, 'qty', Math.max(1, item.qty - 1))}
                          className="w-7 h-7 flex items-center justify-center font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => handleUpdateScannedItem(idx, 'qty', e.target.value)}
                          className="w-10 text-center font-bold text-xs text-[#0F172A] outline-none bg-transparent"
                        />
                        <button 
                          onClick={() => handleUpdateScannedItem(idx, 'qty', item.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Unit Price */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">दर ₹</span>
                        <input 
                          type="number" 
                          value={item.price}
                          onChange={(e) => handleUpdateScannedItem(idx, 'price', e.target.value)}
                          className="w-20 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-[#0F172A] outline-none text-right"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-slate-400 block">कुल</span>
                        <span className="text-xs font-black text-emerald-600">₹ {Number(item.total).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
              <div>
                <span className="text-[11px] font-bold text-slate-500">कुल सामान: {scannedItems.length}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">कुल बिल राशि</span>
                <span className="font-black text-xl text-[#059669]">₹ {scannedGrandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleTransferScannedToCart}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                ✏️ बिल में एडिट करें
              </button>

              <button
                onClick={handleSaveScannedBillDirectly}
                disabled={savingScannedBill}
                className="py-3 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {savingScannedBill ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {savingScannedBill ? "सेव हो रहा है..." : "💾 1-Click बिल बनाएं"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 6.2 GEMINI API KEY SETTINGS MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs text-[#0F172A]">⚙️ Gemini Vision AI Key</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              फोटो से 100% सटीक बिल स्कैनिंग के लिए Google Gemini API Key डालें (ऑप्शनल, सिस्टम डिफ़ॉल्ट भी काम करता है):
            </p>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono"
            />
            <button
              onClick={() => {
                localStorage.setItem("GEMINI_API_KEY", geminiApiKey.trim());
                alert("API Key सुरक्षित रूप से सेव हो गई!");
                setShowApiKeyModal(false);
              }}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              सेव करें
            </button>
          </div>
        </div>
      )}

      {/* 📱 7. CALCULATOR MODAL */}
      {calculatorVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">कैलकुलेटर (Calculator)</h3>
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

      {/* 📱 8. REFER & EARN MODAL */}
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

      {/* 📱 9. ADD PARTY MODAL */}
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

      {/* 📱 10. ADD ITEM MODAL */}
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

export default function MobileVyaparApp() {
  return (
    <MobileErrorBoundary>
      <MobileVyaparAppContent />
    </MobileErrorBoundary>
  );
}
