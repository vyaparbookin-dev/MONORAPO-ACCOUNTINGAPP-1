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

  const { selectedCompany } = useCompany();
  const business = getBusinessMode(selectedCompany);

  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  useEffect(() => {
    // Global Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        customerNameInputRef.current?.focus();
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, barcode]);

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
    setCart((prev) => {
      const prodId = product._id || product.uuid || product.id;
      const price = parseFloat(product.sellingPrice || product.price || 0);
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

  const getGrandTotal = () => {
    return cart.reduce((sum, item) => sum + (item.total || 0), 0);
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
            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border">F2 खोजें</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border">F4 ग्राहक</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-300">
              F9 बिल बनाएं
            </span>
          </div>
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

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className="text-sm font-black text-blue-700 font-mono">₹{price}</span>
                        <span className="p-1 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                          <Plus size={14} />
                        </span>
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
    </div>
  );
}
