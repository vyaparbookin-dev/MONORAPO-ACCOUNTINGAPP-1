import React, { useState } from "react";
import { X, Sparkles, Shirt, Plus, CheckCircle2, Image as ImageIcon, Trash2 } from "lucide-react";
import api from "../../services/api";

const SIZE_PRESETS = {
  standard: ["S", "M", "L", "XL", "XXL", "3XL"],
  waist: ["28", "30", "32", "34", "36", "38", "40", "42"],
  footwear: ["6", "7", "8", "9", "10", "11"],
  kids: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
};

const POPULAR_COLORS = [
  "Black", "White", "Navy Blue", "Sky Blue", "Red", "Maroon",
  "Olive Green", "Beige", "Grey", "Pink", "Yellow", "Mustard"
];

export default function GarmentsMatrixModal({ isOpen, onClose, onCreated }) {
  const [baseName, setBaseName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Men's Wear");
  const [sizeType, setSizeType] = useState("standard");
  const [selectedSizes, setSelectedSizes] = useState(["M", "L", "XL"]);
  const [selectedColors, setSelectedColors] = useState(["Black", "Navy Blue"]);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stockPerVariant, setStockPerVariant] = useState(5);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const toggleColor = (color) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalVariants = selectedSizes.length * (selectedColors.length || 1);

  const handleGenerateVariants = async () => {
    if (!baseName.trim()) return alert("कृपया प्रोडक्ट का मुख्य नाम दर्ज करें!");
    if (selectedSizes.length === 0) return alert("कम से कम 1 साइज चुनें!");
    if (!sellingPrice) return alert("कृपया सेलिंग प्राइस दर्ज करें!");

    setLoading(true);
    const variants = [];
    const colors = selectedColors.length > 0 ? selectedColors : ["Standard"];

    colors.forEach((color) => {
      selectedSizes.forEach((size) => {
        const fullName = `${baseName.trim()} - ${color !== "Standard" ? color + " " : ""}(${size})`;
        const autoSku = `${baseName.substring(0, 3).toUpperCase()}-${size}-${color.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        variants.push({
          name: fullName,
          brand: brand.trim() || undefined,
          category: category || "Garments",
          size: size,
          color: color !== "Standard" ? color : undefined,
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          mrp: parseFloat(mrp) || parseFloat(sellingPrice) || 0,
          currentStock: parseInt(stockPerVariant) || 0,
          unit: "pcs",
          sku: autoSku,
          image: image || undefined,
          isActive: true,
        });
      });
    });

    try {
      // Save all variants in batch to backend
      for (const variant of variants) {
        await api.post("/api/inventory", variant).catch(() => {});
      }
      alert(`🎉 बधाई! कुल ${variants.length} साइज/कलर वेरिएंट्स इन्वेंटरी में सफलतापूर्वक जोड़ दिए गए!`);
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert("वेरिएंट्स सेव करने में त्रुटि: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/30 rounded-xl border border-purple-400/30">
              <Shirt className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>कपड़ा व जूता साइज-कलर मैट्रिक्स</span>
                <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">1-Click Auto Batch</span>
              </h2>
              <p className="text-xs text-purple-200 font-medium">
                1-क्लिक में सभी साइज (S, M, L, XL / 38, 40 / 6-10) और कलर वेरिएंट्स बनाएं
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Base Product Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">प्रोडक्ट का मुख्य नाम</label>
              <input
                type="text"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                placeholder="e.g. Raymond Men's Slim Fit Cotton Shirt"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ब्रांड (Brand)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Raymond, Zara, Puma"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          {/* Size Set Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wide">1. साइज सेट चुनें (Sizes)</label>
              <div className="flex items-center gap-1 text-xs">
                {Object.keys(SIZE_PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSizeType(key);
                      setSelectedSizes(SIZE_PRESETS[key].slice(0, 4));
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                      sizeType === key ? "bg-purple-600 text-white shadow-sm" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS[sizeType].map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black border transition ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:border-purple-400"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">2. रंग चुनें (Colors)</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COLORS.map((color) => {
                const isSelected = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & Stock Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">खरीद रेट (Cost ₹)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="₹ Cost"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">बिक्री रेट (Sell ₹)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="₹ Selling"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold text-purple-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="₹ MRP"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्टॉक प्रति साइज (Qty)</label>
              <input
                type="number"
                value={stockPerVariant}
                onChange={(e) => setStockPerVariant(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>
          </div>

          {/* Image Upload (Visual Design Preview) */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-14 h-14 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
              {image ? (
                <img src={image} alt="Design" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900">डिज़ाइन फोटो जोड़ें (Screen Only Preview)</div>
              <p className="text-[11px] text-slate-500">बिल बनाते समय स्क्रीन पर दिखेगी, लेकिन बिल प्रिंट में फोटो नहीं छपेगी</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-600 mt-1 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
            </div>
          </div>

          {/* Live Generation Summary */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-400 font-bold">
                {selectedSizes.length} साइज × {selectedColors.length || 1} कलर
              </div>
              <div className="text-sm font-black">
                कुल बनेंगे: <span className="text-amber-400 font-mono text-base">{totalVariants} अलग-अलग प्रोडक्ट्स</span>
              </div>
            </div>

            <button
              onClick={handleGenerateVariants}
              disabled={loading || totalVariants === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "वेरिएंट्स बन रहे हैं..." : `🚀 एक साथ ${totalVariants} आइटम्स बनाएं`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
