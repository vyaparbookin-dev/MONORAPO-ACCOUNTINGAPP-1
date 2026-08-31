import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  FileSpreadsheet,
  Share2,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Users,
  Sliders,
  Edit3,
  X
} from "lucide-react";

export default function KitchenProductionPlannerModal({ isOpen, onClose, inventory = [] }) {
  if (!isOpen) return null;

  // Load custom restaurant recipes from localStorage or fallback to standard
  const defaultStandardRecipes = [
    {
      id: "REC-1",
      dishName: "Shahi Paneer (Special Gravy)",
      category: "Main Course",
      portionSize: "1 Plate",
      ingredients: [
        { name: "Paneer (Fresh Malai)", qtyPerPortion: 0.15, unit: "kg", matchedInvName: "PANEER" },
        { name: "Butter / Amul Makhan", qtyPerPortion: 0.04, unit: "kg", matchedInvName: "BUTTER" },
        { name: "Fresh Cream", qtyPerPortion: 0.05, unit: "kg", matchedInvName: "CREAM" },
        { name: "Tomato Puree & Gravy", qtyPerPortion: 0.10, unit: "kg", matchedInvName: "TOMATO" },
        { name: "Cashew (Kaju) Paste", qtyPerPortion: 0.02, unit: "kg", matchedInvName: "KAJU" },
      ]
    },
    {
      id: "REC-2",
      dishName: "Dal Makhani (Slow Cooked)",
      category: "Main Course",
      portionSize: "1 Plate",
      ingredients: [
        { name: "Black Urad Dal (Sabut)", qtyPerPortion: 0.08, unit: "kg", matchedInvName: "DAL" },
        { name: "Rajma (Red Kidney Beans)", qtyPerPortion: 0.02, unit: "kg", matchedInvName: "RAJMA" },
        { name: "Desi Ghee / Butter", qtyPerPortion: 0.03, unit: "kg", matchedInvName: "GHEE" },
        { name: "Fresh Cream", qtyPerPortion: 0.04, unit: "kg", matchedInvName: "CREAM" },
      ]
    },
    {
      id: "REC-3",
      dishName: "Butter Naan / Tandoori Roti",
      category: "Breads",
      portionSize: "2 Pcs",
      ingredients: [
        { name: "Fine Maida / Wheat Flour", qtyPerPortion: 0.12, unit: "kg", matchedInvName: "MAIDA" },
        { name: "Butter (Melted)", qtyPerPortion: 0.02, unit: "kg", matchedInvName: "BUTTER" },
        { name: "Milk", qtyPerPortion: 0.03, unit: "ltr", matchedInvName: "MILK" },
      ]
    },
    {
      id: "REC-4",
      dishName: "Veg Dum Biryani with Raita",
      category: "Rice & Biryani",
      portionSize: "1 Portion",
      ingredients: [
        { name: "Basmati Rice (Long Grain)", qtyPerPortion: 0.12, unit: "kg", matchedInvName: "RICE" },
        { name: "Mixed Vegetables & Paneer", qtyPerPortion: 0.08, unit: "kg", matchedInvName: "VEG" },
        { name: "Desi Ghee", qtyPerPortion: 0.02, unit: "kg", matchedInvName: "GHEE" },
        { name: "Curd / Dahi (Raita)", qtyPerPortion: 0.08, unit: "kg", matchedInvName: "CURD" },
      ]
    },
    {
      id: "REC-5",
      dishName: "Cold Coffee with Ice Cream",
      category: "Beverages",
      portionSize: "1 Glass",
      ingredients: [
        { name: "Fresh Full Cream Milk", qtyPerPortion: 0.22, unit: "ltr", matchedInvName: "MILK" },
        { name: "Coffee Powder (Espresso)", qtyPerPortion: 0.015, unit: "kg", matchedInvName: "COFFEE" },
        { name: "Sugar", qtyPerPortion: 0.025, unit: "kg", matchedInvName: "SUGAR" },
        { name: "Vanilla Ice Cream Scoop", qtyPerPortion: 0.05, unit: "kg", matchedInvName: "ICE CREAM" },
      ]
    },
    {
      id: "REC-6",
      dishName: "Gulab Jamun (Hot with Chashni)",
      category: "Desserts",
      portionSize: "2 Pcs",
      ingredients: [
        { name: "Mawa / Khoya", qtyPerPortion: 0.07, unit: "kg", matchedInvName: "MAWA" },
        { name: "Sugar (Sugar Syrup)", qtyPerPortion: 0.08, unit: "kg", matchedInvName: "SUGAR" },
        { name: "Refined Oil / Ghee (Frying)", qtyPerPortion: 0.02, unit: "ltr", matchedInvName: "OIL" },
      ]
    }
  ];

  const [standardRecipes, setStandardRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem("restaurant_recipes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultStandardRecipes;
  });

  const [guestCount, setGuestCount] = useState(40);
  const [selectedDishes, setSelectedDishes] = useState([
    { recipeId: "REC-1", plates: 40 },
    { recipeId: "REC-2", plates: 40 },
    { recipeId: "REC-3", plates: 40 },
    { recipeId: "REC-4", plates: 40 },
    { recipeId: "REC-6", plates: 40 },
  ]);

  const [bufferPercentage, setBufferPercentage] = useState(10); // 10% safety buffer
  const [servingMode, setServingMode] = useState("buffet"); // 'buffet' (60% ratio per multi-curry dish) | 'alacarte' (100% full single plate)
  
  // User manually edited order quantities map { "Paneer (Fresh Malai)": 5.0 }
  const [editedQuantities, setEditedQuantities] = useState({});

  // Toggle or Update Dish in Menu
  const toggleDishInMenu = (recipe) => {
    const exists = selectedDishes.find((d) => d.recipeId === recipe.id);
    if (exists) {
      setSelectedDishes((prev) => prev.filter((d) => d.recipeId !== recipe.id));
    } else {
      setSelectedDishes((prev) => [...prev, { recipeId: recipe.id, plates: guestCount }]);
    }
  };

  const updateDishPlates = (recipeId, plates) => {
    setSelectedDishes((prev) =>
      prev.map((d) => (d.recipeId === recipeId ? { ...d, plates: Math.max(1, parseInt(plates) || 1) } : d))
    );
  };

  // Sync all plates with guestCount
  const handleGuestCountChange = (count) => {
    const val = Math.max(1, parseInt(count) || 1);
    setGuestCount(val);
    setSelectedDishes((prev) => prev.map((d) => ({ ...d, plates: val })));
  };

  // Portion Scaling Factor:
  // If buffet mode and multiple main course dishes exist, reduce portion per head to 60%-70% to prevent food wastage
  const buffetRatio = servingMode === "buffet" && selectedDishes.length >= 3 ? 0.65 : 1.0;

  // Calculate Aggregated Raw Material Requirements
  const rawMaterialRequirements = {};

  selectedDishes.forEach((item) => {
    const recipe = standardRecipes.find((r) => r.id === item.recipeId) || defaultStandardRecipes.find((r) => r.id === item.recipeId);
    if (recipe) {
      recipe.ingredients.forEach((ing) => {
        const key = ing.name;
        const totalQtyNeeded = ing.qtyPerPortion * item.plates * buffetRatio * (1 + bufferPercentage / 100);

        if (!rawMaterialRequirements[key]) {
          // Look up in actual inventory
          const matchedInv = inventory.find(
            (p) =>
              (p.name || "").toUpperCase().includes(ing.matchedInvName || "") ||
              (p.name || "").toUpperCase().includes(ing.name.toUpperCase())
          );

          rawMaterialRequirements[key] = {
            name: ing.name,
            unit: ing.unit,
            requiredQty: 0,
            inStockQty: matchedInv ? parseFloat(matchedInv.currentStock) || 0 : 0,
            costPerUnit: matchedInv ? parseFloat(matchedInv.costPrice || matchedInv.sellingPrice || 100) : 100,
          };
        }
        rawMaterialRequirements[key].requiredQty += totalQtyNeeded;
      });
    }
  });

  const ingredientList = Object.values(rawMaterialRequirements).map((ing) => {
    const req = parseFloat(ing.requiredQty.toFixed(2));
    const stock = ing.inStockQty;
    const calculatedShortage = Math.max(0, parseFloat((req - stock).toFixed(2)));
    
    // Check if user manually edited the purchase quantity (e.g. rounded 3.6 to 4 or 5)
    const finalOrderQty = editedQuantities[ing.name] !== undefined ? editedQuantities[ing.name] : calculatedShortage;
    const estimatedCost = Math.round(finalOrderQty * ing.costPerUnit);

    return { ...ing, requiredQty: req, shortage: calculatedShortage, finalOrderQty, estimatedCost };
  });

  const handleEditQtyChange = (name, val) => {
    const num = parseFloat(val);
    setEditedQuantities((prev) => ({
      ...prev,
      [name]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  const totalShortageCost = ingredientList.reduce((sum, item) => sum + item.estimatedCost, 0);
  const itemsToPurchase = ingredientList.filter((item) => item.finalOrderQty > 0);

  // WhatsApp Grocery List Generator with exact edited quantities
  const shareGroceryListWhatsApp = () => {
    if (itemsToPurchase.length === 0) {
      alert("All ingredients are in stock or quantity is 0. No purchase needed.");
      return;
    }
    let msg = `*📋 KITCHEN PURCHASE / GROCERY ORDER*\n`;
    msg += `*Event / Party Size:* ${guestCount} Guests (${servingMode === "buffet" ? "Buffet Balanced" : "A-la-carte"} + ${bufferPercentage}% Buffer)\n`;
    msg += `*Date:* ${new Date().toLocaleDateString()}\n`;
    msg += `----------------------------------\n`;
    itemsToPurchase.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.name}*: *${it.finalOrderQty} ${it.unit}* (Need: ${it.requiredQty}, Kitchen Stock: ${it.inStockQty})\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*Est. Order Total:* ₹${totalShortageCost.toLocaleString('en-IN')}\n`;
    msg += `*Please pack and deliver to Kitchen as soon as possible.*`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-800 text-white p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <ChefHat size={26} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                🥘 KITCHEN PRODUCTION & RAW MATERIAL INDENT PLANNER
              </h2>
              <p className="text-xs text-emerald-200">
                Restaurant BOM Recipes • Live Stock Check • Editable Final Quantities before WhatsApp
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition">
            <X size={22} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {/* Top Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="text-emerald-700" size={20} />
                <span className="font-bold text-gray-800 text-sm">Planned Guests / Plates:</span>
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => handleGuestCountChange(e.target.value)}
                  className="w-24 px-3 py-1.5 border-2 border-emerald-500 rounded-lg font-black text-center text-lg text-emerald-800 focus:outline-none"
                />
              </div>

              {/* Serving Mode (Buffet vs A-la-carte) */}
              <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span>Serving Mode:</span>
                <select
                  value={servingMode}
                  onChange={(e) => setServingMode(e.target.value)}
                  className="bg-white border rounded px-2 py-0.5 font-bold text-emerald-800"
                >
                  <option value="buffet">Buffet Party (Portion Balanced 65%)</option>
                  <option value="alacarte">Full Single A-la-carte (100%)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span>Kitchen Buffer:</span>
                <select
                  value={bufferPercentage}
                  onChange={(e) => setBufferPercentage(parseInt(e.target.value))}
                  className="bg-white border rounded px-2 py-0.5 font-bold text-emerald-800"
                >
                  <option value={0}>0% Exact</option>
                  <option value={5}>5% Buffer</option>
                  <option value={10}>10% Standard</option>
                  <option value={15}>15% High Rush</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={shareGroceryListWhatsApp}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
              >
                <Share2 size={16} /> WhatsApp Order ({itemsToPurchase.length} Items)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Menu Selector */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center justify-between border-b pb-2">
                <span>🍽️ Select Menu for Party ({selectedDishes.length} Dishes)</span>
                <span className="text-xs text-emerald-600 font-bold">{guestCount} Portions</span>
              </h3>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {standardRecipes.map((recipe) => {
                  const isSelected = selectedDishes.some((d) => d.recipeId === recipe.id);
                  const selectedObj = selectedDishes.find((d) => d.recipeId === recipe.id);

                  return (
                    <div
                      key={recipe.id}
                      className={`p-3 rounded-xl border transition ${
                        isSelected
                          ? "bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDishInMenu(recipe)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{recipe.dishName}</p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-white text-gray-600 rounded border mt-0.5 inline-block">
                              {recipe.category} • {recipe.portionSize}
                            </span>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-500">Plates:</span>
                            <input
                              type="number"
                              min="1"
                              value={selectedObj?.plates || guestCount}
                              onChange={(e) => updateDishPlates(recipe.id, e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold text-center border rounded bg-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Recipe Ingredients Summary */}
                      <div className="mt-2 text-[10px] text-gray-500 border-t pt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                        {recipe.ingredients.map((ing, idx) => (
                          <span key={idx}>
                            • {ing.name} ({(ing.qtyPerPortion * buffetRatio).toFixed(2)} {ing.unit})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Aggregated Raw Material Shortage Table with EDITABLE Quantities */}
            <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                      <Calculator className="text-emerald-700" size={18} /> Raw Material Indent & Final Order Adjustment
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      💡 You can edit or round-up quantities directly in the "Order Qty" box before sending WhatsApp
                    </p>
                  </div>

                  {itemsToPurchase.length > 0 ? (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle size={12} /> {itemsToPurchase.length} Items to Order
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 font-extrabold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> Stock Sufficient
                    </span>
                  )}
                </div>

                {/* Indent Table */}
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b">
                      <tr>
                        <th className="p-2.5">Raw Material</th>
                        <th className="p-2.5 text-center">Required ({guestCount}p)</th>
                        <th className="p-2.5 text-center">Kitchen Stock</th>
                        <th className="p-2.5 text-center bg-yellow-50 text-amber-900 border-x">
                          ✏️ Final Order Qty (Editable)
                        </th>
                        <th className="p-2.5 text-right">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ingredientList.map((ing, idx) => {
                        const hasShortage = ing.shortage > 0;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 ${hasShortage ? "bg-red-50/30" : ""}`}>
                            <td className="p-2.5 font-bold text-gray-900">
                              {ing.name}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-emerald-800">
                              {ing.requiredQty} {ing.unit}
                            </td>
                            <td className="p-2.5 text-center font-medium text-gray-600">
                              {ing.inStockQty} {ing.unit}
                            </td>
                            <td className="p-2.5 text-center bg-yellow-50/50 border-x">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={ing.finalOrderQty}
                                  onChange={(e) => handleEditQtyChange(ing.name, e.target.value)}
                                  className="w-20 px-2 py-1 text-center font-black text-xs border-2 border-amber-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <span className="text-[10px] font-bold text-gray-500">{ing.unit}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-extrabold text-gray-900">
                              {ing.finalOrderQty > 0 ? `₹${ing.estimatedCost.toLocaleString('en-IN')}` : "₹0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Summary Box */}
              <div className="bg-slate-900 text-white rounded-xl p-4 mt-4 flex justify-between items-center shadow">
                <div>
                  <p className="text-xs text-gray-400">Total Purchase Needed for this Party:</p>
                  <p className="text-2xl font-black text-yellow-400">
                    ₹{totalShortageCost.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={shareGroceryListWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <ShoppingCart size={14} /> Send Edited List to Vendor
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
