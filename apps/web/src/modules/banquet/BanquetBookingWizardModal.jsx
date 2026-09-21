import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Building,
  Calendar,
  Clock,
  Users,
  Utensils,
  Plus,
  Trash2,
  RefreshCw,
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
  Search,
  Sliders,
  Printer,
  FileCheck,
  TrendingUp,
  X,
  Share2,
  DollarSign,
  Info,
  ShieldAlert
} from "lucide-react";

export default function BanquetBookingWizardModal({ isOpen, onClose, onBookingSuccess, halls = [] }) {
  if (!isOpen) return null;

  // 5 Steps: 1: Host & Venue, 2: Menu & Swapping, 3: Seating & Setup, 4: Kitchen Mode, 5: Commercials & BEO
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // STEP 1: Host & Venue
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [city, setCity] = useState("जबलपुर (Jabalpur)");
  const [eventName, setEventName] = useState("Marriage Reception / Birthday Party");

  const todayStr = new Date().toISOString().split("T")[0];
  const [eventDate, setEventDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("evening");
  const [selectedHallId, setSelectedHallId] = useState(halls[0]?._id || "");
  const [slotChecking, setSlotChecking] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState(true);
  const [slotLockedDetails, setSlotLockedDetails] = useState(null);

  // Customer History & CRM Details
  const [customerHistory, setCustomerHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [attendedByStaff, setAttendedByStaff] = useState("विक्रम सिंह (हॉल मैनेजर)");
  const [referredBy, setReferredBy] = useState("डायरेक्ट वॉक-इन (Direct Walk-in)");

  // Staffing Team (Internal + External Freelance Labor)
  const [floorCaptain, setFloorCaptain] = useState("कैप्टन अमित राय");
  const [headChef, setHeadChef] = useState("मास्टर शेफ राजवीर सिंह");
  const [internalStaffCount, setInternalStaffCount] = useState(8);
  const [externalWaitersCount, setExternalWaitersCount] = useState(6);
  const [waiterWage, setWaiterWage] = useState(600);
  const [externalHalwaiCount, setExternalHalwaiCount] = useState(2);
  const [halwaiWage, setHalwaiWage] = useState(1200);

  // Food Service Timeline & Special Setup
  const [startersTime, setStartersTime] = useState("07:00 PM - 08:30 PM");
  const [buffetTime, setBuffetTime] = useState("08:30 PM - 10:30 PM");
  const [dessertsTime, setDessertsTime] = useState("10:00 PM onwards");
  const [specialArrangements, setSpecialArrangements] = useState([
    "स्टेज फ्लोरल आर्च व वार्म लाइटिंग",
    "कोल्ड पायरो एंट्री",
    "डीजे साउंड परमिट अप्रूव्ड"
  ]);
  const [specialFoodNotes, setSpecialFoodNotes] = useState("40 पैक्स के लिए अलग शुद्ध जैन काउंटर");

  // Split Payment Breakdown (Cash, UPI, Cheque, Card)
  const [splitCash, setSplitCash] = useState(10000);
  const [splitUpi, setSplitUpi] = useState(15000);
  const [splitCheque, setSplitCheque] = useState(0);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [splitCard, setSplitCard] = useState(0);

  // Auto-fetch Customer History (Diner & Banquet)
  useEffect(() => {
    if (customerMobile && customerMobile.trim().length >= 10) {
      fetchCustomerHistory(customerMobile.trim());
    } else {
      setCustomerHistory(null);
    }
  }, [customerMobile]);

  const fetchCustomerHistory = async (mobile) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/banquet/customer-history?mobile=${mobile}`);
      if (res.data?.success) {
        setCustomerHistory(res.data);
      }
    } catch (e) {
      console.warn("History lookup failed:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // STEP 2: Menu & Swapping
  const defaultPackages = [
    {
      id: "PKG-CAFE-SNACKS",
      name: "Cafe & Fast-Food Party Combo",
      pricePerPlate: 250,
      description: "2 Drinks, 3 Fast Food Starters, Pizza, Burger & Dessert",
      items: [
        "Cold Coffee with Ice Cream",
        "Virgin Mojito",
        "Peri Peri French Fries",
        "Cheese Garlic Bread",
        "Crispy Veg Burger",
        "Farmhouse Cheese Pizza",
        "Chocolate Brownie with Ice Cream"
      ]
    },
    {
      id: "PKG-HIGHTEA",
      name: "Corporate High-Tea & Snacks",
      pricePerPlate: 180,
      description: "Chai/Coffee, 2 Savory Snacks, Sandwich, Cookies & Mini Pastry",
      items: [
        "Masala Chai / Hot Coffee",
        "Veg Grilled Club Sandwich",
        "Paneer Bread Pakoda / Samosa",
        "Veg Spring Rolls",
        "Assorted Butter Cookies",
        "Mini Black Forest Pastry"
      ]
    },
    {
      id: "PKG-SILVER",
      name: "Silver Standard Thali",
      pricePerPlate: 400,
      description: "1 Welcome Drink, 2 Starters, 1 Paneer Dish, 1 Dal, 1 Rice, 2 Breads, 1 Sweet",
      items: [
        "Fresh Lime Soda",
        "Veg Manchurian Dry",
        "Paneer Tikka",
        "Shahi Paneer",
        "Dal Makhani",
        "Jeera Rice",
        "Butter Naan / Tandoori Roti",
        "Gulab Jamun"
      ]
    },
    {
      id: "PKG-GOLD",
      name: "Gold Royal Buffet (पॉपुलर)",
      pricePerPlate: 600,
      description: "2 Drinks, 3 Starters, 2 Main Course, Dal Makhani, Biryani, 3 Breads, 2 Sweets + Ice Cream",
      items: [
        "Blue Lagoon Mocktail",
        "Cold Coffee",
        "Crispy Corn",
        "Paneer Tikka Angara",
        "Hara Bhara Kebab",
        "Paneer Butter Masala",
        "Mix Veg Kadhai",
        "Dal Makhani Bukhara",
        "Veg Dum Biryani with Raita",
        "Butter Naan & Laccha Paratha",
        "Hot Gulab Jamun",
        "Vanilla Ice Cream with Hot Fudge"
      ]
    },
    {
      id: "PKG-PLATINUM",
      name: "Platinum Maharaja Deluxe (शाही शादी)",
      pricePerPlate: 850,
      description: "Live Chaat Counter, 4 Starters, 3 Main Course, 2 Dals, Biryani, 4 Breads, 3 Sweets & Kulfi",
      items: [
        "Live Chaat Counter (Pani Puri & Aloo Tikki)",
        "Virgin Mojito",
        "Paneer Malai Tikka",
        "Veg Spring Rolls",
        "Cheese Balls",
        "Kadhai Paneer",
        "Mushroom Masala Curry",
        "Malai Kofta",
        "Dal Tadka",
        "Dal Makhani",
        "Hyderabadi Veg Dum Biryani",
        "Assorted Breads Basket",
        "Rasmalai",
        "Moong Dal Halwa",
        "Matka Kulfi"
      ]
    }
  ];

  const [selectedPkg, setSelectedPkg] = useState(defaultPackages[3]); // Gold default
  const [menuItemsList, setMenuItemsList] = useState([...defaultPackages[3].items]);
  const [swappedDishes, setSwappedDishes] = useState([]); // [{ originalDish, replacementDish, priceDiff }]
  const [activeSwapDishIndex, setActiveSwapDishIndex] = useState(null);
  const [replacementName, setReplacementName] = useState("");
  const [replacementPriceDiff, setReplacementPriceDiff] = useState(0);

  // Common Popular Replacement Suggestions
  const swapSuggestions = [
    { name: "शाही पनीर लबाबदार", diff: 35 },
    { name: "पनीर टिक्का मसाला", diff: 30 },
    { name: "मलाई कोफ्ता रिच ग्रेवी", diff: 25 },
    { name: "रसमलाई (केसर पिस्ता)", diff: 20 },
    { name: "मूंग दाल हलवा (देसी घी)", diff: 30 },
    { name: "लाइव चाट काउंटर (पानी पूरी)", diff: 45 },
    { name: "तंदूरी सोया चाप", diff: 15 },
    { name: "मटका कुल्फी फालूदा", diff: 25 }
  ];

  // STEP 3: Infrastructure, Seating & Crockery
  const [seatingStyle, setSeatingStyle] = useState("Lounge Sofas & Round Tables");
  const [sofaCount, setSofaCount] = useState(8);
  const [chairCount, setChairCount] = useState(120);
  const [roundTableCount, setRoundTableCount] = useState(15);
  const [stageTheme, setStageTheme] = useState("Royal Golden Floral Arc with Warm Lights");
  const [crockeryType, setCrockeryType] = useState("Bone-China Deluxe Gold Rim");
  const [chafingCount, setChafingCount] = useState(10);
  const [decoratorName, setDecoratorName] = useState("इन-हाउस डेकोरेशन टीम (In-House)");
  const [hasDj, setHasDj] = useState(true);

  // STEP 4: Kitchen Mode
  const [kitchenMode, setKitchenMode] = useState("shared_restaurant"); // or "independent"

  // STEP 5: Commercials & Financial Calculation
  const [minGuaranteedPax, setMinGuaranteedPax] = useState(100);
  const [hallRentInput, setHallRentInput] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(25000);
  const [advanceMethod, setAdvanceMethod] = useState("upi");
  const [notes, setNotes] = useState("दुल्हा-दुल्हन की स्पेशल सोफा एंट्री। 8:30 PM पर केक कटिंग।");

  const [addonsList, setAddonsList] = useState([
    { id: "ADD-1", name: "Floral & Stage Decor with Warm Lights", price: 6500, isIncluded: true, provider: "In-House Decorator" },
    { id: "ADD-2", name: "DJ Sound & Floor Lighting (Approved)", price: 5000, isIncluded: true, provider: "Party Beats DJ" },
    { id: "ADD-3", name: "Customized Designer Cake (2 Kg)", price: 1800, isIncluded: false, provider: "Bakery Partner" },
    { id: "ADD-4", name: "Live Mocktail / Shakes Counter", price: 3000, isIncluded: false, provider: "In-House Bartender" },
    { id: "ADD-5", name: "Dedicated Banquet Captain & Cleaners", price: 2000, isIncluded: true, provider: "In-House Staff" }
  ]);

  // Selected Hall Object
  const currentHall = halls.find((h) => h._id === selectedHallId) || halls[0] || {
    name: "Grand Royal Ballroom",
    minPaxGuaranteed: 75,
    freeHallMinPax: 75,
    lowPaxHallRent: 12000
  };

  // Check Slot Availability whenever Date, Slot, or Hall changes
  useEffect(() => {
    if (selectedHallId && eventDate && timeSlot) {
      checkSlot();
    }
  }, [selectedHallId, eventDate, timeSlot]);

  const checkSlot = async () => {
    setSlotChecking(true);
    setError(null);
    try {
      const res = await api.get(`/api/banquet/check-slot?eventDate=${eventDate}&timeSlot=${timeSlot}&hallId=${selectedHallId}`);
      if (res.data?.available) {
        setSlotAvailable(true);
        setSlotLockedDetails(null);
      } else {
        setSlotAvailable(false);
        setSlotLockedDetails(res.data?.lockedBy || null);
      }
    } catch (err) {
      console.error("Error checking slot:", err);
    } finally {
      setSlotChecking(false);
    }
  };

  // Handle Package Change
  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setMenuItemsList([...pkg.items]);
    setSwappedDishes([]);
  };

  // Handle In-Line Dish Swap
  const handleConfirmSwap = () => {
    if (activeSwapDishIndex === null || !replacementName.trim()) return;

    const origDish = menuItemsList[activeSwapDishIndex];
    const diff = Number(replacementPriceDiff) || 0;

    // Replace in list
    const updatedMenu = [...menuItemsList];
    updatedMenu[activeSwapDishIndex] = `${replacementName.trim()} (बदला हुआ)`;
    setMenuItemsList(updatedMenu);

    // Record swap differential
    setSwappedDishes((prev) => [
      ...prev.filter((s) => s.originalDish !== origDish),
      {
        originalDish: origDish,
        replacementDish: replacementName.trim(),
        priceDiff: diff
      }
    ]);

    // Reset popup
    setActiveSwapDishIndex(null);
    setReplacementName("");
    setReplacementPriceDiff(0);
  };

  const handleRemoveDish = (index) => {
    const updated = menuItemsList.filter((_, idx) => idx !== index);
    setMenuItemsList(updated);
  };

  // Financial Calculations
  const totalDifferential = swappedDishes.reduce((s, d) => s + (Number(d.priceDiff) || 0), 0);
  const finalPlateRate = Math.max(100, (selectedPkg.pricePerPlate || 0) + totalDifferential);

  const pax = Number(minGuaranteedPax) || 50;
  const foodTotal = pax * finalPlateRate;

  // Hall rent rule
  const isHallFree = pax >= (currentHall.freeHallMinPax || 75);
  const effectiveHallRent = isHallFree ? 0 : (hallRentInput > 0 ? Number(hallRentInput) : (currentHall.lowPaxHallRent || 10000));

  const addonsTotal = addonsList.reduce((sum, a) => sum + (a.isIncluded ? Number(a.price || 0) : 0), 0);
  const grandTotal = foodTotal + effectiveHallRent + addonsTotal;
  const effectiveAdvance = Number(splitCash || 0) + Number(splitUpi || 0) + Number(splitCheque || 0) + Number(splitCard || 0);
  const balanceDue = Math.max(0, grandTotal - effectiveAdvance);

  // Submit Booking
  const handleCreateBooking = async () => {
    if (!customerName.trim() || !customerMobile.trim()) {
      alert("कृपया आयोजक का नाम और मोबाइल नंबर दर्ज करें!");
      setCurrentStep(1);
      return;
    }

    if (!slotAvailable) {
      alert("यह स्लॉट पहले से ही किसी अन्य फंक्शन के लिए लॉक है! कृपया तारीख या हॉल बदलें।");
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        hallId: currentHall._id,
        hallName: currentHall.name,
        eventName,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        alternateMobile: alternateMobile.trim(),
        customerAddress: customerAddress.trim(),
        city: city.trim(),
        eventDate,
        timeSlot,
        minGuaranteedPax: pax,
        actualCountedPax: pax,
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        baseRatePerPlate: selectedPkg.pricePerPlate,
        swappedDishesDifferential: totalDifferential,
        finalRatePerPlate: finalPlateRate,
        menuItems: menuItemsList,
        swappedDishes,
        hallRent: effectiveHallRent,
        freeHallMinPax: currentHall.freeHallMinPax,
        addons: addonsList,
        seatingConfig: {
          style: seatingStyle,
          sofaCount: Number(sofaCount),
          chairCount: Number(chairCount),
          roundTableCount: Number(roundTableCount),
          stageTheme
        },
        crockeryConfig: {
          plateType: crockeryType,
          chafingDishesCount: Number(chafingCount),
          glasswareCount: pax + 20,
          cutlerySet: "SS Mirror Finish"
        },
        advancePaid: effectiveAdvance,
        advancePaymentMethod: splitUpi > 0 ? "upi" : (splitCash > 0 ? "cash" : "split"),
        totalEstimatedAmount: grandTotal,
        finalSettlementAmount: grandTotal,
        balanceDue,
        kitchenSyncMode: kitchenMode,
        attendedByStaff,
        handledByStaff: attendedByStaff,
        referralSource: referredBy,
        customerHistorySnippet: customerHistory ? {
          isRepeatDiner: customerHistory.isRepeatDiner,
          dinerVisitsCount: customerHistory.dinerVisitsCount,
          dinerTotalSpend: customerHistory.dinerTotalSpend,
          isRepeatBanquetHost: customerHistory.isRepeatBanquetHost,
          previousBanquetCount: customerHistory.previousBanquetsCount
        } : undefined,
        staffingRoster: {
          bookedBy: attendedByStaff,
          eventManager: floorCaptain,
          headChef: headChef,
          internalStaffCount: Number(internalStaffCount),
          externalStaff: [
            {
              role: "कैटरिंग वेटर (Freelance Waiter)",
              vendorOrAgency: "स्थानीय वेटर यूनियन",
              staffCount: Number(externalWaitersCount),
              wagePerPerson: Number(waiterWage),
              totalWage: Number(externalWaitersCount) * Number(waiterWage),
              isPaid: false
            },
            {
              role: "सहायक हलवाई (Halwai Assistant)",
              vendorOrAgency: "हलवाई कारीगर एसोसिएशन",
              staffCount: Number(externalHalwaiCount),
              wagePerPerson: Number(halwaiWage),
              totalWage: Number(externalHalwaiCount) * Number(halwaiWage),
              isPaid: false
            }
          ]
        },
        serviceTimeline: {
          welcomeDrinksStartersTime: startersTime,
          buffetOpeningTime: buffetTime,
          dessertsTime: dessertsTime,
          closeTime: timeSlot === "morning" ? "04:00 PM" : "12:00 AM",
          specialArrangements: specialArrangements,
          specialFoodInstructions: specialFoodNotes
        },
        paymentInstallments: [
          {
            milestoneName: "प्रथम किस्त: टोकन एडवांस (बुकिंग फाइनल)",
            percent: 25,
            dueDate: eventDate,
            amount: effectiveAdvance,
            status: effectiveAdvance > 0 ? "paid" : "due",
            paidDate: effectiveAdvance > 0 ? new Date() : null,
            paymentModeBreakdown: {
              cash: Number(splitCash || 0),
              upi: Number(splitUpi || 0),
              cheque: {
                chequeNo: chequeNo.trim(),
                bankName: chequeBank.trim(),
                amount: Number(splitCheque || 0)
              },
              card: Number(splitCard || 0)
            }
          },
          {
            milestoneName: "द्वितीय किस्त: प्री-इवेंट 50% (7 दिन पूर्व - टेस्टिंग व मेनू लॉक)",
            percent: 50,
            dueDate: "फंक्शन से 7 दिन पूर्व",
            amount: Math.round(grandTotal * 0.50),
            status: "due"
          },
          {
            milestoneName: "तृतीय किस्त: फाइनल सेटलमेंट 25% (फंक्शन के दिन)",
            percent: 25,
            dueDate: "फंक्शन के दिन (हॉल हैंडओवर से पहले)",
            amount: Math.round(grandTotal * 0.25),
            status: "due"
          }
        ],
        cancellationPolicy: {
          noticeDays30PlusRefundPercent: 90,
          noticeDays15To30RefundPercent: 50,
          noticeDaysBelow15RefundPercent: 0,
          isCancelled: false
        },
        plateAudit: {
          agreedPlates: pax,
          actualPlatesCounted: pax,
          extraPlatesUsed: 0,
          extraPlateRate: finalPlateRate,
          extraPlatesTotalCost: 0,
          verifiedByHostName: customerName.trim(),
          verifiedByHostPhone: customerMobile.trim(),
          hostRelation: "Host",
          hostSignatureNotes: "बुकिंग समय पर सहमति दर्ज",
          isSigned: false
        },
        notes
      };

      const res = await api.post("/api/banquet/bookings", payload);
      alert(res.data?.message || "बैंक्वेट बुकिंग सफलतापूर्वक दर्ज हो गई!");
      if (onBookingSuccess) onBookingSuccess(res.data?.booking);
      onClose();
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.message || err.message || "बुकिंग दर्ज करने में त्रुटि हुई।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-xl font-black">
              🏰
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>बैंक्वेट बुकिंग व BEO कॉन्ट्रैक्ट विज़ार्ड</span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Standalone ERP
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                स्लॉट लॉकिंग • ऑन-डिमांड डिश स्वैपिंग • सिटिंग व क्रॉकरी चेकलिस्ट • लीगल BEO स्लिप
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs overflow-x-auto gap-2">
          {[
            { step: 1, label: "1. आयोजक व स्लॉट लॉक" },
            { step: 2, label: "2. मेनू कॉम्बो व डिश स्वैप" },
            { step: 3, label: "3. सिटिंग व क्रॉकरी" },
            { step: 4, label: "4. रसोई ऑपरेशन मोड" },
            { step: 5, label: "5. बिल, टोकन व BEO" }
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition shrink-0 ${
                currentStep === s.step
                  ? "bg-indigo-600 text-white shadow-xs"
                  : currentStep > s.step
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {currentStep > s.step && <CheckCircle size={12} />}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* STEP 1: HOST & VENUE SLOT LOCK */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building className="text-indigo-600" size={18} />
                  आयोजक विवरण, वेन्यू हॉल व स्लॉट लॉकिंग (Slot Locking Engine):
                </h3>
                {slotChecking ? (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" /> स्लॉट जांच जारी...
                  </span>
                ) : slotAvailable ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    ✓ यह स्लॉट बुकिंग के लिए उपलब्ध है
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                    ⚠️ यह स्लॉट पहले से ही बुक/लॉक है!
                  </span>
                )}
              </div>

              {/* Conflict Alert if slot is locked */}
              {!slotAvailable && slotLockedDetails && (
                <div className="p-3.5 bg-rose-100 border border-rose-300 rounded-2xl text-rose-900 space-y-1">
                  <p className="font-black text-xs flex items-center gap-1.5">
                    <ShieldAlert size={16} /> डबल-बुकिंग सुरक्षा अलर्ट (Double Booking Blocked):
                  </p>
                  <p className="text-[11px]">
                    यह हॉल <strong>{eventDate}</strong> ({timeSlot.toUpperCase()}) को <strong>'{slotLockedDetails.customerName}'</strong> ({slotLockedDetails.customerMobile}) के लिए पहले से ही <strong>{slotLockedDetails.bookingNo}</strong> के तहत लॉक है। 
                    कृपया दूसरा हॉल चुनें या तारीख बदलें।
                  </p>
                </div>
              )}

              {/* Host Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    पार्टी / फंक्शन का नाम (Event Name): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="उदा. राहुल संग स्नेहा शादी रिसेप्शन"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    आयोजक / ग्राहक का नाम (Host Name): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा. श्री सुरेश वर्मा"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    मोबाइल नंबर (Primary Phone): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="98260XXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    वैकल्पिक फोन (Alternate Mobile):
                  </label>
                  <input
                    type="tel"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                    placeholder="घर/भाई का नंबर"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">शहर (City):</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">पूरा पता (Address):</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="कॉलोनी, वार्ड या लैंडमार्क"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">हॉल किसने दिखाया / अटेंड किया:</label>
                  <input
                    type="text"
                    value={attendedByStaff}
                    onChange={(e) => setAttendedByStaff(e.target.value)}
                    placeholder="उदा. विक्रम सिंह (हॉल मैनेजर)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">किसके रेफरेंस से आए (Referral):</label>
                  <input
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="उदा. डॉ. सुनील शर्मा / सोशल मीडिया / वॉक-इन"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* 🌟 CUSTOMER REPUTATION & HISTORY AUTO-LOOKUP BADGE */}
              {historyLoading && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2 text-indigo-700 text-xs">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>ग्राहक का पूर्व इतिहास व रेस्टोरेंट रिकॉर्ड जांचा जा रहा है...</span>
                </div>
              )}

              {customerHistory && !historyLoading && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-slate-800 space-y-1.5 shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-600" />
                      स्मार्ट ग्राहक इतिहास प्रोफाइल (Customer CRM Intelligence):
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-md">
                      {customerHistory.isRepeatDiner ? "🌟 रेस्टोरेंट डाइनर" : "नया ग्राहक"}
                      {customerHistory.isRepeatBanquetHost && " + 🏰 पूर्व बैंक्वेट होस्ट"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-amber-200">
                    <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[10px]">रेस्टोरेंट विज़िट्स व खर्च</span>
                      <strong className="text-slate-900 font-mono">
                        {customerHistory.dinerVisitsCount} विज़िट्स | ₹{customerHistory.dinerTotalSpend.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[10px]">सबसे पसंदीदा व्यंजन</span>
                      <strong className="text-amber-800">
                        {customerHistory.favoriteDish || "पनीर लबाबदार / बटर नान"}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[10px]">पूर्व बैंक्वेट बुकिंग्स</span>
                      <strong className="text-indigo-800">
                        {customerHistory.previousBanquetsCount > 0 
                          ? `${customerHistory.previousBanquetsCount} इवेंट्स आयोजित`
                          : "पहला बैंक्वेट इवेंट"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Shift Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" />
                  फंक्शन की तारीख व समय स्लॉट (Locking Shift):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">इवेंट की तारीख (Date):</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-900"
                    />
                  </div>

                  <div
                    onClick={() => setTimeSlot("morning")}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      timeSlot === "morning"
                        ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/30"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-black text-slate-900 block">🌅 लंच / मॉर्निंग शिफ्ट</span>
                    <span className="text-[10px] text-slate-500">10:00 AM से 03:30 PM</span>
                  </div>

                  <div
                    onClick={() => setTimeSlot("evening")}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      timeSlot === "evening"
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/30"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-black text-slate-900 block">🌆 डिनर / ईवनिंग शिफ्ट</span>
                    <span className="text-[10px] text-slate-500">06:00 PM से 11:30 PM</span>
                  </div>

                  <div
                    onClick={() => setTimeSlot("full_day")}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      timeSlot === "full_day"
                        ? "bg-purple-50 border-purple-400 ring-2 ring-purple-400/30"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-black text-slate-900 block">🌟 फुल डे (Full 24 Hrs)</span>
                    <span className="text-[10px] text-slate-500">सुबह से रात तक शादी</span>
                  </div>
                </div>
              </div>

              {/* Multi-Hall Selection Cards */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  बैंक्वेट हॉल या वेन्यू का चयन करें (Select Venue Hall):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {halls.map((h) => (
                    <div
                      key={h._id}
                      onClick={() => setSelectedHallId(h._id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition space-y-2 ${
                        selectedHallId === h._id
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400/30"
                          : "bg-white border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-slate-900 text-sm">{h.name}</span>
                        {selectedHallId === h._id && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        <p>👥 क्षमता: <strong>{h.capacitySeated} सीट्स</strong> ({h.capacityFloating} फ्लोटिंग)</p>
                        <p>🍽️ फ्री हॉल नियम: <strong>{h.freeHallMinPax}+ प्लेट्स</strong> पर हॉल फ्री</p>
                        <p>🏢 कम प्लेट्स पर रेंट: <strong>₹{h.lowPaxHallRent}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MENU & DYNAMIC ON-DEMAND DISH SWAPPING */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ChefHat className="text-amber-600" size={18} />
                    मेनू कॉम्बो व ऑन-डिमांड डिश स्वैपिंग (No Need to Create New Package Every Time):
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    बेस पैकेज चुनकर किसी भी डिश को ऑन-द-स्पॉट बदलें — मूल्य अंतर (+/-) लाइव जुड़ेगा!
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">संशोधित प्लेट रेट:</span>
                  <span className="text-xl font-black font-mono text-emerald-700">
                    ₹{finalPlateRate} <span className="text-xs font-normal text-slate-500">/प्लेट</span>
                  </span>
                  {totalDifferential > 0 && (
                    <span className="text-[10px] text-amber-700 font-bold block font-mono">
                      (बेस ₹{selectedPkg.pricePerPlate} + स्वैप अंतर ₹{totalDifferential})
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Base Packages Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {defaultPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedPkg.id === pkg.id
                        ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-slate-900 block truncate">{pkg.name}</span>
                    <span className="text-sm font-black font-mono text-amber-900 mt-1 block">
                      ₹{pkg.pricePerPlate}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate mt-0.5">{pkg.description}</span>
                  </button>
                ))}
              </div>

              {/* In-Line Dishes List with Swap Buttons */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                    वर्तमान मेनू व्यंजन ({menuItemsList.length} डिशेज):
                  </span>
                  <span className="text-[11px] text-indigo-700 font-bold">
                    👉 किसी भी डिश के सामने "बदलें (Swap)" दबाकर बदलाव करें
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {menuItemsList.map((dish, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-2xs hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">🍲</span>
                        <span className={`font-bold ${dish.includes("(बदला हुआ)") ? "text-emerald-800" : "text-slate-800"}`}>
                          {dish}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveSwapDishIndex(idx);
                            setReplacementName("");
                            setReplacementPriceDiff(30);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] transition"
                        >
                          🔄 बदलें
                        </button>
                        <button
                          onClick={() => handleRemoveDish(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="मेनू से हटाएं"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Swap Modal Popup */}
                {activeSwapDishIndex !== null && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-amber-950 text-xs">
                        डिश स्वैप करें: <span className="underline">{menuItemsList[activeSwapDishIndex]}</span> की जगह क्या रखना है?
                      </span>
                      <button
                        onClick={() => setActiveSwapDishIndex(null)}
                        className="text-slate-500 hover:text-slate-800 font-bold text-xs"
                      >
                        ✕ रद्द करें
                      </button>
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {swapSuggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setReplacementName(sug.name);
                            setReplacementPriceDiff(sug.diff);
                          }}
                          className="px-2.5 py-1 bg-white border border-amber-200 text-amber-950 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition"
                        >
                          + {sug.name} (+₹{sug.diff})
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={replacementName}
                          onChange={(e) => setReplacementName(e.target.value)}
                          placeholder="नये व्यंजन का नाम लिखें (उदा. शाही पनीर लबाबदार)"
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-900 shrink-0">मूल्य अंतर (+/-):</span>
                        <input
                          type="number"
                          value={replacementPriceDiff}
                          onChange={(e) => setReplacementPriceDiff(e.target.value)}
                          placeholder="+30"
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveSwapDishIndex(null)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-xs"
                      >
                        कैंसिल
                      </button>
                      <button
                        onClick={handleConfirmSwap}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs"
                      >
                        ✓ स्वैप कंफर्म करें (+₹{replacementPriceDiff}/प्लेट)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INFRASTRUCTURE, SEATING & CROCKERY */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Palette className="text-purple-600" size={18} />
                  सिटिंग लेआउट, सोफा/कुर्सी, क्रॉकरी व डेकोरेशन चेकलिस्ट:
                </h3>
                <p className="text-[11px] text-slate-500">
                  हॉल अरेंजमेंट, सोफे, कवर्ड चेयर्स, बफे चफिंग डिशेज़ और वेंडर्स का पूरा लेखा-जोखा
                </p>
              </div>

              {/* Seating Style Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { style: "Lounge Sofas & Round Tables", desc: "शाही लाउंज सोफे व गोल बफे टेबल" },
                  { style: "Theatre Style (Auditorium)", desc: "स्टेज के सामने कतारबद्ध कुर्सियां" },
                  { style: "U-Shape / Cluster Seating", desc: "कॉर्पोरेट व पारिवारिक क्लस्टर" }
                ].map((st, i) => (
                  <div
                    key={i}
                    onClick={() => setSeatingStyle(st.style)}
                    className={`p-3 rounded-2xl border cursor-pointer transition ${
                      seatingStyle === st.style
                        ? "bg-purple-50 border-purple-400 ring-2 ring-purple-400/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-bold text-slate-900 block">{st.style}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{st.desc}</span>
                  </div>
                ))}
              </div>

              {/* Seating & Crockery Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🛋️ VIP सोफे की संख्या:</label>
                  <input
                    type="number"
                    value={sofaCount}
                    onChange={(e) => setSofaCount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">🪑 कवर्ड कुर्सियां (Chairs):</label>
                  <input
                    type="number"
                    value={chairCount}
                    onChange={(e) => setChairCount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">🍽️ गोल टेबल्स (Round Tables):</label>
                  <input
                    type="number"
                    value={roundTableCount}
                    onChange={(e) => setRoundTableCount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">🍲 बफे चफिंग डिश वार्मर्स:</label>
                  <input
                    type="number"
                    value={chafingCount}
                    onChange={(e) => setChafingCount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Crockery & Stage Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🍽️ क्रॉकरी का प्रकार (Plate Ware):</label>
                  <select
                    value={crockeryType}
                    onChange={(e) => setCrockeryType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  >
                    <option value="Bone-China Deluxe Gold Rim">बोन-चाइना डीलक्स गोल्ड रिम (Royal Wedding)</option>
                    <option value="Melamine Premium Buffet Ware">मेलामाइन प्रीमियम बफे प्लेट्स</option>
                    <option value="Eco-Friendly Areca Palm Leaf">पर्यावरण-अनुकूल सुपारी पत्ता प्लेट्स</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">🎨 स्टेज व एंट्री थीम (Stage Theme):</label>
                  <input
                    type="text"
                    value={stageTheme}
                    onChange={(e) => setStageTheme(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* Decorator & DJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">💐 डेकोरेशन कौन करेगा?</label>
                  <input
                    type="text"
                    value={decoratorName}
                    onChange={(e) => setDecoratorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-auto">
                  <input
                    type="checkbox"
                    id="djCheck"
                    checked={hasDj}
                    onChange={(e) => setHasDj(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="djCheck" className="font-bold text-slate-800 cursor-pointer text-xs">
                    🎵 DJ साउंड सिस्टम व फ्लोर लाइट्स शामिल है
                  </label>
                </div>
              </div>

              {/* ⏰ FOOD SERVICE TIMELINE & SPECIAL ARRANGEMENTS */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                <span className="font-black text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-600" />
                  सर्विंग टाइमलाइन व विशेष व्यवस्था (Service Rundown & Setup):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🥤 वेलकम ड्रिंक्स व स्टार्टर्स समय:</label>
                    <input
                      type="text"
                      value={startersTime}
                      onChange={(e) => setStartersTime(e.target.value)}
                      placeholder="07:00 PM - 08:30 PM"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🍲 मुख्य बुफे खुलने का समय:</label>
                    <input
                      type="text"
                      value={buffetTime}
                      onChange={(e) => setBuffetTime(e.target.value)}
                      placeholder="08:30 PM - 10:30 PM"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🍨 डेजर्ट्स व पान काउंटर समय:</label>
                    <input
                      type="text"
                      value={dessertsTime}
                      onChange={(e) => setDessertsTime(e.target.value)}
                      placeholder="10:00 PM onwards"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    खास खान-पान निर्देश (Special Food / Jain / Allergy Notes):
                  </label>
                  <input
                    type="text"
                    value={specialFoodNotes}
                    onChange={(e) => setSpecialFoodNotes(e.target.value)}
                    placeholder="उदा. 40 प्लेट शुद्ध जैन काउंटर बिना प्याज लहसुन"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* 👨‍🍳 OPERATIONAL STAFFING & EXTERNAL LABOR (WAITERS / HALWAI) */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                <span className="font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ChefHat size={15} className="text-amber-600" />
                  इवेंट ऑपरेशनल टीम व बाहरी लेबर (Floor Staff & External Freelancers):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🤵 फ्लोर कैप्टन / इवेंट मैनेजर:</label>
                    <input
                      type="text"
                      value={floorCaptain}
                      onChange={(e) => setFloorCaptain(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">👨‍🍳 मुख्य हेड शेफ का नाम:</label>
                    <input
                      type="text"
                      value={headChef}
                      onChange={(e) => setHeadChef(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">बाहरी वेटर संख्या:</label>
                    <input
                      type="number"
                      value={externalWaitersCount}
                      onChange={(e) => setExternalWaitersCount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">वेटर दिहाड़ी दर (₹):</label>
                    <input
                      type="number"
                      value={waiterWage}
                      onChange={(e) => setWaiterWage(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">बाहरी हलवाई संख्या:</label>
                    <input
                      type="number"
                      value={externalHalwaiCount}
                      onChange={(e) => setExternalHalwaiCount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">हलवाई दिहाड़ी दर (₹):</label>
                    <input
                      type="number"
                      value={halwaiWage}
                      onChange={(e) => setHalwaiWage(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 font-medium">
                  💡 कुल बाहरी लेबर खर्च: <strong>₹{((externalWaitersCount * waiterWage) + (externalHalwaiCount * halwaiWage)).toLocaleString("en-IN")}</strong> (यह इवेंट P&L कॉस्ट शीट में अलग से जुड़ेगा)।
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: KITCHEN OPERATION MODE */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Utensils className="text-teal-600" size={18} />
                  रसोई ऑपरेशन मोड चयन (Kitchen Operation & Inventory Sync Mode):
                </h3>
                <p className="text-[11px] text-slate-500">
                  तय करें कि बैंक्वेट का राशन रेस्टोरेंट की साझा रसोई से निकलेगा या अलग स्वतंत्र स्टोर से खरीदा जाएगा
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode A */}
                <div
                  onClick={() => setKitchenMode("shared_restaurant")}
                  className={`p-5 rounded-2xl border cursor-pointer transition space-y-2.5 ${
                    kitchenMode === "shared_restaurant"
                      ? "bg-teal-50 border-teal-500 ring-2 ring-teal-400/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🔄</span>
                    {kitchenMode === "shared_restaurant" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-bold text-[10px]">
                        सक्रिय मोड (Active)
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">साझा रेस्टोरेंट रसोई (Shared Restaurant Kitchen)</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      रेस्टोरेंट और बैंक्वेट की रसोई और शेफ एक ही हैं। बुकिंग फाइनल होने पर सिस्टम 
                      <strong>"सामग्री मांग-पत्र (Kitchen Indent)"</strong> निकालेगा और राशन रेस्टोरेंट स्टोर से बैंक्वेट में ट्रांसफर होगा।
                    </p>
                  </div>
                  <div className="pt-2 border-t border-teal-200/60 text-[10px] text-teal-800 font-bold">
                    ✓ सटीक P&L • राशन की दोहरी खरीद नहीं • ऑटो-इंडेंट
                  </div>
                </div>

                {/* Mode B */}
                <div
                  onClick={() => setKitchenMode("independent")}
                  className={`p-5 rounded-2xl border cursor-pointer transition space-y-2.5 ${
                    kitchenMode === "independent"
                      ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">📦</span>
                    {kitchenMode === "independent" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                        सक्रिय मोड (Active)
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">स्वतंत्र कैटरिंग स्टोर (Independent Catering Store)</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      बैंक्वेट का पूरा राशन (50kg पनीर, बासमती, गैस सिलेंडर) मंडी से अलग बल्क में खरीदा जाएगा। 
                      बाहरी हलवाई या स्वतंत्र कैटरिंग टीम द्वारा खाना तैयार किया जाएगा।
                    </p>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-800 font-bold">
                    ✓ बड़े विवाह स्थल • अलग कैटरिंग हलवाई बिल • पूर्ण स्वायत्तता
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: COMMERCIALS, ADVANCE & BEO CONTRACT */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calculator className="text-emerald-600" size={18} />
                  फाइनेंशियल कैलकुलेटर, मिनिमम प्लेट नियम, टोकन व BEO:
                </h3>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  वेन्यू: {currentHall.name}
                </span>
              </div>

              {/* Guest Count & Hall Rent Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    न्यूनतम गारंटीकृत प्लेट्स (Min Pax):
                  </label>
                  <input
                    type="number"
                    value={minGuaranteedPax}
                    onChange={(e) => setMinGuaranteedPax(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-black text-base text-indigo-950"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    हॉल फ्री थ्रेशोल्ड: <strong>{currentHall.freeHallMinPax} प्लेट्स</strong>
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">हॉल किराया (Hall Rent):</label>
                  {isHallFree ? (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-black">
                      ₹0 (फ्री हॉल - {pax} प्लेट्स पर छूट)
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={hallRentInput || currentHall.lowPaxHallRent}
                      onChange={(e) => setHallRentInput(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-900"
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isHallFree ? "✓ 75+ प्लेट्स पर हॉल फ्री" : "⚠️ कम प्लेट्स पर हॉल किराया लागू"}
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <label className="font-bold text-slate-800 block mb-1">
                    कुल एडवांस टोकन (Auto-Sum of Split):
                  </label>
                  <div className="font-mono font-black text-xl text-emerald-700">
                    ₹{effectiveAdvance.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                    ✓ कैश, यूपीआई व चेक का संयुक्त भुगतान
                  </span>
                </div>
              </div>

              {/* 💳 MULTI-MODE SPLIT PAYMENT BREAKDOWN */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <DollarSign size={15} className="text-emerald-600" />
                    स्प्लिट पेमेंट ब्रेकडाउन (Multi-Mode Split Advance Payment):
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    कुल प्राप्त: ₹{effectiveAdvance.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">💵 नकद (Cash ₹):</label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">📱 UPI / QR (₹):</label>
                    <input
                      type="number"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🏦 चेक राशि (Cheque ₹):</label>
                    <input
                      type="number"
                      value={splitCheque}
                      onChange={(e) => setSplitCheque(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">💳 कार्ड (Card ₹):</label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {splitCheque > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">चेक नंबर (Cheque No):</label>
                      <input
                        type="text"
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                        placeholder="उदा. 004521"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">बैंक का नाम (Bank Name):</label>
                      <input
                        type="text"
                        value={chequeBank}
                        onChange={(e) => setChequeBank(e.target.value)}
                        placeholder="उदा. SBI Civil Lines"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 📅 3-MILESTONE INSTALLMENT SCHEDULE & CANCELLATION RULES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Milestone Schedule */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
                  <span className="font-black text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    किस्तों की तय समय-सारिणी (3-Milestone Payment Schedule):
                  </span>

                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. टोकन एडवांस (25%)</strong>
                        <span className="text-slate-500 text-[10px]">आज बुकिंग के समय देय</span>
                      </div>
                      <span className="font-mono font-black text-emerald-700">₹{effectiveAdvance.toLocaleString("en-IN")} (प्राप्त)</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 block font-bold">2. प्री-इवेंट 50%</strong>
                        <span className="text-slate-500 text-[10px]">फंक्शन से 7 दिन पूर्व (मेनू व अरेंजमेंट लॉक)</span>
                      </div>
                      <span className="font-mono font-black text-indigo-900">₹{Math.round(grandTotal * 0.50).toLocaleString("en-IN")}</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 block font-bold">3. फाइनल सेटलमेंट (शेष 25%)</strong>
                        <span className="text-slate-500 text-[10px]">फंक्शन के दिन (हॉल हैंडओवर से पूर्व)</span>
                      </div>
                      <span className="font-mono font-black text-rose-700">₹{Math.max(0, grandTotal - effectiveAdvance - Math.round(grandTotal * 0.50)).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2.5">
                  <span className="font-black text-rose-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-rose-600" />
                    रिफंड व कैंसिलेशन नियम (Standard Cancellation Terms):
                  </span>

                  <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-100">
                      <span>30 दिन से अधिक पहले रद्द करने पर:</span>
                      <strong className="text-emerald-700 font-mono">90% रिफंड (10% टोकन कटौती)</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-100">
                      <span>15 से 30 दिन पहले रद्द करने पर:</span>
                      <strong className="text-amber-700 font-mono">50% रिफंड (50% कटौती)</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-100">
                      <span>15 दिन से कम में रद्द करने पर:</span>
                      <strong className="text-rose-700 font-mono">0% रिफंड (टोकन पूर्णतः जब्त)</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    * BEO स्लिप और होस्ट कॉन्ट्रैक्ट पर यह पॉलिसी स्वतः प्रिंट होकर जाएगी।
                  </p>
                </div>
              </div>

              {/* Extra Addons Checklist */}
              <div className="space-y-2">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  अतिरिक्त सुविधाएं व सेवाएं (Add-ons & Vendors):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addonsList.map((ad, aIdx) => (
                    <div
                      key={ad.id}
                      onClick={() => {
                        const updated = [...addonsList];
                        updated[aIdx].isIncluded = !updated[aIdx].isIncluded;
                        setAddonsList(updated);
                      }}
                      className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition ${
                        ad.isIncluded
                          ? "bg-amber-50 border-amber-400 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={ad.isIncluded}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-amber-600"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{ad.name}</span>
                          <span className="text-[10px] text-slate-500">{ad.provider}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-slate-900">+₹{ad.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  विशेष निर्देश व नोट्स (Special Event Notes / Kitchen KOT Instructions):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                />
              </div>

              {/* Total Financial Summary Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] uppercase text-indigo-300 block">कैटरिंग भोजन कुल</span>
                  <span className="text-lg font-black text-white font-mono mt-0.5 block">
                    ₹{foodTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">{pax} × ₹{finalPlateRate}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-indigo-300 block">हॉल रेंट + सुविधाएं</span>
                  <span className="text-lg font-black text-yellow-400 font-mono mt-0.5 block">
                    ₹{(effectiveHallRent + addonsTotal).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">रेंट: ₹{effectiveHallRent} + ऐडऑन</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-emerald-300 block">कुल देय राशि (Total)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">अनुमानित बजट</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-rose-300 block">शेष राशि (Balance Due)</span>
                  <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold">टोकन: ₹{effectiveAdvance.toLocaleString("en-IN")} जमा</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else onClose();
            }}
            className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs transition"
          >
            {currentStep === 1 ? "रद्द करें (Cancel)" : "← पिछला स्टेप"}
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition"
              >
                अगला स्टेप (Next) →
              </button>
            ) : (
              <button
                onClick={handleSaveBooking}
                disabled={loading || !slotAvailable}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition"
              >
                <Save size={16} />
                <span>{loading ? "बुकिंग दर्ज हो रही है..." : "✓ बैंक्वेट स्लॉट लॉक व BEO सुरक्षित करें"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
