import React, { useState } from "react";
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
  X
} from "lucide-react";

export default function BanquetCateringModal({ isOpen, onClose, onApplyBanquet, inventory = [] }) {
  if (!isOpen) return null;

  // Pre-configured Menu Packages
  const menuPackages = [
    {
      id: "PKG-SILVER",
      name: "Silver Package (Standard)",
      pricePerPlate: 400,
      description: "1 Welcome Drink, 2 Starters, 1 Paneer Dish, 1 Dal, 1 Rice, 2 Breads, 1 Sweet, Salad & Raita",
      items: ["Fresh Lime Soda", "Veg Manchurian Dry", "Paneer Tikka", "Shahi Paneer", "Dal Makhani", "Jeera Rice", "Butter Naan / Roti", "Gulab Jamun"]
    },
    {
      id: "PKG-GOLD",
      name: "Gold Royal Buffet (Popular)",
      pricePerPlate: 600,
      description: "2 Welcome Drinks, 3 Starters, 2 Main Course, Dal Makhani, Veg Dum Biryani, 3 Breads, 2 Sweets & Ice Cream",
      items: ["Blue Lagoon Mocktail", "Cold Coffee", "Crispy Corn", "Paneer Tikka", "Hara Bhara Kebab", "Paneer Butter Masala", "Mix Veg Kadhai", "Dal Makhani", "Veg Dum Biryani with Raita", "Butter Naan, Laccha Paratha", "Hot Gulab Jamun", "Vanilla Ice Cream"]
    },
    {
      id: "PKG-PLATINUM",
      name: "Platinum Maharaja Deluxe",
      pricePerPlate: 850,
      description: "Live Chaat Counter, 4 Starters, 3 Main Course, 2 Dals, Dum Biryani, 4 Breads, 3 Sweets & Kulfi",
      items: ["Live Chaat Counter (Pani Puri & Aloo Tikki)", "Virgin Mojito", "Paneer Malai Tikka", "Veg Spring Rolls", "Cheese Balls", "Kadhai Paneer", "Mushroom Masala", "Malai Kofta", "Dal Tadka", "Dal Makhani", "Hyderabadi Veg Biryani", "Assorted Breads Basket", "Rasmalai", "Moong Dal Halwa", "Matka Kulfi"]
    }
  ];

  // Booking Host & Event Details
  const [eventName, setEventName] = useState("Birthday Party / Get-Together");
  const [customerName, setCustomerName] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("evening"); // 'morning' (10 AM - 3 PM) | 'evening' (7 PM - 12 AM) | 'fullday'
  const [hallZone, setHallZone] = useState("Main AC Banquet Hall");

  // Guest Count: Minimum Guaranteed vs Floating Maximum
  const [minGuaranteedPax, setMinGuaranteedPax] = useState(20);
  const [maxFloatingPax, setMaxFloatingPax] = useState(30);

  // Selected Menu Package & Customization
  const [selectedPackageId, setSelectedPackageId] = useState("PKG-GOLD");
  const [ratePerPlate, setRatePerPlate] = useState(600);
  const [customMenuItems, setCustomMenuItems] = useState(menuPackages[1].items);
  const [newDishInput, setNewDishInput] = useState("");

  // Hall & Extra Services Add-ons
  const [hallRent, setHallRent] = useState(10000);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState(1500);

  // Addon Services: Cake, Decor, DJ, Live Counter, Cleaning
  const [addons, setAddons] = useState([
    { id: "ADD-1", name: "Floral & Theme Balloon Stage Decor", price: 5000, isIncluded: true, provider: "In-House" },
    { id: "ADD-2", name: "DJ Sound Setup with Party Lights", price: 6000, isIncluded: false, provider: "Vendor" },
    { id: "ADD-3", name: "Customized Designer Cake (2 Kg)", price: 1500, isIncluded: true, provider: "Bakery Partner" },
    { id: "ADD-4", name: "Live Mocktail Bar Counter", price: 3000, isIncluded: false, provider: "In-House" },
    { id: "ADD-5", name: "Valet Parking & Service Staff Support", price: 2000, isIncluded: false, provider: "In-House" },
  ]);

  const [advanceToken, setAdvanceToken] = useState(5000);
  const [activeTab, setActiveTab] = useState("booking"); // 'booking' | 'menu' | 'addons' | 'grocery'

  // Handle Package Selection
  const handleSelectPackage = (pkg) => {
    setSelectedPackageId(pkg.id);
    setRatePerPlate(pkg.pricePerPlate);
    setCustomMenuItems([...pkg.items]);
  };

  const addCustomDish = () => {
    if (!newDishInput.trim()) return;
    setCustomMenuItems((prev) => [...prev, newDishInput.trim()]);
    setNewDishInput("");
  };

  const removeCustomDish = (idx) => {
    setCustomMenuItems((prev) => prev.filter((_, i) => i !== idx));
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

  // Grocery Indent Calculation for this Event
  const groceryEstimates = [
    { name: "Fresh Paneer (Malai)", perPax: 0.15, unit: "kg", regularDailyStock: 5.0 },
    { name: "Amul Butter / Desi Ghee", perPax: 0.05, unit: "kg", regularDailyStock: 3.0 },
    { name: "Fresh Cream", perPax: 0.04, unit: "kg", regularDailyStock: 2.0 },
    { name: "Basmati Biryani Rice", perPax: 0.10, unit: "kg", regularDailyStock: 10.0 },
    { name: "Black Urad Dal / Rajma", perPax: 0.08, unit: "kg", regularDailyStock: 4.0 },
    { name: "Maida / Wheat Flour", perPax: 0.12, unit: "kg", regularDailyStock: 15.0 },
    { name: "Full Cream Milk", perPax: 0.20, unit: "ltr", regularDailyStock: 8.0 },
    { name: "Sugar", perPax: 0.08, unit: "kg", regularDailyStock: 10.0 },
    { name: "Mawa / Khoya (Sweets)", perPax: 0.06, unit: "kg", regularDailyStock: 2.0 },
    { name: "Cooking Oil (Refined)", perPax: 0.05, unit: "ltr", regularDailyStock: 10.0 },
  ];

  const groceryIndentList = groceryEstimates.map((item) => {
    const neededForEvent = parseFloat((item.perPax * minGuaranteedPax).toFixed(2));
    const matchedInv = inventory.find((p) => (p.name || "").toUpperCase().includes(item.name.toUpperCase()));
    const actualInStock = matchedInv ? parseFloat(matchedInv.currentStock) || 0 : item.regularDailyStock;
    const regularBuffer = item.regularDailyStock; // Buffer for standard cafe/restaurant guests
    const totalNeededWithBuffer = parseFloat((neededForEvent + regularBuffer).toFixed(2));
    const shortageToOrder = Math.max(0, parseFloat((totalNeededWithBuffer - actualInStock).toFixed(2)));

    return {
      ...item,
      neededForEvent,
      actualInStock,
      regularBuffer,
      totalNeededWithBuffer,
      shortageToOrder
    };
  });

  const totalGroceryItemsToOrder = groceryIndentList.filter((g) => g.shortageToOrder > 0);

  // WhatsApp Event Summary & Grocery Indent
  const sendWhatsAppEventSummary = () => {
    let msg = `*🏰 BANQUET & PARTY BOOKING CONFIRMATION*` + "\n";
    msg += `*Event:* ${eventName}` + "\n";
    msg += `*Host:* ${customerName || "Valued Guest"} (${primaryPhone})` + "\n";
    if (alternatePhone) msg += `*Alt Phone:* ${alternatePhone}` + "\n";
    msg += `*Date & Slot:* ${eventDate} (${timeSlot.toUpperCase()} Slot)` + "\n";
    msg += `*Hall Zone:* ${hallZone}` + "\n";
    msg += `*Guaranteed Plates:* ${minGuaranteedPax} Pax (Floating Max: ${maxFloatingPax} Pax)` + "\n";
    msg += `*Rate Per Plate:* ₹${ratePerPlate}/Plate (${selectedPackageId})` + "\n";
    msg += "----------------------------------" + "\n";
    msg += `*Food Total (${minGuaranteedPax} Pax):* ₹${foodAmountMin.toLocaleString('en-IN')}` + "\n";
    msg += `*Hall & Services Total:* ₹${totalExtraCharges.toLocaleString('en-IN')}` + "\n";
    msg += `*Total GST:* ₹${totalGst.toLocaleString('en-IN')}` + "\n";
    msg += `*Grand Total:* ₹${grandTotalMin.toLocaleString('en-IN')}` + "\n";
    msg += `*Advance Paid:* ₹${advanceToken.toLocaleString('en-IN')}` + "\n";
    msg += `*Balance Payable:* ₹${balancePending.toLocaleString('en-IN')}` + "\n";
    msg += "----------------------------------" + "\n";
    msg += `*Finalized Menu (${customMenuItems.length} Items):*` + "\n";
    customMenuItems.forEach((d, idx) => {
      msg += `${idx + 1}. ${d}` + "\n";
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
      notes: `Event Date: ${eventDate} | Slot: ${timeSlot} | Hall: ${hallZone} | Min: ${minGuaranteedPax}p, Max: ${maxFloatingPax}p | Hall Rent: ₹${hallRent} | Overtime: ${overtimeHours}h (₹${overtimeTotal}) | Addons: ₹${activeAddonsTotal} | GST: ₹${totalGst} | Advance: ₹${advanceToken} | Balance: ₹${balancePending} | Menu: ${customMenuItems.join(", ")}`
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
                🏰 BANQUET, PARTY & HOTEL EVENT MANAGEMENT
              </h2>
              <p className="text-xs text-rose-200">
                Menu Packages • Guaranteed vs Floating Pax • In-House & Outsourced Add-ons • Grocery Indent
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
                🍽️ Menu Packages
              </button>
              <button
                onClick={() => setActiveTab("addons")}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === "addons" ? "bg-white text-rose-900 shadow" : "text-white hover:bg-white/10"}`}
              >
                🎂 Addons & Decor
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
                    placeholder="e.g. 25th Wedding Anniversary / Birthday Party"
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
                  <label className="text-xs font-bold text-gray-700">Banquet Hall Zone / Lawn</label>
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
                  <Calculator size={18} className="text-rose-700" /> Plates & Overtime Structure
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                  <div>
                    <label className="text-xs font-extrabold text-rose-900">Minimum Guaranteed Plates *</label>
                    <p className="text-[10px] text-gray-500">Bill will be made for minimum these plates</p>
                    <input
                      type="number"
                      min="1"
                      value={minGuaranteedPax}
                      onChange={(e) => setMinGuaranteedPax(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-lg font-black text-center px-3 py-1.5 border-2 border-rose-400 rounded-lg mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-rose-900">Floating Maximum Capacity</label>
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
                    <label className="text-xs font-bold text-gray-700">Hall Fixed Rent (₹)</label>
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
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Hall Rent & Addons:</span>
                    <span>₹{totalExtraCharges.toLocaleString('en-IN')}</span>
                  </div>
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
              {/* Package Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {menuPackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-rose-50/80 border-rose-600 shadow-md ring-2 ring-rose-300"
                          : "bg-white border-gray-200 hover:border-rose-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-gray-900 text-sm">{pkg.name}</h4>
                          <span className="text-sm font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                            ₹{pkg.pricePerPlate} <span className="text-[10px] font-normal">/plate</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{pkg.description}</p>
                      </div>

                      <div className="mt-4 pt-2 border-t flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-600">{pkg.items.length} Dishes</span>
                        <span className={`${isSelected ? "text-rose-700 font-black" : "text-gray-400"}`}>
                          {isSelected ? "✓ Selected Package" : "Click to Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Menu Builder */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <ChefHat size={18} className="text-rose-700" />
                      Finalized Menu for {minGuaranteedPax} Guests ({customMenuItems.length} Dishes)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Add, delete, or swap items for this specific booking
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

                {/* Add new custom dish input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type custom dish to add to menu (e.g. Kadhai Mushroom, Jalebi Rabdi)..."
                    value={newDishInput}
                    onChange={(e) => setNewDishInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomDish()}
                    className="flex-1 text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomDish}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Dish
                  </button>
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
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
                    Event Add-ons, Cakes, DJ & Decoration Setup
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
                    Event requirement vs Live stock vs Regular daily restaurant buffer
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
                        <td className="p-2.5 text-center text-gray-500">{g.regularBuffer} {g.unit}</td>
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
