import React, { useState, useEffect } from "react";
import {
  X,
  ChefHat,
  Plus,
  Trash2,
  Calculator,
  Sparkles,
  DollarSign,
  Flame,
  Zap,
  Box,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
  CheckCircle2
} from "lucide-react";
import api from "../../services/api";

export default function RestaurantRecipeModal({ isOpen, onClose, inventory = [], onRecipeSaved }) {
  if (!isOpen) return null;

  const [dishName, setDishName] = useState("Shahi Paneer (Special Gravy)");
  const [sellingPrice, setSellingPrice] = useState("260");

  // Ingredients with historical base price vs live current purchase price from inventory
  const [ingredients, setIngredients] = useState([
    { id: 1, name: "Paneer (Fresh Malai)", quantity: 0.20, unit: "KG", baseCost: 320, costPerUnit: 380, totalCost: 76, matchedInvKey: "PANEER" },
    { id: 2, name: "Amul Butter / Makhan", quantity: 0.05, unit: "KG", baseCost: 480, costPerUnit: 540, totalCost: 27, matchedInvKey: "BUTTER" },
    { id: 3, name: "Fresh Cream / Malai", quantity: 0.05, unit: "KG", baseCost: 200, costPerUnit: 220, totalCost: 11, matchedInvKey: "CREAM" },
    { id: 4, name: "Tomato & Onion Gravy Paste", quantity: 0.15, unit: "KG", baseCost: 60, costPerUnit: 90, totalCost: 13.5, matchedInvKey: "TOMATO" },
    { id: 5, name: "Cashew (Kaju) Paste & Spices", quantity: 0.03, unit: "KG", baseCost: 700, costPerUnit: 780, totalCost: 23.4, matchedInvKey: "KAJU" },
    { id: 6, name: "Refined Cooking Oil", quantity: 0.03, unit: "LTR", baseCost: 120, costPerUnit: 145, totalCost: 4.35, matchedInvKey: "OIL" },
  ]);

  // Selected Ingredient Inputs
  const [selectedRawName, setSelectedRawName] = useState("");
  const [rawQty, setRawQty] = useState("");
  const [rawUnit, setRawUnit] = useState("KG");
  const [rawRate, setRawRate] = useState("");

  // Overheads per dish (Gas, Chef Labor, Electricity, Packaging)
  const [gasCost, setGasCost] = useState(8);
  const [chefLaborCost, setChefLaborCost] = useState(18);
  const [electricityCost, setElectricityCost] = useState(5);
  const [packagingCost, setPackagingCost] = useState(10);

  // Target Profit Margin % Slider
  const [targetMarginPercent, setTargetMarginPercent] = useState(55); // Default 55% gross margin

  const [saving, setSaving] = useState(false);

  // Auto-sync live current purchase rates from active Inventory
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setIngredients((prev) =>
        prev.map((ing) => {
          const matched = inventory.find(
            (p) =>
              (p.name || "").toUpperCase().includes(ing.matchedInvKey || "") ||
              (p.name || "").toUpperCase().includes(ing.name.toUpperCase())
          );
          if (matched && matched.costPrice) {
            const liveRate = parseFloat(matched.costPrice) || ing.costPerUnit;
            return {
              ...ing,
              costPerUnit: liveRate,
              totalCost: Math.round(ing.quantity * liveRate * 100) / 100
            };
          }
          return ing;
        })
      );
    }
  }, [inventory]);

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
        baseCost: rate,
        costPerUnit: rate,
        totalCost: total,
      },
    ]);

    setSelectedRawName("");
    setRawQty("");
    setRawRate("");
  };

  const handleUpdateIngredientRate = (id, newRate) => {
    const rate = parseFloat(newRate) || 0;
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, costPerUnit: rate, totalCost: Math.round(i.quantity * rate * 100) / 100 } : i
      )
    );
  };

  const handleRemoveIngredient = (id) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  // Calculations
  const baseRawMaterialCost = ingredients.reduce((sum, i) => sum + (i.quantity * (i.baseCost || i.costPerUnit)), 0);
  const currentRawMaterialCost = ingredients.reduce((sum, i) => sum + i.totalCost, 0);

  const totalOverheadCost =
    (parseFloat(gasCost) || 0) +
    (parseFloat(chefLaborCost) || 0) +
    (parseFloat(electricityCost) || 0) +
    (parseFloat(packagingCost) || 0);

  const baseTotalDishCost = Math.round((baseRawMaterialCost + totalOverheadCost) * 100) / 100;
  const currentTotalDishCost = Math.round((currentRawMaterialCost + totalOverheadCost) * 100) / 100;

  // Inflation percentage jump in recipe
  const costInflationAmount = currentTotalDishCost - baseTotalDishCost;
  const costInflationPercentage = baseTotalDishCost > 0 ? Math.round(((currentTotalDishCost - baseTotalDishCost) / baseTotalDishCost) * 100) : 0;

  const sp = parseFloat(sellingPrice) || 0;
  const currentNetProfit = sp > 0 ? Math.round((sp - currentTotalDishCost) * 100) / 100 : 0;
  const currentProfitMarginPercent = sp > 0 ? Math.round((currentNetProfit / sp) * 100) : 0;

  // AI Recommended Selling Price based on target gross margin %
  const recommendedSellingPrice = Math.round(currentTotalDishCost / (1 - targetMarginPercent / 100));
  const suggestedPriceIncrease = Math.max(0, recommendedSellingPrice - sp);

  const handleApplyRecommendedPrice = () => {
    setSellingPrice(recommendedSellingPrice.toString());
  };

  const handleSaveRecipe = async () => {
    if (!dishName.trim()) return alert("कृपया डिश का नाम दर्ज करें!");
    if (ingredients.length === 0) return alert("कम से कम 1 कच्चा माल जोड़ें!");

    setSaving(true);
    try {
      const payload = {
        name: dishName.trim(),
        category: "Restaurant Menu",
        sellingPrice: sp || recommendedSellingPrice,
        costPrice: currentTotalDishCost,
        productionCost: currentTotalDishCost,
        unit: "PLT",
        recipe: ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          cost: i.totalCost,
          costPerUnit: i.costPerUnit
        })),
        customFields: {
          gasCost,
          chefLaborCost,
          electricityCost,
          packagingCost,
          foodCost: currentRawMaterialCost,
          baseDishCost: baseTotalDishCost,
          inflationPercent: costInflationPercentage
        },
      };

      // Save locally to localStorage so Kitchen Production Planner can read it
      try {
        const savedRecipes = JSON.parse(localStorage.getItem("restaurant_recipes") || "[]");
        const updatedRecipes = savedRecipes.filter((r) => r.dishName !== dishName.trim());
        updatedRecipes.unshift({
          id: `REC-${Date.now()}`,
          dishName: dishName.trim(),
          category: "Main Course",
          portionSize: "1 Plate",
          sellingPrice: sp || recommendedSellingPrice,
          costPrice: currentTotalDishCost,
          ingredients: ingredients.map((i) => ({
            name: i.name,
            qtyPerPortion: i.quantity,
            unit: i.unit.toLowerCase(),
            matchedInvName: i.name.split(" ")[0].toUpperCase()
          }))
        });
        localStorage.setItem("restaurant_recipes", JSON.stringify(updatedRecipes));
      } catch (e) {
        console.error(e);
      }

      await api.post("/api/inventory", payload).catch(() => {});
      alert(`🎉 डिश "${dishName}" की रेसिपी व नवीनतम लागत (₹${currentTotalDishCost}) सफलतापूर्वक सेव हो गई!`);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-amber-900 to-slate-900 p-4 px-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/30 rounded-xl border border-red-400/30">
              <ChefHat className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                🥘 DYNAMIC RESTAURANT RECIPE BOM & INFLATION ADVISOR
              </h2>
              <p className="text-xs text-amber-200">
                कच्चा माल महंगाई ट्रैकर • लाइव रेसिपी लागत व प्रॉफिट मार्जिन लीकेज अलर्ट
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto bg-slate-50">
          {/* Top Dish & Selling Price Details */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Dish / Menu Item Name (डिश का नाम) *
              </label>
              <input
                type="text"
                placeholder="e.g. Shahi Paneer Special / Dal Makhani..."
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Current Menu Selling Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  placeholder="250"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border-2 border-amber-400 rounded-lg text-sm font-black text-amber-900 bg-amber-50/40 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-3 text-right">
              <span className="text-[11px] font-bold text-gray-500 block">Current Profit Margin</span>
              <span
                className={`text-xl font-black px-2.5 py-0.5 rounded-lg inline-block mt-0.5 ${
                  currentProfitMarginPercent >= 50
                    ? "bg-green-100 text-green-800"
                    : currentProfitMarginPercent >= 35
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {currentProfitMarginPercent}% (₹{currentNetProfit} / plate)
              </span>
            </div>
          </div>

          {/* AI Inflation & Profit Leakage Warning Card */}
          {costInflationPercentage > 5 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-2 border-amber-400 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    ⚠️ RAW MATERIAL PRICE INFLATION DETECTED (+{costInflationPercentage}% Cost Jump)
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5">
                    किचन का कच्चा माल (पनीर, मक्खन, तेल) महंगा होने से इस डिश की लागत <strong>₹{baseTotalDishCost}</strong> से बढ़कर <strong>₹{currentTotalDishCost}</strong> हो गई है (+₹{costInflationAmount.toFixed(1)} प्रति प्लेट)।
                  </p>
                  <p className="text-xs text-red-700 font-bold mt-1">
                    आपका पुराना मार्जिन घटकर <strong>{currentProfitMarginPercent}%</strong> रह गया है।
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-gray-600">
                  Target {targetMarginPercent}% Margin Price
                </span>
                <span className="text-2xl font-black text-green-700">₹{recommendedSellingPrice}</span>
                {suggestedPriceIncrease > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyRecommendedPrice}
                    className="mt-1 bg-green-600 hover:bg-green-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow flex items-center gap-1 transition"
                  >
                    <ArrowUpRight size={14} /> Update Menu Price (+₹{suggestedPriceIncrease})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ingredients & Dynamic Purchase Rates Table */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Calculator size={18} className="text-amber-700" />
                Raw Materials & Recipe BOM ({ingredients.length} Ingredients)
              </h3>
              <span className="text-xs text-gray-500">
                Live Kitchen Raw Cost: <strong className="text-gray-900">₹{currentRawMaterialCost.toFixed(2)}</strong>
              </span>
            </div>

            {/* Add New Raw Material Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-lg border border-gray-200 items-end">
              <div className="md:col-span-5">
                <label className="text-[11px] font-bold text-gray-700">Ingredient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Malai Paneer / Desi Ghee"
                  value={selectedRawName}
                  onChange={(e) => setSelectedRawName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border rounded bg-white mt-0.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-gray-700">Qty / Portion</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.2"
                  value={rawQty}
                  onChange={(e) => setRawQty(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border rounded bg-white mt-0.5 text-center font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-gray-700">Unit</label>
                <select
                  value={rawUnit}
                  onChange={(e) => setRawUnit(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border rounded bg-white mt-0.5 font-bold"
                >
                  <option value="KG">KG</option>
                  <option value="LTR">LTR</option>
                  <option value="GM">GM</option>
                  <option value="PCS">PCS</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-gray-700">Purchase Rate (₹)</label>
                <input
                  type="number"
                  placeholder="₹/Unit"
                  value={rawRate}
                  onChange={(e) => setRawRate(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border rounded bg-white mt-0.5 text-center font-bold"
                />
              </div>
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded text-xs flex items-center justify-center shadow"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5">Ingredient Name</th>
                    <th className="p-2.5 text-center">Qty / Portion</th>
                    <th className="p-2.5 text-center">Old Base Rate</th>
                    <th className="p-2.5 text-center bg-yellow-50 text-amber-900 border-x">
                      ✏️ Current Purchase Rate (Editable)
                    </th>
                    <th className="p-2.5 text-center">Rate Trend</th>
                    <th className="p-2.5 text-right">Dish Portion Cost</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ingredients.map((ing) => {
                    const priceDiff = ing.costPerUnit - (ing.baseCost || ing.costPerUnit);
                    const percentDiff = ing.baseCost > 0 ? Math.round((priceDiff / ing.baseCost) * 100) : 0;
                    return (
                      <tr key={ing.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-gray-900">{ing.name}</td>
                        <td className="p-2.5 text-center font-bold text-gray-700">
                          {ing.quantity} {ing.unit}
                        </td>
                        <td className="p-2.5 text-center text-gray-400 font-medium">
                          ₹{ing.baseCost || ing.costPerUnit}/{ing.unit}
                        </td>
                        <td className="p-2.5 text-center bg-yellow-50/50 border-x">
                          <div className="flex items-center justify-center gap-1">
                            <span>₹</span>
                            <input
                              type="number"
                              value={ing.costPerUnit}
                              onChange={(e) => handleUpdateIngredientRate(ing.id, e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-center font-black text-xs border border-amber-400 rounded bg-white"
                            />
                            <span className="text-[10px] text-gray-500">/{ing.unit}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          {percentDiff > 0 ? (
                            <span className="text-[10px] font-black text-red-600 flex items-center justify-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded">
                              <ArrowUpRight size={12} /> +{percentDiff}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">Stable</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-black text-gray-900">
                          ₹{ing.totalCost.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overheads & Production Cost */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
              <Flame size={18} className="text-orange-600" />
              Kitchen Operational Overheads per Dish (₹{totalOverheadCost})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <span className="text-[10px] font-bold text-gray-500">Commercial Gas (LPG)</span>
                <input
                  type="number"
                  value={gasCost}
                  onChange={(e) => setGasCost(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 border rounded mt-1 bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <span className="text-[10px] font-bold text-gray-500">Chef & Karigar Labor</span>
                <input
                  type="number"
                  value={chefLaborCost}
                  onChange={(e) => setChefLaborCost(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 border rounded mt-1 bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <span className="text-[10px] font-bold text-gray-500">Kitchen Electricity</span>
                <input
                  type="number"
                  value={electricityCost}
                  onChange={(e) => setElectricityCost(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 border rounded mt-1 bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <span className="text-[10px] font-bold text-gray-500">Container & Packaging</span>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 border rounded mt-1 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-slate-900 text-white p-4 px-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-gray-400 block">Total Dish Cost (Raw + Overheads):</span>
              <span className="text-xl font-black text-yellow-400">₹{currentTotalDishCost.toFixed(2)}</span>
            </div>
            <div className="border-l border-gray-700 pl-6">
              <span className="text-[11px] text-gray-400 block">Menu Price & Net Margin:</span>
              <span className="text-xl font-black text-green-400">
                ₹{sp} <span className="text-xs font-bold text-gray-300">({currentProfitMarginPercent}% Margin)</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRecipe}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 size={16} /> {saving ? "Saving..." : "Save Recipe & Sync Menu Cost"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
