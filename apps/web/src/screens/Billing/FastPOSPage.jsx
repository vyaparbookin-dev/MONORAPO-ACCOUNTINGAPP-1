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
  Store,
  ChefHat,
  Flame,
  Printer,
  ShieldCheck,
  Eye,
  Receipt
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
    isVeg: true,
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
      customerAddress: "Table 3 (AC Hall)",
      selectedTable: "Table 3 (AC Hall - 6 Seater)",
      appliedCoupon: null
    },
    {
      id: "counter_2",
      counterName: "Counter 2 (Takeaway / Bar)",
      cart: [],
      customerName: "Walk-in Guest",
      customerMobile: "",
      customerAddress: "Takeaway Counter",
      selectedTable: "🛍️ Parcel / Takeaway",
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

  // Dual View Mode: 'tiles' (Food Grid with images) or 'list' (High-speed POS rows)
  const [viewMode, setViewMode] = useState("tiles");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  // Modals State
  const [showKotModal, setShowKotModal] = useState(false);
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);
  const [showEmergencyHandoverModal, setShowEmergencyHandoverModal] = useState(false);
  const [showKitchenKdsModal, setShowKitchenKdsModal] = useState(false);
  const [showRecentBillsModal, setShowRecentBillsModal] = useState(false);

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
      waiter: "Rohan Captain",
      placedAt: new Date(Date.now() - 14 * 60000),
      prepTimeMinutes: 14,
      status: "COOKING",
      amount: 480,
      items: [
        { name: "Crispy Cheese Veg Burger", qty: 2, rate: 110, station: "Pizza & Fast Food" },
        { name: "Cold Coffee with Ice Cream", qty: 2, rate: 95, station: "Bar & Drinks" }
      ]
    },
    {
      id: "KOT-102",
      table: "Table 3 (AC Hall)",
      capacity: 6,
      waiter: "Sunil Chef",
      placedAt: new Date(Date.now() - 28 * 60000),
      prepTimeMinutes: 28,
      status: "SERVED",
      amount: 800,
      items: [
        { name: "Shahi Paneer Butter Masala", qty: 1, rate: 240, station: "Main Kitchen" },
        { name: "Butter Garlic Tandoori Naan", qty: 4, rate: 45, station: "Tandoor" },
        { name: "Veg Dum Biryani with Raita", qty: 1, rate: 190, station: "Main Kitchen" },
        { name: "Cold Coffee with Ice Cream", qty: 2, rate: 95, station: "Bar & Drinks" }
      ]
    },
    {
      id: "KOT-103",
      table: "Table 4 (Garden)",
      capacity: 8,
      waiter: "Aman Steward",
      placedAt: new Date(Date.now() - 42 * 60000),
      prepTimeMinutes: 42,
      status: "BILLED",
      amount: 1250,
      items: [
        { name: "Veg Dum Biryani with Raita", qty: 2, rate: 190, station: "Main Kitchen" },
        { name: "Paneer Tikka Dry", qty: 2, rate: 210, station: "Tandoor" },
        { name: "Farmhouse Loaded Pizza (8 inch)", qty: 2, rate: 220, station: "Pizza & Fast Food" }
      ]
    },
    {
      id: "KOT-104",
      table: "Table 1 (Dine-in)",
      capacity: 2,
      waiter: "Rohan Captain",
      placedAt: new Date(Date.now() - 6 * 60000),
      prepTimeMinutes: 6,
      status: "COOKING",
      amount: 320,
      items: [
        { name: "Dal Makhani Special", qty: 1, rate: 180, station: "Main Kitchen" },
        { name: "Butter Garlic Tandoori Naan", qty: 3, rate: 45, station: "Tandoor" }
      ]
    }
  ]);

  // Emergency Handover Form State
  const [handoverForm, setHandoverForm] = useState({
    outgoingCashier: "Deepa Cashier",
    incomingCashier: "Rohan Captain",
    emergencyReason: "Personal Emergency / Shift Swap",
    openingCash: 2000,
    countedCash: 16800,
    expectedCash: 16800,
    handoverTime: new Date().toLocaleTimeString("hi-IN")
  });

  const cookingCount = activeFloorOrders.filter(o => o.status === "COOKING").length;
  const servedCount = activeFloorOrders.filter(o => o.status === "SERVED").length;
  const billedCount = activeFloorOrders.filter(o => o.status === "BILLED").length;
  const vacantCount = 4;

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

  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);

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

  // 1-Click Generate Bill from Cart
  const triggerCheckout = async () => {
    if (cart.length === 0) return alert("कृपया बिल बनाने के लिए कार्ट में आइटम जोड़ें!");
    try {
      setLoading(true);
      const newBill = {
        _id: `b_live_${Date.now()}`,
        billNumber: `BILL-REST-${Date.now().toString().slice(-4)}`,
        customerName: customerName || "Walk-in Guest",
        customerMobile: customerMobile || "",
        customerAddress: customerAddress || "",
        table: selectedTable || "Table 1",
        selectedTable: selectedTable || "Table 1",
        counter: currentActiveTab.counterName,
        items: [...cart],
        subTotal: getSubTotal(),
        discountAmount: getCouponDiscount(),
        finalAmount: getGrandTotal(),
        totalAmount: getGrandTotal(),
        total: getGrandTotal(),
        paymentMethod: "UPI / Cash",
        paymentMode: "Paid",
        status: "paid",
        createdAt: new Date().toISOString(),
        date: new Date().toISOString()
      };

      await api.post("/api/billing", newBill).catch(() => {});
      
      // Update local bills immediately
      setBills(prev => [newBill, ...prev]);
      
      alert(`🎉 [${currentActiveTab.counterName}] बिल #${newBill.billNumber} सफलतापूर्वक तैयार हो गया!\n\nटेबल: ${newBill.selectedTable}\nग्राहक: ${newBill.customerName}\nकुल रकम: ₹${getGrandTotal()}`);
      
      // Clear Cart
      setCart([]);
      setAppliedCoupon(null);
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
        productId: `kot_${Date.now()}_${Math.random()}`,
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

  // Transfer KDS Order directly to Billing Cart
  const handleLoadKdsOrderToBilling = (ord) => {
    const loadedCartItems = ord.items.map(it => {
      const rate = it.rate || (it.amount ? Math.round(it.amount / it.qty) : 150);
      return {
        productId: `kds_${Date.now()}_${Math.random()}`,
        name: it.name,
        category: "Restaurant",
        rate: rate,
        quantity: it.qty,
        unit: "PLT",
        image: "",
        total: rate * it.qty
      };
    });

    setCart(loadedCartItems);
    setSelectedTable(ord.table);
    setCustomerName(ord.customerName || `${ord.waiter}'s Guest`);
    handleUpdateKotStatus(ord.id, "BILLED");
    setShowKitchenKdsModal(false);

    alert(`🎉 [${ord.table}] के सभी ${loadedCartItems.length} आइटम्स (कुल ₹${ord.amount}) बिलिंग कार्ट में लोड कर दिए गए हैं!\n\nअब नीचे '⚡ पक्का बिल बनाएं (F9)' पर क्लिक करें।`);
  };

  // Perform Emergency Shift Handover
  const handleExecuteEmergencyHandover = () => {
    alert(`🚨 आपातकालीन गल्ला हैंडओवर संपन्न!\n\nआउटगोइंग: ${handoverForm.outgoingCashier}\nइनकमिंग: ${handoverForm.incomingCashier}\nगल्ला कैश: ₹${handoverForm.countedCash}\nकारण: ${handoverForm.emergencyReason}\nसमय: ${handoverForm.handoverTime}\n\nनया कैशियर सेशन प्रारंभ हो गया!`);
    setShowEmergencyHandoverModal(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-100 -m-6 p-4 gap-2 overflow-hidden relative">
      {/* 🚀 COMPACT UNIFIED HEADER */}
      <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-600 to-orange-600 p-2 rounded-xl text-white shadow-md">
            <Utensils size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2 leading-none">
              <span>Fast POS Touch & Kitchen Billing</span>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                Restaurant
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">टचस्क्रीन टाइल्स, लाइव KOT व 2-काउंटर बिलिंग</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Recent Bills Button */}
          <button
            onClick={() => setShowRecentBillsModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
            title="हाल ही में बने बिल देखें"
          >
            <Receipt size={13} /> 🧾 बने बिल ({bills.length})
          </button>

          {/* Kitchen KDS Live Tracker Button */}
          <button
            onClick={() => setShowKitchenKdsModal(true)}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1"
            title="लाइव किचन डिस्प्ले सिस्टम (KDS)"
          >
            <ChefHat size={13} /> 🍳 किचन ऑर्डर्स ({cookingCount})
          </button>

          {/* Table KOT Button */}
          <button
            onClick={() => setShowKotModal(true)}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1"
          >
            <Utensils size={13} /> 🍽️ Table KOT
          </button>

          {/* Tiles vs List Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("tiles")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                viewMode === "tiles" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={13} /> 🍱 Tiles View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                viewMode === "list" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={13} /> 📋 List View
            </button>
          </div>

          {/* Happy Hours Button */}
          <button
            onClick={() => setShowHappyHourModal(true)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1 ${
              isHappyHourActive
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            ⏰ {isHappyHourActive ? `${happyHourConfig.discountPercent}% OFF` : "Happy Hours"}
          </button>

          {/* Emergency Shift Handover Button */}
          <button
            onClick={() => setShowEmergencyHandoverModal(true)}
            className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
            title="इमरजेंसी गल्ला हैंडओवर"
          >
            <ShieldCheck size={13} /> 🚨 गल्ला
          </button>
        </div>
      </div>

      {/* 📊 COMBINED COUNTERS & LIVE FLOOR STATUS BAR */}
      <div className="bg-slate-900 px-3 py-2 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between gap-2 text-white shrink-0 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-black text-amber-400 flex items-center gap-1 pl-1 shrink-0">
            <Store size={14} /> काउंटर:
          </span>
          {counterTabs.map((tab) => {
            const isActive = tab.id === activeCounterTab;
            const tabTotal = tab.cart.reduce((s, i) => s + (i.total || 0), 0);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCounterTab(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md ring-2 ring-amber-300"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>🏷️ {tab.counterName}</span>
                {tab.cart.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    isActive ? "bg-slate-950 text-amber-300" : "bg-slate-700 text-white"
                  }`}>
                    {tab.cart.length} (₹{tabTotal})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className="px-2 py-0.5 rounded-lg bg-blue-900/80 text-blue-200 border border-blue-700">
            🔵 कुकिंग: {cookingCount}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-900/80 text-amber-200 border border-amber-700">
            🟡 सर्वड: {servedCount}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-900/80 text-rose-200 border border-rose-700">
            🔴 बिल पेंडिंग: {billedCount}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-900/80 text-emerald-200 border border-emerald-700 hidden sm:inline">
            🟢 खाली: {vacantCount}
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Side: Product Selector (Tiles Grid vs Barcode List) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Category Tabs & Search Bar */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col gap-1.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="व्यंजन या प्रोडक्ट खोजें / बारकोड स्कैन करें... (F2)"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800"
                value={barcode || searchFilter}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setSearchFilter(e.target.value);
                }}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Category Scrollable Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black whitespace-nowrap transition ${
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
            <div className="flex-1 p-2.5 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {filteredProducts.map((p) => {
                  const prodId = p._id || p.uuid || p.id;
                  const inCartItem = cart.find((i) => i.productId === prodId);
                  const price = p.sellingPrice || p.price || 0;

                  return (
                    <div
                      key={prodId}
                      onClick={() => addToCart(p)}
                      className={`bg-white rounded-2xl border p-2 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        inCartItem
                          ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/30"
                          : "border-slate-200 hover:border-amber-400"
                      }`}
                    >
                      <div className="w-full h-20 rounded-xl bg-slate-100 overflow-hidden mb-1.5 flex items-center justify-center border border-slate-100 relative">
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
                          <span className="absolute top-1 right-1 bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {inCartItem.quantity}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{p.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pl-3">{p.category || "Restaurant"}</p>
                      </div>

                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        <span className="text-xs font-black text-amber-900 font-mono">
                          ₹{isHappyHourActive && (happyHourConfig.categories.includes(p.category) || happyHourConfig.categories.includes("All"))
                            ? Math.round(price * (1 - happyHourConfig.discountPercent / 100))
                            : price}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => toggleItemStock(prodId, e)}
                            className={`px-1 py-0.5 rounded text-[8px] font-black uppercase transition ${
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
                            <Plus size={13} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Enhanced POS List View */
            <div className="flex-1 overflow-y-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700 border-b">
                  <tr>
                    <th className="p-2.5">व्यंजन / आइटम</th>
                    <th className="p-2.5">कैटेगरी</th>
                    <th className="p-2.5 text-right">कीमत</th>
                    <th className="p-2.5 text-center">स्टॉक</th>
                    <th className="p-2.5 text-center">एक्शन</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const prodId = p._id || p.uuid || p.id;
                    const inCartItem = cart.find((i) => i.productId === prodId);
                    const price = p.sellingPrice || p.price || 0;
                    return (
                      <tr key={prodId} className={`border-b hover:bg-amber-50/50 transition ${inCartItem ? "bg-amber-50/30" : ""}`}>
                        <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          {p.image && <img src={p.image} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />}
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500 font-medium">{p.category || "Restaurant"}</td>
                        <td className="p-2.5 text-right font-black text-amber-900 font-mono text-sm">₹{price}</td>
                        <td className="p-2.5 text-center text-slate-600 font-mono">{p.currentStock || 50} {p.unit || "pcs"}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => addToCart(p)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-black transition text-xs shadow-sm flex items-center gap-1 mx-auto"
                          >
                            <Plus size={12} /> + जोड़ें {inCartItem ? `(${inCartItem.quantity})` : ""}
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
          {/* Customer Input & Clean Visible Details */}
          <div className="p-3 border-b border-slate-800 bg-slate-800/90 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} />
                <span>ग्राहक विवरण (Customer)</span>
              </span>
              <span className="text-[10px] bg-slate-700 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                🍽️ {selectedTable}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <input
                ref={customerNameInputRef}
                type="text"
                placeholder="ग्राहक का नाम (Customer Name)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-bold"
              />
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="text"
                  placeholder="मोबाइल नंबर (F4)"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-black font-mono"
                />
                <input
                  type="text"
                  placeholder="पता / टेबल"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-700/90 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-6">
                <ShoppingCart size={28} className="mb-1.5 opacity-40 text-amber-400" />
                <p className="font-bold">कार्ट खाली है</p>
                <p className="text-[10px] text-slate-400 mt-0.5">व्यंजन पर क्लिक करें या Table KOT / KDS से लोड करें</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 pr-1">
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
                        <Minus size={11} />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-amber-400 w-11 text-right">₹{item.total}</span>
                    <button onClick={() => removeFromCart(idx)} className="text-slate-500 hover:text-red-400 p-0.5">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary & 1-Click Pay */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-1.5 text-xs shrink-0">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>उप-योग (Subtotal)</span>
              <span className="font-mono font-bold text-white">₹{getSubTotal()}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400 font-bold text-[11px]">
                <span>कूपन छूट ({appliedCoupon.code})</span>
                <span className="font-mono">-₹{getCouponDiscount()}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-black text-white pt-1.5 border-t border-slate-800">
              <span>कुल राशि (Grand Total)</span>
              <span className="text-lg text-amber-400 font-mono font-black">₹{getGrandTotal()}</span>
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

      {/* 🧾 MODAL: RECENT BILLS LIST (हाल ही में बने बिल) */}
      {showRecentBillsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-slate-900">
                <Receipt size={20} className="text-amber-600" />
                <h3 className="font-black text-sm">हाल ही में बने बिल (Recent Bills List)</h3>
              </div>
              <button onClick={() => setShowRecentBillsModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-3 overflow-y-auto flex-1 space-y-2 text-xs">
              {bills.length === 0 ? (
                <p className="text-slate-500 text-center py-6">अभी कोई बिल नहीं बना है</p>
              ) : (
                bills.map((b, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{b.billNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {b.table || b.selectedTable || "Counter"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ग्राहक: <span className="font-bold text-slate-700">{b.customerName || "Walk-in"}</span> • {b.items?.length || 1} आइटम्स
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-700 font-mono">₹{b.total || b.finalAmount || b.totalAmount}</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">✓ Paid (UPI/Cash)</span>
                    </div>
                  </div>
                ))
              )}
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
                  <p className="text-xs text-slate-500">किचन में चल रहे आर्डर, वेटर, तैयारी समय व 1-क्लिक बिलिंग</p>
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
                  <span className="text-[11px] text-blue-700 font-bold block">किचन में कुकिंग</span>
                  <span className="text-2xl font-black text-blue-900 font-mono">{cookingCount} Tables</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[11px] text-amber-700 font-bold block">खाना सर्व हो चुका</span>
                  <span className="text-2xl font-black text-amber-900 font-mono">{servedCount} Tables</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[11px] text-rose-700 font-bold block">बिल तैयार / पेंडिंग</span>
                  <span className="text-2xl font-black text-rose-900 font-mono">{billedCount} Tables</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-bold block">खाली टेबल्स</span>
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
                          ? isLate ? "bg-rose-50/70 border-rose-400" : "bg-blue-50/70 border-blue-400"
                          : isServed ? "bg-amber-50/70 border-amber-400" : "bg-slate-50 border-slate-300"
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
                            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs transition"
                          >
                            ✓ खाना सर्व हो गया (Mark Served)
                          </button>
                        )}
                        <button
                          onClick={() => handleLoadKdsOrderToBilling(ord)}
                          className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-1"
                        >
                          <Receipt size={13} /> 🧾 बिल बनाएं (+ Load to Cart)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 MODAL: EMERGENCY MID-SHIFT HANDOVER */}
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
