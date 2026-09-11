import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  ShoppingCart,
  Save,
  Search,
  Trash2,
  Monitor,
  LayoutGrid,
  List,
  Utensils,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Minus,
  Image as ImageIcon,
  Camera,
  Mic,
  ChevronUp,
  ChevronDown,
  Sparkles,
  X,
  FileText,
  Gift,
  CheckCircle,
  Users,
  Sliders,
  Store,
  Layers,
  Phone
} from "lucide-react";
import RestaurantKotModal from "../../components/modals/RestaurantKotModal";
import { getBusinessMode } from "../../utils/businessMode";
import { useCompany } from "../../contexts/CompanyContext";

const DEFAULT_RESTAURANT_DISHES = [
  {
    _id: "dish_1",
    name: "Shahi Paneer Butter Masala",
    sellingPrice: 240,
    price: 240,
    category: "Main Course",
    currentStock: 80,
    unit: "Plate",
    barcode: "1001",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300"
  },
  {
    _id: "dish_2",
    name: "Butter Garlic Tandoori Naan",
    sellingPrice: 45,
    price: 45,
    category: "Breads",
    currentStock: 200,
    unit: "pc",
    barcode: "1002",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300"
  },
  {
    _id: "dish_3",
    name: "Veg Dum Biryani with Raita",
    sellingPrice: 190,
    price: 190,
    category: "Rice & Biryani",
    currentStock: 50,
    unit: "Plate",
    barcode: "1003",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300"
  },
  {
    _id: "dish_4",
    name: "Cold Coffee with Ice Cream",
    sellingPrice: 95,
    price: 95,
    category: "Beverages",
    currentStock: 100,
    unit: "Glass",
    barcode: "1004",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300"
  },
  {
    _id: "dish_5",
    name: "Crispy Cheese Veg Burger",
    sellingPrice: 110,
    price: 110,
    category: "Fast Food",
    currentStock: 60,
    unit: "pc",
    barcode: "1005",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"
  },
  {
    _id: "dish_6",
    name: "Farmhouse Loaded Pizza (8 inch)",
    sellingPrice: 220,
    price: 220,
    category: "Fast Food",
    currentStock: 40,
    unit: "pc",
    barcode: "1006",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300"
  },
  {
    _id: "dish_7",
    name: "Dal Makhani Special",
    sellingPrice: 180,
    price: 180,
    category: "Main Course",
    currentStock: 70,
    unit: "Plate",
    barcode: "1007",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300"
  },
  {
    _id: "dish_8",
    name: "Paneer Tikka Dry",
    sellingPrice: 210,
    price: 210,
    category: "Starters",
    currentStock: 45,
    unit: "Plate",
    barcode: "1008",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300"
  },
  {
    _id: "dish_9",
    name: "Fresh Lime Soda / Mojito",
    sellingPrice: 70,
    price: 70,
    category: "Beverages",
    currentStock: 120,
    unit: "Glass",
    barcode: "1009",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300"
  },
  {
    _id: "dish_10",
    name: "Gulab Jamun with Rabdi (2 pcs)",
    sellingPrice: 80,
    price: 80,
    category: "Desserts",
    currentStock: 90,
    unit: "Portion",
    barcode: "1010",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"
  }
];

export default function FastPOSPage() {
  // --- 🏢 MULTI-COUNTER BILLING TABS ---
  const [activeCounterTab, setActiveCounterTab] = useState("counter_1");
  const [counterTabs, setCounterTabs] = useState([
    {
      id: "counter_1",
      counterName: "Counter 1 (Main Cashier)",
      cart: [],
      customerName: "Rahul Verma",
      customerMobile: "7828289433",
      customerAddress: "Main Market Road",
      selectedTable: "Table 3 (AC Hall - 6 Seater)",
      appliedCoupon: null
    },
    {
      id: "counter_2",
      counterName: "Counter 2 (Takeaway / Bar)",
      cart: [],
      customerName: "",
      customerMobile: "",
      customerAddress: "",
      selectedTable: "🛍️ Parcel / Takeaway (No Table)",
      appliedCoupon: null
    }
  ]);

  const currentActiveTab = counterTabs.find(t => t.id === activeCounterTab) || counterTabs[0];

  const cart = currentActiveTab.cart;
  const customerName = currentActiveTab.customerName;
  const customerMobile = currentActiveTab.customerMobile;
  const customerAddress = currentActiveTab.customerAddress;
  const selectedTable = currentActiveTab.selectedTable;
  const appliedCoupon = currentActiveTab.appliedCoupon;

  const updateActiveTab = (updater) => {
    setCounterTabs(prev => prev.map(tab => {
      if (tab.id === activeCounterTab) {
        return typeof updater === 'function' ? updater(tab) : { ...tab, ...updater };
      }
      return tab;
    }));
  };

  const setCart = (newCartOrFn) => {
    updateActiveTab(tab => ({
      ...tab,
      cart: typeof newCartOrFn === 'function' ? newCartOrFn(tab.cart) : newCartOrFn
    }));
  };

  const setCustomerName = (val) => updateActiveTab({ customerName: val });
  const setCustomerMobile = (val) => updateActiveTab({ customerMobile: val });
  const setCustomerAddress = (val) => updateActiveTab({ customerAddress: val });
  const setSelectedTable = (val) => updateActiveTab({ selectedTable: val });
  const setAppliedCoupon = (val) => updateActiveTab({ appliedCoupon: val });

  const [barcode, setBarcode] = useState("");
  const [products, setProducts] = useState(DEFAULT_RESTAURANT_DISHES);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dual View Mode: 'tiles' (Food/Visual Grid with images) or 'list' (Fast Table/Keyboard mode)
  const [viewMode, setViewMode] = useState("tiles");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  // Customer Insights
  const [customerInsight, setCustomerInsight] = useState(null);

  // Modals & Bottom Bar State
  const [showKotModal, setShowKotModal] = useState(false);
  const [showSlipScanner, setShowSlipScanner] = useState(false);
  const [slipImage, setSlipImage] = useState(null);
  const [slipText, setSlipText] = useState("");
  const [isBottomCartExpanded, setIsBottomCartExpanded] = useState(false);

  // --- ⏰ OWNER CONTROLLED HAPPY HOURS STATE ---
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [happyHourConfig, setHappyHourConfig] = useState(() => {
    const saved = localStorage.getItem("vb_happy_hours");
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      startHour: 12, // 12 PM
      endHour: 17,   // 5 PM
      discountPercent: 20,
      categories: ["Fast Food", "Beverages", "Snacks", "Main Course", "Starters", "Breads", "Rice & Biryani", "Desserts", "Restaurant"]
    };
  });
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);

  // --- 🚫 OUT OF STOCK (86 ITEM) TOGGLE STATE ---
  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    const saved = localStorage.getItem("vb_out_of_stock");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 🔔 LIVE KITCHEN-TO-CASHIER ACTIVE ORDERS & SLA TIMINGS ---
  const [activeKotOrders, setActiveKotOrders] = useState([
    {
      id: "KOT-101",
      table: "Table 3 (AC Hall - 6 Seater)",
      waiter: "Rohan",
      placedAt: new Date(Date.now() - 14 * 60000),
      prepTimeMinutes: 11,
      status: "READY",
      items: [{ name: "Shahi Paneer", qty: 1 }, { name: "Butter Garlic Naan", qty: 4 }]
    },
    {
      id: "KOT-102",
      table: "Table 4 (Garden - 8 Seater)",
      waiter: "Sunil",
      placedAt: new Date(Date.now() - 24 * 60000),
      prepTimeMinutes: 24,
      status: "COOKING",
      items: [{ name: "Veg Dum Biryani", qty: 2 }, { name: "Cold Coffee", qty: 2 }]
    }
  ]);

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [showCouponAuthModal, setShowCouponAuthModal] = useState(false);
  const [pendingCouponAuth, setPendingCouponAuth] = useState(null);
  const [enteredAuthOtp, setEnteredAuthOtp] = useState("");
  const [authOtpError, setAuthOtpError] = useState("");
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", category: "Fast Food", stock: 50, barcode: "" });
  const [feedbackBillData, setFeedbackBillData] = useState(null);

  // Check if current time falls into Happy Hours
  const isCurrentTimeInHappyHours = () => {
    if (!happyHourConfig.isEnabled) return false;
    const currentHour = new Date().getHours();
    return currentHour >= happyHourConfig.startHour && currentHour < happyHourConfig.endHour;
  };
  const isHappyHourActive = isCurrentTimeInHappyHours();

  // Save happy hour changes
  const handleSaveHappyHourConfig = (newConfig) => {
    setHappyHourConfig(newConfig);
    localStorage.setItem("vb_happy_hours", JSON.stringify(newConfig));
    setShowHappyHourModal(false);
    alert(`🎉 Happy Hours सेटिंग्स सेव हो गई! (${newConfig.discountPercent}% छूट: ${newConfig.startHour}:00 से ${newConfig.endHour}:00 बजे)`);
  };

  // Toggle Item Stock
  const toggleItemStock = (prodId, e) => {
    if (e) e.stopPropagation();
    setOutOfStockItems(prev => {
      const updated = prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId];
      localStorage.setItem("vb_out_of_stock", JSON.stringify(updated));
      return updated;
    });
  };

  // Mark KOT Order as Ready or Served
  const handleUpdateKotStatus = (kotId, newStatus) => {
    setActiveKotOrders(prev => prev.map(k => k.id === kotId ? { ...k, status: newStatus } : k));
  };

  const { selectedCompany } = useCompany();
  const business = getBusinessMode(selectedCompany);

  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        customerNameInputRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        triggerCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Customer Insights Calculator
  useEffect(() => {
    if (customerMobile.trim().length >= 10 || (customerName.trim().length >= 3 && !customerMobile)) {
      const matchedBills = bills.filter(
        (b) =>
          (customerMobile && b.customerMobile === customerMobile.trim()) ||
          (customerName && b.customerName?.toLowerCase() === customerName.trim().toLowerCase())
      );

      if (matchedBills.length > 0) {
        const totalSpent = matchedBills.reduce((sum, b) => sum + (b.total || b.finalAmount || 0), 0);
        const avgSpent = Math.round(totalSpent / matchedBills.length);
        const lastBill = matchedBills[0];
        const lastDate = new Date(lastBill.createdAt || lastBill.date || Date.now()).toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        setCustomerInsight({
          totalVisits: matchedBills.length,
          lastVisitDate: lastDate,
          totalSpent,
          avgSpent,
        });
      } else {
        setCustomerInsight(null);
      }
    } else {
      setCustomerInsight(null);
    }
  }, [customerMobile, customerName, bills]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/inventory").catch(() => ({ data: [] }));
      const productList = res.data?.products || res.data || [];
      if (productList.length > 0) {
        setProducts(productList.filter(Boolean));
      } else {
        setProducts(DEFAULT_RESTAURANT_DISHES);
      }
    } catch (err) {
      console.error(err);
      setProducts(DEFAULT_RESTAURANT_DISHES);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await api.get("/api/billing?limit=500").catch(() => ({ data: [] }));
      const billList = res.data?.bills || res.data || [];
      setBills(billList);
    } catch (err) {
      console.error(err);
    }
  };

  // Extract Categories
  const categories = ["All", ...new Set(products.map((p) => p.category || "General").filter(Boolean))];

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || (p.category || "General") === selectedCategory;
    const matchesSearch =
      !searchFilter ||
      p.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.barcode?.includes(searchFilter) ||
      p.sku?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Barcode scan or manual entry
  const handleSearch = (e) => {
    if (e.key === "Enter" && barcode.trim() !== "") {
      e.preventDefault();
      const foundProduct = products.find(
        (p) =>
          p &&
          (String(p.barcode) === barcode ||
            String(p.sku) === barcode ||
            String(p.name || "").toLowerCase() === barcode.toLowerCase())
      );

      if (foundProduct) {
        addToCart(foundProduct);
      } else {
        alert("Product not found! Please check the barcode or name.");
      }
      setBarcode("");
    }
  };

  const addToCart = (product) => {
    const prodId = product._id || product.uuid || product.id;
    if (outOfStockItems.includes(prodId)) {
      alert("⚠️ यह आइटम 'Out of Stock' है! कृपया किचन में सामान उपलब्ध होने पर इसे चालू करें।");
      return;
    }
    
    let price = parseFloat(product.sellingPrice || product.price || 0);
    const cat = product.category || "General";
    if (isHappyHourActive && (happyHourConfig.categories.includes(cat) || happyHourConfig.categories.includes("All"))) {
      price = Math.round(price * (1 - happyHourConfig.discountPercent / 100));
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === prodId);
      if (existing) {
        return prev.map((item) =>
          item.productId === prodId
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * price }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: prodId,
          name: product.name,
          category: product.category || "General",
          rate: price,
          quantity: 1,
          unit: product.unit || "pcs",
          image: product.image || "",
          total: price,
        },
      ];
    });
  };

  const handleQuantityChange = (idx, newQty) => {
    if (isNaN(newQty) || newQty <= 0) {
      removeFromCart(idx);
      return;
    }
    setCart((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: newQty, total: newQty * item.rate } : item))
    );
  };

  const removeFromCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    const redeemedCoupons = JSON.parse(localStorage.getItem("vb_redeemed_coupons") || "[]");
    const alreadyRedeemed = redeemedCoupons.find(c => c.code.toUpperCase() === cleanCode);
    if (alreadyRedeemed) {
      setCouponError(`❌ यह कूपन पहले ही दिनांक ${new Date(alreadyRedeemed.redeemedAt).toLocaleDateString("hi-IN")} को बिल #${alreadyRedeemed.billNumber} में उपयोग हो चुका है!`);
      return;
    }

    let couponData = null;
    if (cleanCode.startsWith("SAVE100") || cleanCode === "SAVE100") {
      couponData = { code: cleanCode, type: "FLAT", discount: 100, title: "₹100 की फ्लैट छूट", minBill: 500, phoneLink: cleanCode.includes("-") ? cleanCode.split("-")[1] : "" };
    } else if (cleanCode.startsWith("BURGER30") || cleanCode === "BURGER30") {
      couponData = { code: cleanCode, type: "ITEM_PRICE", discount: 80, targetItem: "Crispy Cheese Veg Burger", specialPrice: 30, title: "बर्गर सिर्फ ₹30 में" };
    } else if (cleanCode.startsWith("FREEFRIES") || cleanCode === "FREEFRIES") {
      couponData = { code: cleanCode, type: "FREE_ITEM", discount: 90, freeItem: "French Fries", title: "मुफ़्त फ्रेंच फ्राइज़" };
    } else if (cleanCode.startsWith("FESTIVE20") || cleanCode === "FESTIVE20") {
      couponData = { code: cleanCode, type: "PERCENT", discountPercent: 20, title: "20% की छूट" };
    } else {
      couponData = { code: cleanCode, type: "FLAT", discount: 50, title: "विशेष छूट" };
    }

    const sub = cart.reduce((s, i) => s + (i.total || 0), 0);
    if (couponData.minBill && sub < couponData.minBill) {
      setCouponError(`⚠️ यह कूपन ₹${couponData.minBill} या अधिक के बिल पर ही लागू होगा!`);
      return;
    }

    setAppliedCoupon(couponData);
    setCouponCodeInput("");
  };

  const getSubTotal = () => cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "PERCENT") return Math.round((getSubTotal() * appliedCoupon.discountPercent) / 100);
    return appliedCoupon.discount || 0;
  };
  const getGrandTotal = () => Math.max(0, getSubTotal() - getCouponDiscount());

  const triggerCheckout = async () => {
    if (cart.length === 0) return alert("कृपया बिल बनाने के लिए कार्ट में आइटम जोड़ें!");
    try {
      setLoading(true);
      const payload = {
        billNumber: `BILL-${Date.now().toString().slice(-6)}`,
        customerName: customerName || "Walk-in Customer",
        customerMobile: customerMobile || "",
        customerAddress: customerAddress || "",
        selectedTable: selectedTable || "Table 1",
        counter: currentActiveTab.counterName,
        items: cart,
        subTotal: getSubTotal(),
        discountAmount: getCouponDiscount(),
        finalAmount: getGrandTotal(),
        total: getGrandTotal(),
        paymentMethod: "cash",
        paymentStatus: "paid",
        date: new Date().toISOString()
      };

      if (appliedCoupon) {
        const existingRedeemed = JSON.parse(localStorage.getItem("vb_redeemed_coupons") || "[]");
        existingRedeemed.push({
          code: appliedCoupon.code,
          customerMobile: customerMobile || "",
          customerName: customerName || "Walk-in",
          billNumber: payload.billNumber,
          redeemedAt: new Date().toISOString()
        });
        localStorage.setItem("vb_redeemed_coupons", JSON.stringify(existingRedeemed));
      }

      await api.post("/api/billing", payload).catch(() => {});
      alert(`🎉 [${currentActiveTab.counterName}] बिल ${payload.billNumber} सफलतापूर्वक तैयार हो गया! कुल: ₹${getGrandTotal()}`);
      setCart([]);
      setAppliedCoupon(null);
      fetchBills();
    } catch (err) {
      alert("Error creating bill: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyKot = (kotData) => {
    setCart((prev) => [
      ...prev,
      ...kotData.items.map((i) => ({
        productId: "",
        name: i.name,
        category: i.category || "Restaurant",
        rate: i.rate,
        quantity: i.quantity,
        unit: i.unit || "PLT",
        total: i.total,
      })),
    ]);
    setSelectedTable(kotData.table);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-100 -m-6 p-6 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3 flex justify-between items-center shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-600 to-orange-600 p-2 rounded-xl text-white shadow-md">
            <Utensils size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fast POS Touch & Multi-Counter Billing</span>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                Live POS
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">टचस्क्रीन टाइल्स, KOT टेबल सीटर व 2 काउंटर एक साथ बिलिंग</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Table KOT Button */}
          <button
            onClick={() => setShowKotModal(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Utensils size={14} /> 🍽️ Table KOT & Seater
          </button>

          {/* Tiles vs List Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("tiles")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "tiles" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={14} /> 🍱 Food / Item Tiles
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={14} /> 📋 List Mode
            </button>
          </div>

          {/* Happy Hours Button */}
          <button
            onClick={() => setShowHappyHourModal(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 ${
              isHappyHourActive
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md animate-pulse"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
            title="Happy Hours डिस्काउंट % व समय बदलें"
          >
            ⏰ {isHappyHourActive ? `Happy Hours ON (${happyHourConfig.discountPercent}% OFF)` : "Happy Hours %"}
          </button>
        </div>
      </div>

      {/* 🏢 2 COUNTERS SIMULTANEOUS MULTI-TAB SWITCHER */}
      <div className="bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-800 mb-3 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 pl-2 shrink-0">
            <Store size={15} /> काउंटर चुनें:
          </span>
          {counterTabs.map((tab) => {
            const isActive = tab.id === activeCounterTab;
            const tabTotal = tab.cart.reduce((s, i) => s + (i.total || 0), 0);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCounterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md ring-2 ring-amber-300"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>🏷️ {tab.counterName}</span>
                {tab.cart.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                    isActive ? "bg-slate-950 text-amber-300" : "bg-slate-700 text-white"
                  }`}>
                    {tab.cart.length} items (₹{tabTotal})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Table Badge */}
        <div className="hidden md:flex items-center gap-2 pr-2 text-xs">
          <span className="text-slate-400">एक्टिव टेबल:</span>
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40 font-bold">
            🍽️ {selectedTable}
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-4 flex-1 min-h-0 pb-12">
        {/* Left Side: Product Selector (Tiles Grid vs Barcode List) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Category Tabs & Search Bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="बारकोड स्कैन करें या व्यंजन / प्रोडक्ट खोजें... (F2)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800"
                value={barcode || searchFilter}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setSearchFilter(e.target.value);
                }}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Category Scrollable Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items: Tiles View vs List View */}
          {viewMode === "tiles" ? (
            <div className="flex-1 p-3 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredProducts.map((p) => {
                  const prodId = p._id || p.uuid || p.id;
                  const inCartItem = cart.find((i) => i.productId === prodId);
                  const price = p.sellingPrice || p.price || 0;

                  return (
                    <div
                      key={prodId}
                      onClick={() => addToCart(p)}
                      className={`bg-white rounded-2xl border p-2.5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        inCartItem
                          ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/30"
                          : "border-slate-200 hover:border-amber-400"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2 flex items-center justify-center border border-slate-100 relative">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                        {inCartItem && (
                          <span className="absolute top-1.5 right-1.5 bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {inCartItem.quantity}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{p.category || "Restaurant"}</p>
                      </div>

                      {/* Stock Switch & Price */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-amber-900 font-mono">
                            ₹{isHappyHourActive && (happyHourConfig.categories.includes(p.category) || happyHourConfig.categories.includes("All"))
                              ? Math.round(price * (1 - happyHourConfig.discountPercent / 100))
                              : price}
                          </span>
                          {isHappyHourActive && (
                            <span className="text-[10px] line-through text-slate-400">₹{price}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => toggleItemStock(prodId, e)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition ${
                              outOfStockItems.includes(prodId)
                                ? "bg-rose-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            title="1-Click Out of Stock"
                          >
                            {outOfStockItems.includes(prodId) ? "86 Out" : "Stock"}
                          </button>
                          <span
                            onClick={() => addToCart(p)}
                            className="p-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition"
                          >
                            <Plus size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700 border-b">
                  <tr>
                    <th className="p-3">व्यंजन / आइटम (Item Name)</th>
                    <th className="p-3">कैटेगरी</th>
                    <th className="p-3 text-right">कीमत (Price)</th>
                    <th className="p-3 text-center">स्टॉक</th>
                    <th className="p-3 text-center">एक्शन</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const prodId = p._id || p.uuid || p.id;
                    const price = p.sellingPrice || p.price || 0;
                    return (
                      <tr key={prodId} className="border-b hover:bg-amber-50/50">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          {p.image && <img src={p.image} alt={p.name} className="w-6 h-6 rounded object-cover" />}
                          <span>{p.name}</span>
                        </td>
                        <td className="p-3 text-slate-500">{p.category || "Restaurant"}</td>
                        <td className="p-3 text-right font-black text-amber-900 font-mono">₹{price}</td>
                        <td className="p-3 text-center text-slate-600">{p.currentStock || 50} {p.unit || "pcs"}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => addToCart(p)}
                            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition"
                          >
                            + जोड़ें (+ Add)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Customer Info & Cart Sidebar */}
        <div className="w-96 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col shrink-0 overflow-hidden">
          {/* Customer Input & Full Visibility Details */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} />
                <span>ग्राहक विवरण (Customer Info)</span>
              </span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                {currentActiveTab.counterName.split(" ")[0]}
              </span>
            </div>

            {/* Full-Width Clean Customer Inputs */}
            <div className="space-y-1.5 text-xs">
              <div>
                <input
                  ref={customerNameInputRef}
                  type="text"
                  placeholder="ग्राहक का नाम (Customer Name)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="मोबाइल नंबर (F4)"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-black font-mono"
                />
                <input
                  type="text"
                  placeholder="पता / टेबल"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Available Coupon Offer Banner */}
            {customerMobile.length >= 10 && !appliedCoupon && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 p-2 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center gap-1.5">
                  <Gift size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="font-black text-amber-300 text-[11px]">🎉 1 कूपन: SAVE100 (₹100 छूट)</p>
                    <p className="text-[9px] text-slate-300">Min ₹500 बिल पर मान्य</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon({ code: `SAVE100-${customerMobile.slice(-4)}`, type: "FLAT", discount: 100, title: "₹100 की फ्लैट छूट" })}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition shrink-0 shadow"
                >
                  ✓ लागू करें
                </button>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                <ShoppingCart size={32} className="mb-2 opacity-40 text-amber-400" />
                <p>कार्ट खाली है</p>
                <p className="text-[10px] text-slate-400">व्यंजन पर क्लिक करें या Table KOT से ट्रांसफर करें</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 pr-2">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                        <ImageIcon size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-white line-clamp-1">{item.name}</h5>
                      <span className="text-[10px] text-slate-400">
                        ₹{item.rate} / {item.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 font-mono font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-amber-400 w-12 text-right">₹{item.total}</span>
                    <button onClick={() => removeFromCart(idx)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary & 1-Click Pay */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>उप-योग (Subtotal)</span>
              <span className="font-mono font-bold text-white">₹{getSubTotal()}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>कूपन छूट ({appliedCoupon.code})</span>
                <span className="font-mono">-₹{getCouponDiscount()}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-slate-800">
              <span>कुल राशि (Grand Total)</span>
              <span className="text-xl text-amber-400 font-mono font-black">₹{getGrandTotal()}</span>
            </div>

            <button
              onClick={triggerCheckout}
              disabled={loading || cart.length === 0}
              className={`w-full py-2.5 rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                cart.length > 0
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-emerald-500/20 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>⚡ पक्का बिल बनाएं व प्रिंट करें (F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ⏰ MODAL: HAPPY HOURS DISCOUNT CONFIGURATION */}
      {showHappyHourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold">
                  ⏰
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Happy Hours डिस्काउंट सेटिंग्स</h3>
                  <p className="text-[10px] text-slate-500">मालिक द्वारा नियंत्रित विशेष समय डिस्काउंट %</p>
                </div>
              </div>
              <button onClick={() => setShowHappyHourModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveHappyHourConfig(happyHourConfig);
              }}
              className="py-4 space-y-4 text-xs"
            >
              {/* Enable / Disable Switch */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div>
                  <span className="font-black text-amber-950 block">Happy Hours चालू / बंद रखें</span>
                  <span className="text-[10px] text-amber-800">नियत समय पर ऑटोमैटिक छूट लागू होगी</span>
                </div>
                <input
                  type="checkbox"
                  checked={happyHourConfig.isEnabled}
                  onChange={(e) => setHappyHourConfig({ ...happyHourConfig, isEnabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-slate-700 font-black mb-1.5">
                  डिस्काउंट प्रतिशत (% Discount): <span className="text-amber-600 font-black text-sm">{happyHourConfig.discountPercent}% OFF</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 15, 20, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setHappyHourConfig({ ...happyHourConfig, discountPercent: pct })}
                      className={`py-1.5 rounded-xl font-black text-xs transition ${
                        happyHourConfig.discountPercent === pct
                          ? "bg-amber-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={happyHourConfig.discountPercent}
                  onChange={(e) => setHappyHourConfig({ ...happyHourConfig, discountPercent: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                  placeholder="कस्टम % डालें (e.g. 25)"
                />
              </div>

              {/* Timing Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">शुरू समय (Start Hour)</label>
                  <select
                    value={happyHourConfig.startHour}
                    onChange={(e) => setHappyHourConfig({ ...happyHourConfig, startHour: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((h) => (
                      <option key={h} value={h}>
                        {h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">समाप्त समय (End Hour)</label>
                  <select
                    value={happyHourConfig.endHour}
                    onChange={(e) => setHappyHourConfig({ ...happyHourConfig, endHour: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((h) => (
                      <option key={h} value={h}>
                        {h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  ✓ सेटिंग्स सुरक्षित करें (Save Happy Hours)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🍽️ RESTAURANT KOT & TABLE SEATER MODAL */}
      <RestaurantKotModal
        isOpen={showKotModal}
        onClose={() => setShowKotModal(false)}
        onApplyKot={handleApplyKot}
        inventory={products}
      />
    </div>
  );
}
