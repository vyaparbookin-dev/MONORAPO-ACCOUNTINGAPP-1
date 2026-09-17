import React, { useState, useEffect } from "react";
import {
  Tag,
  Award,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Gift,
  Sparkles,
  Star,
  Calendar,
  ShieldCheck,
  Share2,
  Smartphone,
  Check,
  X,
  RefreshCw,
  Percent,
  Clock
} from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

const BUSINESS_MODULES = [
  { id: "all", label: "🏢 सभी व्यवसाय (All Business)" },
  { id: "restaurant", label: "🍽️ रेस्तरां / कैफे (Restaurant)" },
  { id: "grocery", label: "🛒 किराना / सुपरमार्केट (Grocery)" },
  { id: "clothes", label: "👔 गारमेंट्स / फुटवियर (Garments)" },
  { id: "salon", label: "💇‍♂️ सैलून / ब्यूटी पार्लर (Salon)" },
  { id: "hardware", label: "🔧 हार्डवेयर / सैनिटरी (Hardware)" },
  { id: "gamezone", label: "🎮 गेमज़ोन / एम्यूजमेंट (Gamezone)" },
  { id: "services", label: "💼 सेवा / अन्य (Services)" }
];

const CouponsPage = () => {
  const { selectedCompany } = useCompany() || {};
  const [activeTab, setActiveTab] = useState("stamps"); // "stamps" | "coupons"
  const [loading, setLoading] = useState(false);

  // ----------------------------------------
  // TAB 1: STANDARD COUPONS STATE
  // ----------------------------------------
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountPercentage: 10,
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    businessModule: "all"
  });

  // ----------------------------------------
  // TAB 2: DIGITAL STAMP PROGRAMS STATE
  // ----------------------------------------
  const [stampPrograms, setStampPrograms] = useState([]);
  const [customerCards, setCustomerCards] = useState([]);
  const [showStampForm, setShowStampForm] = useState(false);
  const [editingStampId, setEditingStampId] = useState(null);
  const [stampForm, setStampForm] = useState({
    title: "डाइन-इन स्पेशल: 6 विज़िट = 1 स्टार्टर फ्री",
    description: "हर ₹200+ के बिल पर पाएं 1 स्टैंप और 6 स्टैंप पर फ्री रिवॉर्ड!",
    businessModule: "restaurant",
    totalStamps: 6,
    minBillAmount: 200,
    rewardType: "free_item", // free_item, percentage, flat_discount
    rewardItemName: "पनीर टिक्का / स्टार्टर",
    discountPercentage: 20,
    maxDiscountAmount: 300,
    discountAmount: 150,
    validityDays: 60,
    rewardValidityDays: 30,
    oneStampPerDay: true,
    isActive: true
  });
  const [savingStamp, setSavingStamp] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetchCoupons();
    fetchStampPrograms();
    fetchCustomerStampCards();
  }, [selectedCompany]);

  // ========================================
  // COUPONS API CALLS
  // ========================================
  const fetchCoupons = async () => {
    try {
      const res = await api.get("/api/coupon");
      const data = res.data?.coupons || res.data || res;
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
      setCoupons([]);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      if (editingCouponId) {
        await api.put(`/api/coupon/${editingCouponId}`, couponForm);
        alert("कूपन सफलतापूर्वक अपडेट हुआ!");
      } else {
        await api.post("/api/coupon", couponForm);
        alert("नया कूपन सफलतापूर्वक बनाया गया!");
      }
      fetchCoupons();
      resetCouponForm();
    } catch (err) {
      console.error("Error saving coupon:", err);
      alert("कूपन सहेजने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("क्या आप वाकई इस कूपन को हटाना चाहते हैं?")) return;
    try {
      await api.delete(`/api/coupon/${id}`);
      fetchCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      discountPercentage: 10,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      businessModule: "all"
    });
    setEditingCouponId(null);
    setShowCouponForm(false);
  };

  // ========================================
  // STAMP PROGRAMS API CALLS
  // ========================================
  const fetchStampPrograms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/stamps/programs");
      const data = res.data?.programs || res.data || [];
      setStampPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch stamp programs:", err);
      setStampPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStampCards = async () => {
    try {
      const res = await api.get("/api/stamps/customer-cards");
      const data = res.data?.cards || res.data || [];
      setCustomerCards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch customer stamp cards:", err);
      setCustomerCards([]);
    }
  };

  const handleSaveStampProgram = async (e) => {
    e.preventDefault();
    if (!stampForm.title.trim()) {
      alert("कृपया प्रोग्राम का शीर्षक दर्ज करें!");
      return;
    }
    setSavingStamp(true);
    try {
      if (editingStampId) {
        await api.put(`/api/stamps/programs/${editingStampId}`, stampForm);
        alert("✅ डिजिटल स्टैंप कार्ड सफलतापूर्वक अपडेट हुआ!");
      } else {
        await api.post("/api/stamps/programs", stampForm);
        alert("🎉 नया डिजिटल स्टैंप कार्ड सफलतापूर्वक बनाया गया!");
      }
      fetchStampPrograms();
      resetStampForm();
    } catch (err) {
      console.error("Error saving stamp program:", err);
      alert("स्टैंप कार्ड सहेजने में त्रुटि: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingStamp(false);
    }
  };

  const handleEditStampProgram = (prog) => {
    setEditingStampId(prog._id);
    setStampForm({
      title: prog.title || "",
      description: prog.description || "",
      businessModule: prog.businessModule || "restaurant",
      totalStamps: prog.totalStamps || 6,
      minBillAmount: prog.minBillAmount || 0,
      rewardType: prog.rewardType || "free_item",
      rewardItemName: prog.rewardItemName || "",
      discountPercentage: prog.discountPercentage || 0,
      maxDiscountAmount: prog.maxDiscountAmount || 0,
      discountAmount: prog.discountAmount || 0,
      validityDays: prog.validityDays || 60,
      rewardValidityDays: prog.rewardValidityDays || 30,
      oneStampPerDay: prog.oneStampPerDay !== false,
      isActive: prog.isActive !== false
    });
    setShowStampForm(true);
  };

  const handleDeleteStampProgram = async (id) => {
    if (!window.confirm("क्या आप वाकई इस स्टैंप प्रोग्राम को हटाना चाहते हैं?")) return;
    try {
      await api.delete(`/api/stamps/programs/${id}`);
      fetchStampPrograms();
    } catch (err) {
      console.error("Error deleting stamp program:", err);
    }
  };

  const handleToggleStampActive = async (prog) => {
    try {
      await api.put(`/api/stamps/programs/${prog._id}`, { isActive: !prog.isActive });
      fetchStampPrograms();
    } catch (err) {
      console.error("Error toggling stamp status:", err);
    }
  };

  const resetStampForm = () => {
    setStampForm({
      title: "डाइन-इन स्पेशल: 6 विज़िट = 1 स्टार्टर फ्री",
      description: "हर ₹200+ के बिल पर पाएं 1 स्टैंप और 6 स्टैंप पर फ्री रिवॉर्ड!",
      businessModule: "restaurant",
      totalStamps: 6,
      minBillAmount: 200,
      rewardType: "free_item",
      rewardItemName: "पनीर टिक्का / स्टार्टर",
      discountPercentage: 20,
      maxDiscountAmount: 300,
      discountAmount: 150,
      validityDays: 60,
      rewardValidityDays: 30,
      oneStampPerDay: true,
      isActive: true
    });
    setEditingStampId(null);
    setShowStampForm(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
                <Award size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  लॉयल्टी व डिस्काउंट कूपन प्रबंधन (Loyalty & Rewards)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  ग्राहकों के लिए डिजिटल स्टैंप कार्ड (6 विज़िट = 1 फ्री) और प्रमोशनल कूपन कोड
                </p>
              </div>
            </div>
          </div>

          {/* MAIN TABS SWITCHER */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("stamps")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "stamps"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Star size={15} className={activeTab === "stamps" ? "text-amber-500 fill-amber-500" : ""} />
              <span>⭐ डिजिटल स्टैंप कार्ड (Punch Cards)</span>
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "coupons"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Tag size={15} />
              <span>🎟️ डिस्काउंट कूपन (Coupons)</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DIGITAL STAMP PUNCH CARDS (NEW FEATURE)            */}
        {/* ========================================================= */}
        {activeTab === "stamps" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Action Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>सक्रिय स्टैंप कार्ड प्रोग्राम (Active Stamp Programs)</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                    {stampPrograms.length} प्रोग्राम
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  बिलिंग के दौरान ग्राहक का नंबर डालने पर स्वतः स्टैंप काउंट होंगे
                </p>
              </div>
              <button
                onClick={() => {
                  if (showStampForm) resetStampForm();
                  else setShowStampForm(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                {showStampForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showStampForm ? "रद्द करें" : "+ नया स्टैंप कार्ड बनाएं"}</span>
              </button>
            </div>

            {/* STAMP CARD FORM MODAL / CARD */}
            {showStampForm && (
              <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-200 p-5 sm:p-6 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    <h3 className="font-black text-base text-slate-900">
                      {editingStampId ? "स्टैंप कार्ड प्रोग्राम एडिट करें" : "नया डिजिटल स्टैंप कार्ड प्रोग्राम सेट करें"}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">100% कस्टमाइज़ेबल लॉयल्टी नियम</span>
                </div>

                <form onSubmit={handleSaveStampProgram} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        प्रोग्राम का नाम (Campaign Title) *
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. रेस्टोरेंट डाइन-इन: 6 विज़िट = 1 स्टार्टर फ्री"
                        value={stampForm.title}
                        onChange={(e) => setStampForm({ ...stampForm, title: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                        required
                      />
                    </div>

                    {/* Business Module */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        व्यवसाय का प्रकार (Business Category)
                      </label>
                      <select
                        value={stampForm.businessModule}
                        onChange={(e) => setStampForm({ ...stampForm, businessModule: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs bg-white"
                      >
                        {BUSINESS_MODULES.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Total Stamps Goal */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        कुल कितने स्टैंप चाहिए? (Target Visits to Unlock Reward) *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={stampForm.totalStamps}
                          onChange={(e) => setStampForm({ ...stampForm, totalStamps: Number(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                          required
                        />
                        <span className="text-xs text-slate-500 font-extrabold whitespace-nowrap">विज़िट / स्टैंप</span>
                      </div>
                      <p className="text-[10px] text-slate-400">आमतौर पर रेस्टोरेंट्स व सैलून 5 या 6 स्टैंप रखते हैं</p>
                    </div>

                    {/* Minimum Bill Amount */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        न्यूनतम बिल राशि (Min Bill Amount per Stamp ₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0 = कोई न्यूनतम शर्त नहीं"
                          value={stampForm.minBillAmount}
                          onChange={(e) => setStampForm({ ...stampForm, minBillAmount: Number(e.target.value) })}
                          className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">उदा. ₹200 से कम के बिल पर स्टैंप काउंट नहीं होगा</p>
                    </div>

                    {/* Reward Type Selection */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block">
                        लक्ष्य पूरा होने पर ग्राहक को क्या रिवॉर्ड देना है? (Reward Type) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: "free_item", label: "🍲 फ्री डिश / सामान (Free Item)", desc: "उदा. 1 पनीर टिक्का या 1 कॉफ़ी फ्री" },
                          { id: "percentage", label: "🏷️ प्रतिशत छूट (% Discount)", desc: "उदा. अगले बिल पर 20% की छूट" },
                          { id: "flat_discount", label: "💵 फ्लैट रुपया छूट (Flat ₹ Off)", desc: "उदा. कुल बिल में ₹150 की सीधी छूट" }
                        ].map((rt) => (
                          <div
                            key={rt.id}
                            onClick={() => setStampForm({ ...stampForm, rewardType: rt.id })}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                              stampForm.rewardType === rt.id
                                ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="font-extrabold text-xs">{rt.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{rt.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conditional Reward Fields */}
                    {stampForm.rewardType === "free_item" && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-black text-slate-700 block">
                          फ्री आइटम / डिश का नाम (Free Dish / Service Name) *
                        </label>
                        <input
                          type="text"
                          placeholder="उदा. 1 पनीर टिक्का / 1 चॉकलेट शेक / 1 फ्री हेयर स्पा"
                          value={stampForm.rewardItemName}
                          onChange={(e) => setStampForm({ ...stampForm, rewardItemName: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                          required
                        />
                      </div>
                    )}

                    {stampForm.rewardType === "percentage" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-slate-700 block">
                            छूट प्रतिशत (% Discount) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="20"
                            value={stampForm.discountPercentage}
                            onChange={(e) => setStampForm({ ...stampForm, discountPercentage: Number(e.target.value) })}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-slate-700 block">
                            अधिकतम छूट सीमा (Max Discount Cap ₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="300 (0 = कोई सीमा नहीं)"
                            value={stampForm.maxDiscountAmount}
                            onChange={(e) => setStampForm({ ...stampForm, maxDiscountAmount: Number(e.target.value) })}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                          />
                        </div>
                      </>
                    )}

                    {stampForm.rewardType === "flat_discount" && (
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 block">
                          फ्लैट छूट राशि (Flat Discount Amount ₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="150"
                          value={stampForm.discountAmount}
                          onChange={(e) => setStampForm({ ...stampForm, discountAmount: Number(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                          required
                        />
                      </div>
                    )}

                    {/* Expiry Days */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        स्टैंप पूरे करने की समय सीमा (Validity Days)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={stampForm.validityDays}
                          onChange={(e) => setStampForm({ ...stampForm, validityDays: Number(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-xs"
                        />
                        <span className="text-xs text-slate-500 font-extrabold whitespace-nowrap">दिन (0 = असीमित)</span>
                      </div>
                    </div>

                    {/* Anti-Fraud Toggle */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">
                        धोखाधड़ी से सुरक्षा (Anti-Fraud Rule)
                      </label>
                      <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stampForm.oneStampPerDay}
                          onChange={(e) => setStampForm({ ...stampForm, oneStampPerDay: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-slate-700">
                          1 दिन में अधिकतम 1 ही स्टैंप (1 Stamp Per Day)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* LIVE PREVIEW BOX */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                      <Sparkles size={12} /> ग्राहक को ऐसा डिजिटल कार्ड दिखेगा (Live Card Preview):
                    </span>
                    <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div>
                        <div className="font-black text-sm text-slate-900">{stampForm.title || "लॉयल्टी कार्ड"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          न्यूनतम बिल: ₹{stampForm.minBillAmount} • रिवॉर्ड:{" "}
                          <strong className="text-emerald-600 font-bold">
                            {stampForm.rewardType === "free_item"
                              ? `1 फ्री ${stampForm.rewardItemName || "आइटम"}`
                              : stampForm.rewardType === "percentage"
                              ? `${stampForm.discountPercentage}% छूट`
                              : `₹${stampForm.discountAmount} छूट`}
                          </strong>
                        </div>
                      </div>
                      {/* EMOJI STAMPS VISUAL */}
                      <div className="flex items-center gap-1 text-lg tracking-widest bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-300">
                        {Array.from({ length: Math.min(10, stampForm.totalStamps || 6) }).map((_, idx) => (
                          <span key={idx} className={idx < 3 ? "text-amber-500" : "text-slate-300"}>
                            {idx < 3 ? "⭐" : "⚪"}
                          </span>
                        ))}
                        <span className="text-xs font-black text-amber-900 ml-1">
                          (3/{stampForm.totalStamps})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={savingStamp}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>{savingStamp ? "सहेज रहा है..." : editingStampId ? "अपडेट सुरक्षित करें" : "प्रोग्राम सक्रिय करें (Launch)"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetStampForm}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      रद्द करें
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STAMP PROGRAMS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stampPrograms.length === 0 ? (
                <div className="md:col-span-2 p-10 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-2xl shadow-xs">
                    ⭐
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">कोई स्टैंप प्रोग्राम नहीं मिला</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    ऊपर <strong>"+ नया स्टैंप कार्ड बनाएं"</strong> बटन दबाकर पहला लॉयल्टी प्रोग्राम शुरू करें (उदा. "6 विज़िट = 1 स्टार्टर फ्री")।
                  </p>
                </div>
              ) : (
                stampPrograms.map((prog) => (
                  <div
                    key={prog._id}
                    className={`bg-white rounded-2xl border p-5 space-y-3.5 shadow-xs transition hover:shadow-md ${
                      prog.isActive ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-base text-slate-900">{prog.title}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {BUSINESS_MODULES.find((m) => m.id === prog.businessModule)?.label.split(" ")[0] || "🏢"}
                          </span>
                          {prog.isActive ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              🟢 सक्रिय (Active)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              ⚪ बंद (Inactive)
                            </span>
                          )}
                        </div>
                        {prog.description && (
                          <p className="text-xs text-slate-500 mt-1">{prog.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditStampProgram(prog)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteStampProgram(prog._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Visual Stamp Card Grid */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-500">
                        <span>स्टैंप लक्ष्य: {prog.totalStamps} विज़िट</span>
                        <span>न्यूनतम बिल: ₹{prog.minBillAmount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-base tracking-widest bg-white p-2 rounded-lg border border-slate-200">
                        {Array.from({ length: Math.min(10, prog.totalStamps) }).map((_, i) => (
                          <span key={i} className="text-amber-500">⭐</span>
                        ))}
                        {prog.totalStamps > 10 && <span className="text-xs font-bold text-slate-400">+{prog.totalStamps - 10}</span>}
                      </div>
                    </div>

                    {/* Reward Badge */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <Gift size={14} className="text-emerald-600" />
                        <span>
                          रिवॉर्ड:{" "}
                          <strong>
                            {prog.rewardType === "free_item"
                              ? `1 फ्री ${prog.rewardItemName}`
                              : prog.rewardType === "percentage"
                              ? `${prog.discountPercentage}% छूट (अधिकतम ₹${prog.maxDiscountAmount})`
                              : `₹${prog.discountAmount} फ्लैट छूट`}
                          </strong>
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleStampActive(prog)}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                          prog.isActive
                            ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {prog.isActive ? "रोकें (Pause)" : "सक्रिय करें (Activate)"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CUSTOMERS STAMP TRACKER AUDIT TABLE */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Smartphone size={18} className="text-indigo-600" />
                    <span>ग्राहक स्टैंप ट्रैकर व रिवॉर्ड्स (Customer Stamp Progress)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    जिन ग्राहकों के स्टैंप दर्ज हुए हैं उनकी लाइव प्रगति और अनलॉक रिवॉर्ड कोड
                  </p>
                </div>
                <button
                  onClick={fetchCustomerStampCards}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                  title="रिफ्रेश करें"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
                      <th className="p-3">ग्राहक (Customer)</th>
                      <th className="p-3">प्रोग्राम (Card)</th>
                      <th className="p-3">स्टैंप प्रगति (Stamps)</th>
                      <th className="p-3">स्थिति (Status)</th>
                      <th className="p-3">रिवॉर्ड / कूपन कोड</th>
                      <th className="p-3">अंतिम विज़िट</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerCards.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-slate-400">
                          अभी तक किसी ग्राहक का स्टैंप दर्ज नहीं हुआ है। बिलिंग में मोबाइल नंबर डालकर बिल बनाएं!
                        </td>
                      </tr>
                    ) : (
                      customerCards.map((c) => (
                        <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">{c.customerName || "ग्राहक"}</div>
                            <div className="text-[11px] text-slate-500 font-mono">📞 {c.customerPhone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-700">{c.programId?.title || "स्टैंप प्रोग्राम"}</div>
                            <span className="text-[10px] text-slate-400">चक्र #{c.cycle || 1}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-black text-amber-600 text-sm tracking-wider">
                              {"⭐".repeat(Math.min(c.currentStamps, c.totalStamps))}
                              {"⚪".repeat(Math.max(0, c.totalStamps - c.currentStamps))}
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              {c.currentStamps} / {c.totalStamps} स्टैंप पूरे
                            </span>
                          </td>
                          <td className="p-3">
                            {c.status === "REWARD_READY" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                🎉 रिवॉर्ड अनलॉक!
                              </span>
                            ) : c.status === "REDEEMED" ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                ✅ रिडीम हो चुका
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                ⏳ प्रगति पर ({c.totalStamps - c.currentStamps} शेष)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {c.unlockedReward?.code ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200">
                                  {c.unlockedReward.code}
                                </span>
                                {c.unlockedReward.isRedeemed && (
                                  <span className="text-[10px] text-slate-400">(प्रयुक्त)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">--</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {c.lastStampDate ? new Date(c.lastStampDate).toLocaleDateString("hi-IN") : "--"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: STANDARD PROMOTIONAL COUPONS                       */}
        {/* ========================================================= */}
        {activeTab === "coupons" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  डिस्काउंट कूपन कोड्स (Promotional Coupons)
                </h2>
                <p className="text-xs text-slate-500">
                  विशेष छूट कूपन कोड बनाएं जिसे ग्राहक बिलिंग पर लागू कर सकते हैं
                </p>
              </div>
              <button
                onClick={() => {
                  if (showCouponForm) resetCouponForm();
                  else setShowCouponForm(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                {showCouponForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showCouponForm ? "रद्द करें" : "+ नया कूपन बनाएं"}</span>
              </button>
            </div>

            {/* Coupon Form */}
            {showCouponForm && (
              <div className="bg-white rounded-2xl shadow-md border-2 border-emerald-200 p-5 animate-in slide-in-from-top-2">
                <h3 className="font-black text-base text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  {editingCouponId ? "कूपन संपादित करें" : "नया डिस्काउंट कूपन बनाएं"}
                </h3>
                <form onSubmit={handleSaveCoupon} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">कूपन कोड (Coupon Code) *</label>
                      <input
                        type="text"
                        placeholder="उदा. FESTIVE20, WELCOME10"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-900 uppercase outline-none focus:border-emerald-500"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">छूट प्रतिशत (Discount %) *</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="10"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                        value={couponForm.discountPercentage}
                        onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">वैध प्रारंभ (Valid From)</label>
                      <input
                        type="date"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                        value={couponForm.validFrom}
                        onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">समाप्ति तारीख (Valid To)</label>
                      <input
                        type="date"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                        value={couponForm.validTo}
                        onChange={(e) => setCouponForm({ ...couponForm, validTo: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition"
                    >
                      {editingCouponId ? "अपडेट करें" : "कूपन बनाएं"}
                    </button>
                    <button
                      type="button"
                      onClick={resetCouponForm}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      रद्द करें
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Coupons Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
                    <th className="p-3">कूपन कोड</th>
                    <th className="p-3">छूट (%)</th>
                    <th className="p-3">वैध प्रारंभ</th>
                    <th className="p-3">समाप्ति</th>
                    <th className="p-3">कार्य (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-400">
                        कोई कूपन उपलब्ध नहीं है। ऊपर दिए गए बटन से नया कूपन बनाएं।
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                        <td className="p-3">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-600 text-sm">
                          {c.discountPercentage || c.discount || 0}% OFF
                        </td>
                        <td className="p-3 text-slate-500">
                          {c.validFrom ? new Date(c.validFrom).toLocaleDateString("hi-IN") : "--"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {c.validTo ? new Date(c.validTo).toLocaleDateString("hi-IN") : "--"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCouponId(c._id);
                                setCouponForm({
                                  code: c.code,
                                  discountPercentage: c.discountPercentage || c.discount || 0,
                                  validFrom: c.validFrom ? new Date(c.validFrom).toISOString().split("T")[0] : "",
                                  validTo: c.validTo ? new Date(c.validTo).toISOString().split("T")[0] : "",
                                  businessModule: c.businessModule || "all"
                                });
                                setShowCouponForm(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold cursor-pointer"
                            >
                              एडिट
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(c._id)}
                              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold cursor-pointer"
                            >
                              हटाएं
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CouponsPage;
