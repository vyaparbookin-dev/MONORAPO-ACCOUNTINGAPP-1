import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";

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
    sellingPrice: "",
    mrp: "",
    gstRate: "",
    unit: "pcs",
    stock: "",
    minimumStock: 10,
    supplier: "",
  });

  const gstRates = [0, 5, 12, 18, 28];

  // Make dropdowns dynamic
  const [units, setUnits] = useState(["pcs", "kg", "ltr", "ft", "mtr", "dozen", "box", "bag", "nag", "cartoon", "set", "pair"]);
  const [categories, setCategories] = useState(["Electronics", "Textiles", "Groceries", "Hardware", "Chemicals", "Others"]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        let localCats = await dbService.getCategories?.() || [];
        if (!localCats.length) {
          const catRes = await api.get('/api/category').catch(() => null);
          if (catRes) localCats = catRes.data?.categories || catRes.data || [];
        }
        if (localCats.length > 0) setCategories(prev => [...new Set([...prev, ...localCats.map(c => c.name)])]);

        let localUnits = await dbService.getUnits?.() || [];
        if (!localUnits.length) {
          const unitRes = await api.get('/api/unit').catch(() => null);
          if (unitRes) localUnits = unitRes.data?.units || unitRes.data || [];
        }
        if (localUnits.length > 0) setUnits(prev => [...new Set([...prev, ...localUnits.map(u => u.name)])]);
      } catch (err) { console.warn("Failed to load dynamic dropdowns", err); }
    };
    fetchDropdowns();
  }, []);

  const generateInternalCode = () => {
    // Generates a simple unique code for internal products
    const timestamp = Date.now();
    setForm({ ...form, barcode: `ITEM${timestamp.toString().slice(-6)}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Offline First: Local SQLite me turant save karein
      await dbService.saveProduct({
          name: form.name,
          sku: form.sku || form.barcode || `SKU-${Date.now()}`,
          price: parseFloat(form.sellingPrice) || 0,
          quantity: parseFloat(form.stock) || 0,
          category: form.category
        });

      // 2. Cloud Sync: Backend par bhejein
      try {
        await api.post("/api/inventory", form);
      } catch (apiErr) {
        // Agar Internet nahi hai ya server down hai, toh queue me daal do
        if (!navigator.onLine || apiErr.message === "Network Error") {
          syncQueue.enqueue({ method: "POST", url: "/api/inventory", data: form });
          console.log("Offline mode: Product queued for sync.");
        } else {
          throw apiErr;
        }
      }

      alert("Product added successfully!");
      navigate("/inventory"); // Using correct path based on common routing
    } catch (err) {
      console.error(err);
      alert("Error adding product: " + (err.response?.data?.message || err.message));
    }
  };

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
            <select
              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price *</label>
              <input
                type="number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
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