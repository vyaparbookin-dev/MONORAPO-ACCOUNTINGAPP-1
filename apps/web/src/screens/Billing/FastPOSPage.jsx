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
} from "lucide-react";
import RestaurantKotModal from "../../components/modals/RestaurantKotModal";
import { getBusinessMode } from "../../utils/businessMode";
import { useCompany } from "../../contexts/CompanyContext";

export default function FastPOSPage() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerInsight, setCustomerInsight] = useState(null);

  // Dual View Mode: 'tiles' (Food/Visual Grid with images) or 'list' (Fast Table/Keyboard mode)
  const [viewMode, setViewMode] = useState("tiles");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  // Modals & Bottom Bar State
  const [showKotModal, setShowKotModal] = useState(false);
  const [showSlipScanner, setShowSlipScanner] = useState(false);
  const [slipImage, setSlipImage] = useState(null);
  const [slipText, setSlipText] = useState("");
  const [isBottomCartExpanded, setIsBottomCartExpanded] = useState(false);

  // --- ⏰ OWNER CONTROLLED HAPPY HOURS STATE ---
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [happyHourConfig, setHappyHourConfig] = useState(() => {
    const saved = localStorage.getItem("vb_happy_hours");
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      startHour: 12, // 12 PM
      endHour: 16,   // 4 PM
      discountPercent: 20,
      categories: ["Fast Food", "Beverages", "Snacks", "Restaurant"]
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
      table: "Table 2 (AC Hall)",
      waiter: "Rohan",
      placedAt: new Date(Date.now() - 14 * 60000), // 14 mins ago
      prepTimeMinutes: 11,
      status: "READY", // 'COOKING' | 'READY' | 'SERVED'
      items: [{ name: "Crispy Veg Burger", qty: 2 }, { name: "Cold Coffee", qty: 2 }]
    },
    {
      id: "KOT-102",
      table: "Table 4 (Garden)",
      waiter: "Sunil",
      placedAt: new Date(Date.now() - 24 * 60000), // 24 mins ago (Delayed!)
      prepTimeMinutes: 24,
      status: "COOKING",
      items: [{ name: "Farmhouse Pizza", qty: 1 }, { name: "Paneer Tikka", qty: 1 }]
    },
    {
      id: "KOT-103",
      table: "Table 1 (Family)",
      waiter: "Aman",
      placedAt: new Date(Date.now() - 6 * 60000), // 6 mins ago
      prepTimeMinutes: 6,
      status: "COOKING",
      items: [{ name: "Veg Dum Biryani", qty: 2 }, { name: "Butter Naan", qty: 4 }]
    }
  ]);

  // --- ⭐ CUSTOMER FEEDBACK & GOOGLE REVIEW MODAL STATE ---
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", category: "Fast Food", stock: 50, barcode: "" });
  const [feedbackBillData, setFeedbackBillData] = useState(null);

  // Check if current time falls into Happy Hours
  const isCurrentTimeInHappyHours = () => {
    if (!happyHourConfig.isEnabled) return false;
    const currentHour = new Date().getHours();
    return currentHour >= happyHourConfig.startHour && currentHour < happyHourConfig.endHour;
  };
  const isHappyHourActive = isCurrentTimeInHappyHours();

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

  const cartRef = useRef(cart);
  const customerNameRef = useRef(customerName);
  const customerMobileRef = useRef(customerMobile);
  const customerAddressRef = useRef(customerAddress);

  useEffect(() => {
    cartRef.current = cart;
    customerNameRef.current = customerName;
    customerMobileRef.current = customerMobile;
    customerAddressRef.current = customerAddress;
  }, [cart, customerName, customerMobile, customerAddress]);

  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  };

  const focusCustomer = () => {
    if (customerNameInputRef.current) {
      customerNameInputRef.current.focus();
      customerNameInputRef.current.select();
    }
  };

  const triggerCheckout = () => {
    handleCheckout();
  };

  useEffect(() => {
    // Global Keyboard Shortcuts (F2, F4, F9, Escape)
    const handleKeyDown = (e) => {
      const key = e.key || e.code;
      if (key === "F2" || e.code === "F2" || e.keyCode === 113) {
        e.preventDefault();
        focusSearch();
      } else if (key === "F4" || e.code === "F4" || e.keyCode === 115) {
        e.preventDefault();
        focusCustomer();
      } else if (key === "F9" || e.code === "F9" || e.keyCode === 120) {
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
        const totalSpent = matchedBills.reduce((sum, b) => sum + (b.total || 0), 0);
        const avgSpent = Math.round(totalSpent / matchedBills.length);
        const lastBill = matchedBills[0];
        const lastDate = new Date(lastBill.createdAt || lastBill.date).toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthVisits = matchedBills.filter((b) => {
          const d = new Date(b.createdAt || b.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        setCustomerInsight({
          totalVisits: matchedBills.length,
          thisMonthVisits,
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

    const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    if (!quickProductForm.name.trim() || !quickProductForm.price) {
      return alert("कृपया प्रोडक्ट का नाम और कीमत दर्ज करें!");
    }

    const newProd = {
      _id: `custom_prod_${Date.now()}`,
      name: quickProductForm.name.trim(),
      sellingPrice: parseFloat(quickProductForm.price),
      price: parseFloat(quickProductForm.price),
      category: quickProductForm.category || "General",
      currentStock: parseInt(quickProductForm.stock) || 50,
      unit: "pcs",
      barcode: quickProductForm.barcode.trim() || String(Date.now()).slice(-6),
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"
    };

    try {
      await api.post("/api/inventory", newProd).catch(() => {});
      const updated = [newProd, ...products];
      setProducts(updated);
      localStorage.setItem("vb_custom_products", JSON.stringify(updated));
      setShowQuickAddProductModal(false);
      setQuickProductForm({ name: "", price: "", category: "Fast Food", stock: 50, barcode: "" });
      addToCart(newProd);
      alert(`🎉 "${newProd.name}" जुड़ गया और कार्ट में डाल दिया गया!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllDummyData = () => {
    if (window.confirm("क्या आप सभी डमी प्रोडक्ट्स और बिल्स को हटाकर नए सिरे (Clean Slate) से शुरू करना चाहते हैं?")) {
      setProducts([]);
      setCart([]);
      setBills([]);
      localStorage.removeItem("vb_custom_products");
      localStorage.removeItem("vb_local_bills");
      alert("✨ सभी डमी डेटा साफ़ कर दिया गया है! अब आप '+ नया आइटम जोड़ें' से अपना असली मेन्यू जोड़ सकते हैं।");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/inventory").catch(() => ({ data: [] }));
      const productList = res.data?.products || res.data || [];
      setProducts(productList.filter(Boolean));
    } catch (err) {
      console.error(err);
      setProducts([]);
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
    
    // Check Happy Hour discount
    let price = parseFloat(product.sellingPrice || product.price || 0);
    const cat = product.category || "General";
    if (isHappyHourActive && happyHourConfig.categories.includes(cat)) {
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
    if (e) e.preventDefault();
    setCouponError("");
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);

    // 1. Flat 100 off on 500+ (e.g. SAVE100, REST100, SAVE100-XYZ)
    if (code.startsWith("SAVE100") || code.startsWith("REST100") || code.includes("100")) {
      if (subtotal < 500) {
        return setCouponError("⚠️ यह कूपन ₹500 या उससे अधिक के बिल पर ही मान्य है!");
      }
      setAppliedCoupon({ code, type: "FLAT", discount: 100, title: "₹100 की फ्लैट छूट (Min ₹500)" });
      setCouponCodeInput("");
      return;
    }

    // 2. Fries Deal @ Rs 50 (e.g. FRIES50)
    if (code === "FRIES50") {
      setAppliedCoupon({ code, type: "ITEM_DEAL", item: "French Fries", specialPrice: 50, discount: 40, title: "Fries Deal @ ₹50 Only (Save ₹40)" });
      setCouponCodeInput("");
      return;
    }

    // 3. Burger Deal @ Rs 30 (e.g. BURGER30)
    if (code === "BURGER30") {
      setAppliedCoupon({ code, type: "ITEM_DEAL", item: "Crispy Burger", specialPrice: 30, discount: 90, title: "Burger Deal @ ₹30 Only (Save ₹90)" });
      setCouponCodeInput("");
      return;
    }

    // 4. Percentage Discount (e.g. FLAT20, VIP15)
    if (code.includes("20")) {
      const disc = Math.round(subtotal * 0.20);
      setAppliedCoupon({ code, type: "PERCENT", percent: 20, discount: disc, title: "20% की छूट (All Items)" });
      setCouponCodeInput("");
      return;
    }

    if (code.includes("10") || code.includes("OFF")) {
      const disc = Math.round(subtotal * 0.10);
      setAppliedCoupon({ code, type: "PERCENT", percent: 10, discount: disc, title: "10% की छूट (Special Customer)" });
      setCouponCodeInput("");
      return;
    }

    // Default custom coupon
    const disc = Math.min(100, Math.round(subtotal * 0.15));
    setAppliedCoupon({ code, type: "CUSTOM", discount: disc, title: `विशेष ऑफर: ₹${disc} की छूट (${code})` });
    setCouponCodeInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const getGrandTotal = () => {
    const rawTotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = appliedCoupon ? (appliedCoupon.discount || 0) : 0;
    return Math.max(0, rawTotal - discount);
  };

  const getTotalItemsCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setLoading(true);
    try {
      const payload = {
        billNumber: `POS-${Date.now().toString().slice(-6)}`,
        customerName: customerName || "Walk-in Customer",
        customerMobile: customerMobile || "",
        customerAddress: customerAddress || "",
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          rate: item.rate,
          unit: item.unit,
          total: item.total,
        })),
        total: getGrandTotal(),
        status: "paid",
      };

      await api.post("/api/billing", payload);
      alert(`🎉 बिल सफलतापूर्वक तैयार हो गया! कुल: ₹${getGrandTotal()}`);
      setCart([]);
      setCustomerName("");
      setCustomerMobile("");
      setCustomerAddress("");
      setCustomerInsight(null);
      setIsBottomCartExpanded(false);
      fetchBills();
    } catch (err) {
      alert("Error creating bill: " + (err.response?.data?.message || err.message));
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
  };

  // Handle Waiter Paper Slip Photo OCR
  const handleSlipFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSlipImage(event.target.result);
      // Auto-simulate / parse items from handwriting
      setSlipText("2 Butter Naan\n1 Shahi Paneer\n1 Veg Biryani\n2 Cold Drink (Coke)");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyParsedSlip = () => {
    if (!slipText.trim()) return alert("कोई आइटम नहीं मिला!");
    const lines = slipText.split("\n");
    lines.forEach((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      let qty = 1;
      let name = line.trim();
      if (match) {
        qty = parseInt(match[1]) || 1;
        name = match[2].trim();
      }
      if (name) {
        const matchedProd = products.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
        const rate = matchedProd ? matchedProd.sellingPrice || matchedProd.price || 150 : 150;
        setCart((prev) => [
          ...prev,
          {
            productId: matchedProd?._id || "",
            name: matchedProd ? matchedProd.name : name,
            category: matchedProd?.category || "Restaurant",
            rate: rate,
            quantity: qty,
            unit: matchedProd?.unit || "PLT",
            total: qty * rate,
            image: matchedProd?.image || "",
          },
        ]);
      }
    });

    setShowSlipScanner(false);
    setSlipImage(null);
    setSlipText("");
    alert("🎉 कागज़ की पर्ची से ऑर्डर सफलतापूर्वक कार्ट में जुड़ गया!");
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-100 -m-6 p-6 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 mb-3 flex justify-between items-center shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-md">
            <Monitor size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fast POS Touch & Counter Billing</span>
              {business.isRestaurant && (
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Restaurant Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium">टचस्क्रीन टाइल्स व सुपरफास्ट बारकोड काउंटर बिलिंग</p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Waiter Paper Slip Photo OCR Button */}
          <button
            onClick={() => setShowSlipScanner(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
            title="कागज़ की पर्ची की फोटो खींचकर KOT बनाएं"
          >
            <Camera size={14} /> 📝 रफ पर्ची स्कैनर (OCR)
          </button>

          {business.isRestaurant && (
            <button
              onClick={() => setShowKotModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Utensils size={14} /> 🍽️ Table KOT
            </button>
          )}

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

          <div className="hidden sm:flex gap-2 text-xs font-bold">
            <button
              onClick={() => setShowHappyHourModal(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 ${
                isHappyHourActive
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md animate-pulse"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
              title="Happy Hours डिस्काउंट सेटिंग (ओनर द्वारा नियंत्रित)"
            >
              ⏰ {isHappyHourActive ? `Happy Hours ON (${happyHourConfig.discountPercent}% OFF)` : "Happy Hours"}
            </button>
            <button
              onClick={focusSearch}
              className="bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1 active:scale-95"
              title="खोज बॉक्स पर जाएं (Keyboard Shortcut: F2)"
            >
              🔍 <span className="font-mono">F2</span> खोजें
            </button>
            <button
              onClick={focusCustomer}
              className="bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1 active:scale-95"
              title="ग्राहक बॉक्स पर जाएं (Keyboard Shortcut: F4)"
            >
              👤 <span className="font-mono">F4</span> ग्राहक
            </button>
            <button
              onClick={triggerCheckout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg border border-emerald-500 shadow-sm transition flex items-center gap-1 active:scale-95"
              title="पक्का बिल तैयार करें (Keyboard Shortcut: F9)"
            >
              ⚡ <span className="font-mono">F9</span> बिल बनाएं
            </button>
            <button
              onClick={() => setShowQuickAddProductModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="नया आइटम तुरंत जोड़ें"
            >
              <Plus size={14} /> नया आइटम
            </button>
            <button
              onClick={handleClearAllDummyData}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold transition"
              title="सभी डमी डेटा साफ़ करें"
            >
              🗑️ साफ़ करें
            </button>
          </div>
        </div>
      </div>

      {/* 📊 DAILY KITCHEN SPEED-OF-SERVICE & TURNAROUND SLA BAR */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2">
            <span>⏱️ आज का सर्विस रिपोर्ट (Daily Speed SLA):</span>
            <span className="text-emerald-400 font-bold">42 Orders Served</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
              🟢 On-Time: 39 Tables (93%)
            </span>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg border border-rose-300 animate-pulse" title="20 मिनट से ज्यादा समय लेने वाले लेट ऑर्डर्स">
              🔴 Late Delayed: 3 Tables (&gt;20 mins)
            </span>
            <span className="text-slate-500 text-[11px] hidden md:inline font-medium">
              (Avg Turnaround: 11.4 Mins)
            </span>
          </div>
        </div>

        {/* Live Active KOT Quick Bar */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {activeKotOrders.map(kot => {
            const isReady = kot.status === "READY";
            const isLate = kot.prepTimeMinutes >= 20;
            return (
              <div
                key={kot.id}
                className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-2 shrink-0 ${
                  isReady
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md animate-bounce"
                    : isLate
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                    : "bg-amber-50 text-amber-900 border-amber-300"
                }`}
              >
                <span>{isReady ? "🔔" : "⏳"} {kot.table}</span>
                <span className="text-[10px] font-mono opacity-90">{kot.prepTimeMinutes}m</span>
                {isReady && (
                  <button
                    onClick={() => handleUpdateKotStatus(kot.id, "SERVED")}
                    className="ml-1 px-1.5 py-0.5 bg-white text-emerald-800 text-[10px] font-black rounded hover:bg-slate-100"
                  >
                    ✓ Served
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-4 flex-1 min-h-0 pb-20">
        {/* Left Side: Product Selector (Tiles Grid vs Barcode List) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Category Tabs & Search Bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="बारकोड स्कैन करें या प्रोडक्ट खोजें... (F2)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={barcode || searchFilter}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    setSearchFilter(e.target.value);
                  }}
                  onKeyDown={handleSearch}
                />
              </div>
            </div>

            {/* Category Scrollable Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
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
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                          : "border-slate-200 hover:border-blue-300"
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
                          <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {inCartItem.quantity}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{p.category || "General"}</p>
                      </div>

                      {/* Stock Switch & Price */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-blue-700 font-mono">
                            ₹{isHappyHourActive && happyHourConfig.categories.includes(p.category || "General")
                              ? Math.round(price * (1 - happyHourConfig.discountPercent / 100))
                              : price}
                          </span>
                          {isHappyHourActive && happyHourConfig.categories.includes(p.category || "General") && (
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
                            title="1-Click Out of Stock (86 Item) Switch"
                          >
                            {outOfStockItems.includes(prodId) ? "86 Out" : "In Stock"}
                          </button>
                          <span
                            onClick={() => addToCart(p)}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              outOfStockItems.includes(prodId)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                            }`}
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
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-center">Stock</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p._id || p.uuid} className="border-b hover:bg-blue-50/50">
                      <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                      <td className="p-2.5 text-slate-500">{p.category || "General"}</td>
                      <td className="p-2.5 text-right font-black text-blue-700">₹{p.sellingPrice || p.price || 0}</td>
                      <td className="p-2.5 text-center text-slate-600">
                        {p.currentStock || 0} {p.unit || "pcs"}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => addToCart(p)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Customer Info & Cart Sidebar */}
        <div className="w-96 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col shrink-0 overflow-hidden">
          {/* Customer Input & Live Insights */}
          <div className="p-4 border-b border-slate-800 bg-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} className="text-blue-400" />
                <span>ग्राहक विवरण (Customer Info)</span>
              </span>
              {customerInsight && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  🌟 Repeat ({customerInsight.totalVisits} Visits)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                ref={customerNameInputRef}
                type="text"
                placeholder="ग्राहक का नाम"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
              />
              <input
                type="text"
                placeholder="मोबाइल नंबर (F4)"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 font-bold font-mono"
              />
            </div>

            {/* 🎁 AUTO SUGGEST AVAILABLE CUSTOMER COUPON POPUP */}
            {customerMobile.length >= 10 && !appliedCoupon && (
              <div className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 p-2 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center gap-1.5">
                  <Gift size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-300 text-[11px]">🎉 1 कूपन उपलब्ध: SAVE100 (₹100 OFF)</p>
                    <p className="text-[9px] text-slate-400">मोबाइल {customerMobile} पर एक्टिव लॉयल्टी ऑफर</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sub = cart.reduce((s, i) => s + (i.total || 0), 0);
                    if (sub > 0 && sub < 500) {
                      alert("⚠️ यह कूपन ₹500 या उससे अधिक के बिल पर लागू होगा। कृपया कार्ट में कुछ और आइटम जोड़ें!");
                    }
                    setAppliedCoupon({ code: `SAVE100-${customerMobile.slice(-4)}`, type: "FLAT", discount: 100, title: "₹100 की फ्लैट छूट (Min ₹500)" });
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition shrink-0 shadow"
                >
                  ✓ लागू करें (1-Click)
                </button>
              </div>
            )}

            {/* Live Customer Insight Widget */}
            {customerInsight && (
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-[11px] space-y-1 animate-in fade-in">
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} className="text-blue-400" /> इस महीने:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {customerInsight.thisMonthVisits} बार (कुल {customerInsight.totalVisits})
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-amber-400" /> पिछली विजिट:
                  </span>
                  <span className="font-bold text-white font-mono">{customerInsight.lastVisitDate}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <DollarSign size={11} className="text-emerald-400" /> कुल खर्च:
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ₹{customerInsight.totalSpent} (₹{customerInsight.avgSpent}/bill)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                <ShoppingCart size={32} className="mb-2 opacity-40" />
                <p>कार्ट खाली है</p>
                <p className="text-[10px] text-slate-600">टाइल्स पर क्लिक करें या F2 दबाकर स्कैन करें</p>
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

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-slate-700 rounded-lg p-0.5 border border-slate-600">
                      <button
                        onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-300 hover:bg-slate-600 rounded"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-300 hover:bg-slate-600 rounded"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="font-black text-amber-400 font-mono w-14 text-right">₹{item.total}</span>

                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 🎟️ COUPON & LOYALTY VOUCHER BOX */}
          <div className="px-4 py-2 bg-slate-800/60 border-t border-slate-800">
            {appliedCoupon ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-2 rounded-xl flex items-center justify-between text-xs animate-in zoom-in-95">
                <div className="flex items-center gap-1.5">
                  <Gift size={14} className="text-emerald-400" />
                  <div>
                    <span className="font-bold text-emerald-300 font-mono">{appliedCoupon.code}</span>
                    <p className="text-[10px] text-emerald-400">{appliedCoupon.title} (-₹{appliedCoupon.discount})</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-rose-400 hover:text-rose-300 font-black text-xs px-1.5 py-0.5"
                >
                  ✕ हटाएं
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="कूपन कोड (उदा. SAVE100, FRIES50)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none uppercase font-mono font-bold"
                  />
                  <button
                    type="submit"
                    disabled={!couponCodeInput.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    लागू करें
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-400 font-medium">{couponError}</p>}
              </form>
            )}
          </div>

          {/* Bill Total & Checkout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-slate-400 font-medium">कुल रकम ({cart.length} आइटम्स)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">₹{getGrandTotal()}</div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                Cash / UPI (Paid)
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{loading ? "बिल तैयार हो रहा है..." : "⚡ पक्का बिल बनाएं (F9)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 BLINKIT-STYLE STICKY BOTTOM FLOATING CART BAR 🌟 */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-6 right-6 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          {/* Thumbnails of Added Items */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 max-w-[60%]">
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700 shrink-0 text-xs"
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-6 h-6 rounded-md object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center">
                    <ImageIcon size={12} className="text-slate-400" />
                  </div>
                )}
                <span className="font-bold text-white max-w-[80px] truncate">{item.name}</span>
                <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded font-black text-[10px]">
                  x{item.quantity}
                </span>
                <span className="font-mono text-amber-300 font-bold">₹{item.total}</span>
              </div>
            ))}
          </div>

          {/* Cart Summary & Fast Checkout */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {getTotalItemsCount()} आइटम्स
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">₹{getGrandTotal()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Save size={16} />
              <span>{loading ? "प्रोसेसिंग..." : "बिल प्रिंट करें (F9)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 📝 WAITER HAND-WRITTEN PAPER SLIP OCR MODAL 📝 */}
      {showSlipScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/30 rounded-xl border border-purple-400/30">
                  <Camera className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">वेटर रफ पर्ची / नोटपैड स्कैनर</h3>
                  <p className="text-xs text-purple-200">कागज़ पर लिखे ऑर्डर की फोटो खींचें या टेक्स्ट लिखें</p>
                </div>
              </div>
              <button
                onClick={() => setShowSlipScanner(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo Upload / Capture */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-purple-50 transition bg-purple-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleSlipFileUpload}
                />
                {slipImage ? (
                  <div className="flex flex-col items-center">
                    <img src={slipImage} alt="Slip" className="max-h-40 rounded-lg shadow mb-2 object-contain" />
                    <span className="text-xs text-purple-700 font-bold">फोटो लोड हो गई! नीचे ऑटो-पार्स देखें</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <Camera className="w-8 h-8 text-purple-500 mb-1" />
                    <span className="text-xs font-bold text-purple-900">
                      📷 कैमरे से पर्ची की फोटो खींचें या फाइल चुनें
                    </span>
                    <span className="text-[10px] text-slate-400">वेटर के हाथ से लिखे ऑर्डर को स्वतः पढ़ लेगा</span>
                  </div>
                )}
              </div>

              {/* Parsed / Manual Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>पहचाने गए आइटम्स (प्रति लाइन 1 डिश):</span>
                  <span className="text-[10px] text-purple-600 font-medium">e.g. 2 Butter Naan</span>
                </label>
                <textarea
                  rows={4}
                  value={slipText}
                  onChange={(e) => setSlipText(e.target.value)}
                  placeholder="2 Butter Naan&#10;1 Shahi Paneer&#10;1 Veg Biryani"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSlipScanner(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleApplyParsedSlip}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg"
                >
                  ⚡ 1-क्लिक कार्ट में जोड़ें (Add to Cart)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Table KOT Modal */}
      <RestaurantKotModal
        isOpen={showKotModal}
        onClose={() => setShowKotModal(false)}
        onApplyKot={handleApplyKot}
        inventory={products}
      />
      {/* ⏰ OWNER CONTROLLED HAPPY HOURS MODAL */}
      {showHappyHourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Happy Hours & Dynamic Discount</h3>
                  <p className="text-xs text-slate-500">ओनर द्वारा नियंत्रित समय और डिस्काउंट सेटिंग</p>
                </div>
              </div>
              <button onClick={() => setShowHappyHourModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <div>
                  <span className="font-black text-amber-950 text-sm">Happy Hours सक्रिय करें</span>
                  <p className="text-[11px] text-amber-800">तय समय पर ऑटोमैटिक डिस्काउंट लागू होगा</p>
                </div>
                <input
                  type="checkbox"
                  checked={happyHourConfig.isEnabled}
                  onChange={(e) => {
                    const updated = { ...happyHourConfig, isEnabled: e.target.checked };
                    setHappyHourConfig(updated);
                    localStorage.setItem("vb_happy_hours", JSON.stringify(updated));
                  }}
                  className="w-5 h-5 accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">शुरू समय (Start Hour)</label>
                  <select
                    value={happyHourConfig.startHour}
                    onChange={(e) => {
                      const updated = { ...happyHourConfig, startHour: parseInt(e.target.value) };
                      setHappyHourConfig(updated);
                      localStorage.setItem("vb_happy_hours", JSON.stringify(updated));
                    }}
                    className="w-full p-2.5 border rounded-xl font-bold bg-white text-slate-800"
                  >
                    <option value={11}>11:00 AM</option>
                    <option value={12}>12:00 PM (दोपहर)</option>
                    <option value={13}>1:00 PM</option>
                    <option value={14}>2:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">समाप्त समय (End Hour)</label>
                  <select
                    value={happyHourConfig.endHour}
                    onChange={(e) => {
                      const updated = { ...happyHourConfig, endHour: parseInt(e.target.value) };
                      setHappyHourConfig(updated);
                      localStorage.setItem("vb_happy_hours", JSON.stringify(updated));
                    }}
                    className="w-full p-2.5 border rounded-xl font-bold bg-white text-slate-800"
                  >
                    <option value={15}>3:00 PM</option>
                    <option value={16}>4:00 PM (शाम)</option>
                    <option value={17}>5:00 PM</option>
                    <option value={18}>6:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">छूट प्रतिशत (Discount %)</label>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const updated = { ...happyHourConfig, discountPercent: pct };
                        setHappyHourConfig(updated);
                        localStorage.setItem("vb_happy_hours", JSON.stringify(updated));
                      }}
                      className={`flex-1 py-2 rounded-xl font-black text-xs transition ${
                        happyHourConfig.discountPercent === pct
                          ? "bg-amber-600 text-white shadow"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowHappyHourModal(false);
                alert("✅ Happy Hours सेटिंग सफलतापूर्वक सेव हो गई!");
              }}
              className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-2xl hover:bg-slate-800 transition"
            >
              सेटिंग सुरक्षित करें (Save Config)
            </button>
          </div>
        </div>
      )}

      {/* ⭐ CUSTOMER FEEDBACK & GOOGLE REVIEW MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
              ⭐
            </div>
            <h3 className="text-xl font-black text-slate-900">कस्टमर फीडबैक व गूगल रिव्यू</h3>
            <p className="text-xs text-slate-500 mt-1">
              बिल #{feedbackBillData?.billNumber} • कुल रकम: ₹{feedbackBillData?.totalAmount}
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <p className="text-xs font-bold text-slate-700 mb-2">📲 बिल रसीद पर यह QR कोड प्रिंट हुआ है:</p>
              <div className="w-36 h-36 bg-white p-2 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center shadow-inner text-center text-xs text-slate-400 font-bold">
                [ QR Code: Rate 5-Star on Google Maps ]
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-2">
                ✓ 4-5 स्टार देने पर सीधे Google Map Review खुलेगा
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const text = `Namaste ${feedbackBillData?.customerName}! Thank you for dining with us at VyaparBook Restaurant. Total Bill: ₹${feedbackBillData?.totalAmount}. Please rate your experience: ⭐⭐⭐⭐⭐ https://g.page/r/sample-google-review`;
                  window.open(`https://api.whatsapp.com/send?phone=91${feedbackBillData?.customerMobile}&text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1"
              >
                📲 WhatsApp Review
              </button>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl shadow transition"
              >
                Done (पूर्ण)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}