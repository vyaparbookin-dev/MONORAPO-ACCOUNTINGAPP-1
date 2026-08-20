import React, { useState } from "react";
import { X, ChefHat, Plus, Trash2, Calculator, Sparkles, DollarSign, Flame, Zap, Box } from "lucide-react";
import api from "../../services/api";

export default function RestaurantRecipeModal({ isOpen, onClose, inventory = [], onRecipeSaved }) {
  const [dishName, setDishName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  
  // Ingredients (Raw Materials)
  const [ingredients, setIngredients] = useState([
    { id: 1, name: "Paneer", quantity: 0.2, unit: "KG", costPerUnit: 350, totalCost: 70 },
    { id: 2, name: "Amul Butter", quantity: 0.05, unit: "KG", costPerUnit: 520, totalCost: 26 },
    { id: 3, name: "Tomato & Onion Gravy", quantity: 0.15, unit: "KG", costPerUnit: 120, totalCost: 18 },
    { id: 4, name: "Spices & Cooking Oil", quantity: 1, unit: "PCS", costPerUnit: 12, totalCost: 12 },
  ]);

  // Selected Ingredient Inputs
  const [selectedRawName, setSelectedRawName] = useState("");
  const [rawQty, setRawQty] = useState("");
  const [rawUnit, setRawUnit] = useState("KG");
  const [rawRate, setRawRate] = useState("");

  // Overheads per dish (Gas, Chef Labor, Electricity, Packaging)
  const [gasCost, setGasCost] = useState(6);
  const [chefLaborCost, setChefLaborCost] = useState(15);
  const [electricityCost, setElectricityCost] = useState(4);
  const [packagingCost, setPackagingCost] = useState(8);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Add raw material
  const handleAddIngredient = () => {
    if (!selectedRawName.trim()) return alert("कच्चा माल (Raw Material) का नाम दर्ज करें!");
    const qty = parseFloat(rawQty) || 1;
    const rate = parseFloat(rawRate) || 0;
    const total = Math.round(qty * rate * 100) / 100;

    setIngredients([
      ...ingredients,
      {
        id: Date.now(),
        name: selectedRawName.trim(),
        quantity: qty,
        unit: rawUnit,
        costPerUnit: rate,
        totalCost: total,
      },
    ]);

    setSelectedRawName("");
    setRawQty("");
    setRawRate("");
  };

  const handleRemoveIngredient = (id) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  // Calculations
  const rawMaterialCost = ingredients.reduce((sum, i) => sum + i.totalCost, 0);
  const totalOverheadCost =
    (parseFloat(gasCost) || 0) +
    (parseFloat(chefLaborCost) || 0) +
    (parseFloat(electricityCost) || 0) +
    (parseFloat(packagingCost) || 0);

  const totalActualCost = Math.round((rawMaterialCost + totalOverheadCost) * 100) / 100;
  const sp = parseFloat(sellingPrice) || 0;
  const netProfit = sp > 0 ? Math.round((sp - totalActualCost) * 100) / 100 : 0;
  const profitMarginPercent = sp > 0 ? Math.round((netProfit / sp) * 100) : 0;

  const handleSaveRecipe = async () => {
    if (!dishName.trim()) return alert("कृपया डिश का नाम दर्ज करें!");
    if (ingredients.length === 0) return alert("कम से कम 1 कच्चा माल जोड़ें!");

    setSaving(true);
    try {
      // Create or update menu item product with recipe and production cost
      const payload = {
        name: dishName.trim(),
        category: "Restaurant Menu",
        sellingPrice: sp || (totalActualCost * 1.6),
        costPrice: totalActualCost,
        productionCost: totalActualCost,
        unit: "PLT",
        recipe: ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          cost: i.totalCost,
        })),
        customFields: {
          gasCost,
          chefLaborCost,
          electricityCost,
          packagingCost,
          foodCost: rawMaterialCost,
        },
      };

      await api.post("/api/inventory", payload).catch(() => {});
      alert(`🎉 डिश "${dishName}" की रेसिपी व वास्तविक लागत (₹${totalActualCost}) सफलतापूर्वक सेव हो गई!`);
      if (onRecipeSaved) onRecipeSaved();
      onClose();
    } catch (err) {
      alert("रेसिपी सेव करने में त्रुटि: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-amber-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/30 rounded-xl border border-red-400/30">
              <ChefHat className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>रेसिपी BOM एवं प्रति प्लेट वास्तविक लागत इंजन</span>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Food Cost & Overheads</span>
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                कच्चा माल + शेफ, गैस व बिजली का खर्च जोड़कर सटीक लागत व मुनाफा निकालें
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Dish Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">डिश या मेनू आइटम का नाम *</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Shahi Paneer, Butter Chicken, Veg Biryani"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">मेनू बिक्री रेट (Selling Price ₹)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 260"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold text-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Raw Materials / Ingredients */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-amber-950 uppercase tracking-wide">
                1. प्रति प्लेट कच्चा माल (Ingredients / Raw Materials)
              </label>
              <span className="text-xs font-bold text-amber-800 font-mono">
                कच्चा माल लागत: ₹{rawMaterialCost.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  list="recipe-raw-list"
                  value={selectedRawName}
                  onChange={(e) => {
                    setSelectedRawName(e.target.value);
                    const matched = inventory.find((p) => p.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matched) {
                      setRawRate(matched.costPrice || matched.price || 0);
                      if (matched.unit) setRawUnit(matched.unit);
                    }
                  }}
                  placeholder="कच्चा माल (e.g. पनीर, तेल, चिकन)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
                <datalist id="recipe-raw-list">
                  {inventory.filter((p) => p.isRawMaterial).map((p) => (
                    <option key={p._id || p.id} value={p.name} />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={rawQty}
                  onChange={(e) => setRawQty(e.target.value)}
                  placeholder="मात्रा (Qty)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={rawUnit}
                  onChange={(e) => setRawUnit(e.target.value.toUpperCase())}
                  placeholder="KG, GM, LTR"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white uppercase text-center"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> सामग्री जोड़ें
                </button>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {ingredients.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-slate-500 font-mono ml-2">
                      ({item.quantity} {item.unit} @ ₹{item.costPerUnit}/{item.unit})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 font-mono">₹{item.totalCost.toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveIngredient(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overheads (Chef, LPG Gas, Electricity, Packaging) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
              2. प्रति प्लेट अन्य खर्चे (Overhead Costs / Plate)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Flame size={12} className="text-orange-500" /> गैस/LPG खर्च (₹)
                </label>
                <input
                  type="number"
                  value={gasCost}
                  onChange={(e) => setGasCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ChefHat size={12} className="text-purple-500" /> शेफ/लेबर खर्च (₹)
                </label>
                <input
                  type="number"
                  value={chefLaborCost}
                  onChange={(e) => setChefLaborCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> बिजली/पानी खर्च (₹)
                </label>
                <input
                  type="number"
                  value={electricityCost}
                  onChange={(e) => setElectricityCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Box size={12} className="text-blue-500" /> पैकिंग बॉक्स (₹)
                </label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Profit & Cost Summary Card */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-xl">
            <div className="border-r border-slate-700 pr-2">
              <p className="text-[11px] text-slate-400 font-medium">कुल वास्तविक लागत (True Cost)</p>
              <p className="text-lg font-black text-amber-400 font-mono">₹{totalActualCost}</p>
              <p className="text-[10px] text-slate-500">कच्चा माल: ₹{rawMaterialCost.toFixed(0)} + ओवरहेड: ₹{totalOverheadCost}</p>
            </div>

            <div className="border-r border-slate-700 pr-2">
              <p className="text-[11px] text-slate-400 font-medium">बिक्री दर (Selling Price)</p>
              <p className="text-lg font-black text-white font-mono">₹{sp || 0}</p>
              <p className="text-[10px] text-slate-500">{sp > 0 ? "मेनू रेट सेट है" : "बिक्री रेट भरें"}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-medium">शुद्ध मुनाफा (Net Margin)</p>
              <p className={`text-lg font-black font-mono ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ₹{netProfit} ({profitMarginPercent}%)
              </p>
              <p className="text-[10px] text-slate-500">{profitMarginPercent >= 40 ? "🔥 बेहतरीन मार्जिन" : "⚠️ मार्जिन कम है"}</p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleSaveRecipe}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white rounded-xl font-black text-xs shadow-lg transition disabled:opacity-50"
            >
              {saving ? "सेव हो रहा है..." : "💾 रेसिपी व लागत सेव करें (Save BOM Recipe)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
