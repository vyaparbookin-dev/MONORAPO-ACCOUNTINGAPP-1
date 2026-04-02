import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Camera as CameraIcon, UploadCloud, X } from "lucide-react";

const AddProductPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: `ITM${Date.now().toString().slice(-6)}`,
    description: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    image: "",
    costPrice: "",
    costPriceWithTax: "",
    profitMargin: "", // NEW: Profit Margin %
    sellingPrice: "",
    sellingPriceWithTax: "",
    wholesalePrice: "",
    wholesalePriceWithTax: "",
    wholesaleMargin: "",
    dealerPrice: "",
    dealerPriceWithTax: "",
    dealerMargin: "",
    mrp: "",
    gstRate: "",
    unit: "pcs",
    stock: "",
    minimumStock: 10,
    maximumStock: "",
    supplier: "",
    // New Business Specific Fields
    isRawMaterial: false,
    weight: "",
    purity: "",
    makingChargeType: "fixed",
    makingCharge: "",
    brand: "",
    dimensions: "",
    materialType: "",
    ageGroup: "",
    certification: "",
    warrantyPeriod: "",
  });

  const gstRates = [0, 5, 12, 18, 28];

  // Make dropdowns dynamic
  const [units, setUnits] = useState(["pcs", "kg", "ltr", "ft", "mtr", "dozen", "box", "bag", "nag", "cartoon", "set", "pair"]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [industry, setIndustry] = useState("general");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const invRes = await api.get('/api/inventory').catch(() => ({ data: { products: [] } }));
        const inventoryList = invRes.data?.products || invRes.data || [];

        const productCats = inventoryList.map(p => p.category).filter(Boolean);
        const productSubCats = inventoryList.map(p => p.subCategory).filter(Boolean);
        
        const catRes = await api.get('/api/category').catch(() => ({ data: [] }));
        const masterCats = (catRes.data?.categories || catRes.data || []).map(c => c.name);
        
        const allCats = [...masterCats, ...productCats];
        if (allCats.length > 0) {
          setCategories(prev => [...new Set([...prev, ...allCats])]);
        }
        if (productSubCats.length > 0) {
          setSubCategories([...new Set(productSubCats)]);
        }

        const unitRes = await api.get('/api/unit').catch(() => null);
        if (unitRes) {
          const fetchedUnits = unitRes.data?.units || unitRes.data || [];
          if (fetchedUnits.length > 0) setUnits(prev => [...new Set([...prev, ...fetchedUnits.map(u => u.name)])]);
        }

        // Fetch company industry type for conditional logic
        const settingsRes = await api.get('/api/settings').catch(() => null);
        if (settingsRes?.data?.data) {
          setIndustry((settingsRes.data.data.industryType || settingsRes.data.data.businessType || "general").toLowerCase());
        }
      } catch (err) { console.warn("Failed to load dynamic dropdowns", err); }
    };
    fetchDropdowns();
  }, []);

  const handlePriceCalculation = (field, value) => {
    let updatedForm = { ...form, [field]: value };
    
    const cp = parseFloat(field === 'costPrice' ? value : updatedForm.costPrice) || 0;
    const cpWithTax = parseFloat(field === 'costPriceWithTax' ? value : updatedForm.costPriceWithTax) || 0;
    const gst = parseFloat(field === 'gstRate' ? value : updatedForm.gstRate) || 0;

    // Retail
    const sp = parseFloat(field === 'sellingPrice' ? value : updatedForm.sellingPrice) || 0;
    const spWithTax = parseFloat(field === 'sellingPriceWithTax' ? value : updatedForm.sellingPriceWithTax) || 0;
    const margin = parseFloat(field === 'profitMargin' ? value : updatedForm.profitMargin) || 0;

    // Wholesale
    const wp = parseFloat(field === 'wholesalePrice' ? value : updatedForm.wholesalePrice) || 0;
    const wpWithTax = parseFloat(field === 'wholesalePriceWithTax' ? value : updatedForm.wholesalePriceWithTax) || 0;
    const wMargin = parseFloat(field === 'wholesaleMargin' ? value : updatedForm.wholesaleMargin) || 0;

    // Dealer
    const dp = parseFloat(field === 'dealerPrice' ? value : updatedForm.dealerPrice) || 0;
    const dpWithTax = parseFloat(field === 'dealerPriceWithTax' ? value : updatedForm.dealerPriceWithTax) || 0;
    const dMargin = parseFloat(field === 'dealerMargin' ? value : updatedForm.dealerMargin) || 0;

    const calcSpFromMargin = (cost, m) => cost + (cost * m / 100);
    const calcTax = (val, g) => val + (val * g / 100);
    const calcMargin = (sell, cost) => cost > 0 ? ((sell - cost) / cost) * 100 : 0;
    const calcBaseFromTax = (val, g) => val / (1 + g / 100);

    if (field === 'costPrice') {
      updatedForm.costPriceWithTax = cp ? calcTax(cp, gst).toFixed(2) : "";
      if (margin > 0 && cp) { updatedForm.sellingPrice = calcSpFromMargin(cp, margin).toFixed(2); updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2); }
      if (wMargin > 0 && cp) { updatedForm.wholesalePrice = calcSpFromMargin(cp, wMargin).toFixed(2); updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2); }
      if (dMargin > 0 && cp) { updatedForm.dealerPrice = calcSpFromMargin(cp, dMargin).toFixed(2); updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2); }
    } else if (field === 'costPriceWithTax') {
      const newCp = cpWithTax ? calcBaseFromTax(cpWithTax, gst) : 0;
      updatedForm.costPrice = newCp ? newCp.toFixed(2) : "";
      if (margin > 0 && newCp) { updatedForm.sellingPrice = calcSpFromMargin(newCp, margin).toFixed(2); updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2); }
      if (wMargin > 0 && newCp) { updatedForm.wholesalePrice = calcSpFromMargin(newCp, wMargin).toFixed(2); updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2); }
      if (dMargin > 0 && newCp) { updatedForm.dealerPrice = calcSpFromMargin(newCp, dMargin).toFixed(2); updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2); }
    } else if (field === 'gstRate') {
      if (cp) updatedForm.costPriceWithTax = calcTax(cp, gst).toFixed(2);
      if (sp) updatedForm.sellingPriceWithTax = calcTax(sp, gst).toFixed(2);
      if (wp) updatedForm.wholesalePriceWithTax = calcTax(wp, gst).toFixed(2);
      if (dp) updatedForm.dealerPriceWithTax = calcTax(dp, gst).toFixed(2);
    } else if (field === 'sellingPrice') {
      updatedForm.sellingPriceWithTax = sp ? calcTax(sp, gst).toFixed(2) : "";
      if (cp > 0 && sp) updatedForm.profitMargin = calcMargin(sp, cp).toFixed(2);
    } else if (field === 'sellingPriceWithTax') {
      const newSp = spWithTax ? calcBaseFromTax(spWithTax, gst) : 0;
      updatedForm.sellingPrice = newSp ? newSp.toFixed(2) : "";
      if (cp > 0 && newSp) updatedForm.profitMargin = calcMargin(newSp, cp).toFixed(2);
    } else if (field === 'profitMargin' && cp > 0 && margin > 0) {
      updatedForm.sellingPrice = calcSpFromMargin(cp, margin).toFixed(2); updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2);
    } else if (field === 'wholesalePrice') {
      updatedForm.wholesalePriceWithTax = wp ? calcTax(wp, gst).toFixed(2) : ""; if (cp > 0 && wp) updatedForm.wholesaleMargin = calcMargin(wp, cp).toFixed(2);
    } else if (field === 'wholesalePriceWithTax') {
      const newWp = wpWithTax ? calcBaseFromTax(wpWithTax, gst) : 0; updatedForm.wholesalePrice = newWp ? newWp.toFixed(2) : ""; if (cp > 0 && newWp) updatedForm.wholesaleMargin = calcMargin(newWp, cp).toFixed(2);
    } else if (field === 'wholesaleMargin' && cp > 0 && wMargin > 0) {
      updatedForm.wholesalePrice = calcSpFromMargin(cp, wMargin).toFixed(2); updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2);
    } else if (field === 'dealerPrice') {
      updatedForm.dealerPriceWithTax = dp ? calcTax(dp, gst).toFixed(2) : ""; if (cp > 0 && dp) updatedForm.dealerMargin = calcMargin(dp, cp).toFixed(2);
    } else if (field === 'dealerPriceWithTax') {
      const newDp = dpWithTax ? calcBaseFromTax(dpWithTax, gst) : 0; updatedForm.dealerPrice = newDp ? newDp.toFixed(2) : ""; if (cp > 0 && newDp) updatedForm.dealerMargin = calcMargin(newDp, cp).toFixed(2);
    } else if (field === 'dealerMargin' && cp > 0 && dMargin > 0) {
      updatedForm.dealerPrice = calcSpFromMargin(cp, dMargin).toFixed(2); updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2);
    }

    setForm(updatedForm);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, facingMode: 'environment' });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.7); // compression
      setForm({ ...form, image: dataUrl });
      stopCamera();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image must be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => { if (isCameraOpen) stopCamera(); };
  }, [isCameraOpen]);

  const resetForm = () => {
    setForm({
      name: "", sku: "", barcode: `ITM${Date.now().toString().slice(-6)}`, description: "", category: "", subCategory: "", image: "",
      hsnCode: "", costPrice: "", costPriceWithTax: "", profitMargin: "", sellingPrice: "",
      sellingPriceWithTax: "", mrp: "", gstRate: "", unit: "pcs", stock: "",
      wholesalePrice: "", wholesalePriceWithTax: "", wholesaleMargin: "",
      dealerPrice: "", dealerPriceWithTax: "", dealerMargin: "",
      minimumStock: 10, maximumStock: "", supplier: "", isRawMaterial: false, weight: "", purity: "",
      makingChargeType: "fixed", makingCharge: "", brand: "", dimensions: "",
      materialType: "", ageGroup: "", certification: "", warrantyPeriod: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/inventory", form);
      alert("Product added successfully!");
      navigate("/inventory");
    } catch (err) {
      console.error(err);
      alert("Error adding product: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveAndAddAnother = async (e) => {
    e.preventDefault();
    try {
      if (!form.name || !form.category || !form.costPrice || !form.sellingPrice) {
        return alert("Please fill all required fields before saving.");
      }
      await api.post("/api/inventory", form);
      alert("Product saved! You can now add another one.");
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error adding product: " + (err.response?.data?.message || err.message));
    }
  };

  // Industry logic for conditional rendering
  const showRawMaterial = ['restaurant', 'food', 'cafe', 'bakery', 'manufacturing'].some(i => industry.includes(i));
  const showJewellery = ['jewellery', 'jewelry', 'goldsmith'].some(i => industry.includes(i));
  const showHardware = ['hardware', 'builder', 'construction', 'real estate', 'paint'].some(i => industry.includes(i));
  const showScienceSports = ['sports', 'science', 'medical', 'pharma', 'gym'].some(i => industry.includes(i));
  const showAnySpecific = showRawMaterial || showJewellery || showHardware || showScienceSports;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Product Image Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image (Optional)</label>
          {isCameraOpen ? (
            <div className="relative w-full max-w-sm bg-black rounded-lg overflow-hidden flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline className="h-48 w-full object-contain" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-2 flex gap-2">
                <button type="button" onClick={captureImage} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-700">Capture</button>
                <button type="button" onClick={stopCamera} className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"><X size={20} /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-300">
                {form.image ? <img src={form.image} alt="Product" className="w-full h-full object-cover" /> : <UploadCloud className="text-gray-400" size={32} />}
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex w-fit items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition text-sm font-medium shadow-sm">
                  <UploadCloud size={16} /> Upload File
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <button type="button" onClick={startCamera} className="flex w-fit items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition text-sm font-medium shadow-sm">
                  <CameraIcon size={16} /> Open Camera
                </button>
                {form.image && (
                  <button type="button" onClick={() => setForm({...form, image: ""})} className="text-xs text-red-600 hover:underline text-left">Remove Image</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU / Code</label>
            <input
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Barcode (Auto or Scan)</label>
            <input
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="Scan barcode"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <input
              list="category-list"
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Type or select a category"
              required
            />
            <datalist id="category-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sub Category</label>
            <input
              list="subcategory-list"
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.subCategory}
              onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              placeholder="Type a sub-category"
            />
            <datalist id="subcategory-list">
              {subCategories.map(sc => <option key={sc} value={sc} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">HSN Code</label>
            <input
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.hsnCode}
              onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Pricing & Margins</h3>
          
          {/* Base Costs & GST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GST Rate (%)</label>
              <select
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.gstRate}
                onChange={(e) => handlePriceCalculation('gstRate', e.target.value)}
              >
                <option value="">0%</option>
                {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (W/O GST) *</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.costPrice}
                onChange={(e) => handlePriceCalculation('costPrice', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (With GST)</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.costPriceWithTax}
                onChange={(e) => handlePriceCalculation('costPriceWithTax', e.target.value)}
              />
            </div>
          </div>

          {/* Retail Price */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Margin (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50"
                value={form.profitMargin}
                onChange={(e) => handlePriceCalculation('profitMargin', e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (W/O GST) *</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                value={form.sellingPrice}
                onChange={(e) => handlePriceCalculation('sellingPrice', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (With GST) *</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                value={form.sellingPriceWithTax}
                onChange={(e) => handlePriceCalculation('sellingPriceWithTax', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MRP</label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </div>
          </div>

          {/* Wholesale Price */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Margin (%)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50" value={form.wholesaleMargin} onChange={(e) => handlePriceCalculation('wholesaleMargin', e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (W/O GST)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={form.wholesalePrice} onChange={(e) => handlePriceCalculation('wholesalePrice', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (With GST)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={form.wholesalePriceWithTax} onChange={(e) => handlePriceCalculation('wholesalePriceWithTax', e.target.value)} />
            </div>
            <div className="hidden md:block"></div> {/* Spacer */}
          </div>

          {/* Dealer Price */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Margin (%)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50" value={form.dealerMargin} onChange={(e) => handlePriceCalculation('dealerMargin', e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (W/O GST)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={form.dealerPrice} onChange={(e) => handlePriceCalculation('dealerPrice', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (With GST)</label>
              <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={form.dealerPriceWithTax} onChange={(e) => handlePriceCalculation('dealerPriceWithTax', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Opening Stock</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Stock Limit</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.maximumStock}
                onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Industry Specific Details */}
        {showAnySpecific && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-gray-800">Business Specific Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
              
              {/* Restaurant / Manufacturing */}
              {showRawMaterial && (
                <div className="md:col-span-3 flex items-center gap-2 mb-1">
                  <input type="checkbox" id="isRawMaterial" checked={form.isRawMaterial} onChange={(e) => setForm({...form, isRawMaterial: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <label htmlFor="isRawMaterial" className="text-sm font-medium text-gray-700">Is this a Raw Material? (For Recipes/Manufacturing/Restaurant)</label>
                </div>
              )}

              {/* Jewellery */}
              {showJewellery && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jewellery</label>
                  <input type="number" placeholder="Weight (Grams or mg)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} step="0.001" />
                  <input type="text" placeholder="Purity (e.g. 22K, 925 Silver)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.purity} onChange={(e) => setForm({...form, purity: e.target.value})} />
                </div>
              )}

              {/* Hardware */}
              {showHardware && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hardware & Builder</label>
                  <input type="text" placeholder="Brand Name (e.g. Asian Paints)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} />
                  <input type="text" placeholder="Dimensions (e.g. 8x4 ft)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.dimensions} onChange={(e) => setForm({...form, dimensions: e.target.value})} />
                </div>
              )}

              {/* Science & Sports */}
              {showScienceSports && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Science & Sports</label>
                  <input type="text" placeholder="Material (e.g. Borosilicate, Leather)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.materialType} onChange={(e) => setForm({...form, materialType: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Warranty" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.warrantyPeriod} onChange={(e) => setForm({...form, warrantyPeriod: e.target.value})} />
                    <input type="text" placeholder="Age Grp" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.ageGroup} onChange={(e) => setForm({...form, ageGroup: e.target.value})} />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
          <button type="button" onClick={handleSaveAndAddAnother} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium">
            Save & Add Another
          </button>
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
          Save Product
        </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;