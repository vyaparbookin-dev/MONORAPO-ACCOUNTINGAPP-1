import React, { useState, useEffect } from "react";
import {
  Building,
  Calendar,
  Users,
  Clock,
  Plus,
  Trash2,
  Share2,
  CheckCircle,
  AlertTriangle,
  Gift,
  Sparkles,
  Phone,
  Layers,
  ChefHat,
  Music,
  Cake,
  Palette,
  Calculator,
  Save,
  Coffee,
  Utensils,
  Search,
  Sliders,
  X
} from "lucide-react";

export default function BanquetCateringModal({ isOpen, onClose, onApplyBanquet, inventory = [] }) {
  if (!isOpen) return null;

  // Default Package Presets (Cafe Fast Food, High-Tea, Silver, Gold, Platinum)
  const defaultPresets = [
    {
      id: "PKG-CAFE-SNACKS",
      name: "Cafe & Fast-Food Party Combo",
      category: "Cafe & Lounge",
      pricePerPlate: 250,
      description: "Ideal for Cafe Birthdays: 2 Drinks, 3 Fast Food Starters, Pizza & Dessert",
      items: ["Cold Coffee with Ice Cream", "Virgin Mojito", "Peri Peri French Fries", "Cheese Garlic Bread", "Crispy Veg Burger", "Farmhouse Cheese Pizza", "Chocolate Brownie with Ice Cream"]
    },
    {
      id: "PKG-HIGHTEA",
      name: "Corporate High-Tea & Snacks",
      category: "High-Tea",
      pricePerPlate: 180,
      description: "Tea/Coffee, 2 Savory Snacks, Sandwich, Cookies & Mini Pastry",
      items: ["Masala Chai / Hot Coffee", "Veg Grilled Club Sandwich", "Paneer Bread Pakoda / Samosa", "Veg Spring Rolls", "Assorted Butter Cookies", "Mini Black Forest Pastry"]
    },
    {
      id: "PKG-SILVER",
      name: "Silver Package (Standard Thali)",
      category: "Banquet / Meals",
      pricePerPlate: 400,
      description: "1 Welcome Drink, 2 Starters, 1 Paneer Dish, 1 Dal, 1 Rice, 2 Breads, 1 Sweet, Salad & Raita",
      items: ["Fresh Lime Soda", "Veg Manchurian Dry", "Paneer Tikka", "Shahi Paneer", "Dal Makhani", "Jeera Rice", "Butter Naan / Roti", "Gulab Jamun"]
    },
    {
      id: "PKG-GOLD",
      name: "Gold Royal Buffet (Popular)",
      category: "Banquet / Meals",
      pricePerPlate: 600,
      description: "2 Drinks, 3 Starters, 2 Main Course, Dal Makhani, Biryani, 3 Breads, 2 Sweets & Ice Cream",
      items: ["Blue Lagoon Mocktail", "Cold Coffee", "Crispy Corn", "Paneer Tikka", "Hara Bhara Kebab", "Paneer Butter Masala", "Mix Veg Kadhai", "Dal Makhani", "Veg Dum Biryani with Raita", "Butter Naan, Laccha Paratha", "Hot Gulab Jamun", "Vanilla Ice Cream"]
    },
    {
      id: "PKG-PLATINUM",
      name: "Platinum Maharaja Deluxe",
      category: "Grand Wedding / Royal",
      pricePerPlate: 850,
      description: "Live Chaat, 4 Starters, 3 Main Course, 2 Dals, Dum Biryani, 4 Breads, 3 Sweets & Kulfi",
      items: ["Live Chaat Counter (Pani Puri & Aloo Tikki)", "Virgin Mojito", "Paneer Malai Tikka", "Veg Spring Rolls", "Cheese Balls", "Kadhai Paneer", "Mushroom Masala", "Malai Kofta", "Dal Tadka", "Dal Makhani", "Hyderabadi Veg Biryani", "Assorted Breads Basket", "Rasmalai", "Moong Dal Halwa", "Matka Kulfi"]
    }
  ];

  // Persistent Custom Packages in LocalStorage
  const [packagesList, setPackagesList] = useState(() => {
    try {
      const saved = localStorage.getItem("banquet_custom_packages");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return defaultPresets;
  });

  const savePackagesToStorage = (updated) => {
    setPackagesList(updated);
    try {
      localStorage.setItem("banquet_custom_packages", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Booking Host & Event Details
  const [eventName, setEventName] = useState("Birthday Party / Get-Together");
  const [customerName, setCustomerName] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("evening");
  const [hallZone, setHallZone] = useState("Main Banquet Hall / Cafe Lounge");

  // Guest Count: Minimum Guaranteed vs Floating Maximum
  const [minGuaranteedPax, setMinGuaranteedPax] = useState(20);
  const [maxFloatingPax, setMaxFloatingPax] = useState(25);

  // Selected Menu Package & Customization
  const [selectedPackageId, setSelectedPackageId] = useState(packagesList[0]?.id || "PKG-CAFE-SNACKS");
  const [selectedPackageName, setSelectedPackageName] = useState(packagesList[0]?.name || "Cafe Party Combo");
  const [ratePerPlate, setRatePerPlate] = useState(packagesList[0]?.pricePerPlate || 250);
  const [customMenuItems, setCustomMenuItems] = useState(packagesList[0]?.items || []);
  const [newDishInput, setNewDishInput] = useState("");
  const [selectedInvProduct, setSelectedInvProduct] = useState("");

  // Hall & Extra Services Add-ons
  const [hallRent, setHallRent] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState(1000);

  // Addon Services: Cake, Decor, DJ, Live Counter, Cleaning
  const [addons, setAddons] = useState([
    { id: "ADD-1", name: "Floral & Theme Balloon Stage Decor", price: 3500, isIncluded: false, provider: "In-House / Decorator" },
    { id: "ADD-2", name: "DJ Sound & Party Lights", price: 5000, isIncluded: false, provider: "Vendor Partner" },
    { id: "ADD-3", name: "Customized Designer Cake (1.5 Kg)", price: 1200, isIncluded: true, provider: "Bakery Partner" },
    { id: "ADD-4", name: "Live Mocktail / Coffee Bar Counter", price: 2500, isIncluded: false, provider: "In-House" },
    { id: "ADD-5", name: "Dedicated Party Service Staff & Cleaning", price: 1500, isIncluded: false, provider: "In-House" },
  ]);

  const [advanceToken, setAdvanceToken] = useState(2000);
  const [activeTab, setActiveTab] = useState("booking");

  // Handle Package Selection
  const handleSelectPackage = (pkg) => {
    setSelectedPackageId(pkg.id);
    setSelectedPackageName(pkg.name);
    setRatePerPlate(pkg.pricePerPlate);
    setCustomMenuItems([...pkg.items]);
  };

  const addCustomDish = () => {
    if (!newDishInput.trim()) return;
    setCustomMenuItems((prev) => [...prev, newDishInput.trim()]);
    setNewDishInput("");
  };

  const addFromInventory = (prodName) => {
    if (!prodName) return;
    if (!customMenuItems.includes(prodName)) {
      setCustomMenuItems((prev) => [...prev, prodName]);
    }
    setSelectedInvProduct("");
  };

  const removeCustomDish = (idx) => {
    setCustomMenuItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCurrentAsPackage = () => {
    const pkgName = prompt("Enter Name for this new Custom Menu Package:", `${eventName} Menu Package`);
    if (!pkgName) return;
    const newPkg = {
      id: `PKG-CUSTOM-${Date.now()}`,
      name: pkgName,
      category: "Custom Saved",
      pricePerPlate: ratePerPlate,
      description: `${customMenuItems.length} Items Custom Package`,
      items: [...customMenuItems]
    };
    const updated = [newPkg, ...packagesList];
    savePackagesToStorage(updated);
    setSelectedPackageId(newPkg.id);
    setSelectedPackageName(newPkg.name);
    alert(`Package "${pkgName}" saved permanently! You can reuse it for any future party.`);
  };

  const handleDeletePackage = (e, pkgId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this menu package?")) return;
    const updated = packagesList.filter((p) => p.id !== pkgId);
    savePackagesToStorage(updated);
    if (selectedPackageId === pkgId && updated.length > 0) {
      handleSelectPackage(updated[0]);
    }
  };

  const toggleAddon = (id) => {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isIncluded: !a.isIncluded } : a))
    );
  };

  // Financial Calculations
  const foodAmountMin = minGuaranteedPax * ratePerPlate;
  const foodAmountMax = maxFloatingPax * ratePerPlate;
  const overtimeTotal = overtimeHours * overtimeRatePerHour;
  const activeAddonsTotal = addons.filter((a) => a.isIncluded).reduce((sum, a) => sum + a.price, 0);
  const totalExtraCharges = hallRent + overtimeTotal + activeAddonsTotal;

  // 5% GST on Catering + 18% on Services
  const foodGst = Math.round((foodAmountMin * 5) / 100);
  const servicesGst = Math.round((totalExtraCharges * 18) / 100);
  const totalGst = foodGst + servicesGst;

  const grandTotalMin = foodAmountMin + totalExtraCharges + totalGst;
  const balancePending = grandTotalMin - (parseFloat(advanceToken) || 0);

  // Dynamic Raw Material Breakdown based on Selected Items
  const calculateGroceryBreakdown = () => {
    const rawMap = {};

    customMenuItems.forEach((dish) => {
      const lower = dish.toLowerCase();
      if (lower.includes("paneer")) {
        rawMap["Fresh Malai Paneer"] = (rawMap["Fresh Malai Paneer"] || 0) + (minGuaranteedPax > 30 ? 0.08 : 0.12);
        rawMap["Amul Butter / Ghee"] = (rawMap["Amul Butter / Ghee"] || 0) + 0.03;
      }
      if (lower.includes("pizza") || lower.includes("burger") || lower.includes("cheese")) {
        rawMap["Mozzarella / Amul Cheese"] = (rawMap["Mozzarella / Amul Cheese"] || 0) + 0.06;
        rawMap["Pizza Base / Burger Buns"] = (rawMap["Pizza Base / Burger Buns"] || 0) + 1.0;
        rawMap["Refined Maida Flour"] = (rawMap["Refined Maida Flour"] || 0) + 0.08;
      }
      if (lower.includes("fries") || lower.includes("potato") || lower.includes("tikki")) {
        rawMap["Potatoes (Aloo)"] = (rawMap["Potatoes (Aloo)"] || 0) + 0.12;
        rawMap["Refined Cooking Oil"] = (rawMap["Refined Cooking Oil"] || 0) + 0.04;
      }
      if (lower.includes("coffee") || lower.includes("tea") || lower.includes("milk") || lower.includes("shake")) {
        rawMap["Full Cream Milk"] = (rawMap["Full Cream Milk"] || 0) + 0.20;
        rawMap["Sugar"] = (rawMap["Sugar"] || 0) + 0.03;
      }
      if (lower.includes("dal")) {
        rawMap["Black Urad Dal / Rajma"] = (rawMap["Black Urad Dal / Rajma"] || 0) + 0.06;
        rawMap["Fresh Cream"] = (rawMap["Fresh Cream"] || 0) + 0.03;
      }
      if (lower.includes("rice") || lower.includes("biryani") || lower.includes("pulao")) {
        rawMap["Basmati Rice (Long Grain)"] = (rawMap["Basmati Rice (Long Grain)"] || 0) + 0.09;
      }
      if (lower.includes("naan") || lower.includes("roti") || lower.includes("paratha")) {
        rawMap["Wheat Flour / Maida"] = (rawMap["Wheat Flour / Maida"] || 0) + 0.10;
      }
      if (lower.includes("jamun") || lower.includes("halwa") || lower.includes("sweet")) {
        rawMap["Mawa / Khoya & Sugar"] = (rawMap["Mawa / Khoya & Sugar"] || 0) + 0.07;
      }
    });

    if (Object.keys(rawMap).length === 0) {
      rawMap["General Vegetables & Provisions"] = 0.25;
      rawMap["Cooking Oil & Spices"] = 0.05;
    }

    return Object.entries(rawMap).map(([name, perPax]) => {
      const neededForEvent = parseFloat((perPax * minGuaranteedPax).toFixed(2));
      const matchedInv = inventory.find((p) => (p.name || "").toLowerCase().includes(name.toLowerCase().split(" ")[0]));
      const actualInStock = matchedInv ? parseFloat(matchedInv.currentStock) || 0 : 5.0;
      const regularDailyBuffer = 4.0;
      const totalNeededWithBuffer = parseFloat((neededForEvent + regularDailyBuffer).toFixed(2));
      const shortageToOrder = Math.max(0, parseFloat((totalNeededWithBuffer - actualInStock).toFixed(2)));
      const unit = name.includes("Buns") ? "pcs" : name.includes("Milk") || name.includes("Oil") ? "ltr" : "kg";

      return {
        name,
        unit,
        neededForEvent,
        actualInStock,
        regularDailyBuffer,
        shortageToOrder
      };
    });
  };

  const groceryIndentList = calculateGroceryBreakdown();
  const totalGroceryItemsToOrder = groceryIndentList.filter((g) => g.shortageToOrder > 0);

  const sendWhatsAppEventSummary = () => {
    let msg = `*🏰 BANQUET & PARTY BOOKING CONFIRMATION*
`;
    msg += `*Event:* ${eventName}
`;
    msg += `*Host:* ${customerName || "Valued Guest"} (${primaryPhone})
`;
    if (alternatePhone) msg += `*Alt Phone:* ${alternatePhone}
`;
    msg += `*Date & Slot:* ${eventDate} (${timeSlot.toUpperCase()} Slot)
`;
    msg += `*Venue:* ${hallZone}
`;
    msg += `*Guaranteed Plates:* ${minGuaranteedPax} Pax (Floating Max: ${maxFloatingPax} Pax)
`;
    msg += `*Rate Per Plate:* ₹${ratePerPlate}/Plate (${selectedPackageName})
`;
    msg += `----------------------------------
`;
    msg += `*Food Total (${minGuaranteedPax} Pax):* ₹${foodAmountMin.toLocaleString('en-IN')}
`;
    if (totalExtraCharges > 0) msg += `*Hall & Addons Total:* ₹${totalExtraCharges.toLocaleString('en-IN')}
`;
    msg += `*Total GST:* ₹${totalGst.toLocaleString('en-IN')}
`;
    msg += `*Grand Total:* ₹${grandTotalMin.toLocaleString('en-IN')}
`;
    msg += `*Advance Paid:* ₹${advanceToken.toLocaleString('en-IN')}
`;
    msg += `*Balance Payable:* ₹${balancePending.toLocaleString('en-IN')}
`;
    msg += `----------------------------------
`;
    msg += `*Finalized Menu (${customMenuItems.length} Items):*
`;
    customMenuItems.forEach((d, idx) => {
      msg += `${idx + 1}. ${d}
`;
    });

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleApplyToBilling = () => {
    if (!customerName.trim()) return alert("Please enter Customer / Host Name.");
    if (!primaryPhone.trim()) return alert("Please enter Primary Mobile Number.");

    const banquetBillItem = {
      name: `${eventName} (${minGuaranteedPax} Pax @ ₹${ratePerPlate}/Plate) - ${customerName}`,
      category: "Banquet & Catering",
      quantity: minGuaranteedPax,
      rate: ratePerPlate,
      unit: "PLATE",
      total: foodAmountMin,
      customerName,
      customerMobile: primaryPhone,
      tax: totalGst,
      notes: `Event Date: ${eventDate} | Slot: ${timeSlot} | Venue: ${hallZone} | Min: ${minGuaranteedPax}p, Max: ${maxFloatingPax}p | Hall Rent: ₹${hallRent} | Overtime: ${overtimeHours}h (₹${overtimeTotal}) | Addons: ₹${activeAddonsTotal} | GST: ₹${totalGst} | Advance: ₹${advanceToken} | Balance: ₹${balancePending} | Menu: ${customMenuItems.join(", ")}`
    };

    onApplyBanquet(banquetBillItem, {
      hallRent,
      overtimeTotal,
      activeAddonsTotal,
      grandTotal: grandTotalMin,
      advanceToken,
      balancePending
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-rose-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-slate-900 text-white p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Building size={24} className="text-pink-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                🏰 BANQUET, CAFE & HOTEL PARTY EVENT SYSTEM
              </h2>
              <p className="text-xs text-rose-200">
                100% Flexible Menus • Cafe Snacks / Banquet Meals • Live Inventory Add • Balanced Buffet Volumes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/20 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActiveTab("booking")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "booking" ? "bg-white text-rose-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                📅 Booking & Timing
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "menu" ? "bg-white text-rose-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🍽️ Menu Packages & Customizer
              </button>
              <button
                onClick={() => setActiveTab("addons")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "addons" ? "bg-white text-rose-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🎂 Addons & Services
              </button>
              <button
                onClick={() => setActiveTab("grocery")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "grocery" ? "bg-white text-rose-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🛒 Grocery Indent ({totalGroceryItemsToOrder.length})
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === "booking" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Host Details */}
              <div className="md:col-span-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                  <Users size={18} className="text-rose-700" /> Host & Event Particulars
                </h3>

                <div>
                  <label className="text-xs font-bold text-gray-700">Event / Occasion Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. 25th Birthday Party / Anniversary"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700">Host / Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Primary Mobile *</label>
                    <input
                      type="text"
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      maxLength={10}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Alternate / WhatsApp No</label>
                    <input
                      type="text"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="Optional 2nd No"
                      maxLength={10}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Time Slot</label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1 font-bold text-rose-900 bg-rose-50"
                    >
                      <option value="morning">Morning Slot (10 AM - 3 PM)</option>
                      <option value="evening">Evening Slot (7 PM - 12 AM)</option>
                      <option value="fullday">Full Day (10 AM - 12 AM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700">Venue Area (Banquet Hall / Cafe Floor)</label>
                  <input
                    type="text"
                    value={hallZone}
                    onChange={(e) => setHallZone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                  />
                </div>
              </div>

              {/* Guest Counts & Timing Slabs */}
              <div className="md:col-span-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                  <Calculator size={18} className="text-rose-700" /> Plates, Pricing & Advance
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                  <div>
                    <label className="text-xs font-extrabold text-rose-900">Minimum Guaranteed Plates *</label>
                    <p className="text-[10px] text-gray-500">Bill will be made for min. these plates</p>
                    <input
                      type="number"
                      min="1"
                      value={minGuaranteedPax}
                      onChange={(e) => setMinGuaranteedPax(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-lg font-black text-center px-3 py-1.5 border-2 border-rose-400 rounded-lg mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-rose-900">Floating Max Capacity</label>
                    <p className="text-[10px] text-gray-500">Kitchen buffer prepared up to</p>
                    <input
                      type="number"
                      min={minGuaranteedPax}
                      value={maxFloatingPax}
                      onChange={(e) => setMaxFloatingPax(Math.max(minGuaranteedPax, parseInt(e.target.value) || minGuaranteedPax))}
                      className="w-full text-lg font-black text-center px-3 py-1.5 border-2 border-rose-300 rounded-lg mt-1 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Hall / Venue Rent (₹) (0 for Cafe)</label>
                    <input
                      type="number"
                      value={hallRent}
                      onChange={(e) => setHallRent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Advance Token Received (₹)</label>
                    <input
                      type="number"
                      value={advanceToken}
                      onChange={(e) => setAdvanceToken(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500 mt-1 font-bold text-green-700 bg-green-50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700">Overtime Extension (Hours)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 text-xs text-center font-bold px-2 py-1 border rounded"
                      />
                      <span className="text-xs font-medium">hrs @ ₹{overtimeRatePerHour}/hr</span>
                    </div>
                  </div>
                  {overtimeHours > 0 && (
                    <p className="text-xs text-rose-700 font-bold text-right">
                      Overtime Total: + ₹{overtimeTotal.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                {/* Billing Summary Box */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 shadow">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Food Amount ({minGuaranteedPax} Pax @ ₹{ratePerPlate}):</span>
                    <span>₹{foodAmountMin.toLocaleString('en-IN')}</span>
                  </div>
                  {totalExtraCharges > 0 && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Hall Rent & Addons:</span>
                      <span>₹{totalExtraCharges.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>GST (Food 5% + Services 18%):</span>
                    <span>₹{totalGst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-yellow-300 border-t border-gray-700 pt-1.5">
                    <span>Grand Total:</span>
                    <span>₹{grandTotalMin.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400 font-bold pt-1">
                    <span>Advance Received:</span>
                    <span>₹{advanceToken.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-400 font-bold">
                    <span>Balance Payable:</span>
                    <span>₹{balancePending.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menu Packages Tab */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* Top Package Manager Bar */}
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div>
                  <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <Utensils size={18} className="text-rose-700" />
                    Available Menu Packages ({packagesList.length} Packages)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Click any package to load, or customize and save your own packages permanently
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsPackage}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"
                  >
                    <Save size={14} /> Save Current Menu as New Package
                  </button>
                </div>
              </div>

              {/* Package Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packagesList.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between relative group ${
                        isSelected
                          ? "bg-rose-50/90 border-rose-600 shadow-md ring-2 ring-rose-300"
                          : "bg-white border-gray-200 hover:border-rose-300"
                      }`}
                    >
                      {pkg.id.startsWith("PKG-CUSTOM-") && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePackage(e, pkg.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition"
                          title="Delete this package"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <div>
                        <div className="flex justify-between items-start pr-4">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {pkg.category || "Party Package"}
                            </span>
                            <h4 className="font-extrabold text-gray-900 text-sm mt-1">{pkg.name}</h4>
                          </div>
                          <span className="text-sm font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                            ₹{pkg.pricePerPlate} <span className="text-[10px] font-normal">/plate</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium line-clamp-2">{pkg.description}</p>
                      </div>

                      <div className="mt-4 pt-2 border-t flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-600">{pkg.items.length} Dishes</span>
                        <span className={`${isSelected ? "text-rose-700 font-black" : "text-gray-400"}`}>
                          {isSelected ? "✓ Active Selected" : "Click to Load"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Menu Builder */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <ChefHat size={18} className="text-rose-700" />
                      Active Menu for {minGuaranteedPax} Guests ({customMenuItems.length} Items)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Add items from your live inventory products or type any custom dish name
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Rate Per Plate:</span>
                    <input
                      type="number"
                      value={ratePerPlate}
                      onChange={(e) => setRatePerPlate(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs font-black text-center border-2 border-rose-400 rounded-lg text-rose-800 bg-rose-50"
                    />
                  </div>
                </div>

                {/* Portion Balancing Info Banner */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                  <Sliders size={16} className="text-amber-700 shrink-0" />
                  <span>
                    <strong>Buffet Portion Balancing:</strong> Because a buffet/party has {customMenuItems.length} total items, the portion volume per person is automatically balanced so the plate is complete without food wastage.
                  </span>
                </div>

                {/* Inputs: 1) From Live Inventory & 2) Free Text */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6 flex gap-2">
                    <select
                      value={selectedInvProduct}
                      onChange={(e) => addFromInventory(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-blue-300 rounded-lg font-medium text-blue-900 bg-blue-50/50 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">+ Add from your Live Products / Cafe Menu...</option>
                      {inventory.map((item) => (
                        <option key={item._id} value={item.name}>
                          {item.name} ({item.category || "Item"}) - ₹{item.sellingPrice || item.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-6 flex gap-2">
                    <input
                      type="text"
                      placeholder="Or type any custom dish name (e.g. White Sauce Pasta)..."
                      value={newDishInput}
                      onChange={(e) => setNewDishInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomDish()}
                      className="flex-1 text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomDish}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {customMenuItems.map((dish, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2.5 bg-slate-50 border rounded-lg text-xs hover:bg-rose-50/50 transition group"
                    >
                      <span className="font-semibold text-gray-900">
                        {idx + 1}. {dish}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCustomDish(idx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                        title="Remove dish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add-ons & Extra Services Tab */}
          {activeTab === "addons" && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Sparkles size={18} className="text-pink-600" />
                    Party Add-ons, Cakes, Music & Decoration
                  </h3>
                  <p className="text-xs text-gray-500">
                    Toggle services provided in-house or outsourced through partner vendors
                  </p>
                </div>

                <span className="text-sm font-black text-rose-800 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  Total Addons: ₹{activeAddonsTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addons.map((add) => (
                  <div
                    key={add.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      add.isIncluded ? "bg-pink-50/60 border-pink-400 ring-1 ring-pink-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={add.isIncluded}
                        onChange={() => toggleAddon(add.id)}
                        className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{add.name}</h4>
                        <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border mt-0.5 inline-block">
                          Provider: {add.provider}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-gray-900">₹{add.price.toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-bold ${add.isIncluded ? "text-pink-700" : "text-gray-400"}`}>
                        {add.isIncluded ? "✓ Included in Bill" : "Not Included"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grocery Indent & Kitchen Raw Material Check Tab */}
          {activeTab === "grocery" && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <ChefHat size={18} className="text-emerald-700" />
                    Kitchen Raw Material Indent & Grocery Buffer Check ({minGuaranteedPax} Guests)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Event requirement vs Live stock vs Regular daily restaurant/cafe buffer
                  </p>
                </div>

                <button
                  type="button"
                  onClick={sendWhatsAppEventSummary}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                >
                  <Share2 size={14} /> Send WhatsApp Indent
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-2.5">Raw Material</th>
                      <th className="p-2.5 text-center">Needed for Event ({minGuaranteedPax}p)</th>
                      <th className="p-2.5 text-center">Regular Daily Buffer</th>
                      <th className="p-2.5 text-center">Current Kitchen Stock</th>
                      <th className="p-2.5 text-center">To Purchase from Market</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groceryIndentList.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-gray-900">{g.name}</td>
                        <td className="p-2.5 text-center font-semibold text-rose-800">{g.neededForEvent} {g.unit}</td>
                        <td className="p-2.5 text-center text-gray-500">{g.regularDailyBuffer} {g.unit}</td>
                        <td className="p-2.5 text-center font-medium text-emerald-800">{g.actualInStock} {g.unit}</td>
                        <td className="p-2.5 text-center font-black">
                          {g.shortageToOrder > 0 ? (
                            <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded font-black">
                              + {g.shortageToOrder} {g.unit}
                            </span>
                          ) : (
                            <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded font-bold">
                              ✓ Sufficient
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-white p-4 px-6 border-t flex justify-between items-center shrink-0">
          <div>
            <span className="text-xs text-gray-500 font-semibold">Total Payable ({minGuaranteedPax} Pax):</span>
            <p className="text-xl font-black text-rose-900">₹{grandTotalMin.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendWhatsAppEventSummary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Share2 size={15} /> WhatsApp Confirmation
            </button>
            <button
              type="button"
              onClick={handleApplyToBilling}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle size={15} /> Confirm & Apply to Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
