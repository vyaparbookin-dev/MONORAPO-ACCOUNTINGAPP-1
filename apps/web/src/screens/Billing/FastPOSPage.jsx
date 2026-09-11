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
  Sparkles,
  X,
  FileText,
  Gift,
  CheckCircle,
  Users,
  Sliders,
  Store,
  Layers,
  Phone,
  ChefHat,
  Flame,
  AlertTriangle,
  Printer,
  ShieldCheck,
  HelpCircle
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
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);
  const [showEmergencyHandoverModal, setShowEmergencyHandoverModal] = useState(false);
  const [showKitchenKdsModal, setShowKitchenKdsModal] = useState(false);

  // --- ⏰ OWNER CONTROLLED HAPPY HOURS STATE ---
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [happyHourConfig, setHappyHourConfig] = useState(() => {
    const saved = localStorage.getItem("vb_happy_hours");
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      startHour: 12,
      endHour: 17,
      discountPercent: 20,
      categories: ["Fast Food", "Beverages", "Snacks", "Main Course", "Starters", "Breads", "Rice & Biryani", "Desserts", "Restaurant"]
    };
  });

  // --- 🚫 OUT OF STOCK (86 ITEM) TOGGLE STATE ---
  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    const saved = localStorage.getItem("vb_out_of_stock");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 🔔 LIVE KITCHEN & TABLE FLOOR ORDERS REALTIME STATE ---
  const [activeFloorOrders, setActiveFloorOrders] = useState([
    {
      id: "KOT-101",
      table: "Table 2 (AC Hall)",
      capacity: 4,
      waiter: "Rohan",
      placedAt: new Date(Date.now() - 14 * 60000),
      prepTimeMinutes: 14,
      status: "COOKING", // 'COOKING' | 'SERVED' | 'BILLED'
      amount: 480,
      items: [{ name: "Crispy Veg Burger", qty: 2, station: "Pizza & Fast Food" }, { name: "Cold Coffee", qty: 2, station: "Bar & Drinks" }]
    },
    {
      id: "KOT-102",
      table: "Table 3 (AC Hall)",
      capacity: 6,
      waiter: "Sunil",
      placedAt: new Date(Date.now() - 28 * 60000),
      prepTimeMinutes: 28,
      status: "SERVED",
      amount: 800,
      items: [{ name: "Shahi Paneer", qty: 1, station: "Main Kitchen" }, { name: "Butter Garlic Naan", qty: 4, station: "Tandoor" }]
    },
    {
      id: "KOT-103",
      table: "Table 4 (Garden)",
      capacity: 8,
      waiter: "Aman",
      placedAt: new Date(Date.now() - 42 * 60000),
      prepTimeMinutes: 42,
      status: "BILLED",
      amount: 1250,
      items: [{ name: "Veg Dum Biryani", qty: 2, station: "Main Kitchen" }, { name: "Paneer Tikka", qty: 2, station: "Tandoor" }]
    },
    {
      id: "KOT-104",
      table: "Table 1 (Dine-in)",
      capacity: 2,
      waiter: "Rohan",
      placedAt: new Date(Date.now() - 6 * 60000),
      prepTimeMinutes: 6,
      status: "COOKING",
      amount: 320,
      items: [{ name: "Dal Makhani Special", qty: 1, station: "Main Kitchen" }, { name: "Tandoori Roti", qty: 4, station: "Tandoor" }]
    }
  ]);

  // Emergency Shift Handover Form State
  const [handoverForm, setHandoverForm] = useState({
    outgoingCashier: "Current Cashier (You)",
    incomingCashier: "Rohan Captain",
    emergencyReason: "Personal Emergency / Shift Swap",
    openingCash: 2000,
    countedCash: 16800,
    expectedCash: 16800,
    handoverTime: new Date().toLocaleTimeString("hi-IN")
  });

  // Calculate Real-time Floor Counts
  const cookingCount = activeFloorOrders.filter(o => o.status === "COOKING").length;
  const servedCount = activeFloorOrders.filter(o => o.status === "SERVED").length;
  const billedCount = activeFloorOrders.filter(o => o.status === "BILLED").length;
  const vacantCount = 4; // Tables 5, 6, P1, SW

  const isCurrentTimeInHappyHours = () => {
    if (!happyHourConfig.isEnabled) return false;
    const currentHour = new Date().getHours();
    return currentHour >= happyHourConfig.startHour && currentHour < happyHourConfig.endHour;
  };
  const isHappyHourActive = isCurrentTimeInHappyHours();

  const handleSaveHappyHourConfig = (newConfig) => {
    setHappyHourConfig(newConfig);
    localStorage.setItem("vb_happy_hours", JSON.stringify(newConfig));
    setShowHappyHourModal(false);
    alert(`🎉 Happy Hours सेटिंग्स सेव हो गई! (${newConfig.discountPercent}% छूट: ${newConfig.startHour}:00 से ${newConfig.endHour}:00 बजे)`);
  };

  const toggleItemStock = (prodId, e) => {
    if (e) e.stopPropagation();
    setOutOfStockItems(prev => {
      const updated = prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId];
      localStorage.setItem("vb_out_of_stock", JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateKotStatus = (kotId, newStatus) => {
    setActiveFloorOrders(prev => prev.map(k => k.id === kotId ? { ...k, status: newStatus } : k));
  };

  const { selectedCompany } = useCompany();
  const business = getBusinessMode(selectedCompany);

  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

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

  const categories = ["All", ...new Set(products.map((p) => p.category || "General").filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || (p.category || "General") === selectedCategory;
    const matchesSearch =
      !searchFilter ||
      p.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.barcode?.includes(searchFilter) ||
      p.sku?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  // Perform Emergency Shift Handover
  const handleExecuteEmergencyHandover = () => {
    alert(`🚨 आपातकालीन गल्ला हैंडओवर संपन्न!

आउटगोइंग: ${handoverForm.outgoingCashier}
इनकमिंग: ${handoverForm.incomingCashier}
गल्ला कैश: ₹${handoverForm.countedCash}
कारण: ${handoverForm.emergencyReason}
समय: ${handoverForm.handoverTime}

नया कैशियर सेशन प्रारंभ हो गया!`);
    setShowEmergencyHandoverModal(false);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-100 -m-6 p-6 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-2.5 flex justify-between items-center shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-600 to-orange-600 p-2 rounded-xl text-white shadow-md">
            <Utensils size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fast POS Touch & Kitchen Operations</span>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                Live POS
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">लाइव टेबल फ्लोर स्टेटस, KOT किचन ट्रैकिंग व इमरजेंसी गल्ला हैंडओवर</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Emergency Shift Handover Button */}
          <button
            onClick={() => setShowEmergencyHandoverModal(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
            title="किसी भी समय बीच शिफ्ट में गल्ला हैंडओवर करें"
          >
            <ShieldCheck size={14} /> 🚨 इमरजेंसी गल्ला हैंडओवर
          </button>

          {/* Kitchen KDS Live Tracker Button */}
          <button
            onClick={() => setShowKitchenKdsModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
            title="लाइव किचन डिस्प्ले सिस्टम (KDS)"
          >
            <ChefHat size={14} /> 🍳 लाइव किचन ऑर्डर्स ({cookingCount})
          </button>

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
              <LayoutGrid size={14} /> 🍱 Food Tiles
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={14} /> 📋 List
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

      {/* 📊 LIVE RESTAURANT FLOOR & KITCHEN STATUS BAR */}
      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 mb-2.5 flex items-center justify-between gap-2 flex-wrap text-xs font-black">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-700 flex items-center gap-1.5 pl-1">
            <Flame size={15} className="text-orange-500" />
            <span>रेस्टोरेंट लाइव स्टेटस:</span>
          </span>

          {/* Cooking in Kitchen */}
          <button
            onClick={() => setShowKitchenKdsModal(true)}
            className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5 hover:bg-blue-200 transition"
          >
            <span>🔵 किचन में चल रहे (Cooking):</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[11px]">{cookingCount} Tables</span>
          </button>

          {/* Food Served */}
          <div className="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5">
            <span>🟡 खाना सर्व हो चुका (Served):</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono text-[11px]">{servedCount} Tables</span>
          </div>

          {/* Billed / Payment Pending */}
          <div className="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
            <span>🔴 बिल तैयार / पेमेंट बाकी (Billed):</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[11px]">{billedCount} Tables</span>
          </div>

          {/* Vacant Tables */}
          <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <span>🟢 खाली टेबल (Vacant):</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px]">{vacantCount} Tables</span>
          </div>
        </div>

        <button
          onClick={() => setShowKitchenKdsModal(true)}
          className="text-blue-700 hover:text-blue-900 text-xs font-bold flex items-center gap-1 underline"
        >
          पूरा किचन KDS देखें &gt;
        </button>
      </div>

      {/* 🏢 2 COUNTERS SIMULTANEOUS MULTI-TAB SWITCHER */}
      <div className="bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-800 mb-2.5 flex items-center justify-between gap-3 text-white">
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
      <div className="flex gap-4 flex-1 min-h-0 pb-6">
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

      {/* 🚨 MODAL: EMERGENCY MID-SHIFT CASHIER HANDOVER (ON-THE-SPOT Z-REPORT) */}
      {showEmergencyHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <ShieldCheck size={22} />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">आपातकालीन गल्ला हैंडओवर (Emergency Shift Handover)</h3>
                  <p className="text-[10px] text-slate-500">बिना बिलिंग रोके तुरंत 30 सेकंड में गल्ला मिलान व हैंडओवर</p>
                </div>
              </div>
              <button onClick={() => setShowEmergencyHandoverModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">वर्तमान कैशियर (Outgoing)</label>
                  <input
                    type="text"
                    value={handoverForm.outgoingCashier}
                    onChange={(e) => setHandoverForm({ ...handoverForm, outgoingCashier: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">नया कैशियर (Incoming)*</label>
                  <input
                    type="text"
                    value={handoverForm.incomingCashier}
                    onChange={(e) => setHandoverForm({ ...handoverForm, incomingCashier: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">हैंडओवर का कारण (Reason)*</label>
                <input
                  type="text"
                  value={handoverForm.emergencyReason}
                  onChange={(e) => setHandoverForm({ ...handoverForm, emergencyReason: e.target.value })}
                  placeholder="उदा: अचानक आवश्यक कार्य / शिफ्ट बदलाव"
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                />
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>ओपनिंग कैश:</span>
                  <span className="font-mono font-bold">₹{handoverForm.openingCash}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>वर्तमान शिफ्ट कैश सेल:</span>
                  <span className="font-mono font-bold">₹{handoverForm.expectedCash - handoverForm.openingCash}</span>
                </div>
                <div className="flex justify-between items-center text-amber-400 font-black pt-2 border-t border-slate-800 text-sm">
                  <span>गल्ले में अपेक्षित कुल कैश:</span>
                  <span className="font-mono text-base">₹{handoverForm.expectedCash}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black mb-1">
                  गल्ले में वास्तविक गिना गया कैश (Counted Cash in Drawer)*
                </label>
                <input
                  type="number"
                  value={handoverForm.countedCash}
                  onChange={(e) => setHandoverForm({ ...handoverForm, countedCash: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 border-2 border-rose-500 rounded-xl font-mono text-lg font-black bg-rose-50/50 text-rose-950 text-center"
                />
              </div>

              <div className={`p-3 rounded-2xl text-center font-black ${
                handoverForm.countedCash === handoverForm.expectedCash
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-rose-100 text-rose-900 border border-rose-300"
              }`}>
                {handoverForm.countedCash === handoverForm.expectedCash
                  ? "✅ गल्ला पूरा मिल गया है (0 Shortage)"
                  : `⚠️ अंतर (Difference): ₹${handoverForm.countedCash - handoverForm.expectedCash}`}
              </div>

              <button
                type="button"
                onClick={handleExecuteEmergencyHandover}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                <span>🧾 Z-Report हैंडओवर स्लिप बनाएं व नया कैशियर सेट करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍳 MODAL: LIVE KITCHEN DISPLAY SYSTEM (KDS) & FLOOR ORDERS TRACKER */}
      {showKitchenKdsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-6 border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5 text-blue-700">
                <ChefHat size={24} />
                <div>
                  <h3 className="font-black text-slate-900 text-base">लाइव किचन डिस्प्ले व टेबल ट्रैकर (Kitchen KDS)</h3>
                  <p className="text-xs text-slate-500">किचन में चल रहे आर्डर, वेटर, तैयारी समय (SLA) व स्थिति</p>
                </div>
              </div>
              <button onClick={() => setShowKitchenKdsModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Summary Badges */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-[11px] text-blue-700 font-bold block">किचन में कुकिंग (Cooking)</span>
                  <span className="text-2xl font-black text-blue-900 font-mono">{cookingCount} Tables</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[11px] text-amber-700 font-bold block">खाना सर्व हो चुका (Served)</span>
                  <span className="text-2xl font-black text-amber-900 font-mono">{servedCount} Tables</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[11px] text-rose-700 font-bold block">बिल तैयार / पेंडिंग</span>
                  <span className="text-2xl font-black text-rose-900 font-mono">{billedCount} Tables</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-bold block">खाली टेबल्स (Vacant)</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">{vacantCount} Tables</span>
                </div>
              </div>

              {/* Live Order Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeFloorOrders.map((ord) => {
                  const isCooking = ord.status === "COOKING";
                  const isServed = ord.status === "SERVED";
                  const isLate = ord.prepTimeMinutes >= 20;

                  return (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-2xl border-2 transition ${
                        isCooking
                          ? isLate
                            ? "bg-rose-50/70 border-rose-400"
                            : "bg-blue-50/70 border-blue-400"
                          : isServed
                          ? "bg-amber-50/70 border-amber-400"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                            <span>{ord.table}</span>
                            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full border text-slate-600">
                              👤 {ord.capacity} Pax
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            कैप्टन: <span className="font-bold text-slate-800">{ord.waiter}</span> • KOT: <span className="font-mono">{ord.id}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                            isCooking
                              ? isLate ? "bg-rose-600 text-white animate-pulse" : "bg-blue-600 text-white"
                              : isServed ? "bg-amber-500 text-slate-950" : "bg-rose-600 text-white"
                          }`}>
                            {ord.status} ({ord.prepTimeMinutes}m)
                          </span>
                          <p className="font-black text-slate-900 font-mono mt-1 text-sm">₹{ord.amount}</p>
                        </div>
                      </div>

                      {/* Items Cooking List */}
                      <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1">
                        <p className="text-[10px] font-bold text-slate-600 uppercase">ऑर्डर में शामिल व्यंजन:</p>
                        {ord.items.map((it, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-800">{it.name} <span className="text-slate-500 font-mono">×{it.qty}</span></span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{it.station}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex gap-2">
                        {isCooking && (
                          <button
                            onClick={() => handleUpdateKotStatus(ord.id, "SERVED")}
                            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs transition"
                          >
                            ✓ खाना सर्व हो गया (Mark Served)
                          </button>
                        )}
                        {isServed && (
                          <button
                            onClick={() => handleUpdateKotStatus(ord.id, "BILLED")}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                          >
                            🧾 बिल बनाएं (Generate Bill)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⏰ MODAL: HAPPY HOURS */}
      {showHappyHourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in zoom-in-95">
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
