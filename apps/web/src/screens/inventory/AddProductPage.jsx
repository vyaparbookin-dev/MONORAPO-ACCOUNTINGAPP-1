import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const AddProductPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    costPrice: "",
    profitMargin: "", // NEW: Profit Margin %
    sellingPrice: "",
    mrp: "",
    gstRate: "",
    unit: "pcs",
    stock: "",
    minimumStock: 10,
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
  const [industry, setIndustry] = useState("general");

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const catRes = await api.get('/api/category').catch(() => null);
        if (catRes) {
          const fetchedCats = catRes.data?.categories || catRes.data || [];
          if (fetchedCats.length > 0) setCategories(prev => [...new Set([...prev, ...fetchedCats.map(c => c.name)])]);
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
    const margin = parseFloat(field === 'profitMargin' ? value : updatedForm.profitMargin) || 0;

    // Auto calculate Selling Price based on Cost Price + Margin %
    if ((field === 'costPrice' || field === 'profitMargin') && cp > 0 && margin > 0) {
      updatedForm.sellingPrice = (cp + (cp * margin) / 100).toFixed(2);
    }
    
    // If user manually types Selling Price, calculate Margin % back
    if (field === 'sellingPrice' && cp > 0) {
      const sp = parseFloat(value) || 0;
      updatedForm.profitMargin = (((sp - cp) / cp) * 100).toFixed(2);
    }
    setForm(updatedForm);
  };

  const generateInternalCode = () => {
    // Generates a simple unique code for internal products
    const timestamp = Date.now();
    setForm({ ...form, barcode: `ITEM${timestamp.toString().slice(-6)}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/inventory", form);
      alert("Product added successfully!");
      navigate("/inventory/list");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
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
            <label className="block text-sm font-medium text-gray-700">Barcode (Scan or Generate)</label>
            <div className="flex gap-2 mt-1">
              <input
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Scan product's barcode"
              />
              <button
                type="button"
                onClick={generateInternalCode}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                title="Generate code for products without a barcode"
              >
                Generate
              </button>
            </div>
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
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.subCategory}
              onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              placeholder="Type a sub-category"
            />
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
          <h3 className="font-semibold mb-2">Pricing & Tax</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.costPrice}
                onChange={(e) => handlePriceCalculation('costPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profit Margin (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50"
                value={form.profitMargin}
                onChange={(e) => handlePriceCalculation('profitMargin', e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price *</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                value={form.sellingPrice}
                onChange={(e) => handlePriceCalculation('sellingPrice', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GST Rate (%)</label>
              <select
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              >
                <option value="">0%</option>
                {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Product
        </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;