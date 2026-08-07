import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, Save, Search, Trash2, Monitor } from "lucide-react";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";

export default function FastPOSPage() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const searchInputRef = useRef(null);
  const customerNameInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []); // Run ONCE on mount

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
  }, [cart, barcode]); // Keyboard listeners depend on these states

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let productList = [];
      
      // 1. Local Offline DB First
      const rawProducts = await dbService.getInventory();

      // ULTIMATE ARRAY CHECK
      if (Array.isArray(rawProducts)) productList = rawProducts;
      else if (rawProducts && Array.isArray(rawProducts.products)) productList = rawProducts.products;
      else if (rawProducts && Array.isArray(rawProducts.data)) productList = rawProducts.data;

      setProducts(productList.filter(Boolean));
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Barcode scan or manual entry
  const handleSearch = (e) => {
    if (e.key === "Enter" && barcode.trim() !== "") {
      e.preventDefault();
      const foundProduct = products.find(
        (p) => p && (String(p.barcode) === barcode || String(p.sku) === barcode || String(p.name || '').toLowerCase() === barcode.toLowerCase())
      );

      if (foundProduct) {
        addToCart(foundProduct);
      } else {
        alert("Product not found! Please check the barcode or name.");
      }
      setBarcode(""); // Clear input after search
    }
  };

  const handleManualAddBtn = () => {
    if (barcode.trim() !== "") {
      const foundProduct = products.find(
        (p) => p && (String(p.barcode) === barcode || String(p.sku) === barcode || String(p.name || '').toLowerCase() === barcode.toLowerCase())
      );
      if (foundProduct) {
        addToCart(foundProduct);
        setBarcode("");
      } else {
        alert("Product not found! Please check the barcode or name.");
      }
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const prodId = product._id || product.uuid;
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
          rate: price,
          quantity: 1,
          total: price,
        },
      ];
    });
  };

  const removeFromCart = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const handleQuantityChange = (idx, newQty) => {
    if (newQty < 1) return;
    const updatedCart = [...cart];
    updatedCart[idx].quantity = newQty;
    updatedCart[idx].total = newQty * updatedCart[idx].rate;
    setCart(updatedCart);
  };

  const getGrandTotal = () => cart.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        billNumber: `POS-${Date.now()}`,
        customerName: customerName.trim() || "Walk-in Customer",
        customerMobile: customerMobile.trim(),
        customerAddress: customerAddress.trim(),
        items: cart,
        total: getGrandTotal(),
        finalAmount: getGrandTotal(),
        status: "paid", // Fast POS defaults to paid by cash
        paymentMethod: "cash",
        date: new Date().toISOString()
      };

      // 1. Offline Save (Local SQLite DB)
      await dbService.saveInvoice({
          invoice: {
            invoice_number: payload.billNumber,
            customer_uuid: "walk-in",
            customerName: payload.customerName,
            customerAddress: payload.customerAddress,
            date: payload.date,
            total_amount: payload.total,
            tax_amount: 0,
            status: payload.status
          },
          items: cart.map(i => ({
            item_name: i.name,
            quantity: i.quantity,
            price: i.rate,
            tax_rate: 0,
            total: i.total
          }))
        });

      // 2. Cloud Sync
      await syncQueue.enqueue({ entityId: payload.billNumber, entity: 'invoice', method: "POST", url: "/api/billing", data: payload });
      
      alert("Bill Generated Offline Successfully!");
      setCart([]);
      setCustomerName("");
      setCustomerMobile("");
      setCustomerAddress("");
      searchInputRef.current?.focus(); // Focus back to scanner
    } catch (err) {
      alert("Error generating bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-gray-100 -m-6 p-6">
      {/* Header with Shortcuts Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg"><Monitor className="text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fast POS Billing</h1>
            <p className="text-sm text-gray-500">Retail counter keyboard-first mode</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <div className="bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <span className="bg-white border rounded px-1 text-xs mr-1 shadow-sm font-mono">F2</span> Search Product
          </div>
          <div className="bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <span className="bg-white border rounded px-1 text-xs mr-1 shadow-sm font-mono">F4</span> Add Customer
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md border border-green-200">
            <span className="bg-white border-green-300 rounded px-1 text-xs mr-1 shadow-sm font-mono text-green-800">F9</span> Checkout & Print
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Cart Section */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Scan Barcode or Type Product Name + Enter"
                className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleSearch}
              />
          <button onClick={handleManualAddBtn} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold shadow-sm transition">
            Enter
          </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-left">
              <thead className="bg-gray-100 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 text-gray-600 font-semibold">Item</th>
                  <th className="p-3 text-gray-600 font-semibold text-center w-32">Qty</th>
                  <th className="p-3 text-gray-600 font-semibold text-right">Rate</th>
                  <th className="p-3 text-gray-600 font-semibold text-right">Total</th>
                  <th className="p-3 text-gray-600 font-semibold text-center w-16">#</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    <p className="text-xl font-medium text-gray-500 mb-2">Cart is empty</p>
                    <p className="text-sm mb-4">Scan an item barcode or type the product name</p>
                      <button onClick={() => searchInputRef.current?.focus()} className="px-6 py-2 border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition">Start Scanning (F2)</button>
                  </td>
                </tr>
                ) : (
                  cart.filter(Boolean).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-blue-50">
                      <td className="p-3 font-medium text-gray-800">{item.name}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          className="w-20 border border-gray-300 rounded p-1 text-center font-bold"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value))}
                        />
                      </td>
                      <td className="p-3 text-right">₹{item.rate}</td>
                      <td className="p-3 text-right font-bold text-blue-600">₹{item.total}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* NEW: Quick Add Products Grid */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 h-64 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Quick Select Items</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.filter(Boolean).map(p => (
                <button 
                  key={p._id || p.uuid} 
                  onClick={() => addToCart(p)}
                  className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition text-left flex flex-col justify-between min-h-[5rem]"
                >
                  <span className="font-semibold text-gray-800 text-sm line-clamp-2">{p.name}</span>
                  <span className="text-blue-600 font-black mt-2">₹{p.price || p.sellingPrice || 0}</span>
                </button>
              ))}
              {products.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-400 py-6 font-medium">No items found in inventory. Please add products first.</div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Summary Section */}
        <div className="w-80 bg-slate-900 text-white rounded-xl shadow-lg flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-700 bg-slate-800 rounded-t-xl shadow-inner">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Customer Info (F4)</h3>
            <input 
              ref={customerNameInputRef}
              type="text" 
              placeholder="Customer Name (Optional)" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mb-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" 
            />
            <input 
              type="text" 
              placeholder="Mobile Number (Optional)" 
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              className="w-full mb-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" 
            />
            <textarea 
              placeholder="Customer Address (Optional)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><ShoppingCart /> Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Total Items</span>
                <span className="font-bold text-white">{cart.length}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold text-white">₹{getGrandTotal()}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span className="font-bold">₹0</span>
              </div>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end">
            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-1">Grand Total</p>
              <p className="text-4xl font-black text-green-400">₹{getGrandTotal()}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition"
            >
              <Save size={24} /> {loading ? "Processing..." : "Complete Bill (F9)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}