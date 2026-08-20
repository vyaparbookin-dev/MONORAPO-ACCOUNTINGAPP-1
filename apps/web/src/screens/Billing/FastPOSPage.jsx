import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { ShoppingCart, Save, Search, Trash2, Monitor, LayoutGrid, List, Utensils, UserCheck, Calendar, Clock, DollarSign, Plus, Minus, Image as ImageIcon } from "lucide-react";
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

  // Modals
  const [showKotModal, setShowKotModal] = useState(false);

  const { selectedCompany } = useCompany();
  const business = getBusinessMode(selectedCompany);

  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);

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
        const lastBill = matchedBills[0]; // Assuming sorted by latest
        const lastDate = new Date(lastBill.createdAt || lastBill.date).toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // Current month visits
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

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-100 -m-6 p-6 overflow-hidden">
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
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Restaurant Mode</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium">टचस्क्रीन टाइल्स व सुपरफास्ट बारकोड काउंटर बिलिंग</p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
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
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-300">F9 बिल बनाएं</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-4 flex-1 min-h-0">
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
                        inCartItem ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30" : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2 flex items-center justify-center border border-slate-100 relative">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
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
                      <td className="p-2.5 text-center text-slate-600">{p.currentStock || 0} {p.unit || 'pcs'}</td>
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

        {/* Right Side: Cart & Customer Insights */}
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
                  🌟 Repeat Customer ({customerInsight.totalVisits} Visits)
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
                  <span className="flex items-center gap-1"><Calendar size={11} className="text-blue-400" /> इस महीने विजिट:</span>
                  <span className="font-bold text-white font-mono">{customerInsight.thisMonthVisits} बार (कुल {customerInsight.totalVisits})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Clock size={11} className="text-amber-400" /> पिछली बार आया:</span>
                  <span className="font-bold text-white font-mono">{customerInsight.lastVisitDate}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1"><DollarSign size={11} className="text-emerald-400" /> कुल खर्च / औसत:</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{customerInsight.totalSpent} (₹{customerInsight.avgSpent}/bill)</span>
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
                <div key={idx} className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <h5 className="font-bold text-white line-clamp-1">{item.name}</h5>
                    <span className="text-[10px] text-slate-400">₹{item.rate} / {item.unit}</span>
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
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Cash / UPI (Paid)</span>
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
