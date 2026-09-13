import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Building,
  Calendar,
  Clock,
  Users,
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
  ShieldAlert,
  ArrowRight,
  Eye,
  FileText,
  Flame,
  ShoppingBag,
  UserCheck,
  Ban
} from "lucide-react";
import BanquetBookingWizardModal from "./BanquetBookingWizardModal";

export default function BanquetHubPage() {
  // Navigation Tabs: 'bookings' | 'crm' | 'plate_audit' | 'event_pl'
  const [activeTab, setActiveTab] = useState("bookings");

  const [halls, setHalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHallFilter, setSelectedHallFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedBookingForBeo, setSelectedBookingForBeo] = useState(null);
  const [selectedBookingForIndent, setSelectedBookingForIndent] = useState(null);
  
  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPay, setSelectedBookingForPay] = useState(null);
  const [payAmountInput, setPayAmountInput] = useState("");

  // Plate Audit & Host Sign-Off Modal
  const [selectedBookingForPlateAudit, setSelectedBookingForPlateAudit] = useState(null);
  const [plateAuditForm, setPlateAuditForm] = useState({
    actualPlatesCounted: 0,
    verifiedByHostName: "",
    verifiedByHostPhone: "",
    hostRelation: "Host (स्वयं)",
    hostSignatureNotes: "फंक्शन के दौरान बफे प्लेट्स की गिनती सत्यापित की गई।"
  });
  const [showPlateSlipModal, setShowPlateSlipModal] = useState(false);

  // Cancellation Modal
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Event Direct Expenses Modal (Groceries, Gas Cylinders, External Labor)
  const [selectedBookingForExpense, setSelectedBookingForExpense] = useState(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseFormType, setExpenseFormType] = useState("grocery"); // 'grocery' | 'gas' | 'external_staff'
  const [groceryExpense, setGroceryExpense] = useState({ itemName: "", qty: 1, unit: "kg", cost: 0, vendorName: "", billNo: "" });
  const [gasExpense, setGasExpense] = useState({ cylinderCount: 1, ratePerCylinder: 1850, supplierName: "कमर्शियल गैस एजेंसी" });
  const [staffExpense, setStaffExpense] = useState({ role: "कैटरिंग वेटर", vendorOrAgency: "स्थानीय वेटर यूनियन", staffCount: 4, wagePerPerson: 600, isPaid: true });

  // Inquiry / CRM Modal
  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    customerName: "",
    customerMobile: "",
    customerCity: "जबलपुर",
    eventType: "शादी रिसेप्शन / रिंग सेरेमनी",
    expectedDate: new Date().toISOString().split("T")[0],
    preferredShift: "evening",
    preferredHallName: "Grand Royal Ballroom (सेंट्रल AC)",
    expectedPax: 150,
    budgetEstimate: 90000,
    attendedByStaff: "विक्रम सिंह (हॉल मैनेजर)",
    referredBy: "डायरेक्ट वॉक-इन",
    clientFeedback: "हॉल का दौरा किया, एसी और स्टेज थीम पसंद आई।"
  });

  useEffect(() => {
    fetchBanquetData();
    fetchInquiries();
  }, []);

  const fetchBanquetData = async () => {
    setLoading(true);
    try {
      const [hallsRes, bookingsRes] = await Promise.all([
        api.get("/api/banquet/halls"),
        api.get("/api/banquet/bookings")
      ]);

      setHalls(hallsRes.data?.halls || []);
      setBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      console.error("Error fetching banquet data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await api.get("/api/banquet/inquiries");
      setInquiries(res.data?.inquiries || []);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
    }
  };

  // KPI Calculations
  const totalHallsCount = halls.length;
  const upcomingBookingsCount = bookings.filter((b) => b.status === "confirmed" || b.status === "ongoing").length;
  const totalBanquetRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalEstimatedAmount || b.finalSettlementAmount || 0)), 0);
  const totalAdvanceCollected = bookings.reduce((sum, b) => sum + (Number(b.advancePaid || 0)), 0);
  const totalBalanceDue = bookings.reduce((sum, b) => sum + (Number(b.balanceDue || 0)), 0);

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (selectedHallFilter !== "all" && b.hallId !== selectedHallFilter) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  // Handle Payment Settle
  const handleSettlePayment = async () => {
    if (!selectedBookingForPay || !payAmountInput) return;
    const addAmt = Number(payAmountInput);
    if (isNaN(addAmt) || addAmt <= 0) return;

    try {
      const newAdv = (Number(selectedBookingForPay.advancePaid) || 0) + addAmt;
      await api.put(`/api/banquet/bookings/${selectedBookingForPay._id}`, {
        advancePaid: newAdv
      });
      alert(`₹${addAmt.toLocaleString("en-IN")} का भुगतान सफलतापूर्वक दर्ज हो गया!`);
      setShowPaymentModal(false);
      setSelectedBookingForPay(null);
      setPayAmountInput("");
      fetchBanquetData();
    } catch (err) {
      console.error("Payment update failed:", err);
      alert("भुगतान दर्ज करने में त्रुटि हुई।");
    }
  };

  // Handle Save Plate Audit
  const handleSavePlateAudit = async () => {
    if (!selectedBookingForPlateAudit) return;
    try {
      const res = await api.post(`/api/banquet/bookings/${selectedBookingForPlateAudit._id}/plate-audit`, {
        actualPlatesCounted: Number(plateAuditForm.actualPlatesCounted),
        verifiedByHostName: plateAuditForm.verifiedByHostName,
        verifiedByHostPhone: plateAuditForm.verifiedByHostPhone,
        hostRelation: plateAuditForm.hostRelation,
        hostSignatureNotes: plateAuditForm.hostSignatureNotes,
        isSigned: true
      });
      alert(res.data?.message || "प्लेट सत्यापन सफलतापूर्वक दर्ज हो गया!");
      fetchBanquetData();
      setShowPlateSlipModal(true);
    } catch (err) {
      alert(err.response?.data?.message || "त्रुटि हुई।");
    }
  };

  // Handle Add Event Direct Expense
  const handleAddEventExpense = async () => {
    if (!selectedBookingForExpense) return;
    try {
      let data = {};
      if (expenseFormType === "grocery") data = groceryExpense;
      else if (expenseFormType === "gas") data = gasExpense;
      else if (expenseFormType === "external_staff") data = staffExpense;

      const res = await api.post(`/api/banquet/bookings/${selectedBookingForExpense._id}/record-expense`, {
        expenseType: expenseFormType,
        data
      });
      alert(res.data?.message || "इवेंट खर्च सफलतापूर्वक लेजर में दर्ज हो गया!");
      setShowAddExpenseModal(false);
      fetchBanquetData();
    } catch (err) {
      alert(err.response?.data?.message || "खर्च दर्ज करने में त्रुटि हुई।");
    }
  };

  // Handle Cancellation
  const handleConfirmCancellation = async () => {
    if (!selectedBookingForCancel) return;
    try {
      const res = await api.post(`/api/banquet/bookings/${selectedBookingForCancel._id}/cancel`, {
        cancellationReason
      });
      alert(res.data?.message || "बुकिंग रद्द कर दी गई।");
      setSelectedBookingForCancel(null);
      setCancellationReason("");
      fetchBanquetData();
    } catch (err) {
      alert(err.response?.data?.message || "रद्द करने में त्रुटि हुई।");
    }
  };

  // Handle Save Inquiry
  const handleCreateInquiry = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/banquet/inquiries", inquiryForm);
      alert("नई पूछताछ (Lead Inquiry) सफलतापूर्वक दर्ज हो गई!");
      setShowNewInquiryModal(false);
      fetchInquiries();
    } catch (err) {
      alert(err.response?.data?.message || "पूछताछ दर्ज करने में त्रुटि हुई।");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. TOP HEADER & KPI CARDS */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Building size={22} />
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    बैंक्वेट हॉल व कन्वेंशन हब (Banquet & Events Hub)
                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                      Standalone Mode
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    मल्टी-हॉल वेन्यू, डिश-स्वैपिंग, स्लॉट लॉकिंग, BEO स्लिप, प्लेट ऑडिट व इवेंट P&L
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowNewInquiryModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs border border-indigo-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Phone size={14} />
                <span>+ नई लीड पूछताछ (CRM)</span>
              </button>

              <button
                onClick={() => setShowWizardModal(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={16} />
                <span>+ नया बैंक्वेट बुक करें</span>
              </button>
            </div>
          </div>

          {/* 4 Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "bookings"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar size={14} />
              <span>📋 आगामी कार्यक्रम व बुकिंग्स ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("crm")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "crm"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users size={14} />
              <span>📞 लीड्स व इंक्वायरी CRM ({inquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("plate_audit")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "plate_audit"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileCheck size={14} />
              <span>🍽️ प्लेट गिनती सत्यापन व साइन-ऑफ</span>
            </button>

            <button
              onClick={() => setActiveTab("event_pl")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "event_pl"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <DollarSign size={14} />
              <span>💰 इवेंट P&L व अलग खर्च लेजर</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Scorecards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">सक्रिय वेन्यू हॉल</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">{totalHallsCount} हॉल/लॉन</span>
              <Building size={20} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 block">✓ 100% स्लॉट लॉक रक्षित</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">आगामी इवेंट्स</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-indigo-600">{upcomingBookingsCount} बुक</span>
              <Calendar size={20} className="text-indigo-500" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">अगले 30 दिनों में</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">कुल अनुमानित रेवेन्यू</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                ₹{totalBanquetRevenue.toLocaleString("en-IN")}
              </span>
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">भोजन + रेंट + ऐडऑन्स</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">टोकन एडवांस प्राप्त</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-teal-600 font-mono">
                ₹{totalAdvanceCollected.toLocaleString("en-IN")}
              </span>
              <CheckCircle size={20} className="text-teal-500" />
            </div>
            <span className="text-[10px] text-teal-700 font-bold mt-1 block">खाते में जमा टोकन</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">कुल शेष बकाया (Due)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-rose-600 font-mono">
                ₹{totalBalanceDue.toLocaleString("en-IN")}
              </span>
              <AlertTriangle size={20} className="text-rose-500" />
            </div>
            <span className="text-[10px] text-rose-700 font-bold mt-1 block">फंक्शन की रात देय</span>
          </div>
        </div>

        {/* TAB 1: UPCOMING BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">हॉल फ़िल्टर:</span>
                <select
                  value={selectedHallFilter}
                  onChange={(e) => setSelectedHallFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium outline-none"
                >
                  <option value="all">सभी हॉल व लॉन (All)</option>
                  {halls.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">स्थिति:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium outline-none"
                >
                  <option value="all">सभी बुकिंग्स</option>
                  <option value="confirmed">कन्फर्म्ड (Confirmed)</option>
                  <option value="ongoing">चल रहा है (Ongoing)</option>
                  <option value="completed">सम्पन्न (Completed)</option>
                  <option value="cancelled">रद्द (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" />
                  इवेंट लेजर व स्लॉट स्टेटस (Banquet Events Ledger)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  कुल {filteredBookings.length} कार्यक्रम दर्ज
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
                  <span>बैंक्वेट डेटा लोड हो रहा है...</span>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-3xl block mb-2">🏰</span>
                  <p className="font-bold text-slate-700">कोई बैंक्वेट बुकिंग नहीं मिली।</p>
                  <button
                    onClick={() => setShowWizardModal(true)}
                    className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    + नया बैंक्वेट बुक करें
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">बुकिंग नं व इवेंट</th>
                        <th className="p-3.5">तारीख व शिफ्ट</th>
                        <th className="p-3.5">हॉल / वेन्यू</th>
                        <th className="p-3.5">आयोजक / फोन</th>
                        <th className="p-3.5 text-center">गारंटी पैक्स</th>
                        <th className="p-3.5 text-right">कुल बजट / टोकन</th>
                        <th className="p-3.5 text-right">बकाया राशि</th>
                        <th className="p-3.5 text-center">स्थिति</th>
                        <th className="p-3.5 text-right">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <span className="font-mono font-black text-slate-900 block">{b.bookingNo}</span>
                            <span className="text-slate-600 text-[11px]">{b.eventName}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-bold text-indigo-900 block">{b.eventDate}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-100 text-slate-700 inline-block mt-0.5">
                              {b.timeSlot}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block">{b.hallName}</span>
                            <span className="text-[10px] text-slate-500">
                              {b.kitchenSyncMode === "shared_restaurant" ? "🔄 साझा रसोई" : "📦 स्वतंत्र स्टोर"}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{b.customerName}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{b.customerMobile}</span>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                              {b.minGuaranteedPax} Pax
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <span className="font-mono font-black text-slate-900 block">
                              ₹{(b.totalEstimatedAmount || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ₹{(b.advancePaid || 0).toLocaleString("en-IN")} जमा
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-rose-600">
                            ₹{(b.balanceDue || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                b.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : b.status === "cancelled"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* BEO Button */}
                              <button
                                onClick={() => setSelectedBookingForBeo(b)}
                                title="BEO ऑर्डर स्लिप देखें व प्रिंट करें"
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                              >
                                <FileText size={14} />
                              </button>

                              {/* Kitchen Indent Button */}
                              <button
                                onClick={() => setSelectedBookingForIndent(b)}
                                title="रसोई सामग्री मांग-पत्र (Kitchen Indent)"
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
                              >
                                <ChefHat size={14} />
                              </button>

                              {/* Settle Pay Button */}
                              {b.balanceDue > 0 && b.status !== "cancelled" && (
                                <button
                                  onClick={() => {
                                    setSelectedBookingForPay(b);
                                    setPayAmountInput(b.balanceDue);
                                    setShowPaymentModal(true);
                                  }}
                                  title="भुगतान दर्ज करें"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                                >
                                  <DollarSign size={14} />
                                </button>
                              )}

                              {/* Cancel Button */}
                              {b.status !== "cancelled" && (
                                <button
                                  onClick={() => {
                                    setSelectedBookingForCancel(b);
                                  }}
                                  title="रद्द करें व रिफंड काटें"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CRM & INQUIRIES */}
        {activeTab === "crm" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Phone size={18} className="text-indigo-600" />
                  बैंक्वेट पूछताछ व लीड पाइपलाइन (Inquiry & Follow-up CRM)
                </h3>
                <p className="text-xs text-slate-500">
                  हॉल विज़िट करने वाले ग्राहकों का रिकॉर्ड, फॉलो-अप तारीख व 1-क्लिक बुकिंग
                </p>
              </div>

              <button
                onClick={() => setShowNewInquiryModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus size={15} />
                <span>+ नई पूछताछ दर्ज करें</span>
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
                <Phone size={32} className="mx-auto mb-2 text-indigo-400" />
                <p className="font-bold">कोई पूछताछ (Inquiry) दर्ज नहीं है।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inquiries.map((inq) => (
                  <div key={inq._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-indigo-600">{inq.inquiryNo}</span>
                        <h4 className="font-black text-slate-900 text-base">{inq.customerName}</h4>
                        <span className="text-slate-500 font-mono text-xs block">{inq.customerMobile}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {inq.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-500 block text-[10px]">अपेक्षित तिथि व शिफ्ट:</span>
                        <strong className="text-slate-800">{inq.expectedDate} ({inq.preferredShift})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">संभावित पैक्स व बजट:</span>
                        <strong className="text-slate-800">{inq.expectedPax} Pax • ₹{inq.budgetEstimate?.toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">हॉल किसने दिखाया:</span>
                        <strong className="text-slate-800">{inq.attendedByStaff || "मैनेजर"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">रेफरल स्रोत:</span>
                        <strong className="text-slate-800">{inq.referredBy || "वॉक-इन"}</strong>
                      </div>
                    </div>

                    {inq.clientFeedback && (
                      <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                        💬 "{inq.clientFeedback}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-indigo-700 font-bold">
                        अगला फॉलो-अप: {inq.nextFollowUpDate || "आज ही"}
                      </span>
                      <button
                        onClick={() => {
                          setShowWizardModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <span>⚡ बुकिंग में बदलें</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLATE AUDIT & HOST SIGN-OFF */}
        {activeTab === "plate_audit" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <FileCheck size={18} className="text-teal-600" />
                भौतिक प्लेट गिनती सत्यापन व होस्ट साइन-ऑफ (Physical Plate Audit & Sign-off)
              </h3>
              <p className="text-xs text-slate-500">
                फंक्शन के दौरान बफे में इस्तेमाल हुई वास्तविक प्लेटों की गिनती, अतिरिक्त शुल्क व होस्ट के हस्ताक्षर
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Picker List */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">इवेंट चुनें:</h4>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {bookings.filter(b => b.status !== "cancelled").map(b => (
                    <div
                      key={b._id}
                      onClick={() => {
                        setSelectedBookingForPlateAudit(b);
                        setPlateAuditForm({
                          actualPlatesCounted: b.plateAudit?.actualPlatesCounted || b.minGuaranteedPax,
                          verifiedByHostName: b.plateAudit?.verifiedByHostName || b.customerName,
                          verifiedByHostPhone: b.plateAudit?.verifiedByHostPhone || b.customerMobile,
                          hostRelation: b.plateAudit?.hostRelation || "Host (स्वयं)",
                          hostSignatureNotes: b.plateAudit?.hostSignatureNotes || "बफे काउंटर पर प्लेट्स गिनकर हस्ताक्षर किए।"
                        });
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedBookingForPlateAudit?._id === b._id
                          ? "bg-teal-50 border-teal-500 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-slate-900 text-xs">{b.eventName}</span>
                        <span className="font-mono text-[10px] text-teal-800 font-bold">{b.eventDate}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        होस्ट: {b.customerName} • {b.minGuaranteedPax} पैक्स गारंटी
                      </p>
                      {b.plateAudit?.isSigned && (
                        <span className="mt-1 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          ✓ सत्यापित ({b.plateAudit.actualPlatesCounted} प्लेट्स)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Plate Audit Form */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                {selectedBookingForPlateAudit ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">
                          {selectedBookingForPlateAudit.eventName}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {selectedBookingForPlateAudit.hallName} • {selectedBookingForPlateAudit.eventDate} ({selectedBookingForPlateAudit.timeSlot})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs bg-slate-100 px-3 py-1 rounded-lg">
                        बुकिंग: {selectedBookingForPlateAudit.bookingNo}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">गारंटी प्लेट्स</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {selectedBookingForPlateAudit.minGuaranteedPax}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">प्रति प्लेट दर</span>
                        <span className="text-2xl font-black text-indigo-700 font-mono">
                          ₹{selectedBookingForPlateAudit.finalRatePerPlate}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">अतिरिक्त प्लेट्स इस्तेमाल</span>
                        <span className="text-2xl font-black text-rose-600 font-mono">
                          {Math.max(0, plateAuditForm.actualPlatesCounted - selectedBookingForPlateAudit.minGuaranteedPax)} प्लेट्स
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-xs text-slate-800 block mb-1">
                          वास्तविक गिने गए कुल प्लेट्स (Actual Physical Plate Count): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={plateAuditForm.actualPlatesCounted}
                          onChange={(e) => setPlateAuditForm({ ...plateAuditForm, actualPlatesCounted: Number(e.target.value) })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-lg text-slate-900 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-xs text-slate-800 block mb-1">
                            सत्यापन करने वाले का नाम (Signee Name):
                          </label>
                          <input
                            type="text"
                            value={plateAuditForm.verifiedByHostName}
                            onChange={(e) => setPlateAuditForm({ ...plateAuditForm, verifiedByHostName: e.target.value })}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-xs text-slate-800 block mb-1">
                            रिश्ता / संबंध (Relation with Host):
                          </label>
                          <select
                            value={plateAuditForm.hostRelation}
                            onChange={(e) => setPlateAuditForm({ ...plateAuditForm, hostRelation: e.target.value })}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                          >
                            <option value="Host (स्वयं)">Host (स्वयं आयोजक)</option>
                            <option value="Brother (भाई)">भाई / रिश्तेदार</option>
                            <option value="Father (पिता)">पिता / अभिभावक</option>
                            <option value="Event Planner">इवेंट प्लानर / मैनेजर</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-xs text-slate-800 block mb-1">
                          होस्ट सत्यापन टिप्पणी (Acknowledgment Notes):
                        </label>
                        <input
                          type="text"
                          value={plateAuditForm.hostSignatureNotes}
                          onChange={(e) => setPlateAuditForm({ ...plateAuditForm, hostSignatureNotes: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                        />
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-900">
                          अतिरिक्त प्लेट्स चार्ज: {Math.max(0, plateAuditForm.actualPlatesCounted - selectedBookingForPlateAudit.minGuaranteedPax)} × ₹{selectedBookingForPlateAudit.finalRatePerPlate}
                        </span>
                        <strong className="font-mono text-amber-950 font-black text-sm">
                          = +₹{(Math.max(0, plateAuditForm.actualPlatesCounted - selectedBookingForPlateAudit.minGuaranteedPax) * (selectedBookingForPlateAudit.finalRatePerPlate || 600)).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSavePlateAudit}
                          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs shadow-xs transition"
                        >
                          ✓ प्लेट गिनती सुरक्षित करें व बिल अपडेट करें
                        </button>
                        <button
                          onClick={() => setShowPlateSlipModal(true)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <Printer size={15} />
                          <span>स्लिप प्रिंट करें</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <p className="font-bold">कृपया बाएं सूची में से किसी इवेंट का चयन करें।</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EVENT P&L & DIRECT EXPENSES */}
        {activeTab === "event_pl" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign size={18} className="text-orange-600" />
                  इवेंट-विशिष्ट खर्च लेजर व शुद्ध लाभ (Event Dedicated Expenses & P&L)
                </h3>
                <p className="text-xs text-slate-500">
                  शेयरड किचन होते हुए भी इस इवेंट की अलग खरीदी गई ग्रॉसरी, कमर्शियल गैस सिलेंडर व बाहरी लेबर की सीधी एंट्री
                </p>
              </div>

              {selectedBookingForExpense && (
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition"
                >
                  <Plus size={15} />
                  <span>+ इवेंट खर्च जोड़ें (Groceries/Gas/Staff)</span>
                </button>
              )}
            </div>

            {/* Event Picker Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-700">इवेंट चुनें:</span>
              <select
                value={selectedBookingForExpense?._id || ""}
                onChange={(e) => {
                  const b = bookings.find(x => x._id === e.target.value);
                  setSelectedBookingForExpense(b || null);
                }}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold outline-none"
              >
                <option value="">-- इवेंट चुनें --</option>
                {bookings.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.eventName} • {b.customerName} ({b.eventDate}) - ₹{(b.totalEstimatedAmount||0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedBookingForExpense && (
              <div className="space-y-4">
                {/* Event Financial Overview */}
                {(() => {
                  const b = selectedBookingForExpense;
                  const rev = Number(b.totalEstimatedAmount) || 0;
                  const groceryCost = (b.eventGroceryExpenses || []).reduce((s, g) => s + (Number(g.cost) || 0), 0);
                  const gasCost = (b.gasCylinderUsage || []).reduce((s, g) => s + (Number(g.totalCost) || 0), 0);
                  const staffCost = (b.staffingRoster?.externalStaff || []).reduce((s, st) => s + (Number(st.totalWage) || 0), 0);
                  const totalDirectCost = groceryCost + gasCost + staffCost;
                  const netProfit = rev - totalDirectCost;
                  const margin = rev > 0 ? Math.round((netProfit / rev) * 100) : 0;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md text-center">
                      <div>
                        <span className="text-[10px] uppercase text-indigo-300 block">कुल रेवेन्यू (Billing)</span>
                        <span className="text-xl font-black text-white font-mono">₹{rev.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-orange-300 block">डायरेक्ट इवेंट लागत</span>
                        <span className="text-xl font-black text-orange-400 font-mono">₹{totalDirectCost.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] text-slate-400">ग्रॉसरी + गैस + लेबर</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-emerald-300 block">इवेंट ग्रॉस प्रॉफिट (Profit)</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">₹{netProfit.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-yellow-300 block">प्रॉफिट मार्जिन %</span>
                        <span className="text-xl font-black text-yellow-400 font-mono">{margin}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3 Detail Boxes: Groceries, Cylinders, External Labor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Dedicated Groceries */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                      <ShoppingBag size={15} className="text-orange-500" />
                      अलग खरीदी गई सामग्री (Groceries):
                    </h4>
                    {(selectedBookingForExpense.eventGroceryExpenses || []).length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">कोई अलग ग्रॉसरी बिल दर्ज नहीं है।</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedBookingForExpense.eventGroceryExpenses.map((g, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="block text-slate-800">{g.itemName}</strong>
                              <span className="text-[10px] text-slate-500">{g.qty} {g.unit} • {g.vendorName}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">₹{g.cost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gas Cylinders */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                      <Flame size={15} className="text-rose-500" />
                      कमर्शियल रसोई गैस सिलेंडर (LPG):
                    </h4>
                    {(selectedBookingForExpense.gasCylinderUsage || []).length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">कोई सिलेंडर खर्च दर्ज नहीं है।</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedBookingForExpense.gasCylinderUsage.map((c, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="block text-slate-800">{c.cylinderCount} सिलेंडर</strong>
                              <span className="text-[10px] text-slate-500">@ ₹{c.ratePerCylinder}/सिलेंडर</span>
                            </div>
                            <span className="font-mono font-bold text-rose-700">₹{c.totalCost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External Freelance Labor */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                      <UserCheck size={15} className="text-indigo-500" />
                      बाहरी वेटर व हलवाई लेबर (Labor):
                    </h4>
                    {(selectedBookingForExpense.staffingRoster?.externalStaff || []).length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">कोई बाहरी लेबर दर्ज नहीं है।</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedBookingForExpense.staffingRoster.externalStaff.map((st, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="block text-slate-800">{st.role} ({st.staffCount} व्यक्ति)</strong>
                              <span className="text-[10px] text-slate-500">{st.vendorOrAgency} • @ ₹{st.wagePerPerson}</span>
                            </div>
                            <span className="font-mono font-bold text-indigo-900">₹{st.totalWage}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 2. PRINTABLE BEO SLIP MODAL */}
      {selectedBookingForBeo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedBookingForBeo(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-black text-sm">
                    BEO (Banquet Event Order) अनुबंध व मेनू स्लिप
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    BEO No: {selectedBookingForBeo.bookingNo} • {selectedBookingForBeo.eventName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1"
                >
                  <Printer size={14} />
                  <span>प्रिंट (Print)</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForBeo(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Slip Printable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center border-b pb-3">
                <h2 className="text-lg font-black text-slate-900 uppercase">रॉयल पैलेस बैंक्वेट व कन्वेंशन सेंटर</h2>
                <p className="text-slate-500 text-[11px]">मेन जी.टी. रोड, जबलपुर • फोन: 98765-43210 • GSTIN: 23AAAAA0000A1Z5</p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] uppercase text-slate-800 border">
                  ★ आधिकारिक बैंक्वेट इवेंट ऑर्डर (BEO Contract) ★
                </div>
              </div>

              {/* Host & Event Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <p><strong>आयोजक (Host):</strong> {selectedBookingForBeo.customerName}</p>
                  <p><strong>मोबाइल:</strong> {selectedBookingForBeo.customerMobile}</p>
                  <p><strong>पता:</strong> {selectedBookingForBeo.customerAddress}, {selectedBookingForBeo.city}</p>
                  <p><strong>हॉल किसने बुक किया:</strong> {selectedBookingForBeo.handledByStaff || "मैनेजर"}</p>
                </div>
                <div>
                  <p><strong>कार्यक्रम:</strong> {selectedBookingForBeo.eventName}</p>
                  <p><strong>तारीख व शिफ्ट:</strong> {selectedBookingForBeo.eventDate} ({selectedBookingForBeo.timeSlot.toUpperCase()})</p>
                  <p><strong>वेन्यू हॉल:</strong> {selectedBookingForBeo.hallName}</p>
                  <p><strong>न्यूनतम गारंटीकृत प्लेट्स:</strong> {selectedBookingForBeo.minGuaranteedPax} Pax</p>
                </div>
              </div>

              {/* Service Timeline Rundown */}
              {selectedBookingForBeo.serviceTimeline && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <h5 className="font-bold uppercase text-indigo-900 text-[11px]">⏰ सर्विंग टाइमलाइन (Food Service Rundown):</h5>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <p>• स्टार्टर्स: <strong>{selectedBookingForBeo.serviceTimeline.welcomeDrinksStartersTime}</strong></p>
                    <p>• बुफे खुलना: <strong>{selectedBookingForBeo.serviceTimeline.buffetOpeningTime}</strong></p>
                    <p>• डेजर्ट्स: <strong>{selectedBookingForBeo.serviceTimeline.dessertsTime}</strong></p>
                  </div>
                  {selectedBookingForBeo.serviceTimeline.specialFoodInstructions && (
                    <p className="text-[11px] text-indigo-950 font-bold mt-1">
                      ★ खास निर्देश: {selectedBookingForBeo.serviceTimeline.specialFoodInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Menu & In-Line Swappings */}
              <div className="p-3.5 border border-slate-300 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b pb-1">
                  <h5 className="font-black text-slate-900 uppercase">
                    मेनू कॉम्बो: {selectedBookingForBeo.packageName} (@ ₹{selectedBookingForBeo.finalRatePerPlate}/प्लेट)
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    बेस: ₹{selectedBookingForBeo.baseRatePerPlate} {selectedBookingForBeo.swappedDishesDifferential > 0 && `(+₹${selectedBookingForBeo.swappedDishesDifferential} स्वैप अंतर)`}
                  </span>
                </div>

                {selectedBookingForBeo.swappedDishes?.length > 0 && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 block">बदली गई डिशेज़ (Swapped Dishes):</span>
                    {selectedBookingForBeo.swappedDishes.map((s, i) => (
                      <p key={i} className="text-slate-700 text-[11px]">
                        • <s>{s.originalDish}</s> ➔ <strong>{s.replacementDish}</strong> (+₹{s.priceDiff}/प्लेट)
                      </p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(selectedBookingForBeo.menuItems || []).map((dish, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-amber-600 font-bold">✔</span>
                      <span>{dish}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure & Add-ons Checklist */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="p-3 border border-slate-300 rounded-xl space-y-1">
                  <h5 className="font-bold uppercase text-slate-900 border-b pb-1">🛋️ इंफ्रास्ट्रक्चर व सिटिंग:</h5>
                  <p>• सिटिंग स्टाइल: <strong>{selectedBookingForBeo.seatingConfig?.style}</strong></p>
                  <p>• VIP सोफे: <strong>{selectedBookingForBeo.seatingConfig?.sofaCount || 8} सोफे</strong></p>
                  <p>• कवर्ड कुर्सियां: <strong>{selectedBookingForBeo.seatingConfig?.chairCount || 120} कुर्सियां</strong></p>
                  <p>• क्रॉकरी टाइप: <strong>{selectedBookingForBeo.crockeryConfig?.plateType}</strong></p>
                  <p>• चफिंग डिशेज़: <strong>{selectedBookingForBeo.crockeryConfig?.chafingDishesCount} वार्मर्स</strong></p>
                </div>

                <div className="p-3 border border-slate-300 rounded-xl space-y-1">
                  <h5 className="font-bold uppercase text-slate-900 border-b pb-1">💐 डेकोरेशन व स्टाफ:</h5>
                  <p>• फ्लोर कैप्टन: <strong>{selectedBookingForBeo.staffingRoster?.eventManager || "कैप्टन अमित"}</strong></p>
                  <p>• हेड शेफ: <strong>{selectedBookingForBeo.staffingRoster?.headChef || "शेफ राजवीर"}</strong></p>
                  <p>• स्टेज थीम: <strong>{selectedBookingForBeo.seatingConfig?.stageTheme}</strong></p>
                  <p>• विशेष निर्देश: <em>{selectedBookingForBeo.notes || "N/A"}</em></p>
                </div>
              </div>

              {/* Commercial Settlement Box */}
              <div className="p-4 bg-slate-100 border-2 border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span>कैटरिंग भोजन कुल ({selectedBookingForBeo.minGuaranteedPax} × ₹{selectedBookingForBeo.finalRatePerPlate}):</span>
                  <span className="font-mono font-bold">
                    ₹{((selectedBookingForBeo.minGuaranteedPax || 50) * (selectedBookingForBeo.finalRatePerPlate || 500)).toLocaleString("en-IN")}
                  </span>
                </div>
                {selectedBookingForBeo.hallRent > 0 && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>हॉल किराया (कम प्लेट्स होने पर):</span>
                    <span className="font-mono">₹{selectedBookingForBeo.hallRent.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black text-sm border-t border-slate-300 pt-1.5 text-slate-900">
                  <span>कुल देय अनुमानित बजट (Total):</span>
                  <span className="font-mono">
                    ₹{(selectedBookingForBeo.totalEstimatedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>जमा एडवांस टोकन (Advance Paid):</span>
                  <span className="font-mono">-₹{(selectedBookingForBeo.advancePaid || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center font-black text-sm text-rose-700 border-t border-slate-300 pt-1">
                  <span>शेष देय राशि (Balance Due on Function Night):</span>
                  <span className="font-mono">₹{(selectedBookingForBeo.balanceDue || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Cancellation Policy Note */}
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-900 leading-relaxed">
                <strong>कैंसिलेशन व रिफंड नियम:</strong> फंक्शन से 30 दिन पूर्व रद्द करने पर 90% रिफंड (10% टोकन कटौती), 15-30 दिन पूर्व 50% रिफंड, तथा 15 दिन से कम में रद्द करने पर 0% रिफंड (टोकन पूर्णतः जब्त)।
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 pt-1 font-bold">
                    आयोजक / ग्राहक के हस्ताक्षर (Host Signature)
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">मैंने सभी नियम व शर्तें स्वीकार की हैं</p>
                </div>
                <div>
                  <div className="border-t border-slate-800 pt-1 font-bold">
                    बैंक्वेट मैनेजर के हस्ताक्षर (Authorized Signatory)
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">रॉयल पैलेस बैंक्वेट व कन्वेंशन सेंटर</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KITCHEN INDENT SHEET MODAL */}
      {selectedBookingForIndent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedBookingForIndent(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-teal-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ChefHat size={20} className="text-teal-300" />
                <div>
                  <h3 className="font-black text-sm">
                    केंद्रीय रसोई सामग्री मांग-पत्र (Kitchen Raw Material Indent)
                  </h3>
                  <p className="text-[11px] text-teal-200">
                    {selectedBookingForIndent.bookingNo} • {selectedBookingForIndent.eventName} ({selectedBookingForIndent.minGuaranteedPax} Pax)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBookingForIndent(null)}
                className="p-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-teal-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 space-y-1">
                <p className="font-bold">
                  रसोई मोड: {selectedBookingForIndent.kitchenSyncMode === "shared_restaurant" ? "🔄 साझा रेस्टोरेंट रसोई (Shared Sync)" : "📦 स्वतंत्र कैटरिंग स्टोर"}
                </p>
                <p className="text-[11px] text-teal-800">
                  {selectedBookingForIndent.minGuaranteedPax} प्लेट्स भोजन बनाने हेतु स्टोर से आवश्यक सामग्री की अनुमानित मात्रा।
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">कच्चा माल / किराना सामग्री</th>
                      <th className="p-2.5 text-center">मांग मात्रा (Qty)</th>
                      <th className="p-2.5 text-right">लागत आवंटन (Cost)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedBookingForIndent.kitchenIndent || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{item.rawMaterialName}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-teal-800">
                          {item.estimatedQty} {item.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{item.costAllocated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTLE PAYMENT MODAL */}
      {showPaymentModal && selectedBookingForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-slate-200 shadow-xl">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              भुगतान राशि दर्ज करें (Receive Payment)
            </h3>
            <p className="text-xs text-slate-600">
              {selectedBookingForPay.customerName} • शेष देय राशि: <strong>₹{selectedBookingForPay.balanceDue.toLocaleString("en-IN")}</strong>
            </p>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">जमा की जाने वाली राशि (₹):</label>
              <input
                type="number"
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-lg text-emerald-700 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSettlePayment}
                className="flex-1 py-2 bg-emerald-600 text-white font-black rounded-xl text-xs shadow-xs"
              >
                भुगतान सुरक्षित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CANCELLATION & REFUND MODAL */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-rose-200 shadow-xl">
            <h3 className="font-black text-rose-900 text-sm flex items-center gap-2">
              <Ban size={18} className="text-rose-600" />
              बैंक्वेट बुकिंग निरस्तीकरण व रिफंड (Cancel Booking)
            </h3>

            {(() => {
              const eventDate = new Date(selectedBookingForCancel.eventDate);
              const today = new Date();
              const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const advance = Number(selectedBookingForCancel.advancePaid) || 0;
              let refundPercent = 0;
              if (diffDays >= 30) refundPercent = 90;
              else if (diffDays >= 15) refundPercent = 50;
              else refundPercent = 0;

              const refundAmount = Math.round((advance * refundPercent) / 100);
              const deductionAmount = advance - refundAmount;

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-950">
                    <p><strong>फंक्शन की तारीख:</strong> {selectedBookingForCancel.eventDate} ({diffDays} दिन शेष)</p>
                    <p><strong>जमा एडवांस टोकन:</strong> ₹{advance.toLocaleString("en-IN")}</p>
                    <div className="pt-1 border-t border-rose-200 flex justify-between font-bold">
                      <span>लागू रिफंड नियम:</span>
                      <span>{refundPercent}% रिफंड (₹{refundAmount})</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>टोकन कटौती (Deduction):</span>
                      <span>₹{deductionAmount} (जब्त)</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">निरस्तीकरण का कारण:</label>
                    <input
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="उदा. ग्राहक की ओर से विवाह तिथि स्थगित की गई"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedBookingForCancel(null)}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                    >
                      वापस जाएं
                    </button>
                    <button
                      onClick={handleConfirmCancellation}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs"
                    >
                      रिफंड काटकर रद्द करें
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. ADD EVENT DIRECT EXPENSE MODAL */}
      {showAddExpenseModal && selectedBookingForExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 border border-slate-200 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-orange-600" />
                इवेंट का सीधा खर्च जोड़ें (Add Dedicated Expense)
              </h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              {[
                { id: "grocery", label: "🛒 ग्रॉसरी / राशन बिल" },
                { id: "gas", label: "🔥 रसोई गैस सिलेंडर" },
                { id: "external_staff", label: "👨‍🍳 बाहरी वेटर/हलवाई लेबर" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setExpenseFormType(tab.id)}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition ${
                    expenseFormType === tab.id ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {expenseFormType === "grocery" && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold block mb-1">सामग्री का नाम:</label>
                  <input
                    type="text"
                    value={groceryExpense.itemName}
                    onChange={(e) => setGroceryExpense({ ...groceryExpense, itemName: e.target.value })}
                    placeholder="उदा. 40kg स्पेशल पनीर / 25kg बासमती"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold block mb-1">मात्रा (Qty):</label>
                    <input
                      type="number"
                      value={groceryExpense.qty}
                      onChange={(e) => setGroceryExpense({ ...groceryExpense, qty: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">इकाई (Unit):</label>
                    <input
                      type="text"
                      value={groceryExpense.unit}
                      onChange={(e) => setGroceryExpense({ ...groceryExpense, unit: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">कुल बिल (₹):</label>
                    <input
                      type="number"
                      value={groceryExpense.cost}
                      onChange={(e) => setGroceryExpense({ ...groceryExpense, cost: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">मंडी वेंडर / दुकान:</label>
                    <input
                      type="text"
                      value={groceryExpense.vendorName}
                      onChange={(e) => setGroceryExpense({ ...groceryExpense, vendorName: e.target.value })}
                      placeholder="उदा. श्री कृष्णा डेयरी मंडी"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">बिल नंबर:</label>
                    <input
                      type="text"
                      value={groceryExpense.billNo}
                      onChange={(e) => setGroceryExpense({ ...groceryExpense, billNo: e.target.value })}
                      placeholder="MANDI-102"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {expenseFormType === "gas" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">सिलेंडर संख्या:</label>
                    <input
                      type="number"
                      value={gasExpense.cylinderCount}
                      onChange={(e) => setGasExpense({ ...gasExpense, cylinderCount: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">प्रति सिलेंडर दर (₹):</label>
                    <input
                      type="number"
                      value={gasExpense.ratePerCylinder}
                      onChange={(e) => setGasExpense({ ...gasExpense, ratePerCylinder: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1">गैस एजेंसी का नाम:</label>
                  <input
                    type="text"
                    value={gasExpense.supplierName}
                    onChange={(e) => setGasExpense({ ...gasExpense, supplierName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 font-bold flex justify-between">
                  <span>कुल गैस लागत:</span>
                  <span className="font-mono">₹{gasExpense.cylinderCount * gasExpense.ratePerCylinder}</span>
                </div>
              </div>
            )}

            {expenseFormType === "external_staff" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">रोल / कार्य:</label>
                    <input
                      type="text"
                      value={staffExpense.role}
                      onChange={(e) => setStaffExpense({ ...staffExpense, role: e.target.value })}
                      placeholder="उदा. कैटरिंग वेटर / हलवाई"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">स्टाफ संख्या (Persons):</label>
                    <input
                      type="number"
                      value={staffExpense.staffCount}
                      onChange={(e) => setStaffExpense({ ...staffExpense, staffCount: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">प्रति व्यक्ति दिहाड़ी (₹):</label>
                    <input
                      type="number"
                      value={staffExpense.wagePerPerson}
                      onChange={(e) => setStaffExpense({ ...staffExpense, wagePerPerson: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">एजेंसी / यूनियन:</label>
                    <input
                      type="text"
                      value={staffExpense.vendorOrAgency}
                      onChange={(e) => setStaffExpense({ ...staffExpense, vendorOrAgency: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 font-bold flex justify-between">
                  <span>कुल लेबर भुगतान:</span>
                  <span className="font-mono">₹{staffExpense.staffCount * staffExpense.wagePerPerson}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                रद्द करें
              </button>
              <button
                onClick={handleAddEventExpense}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-xs"
              >
                खर्च सुरक्षित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. NEW INQUIRY / CRM MODAL */}
      {showNewInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 border border-slate-200 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Phone size={16} className="text-indigo-600" />
                नई बैंक्वेट पूछताछ दर्ज करें (New Banquet Lead Inquiry)
              </h3>
              <button onClick={() => setShowNewInquiryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInquiry} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">ग्राहक का नाम: *</label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.customerName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, customerName: e.target.value })}
                    placeholder="उदा. श्रीमती अनिता गुप्ता"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">मोबाइल नंबर: *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryForm.customerMobile}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, customerMobile: e.target.value })}
                    placeholder="98234XXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">अपेक्षित तिथि: *</label>
                  <input
                    type="date"
                    required
                    value={inquiryForm.expectedDate}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, expectedDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">पसंदीदा शिफ्ट:</label>
                  <select
                    value={inquiryForm.preferredShift}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, preferredShift: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="evening">इवनिंग (Evening 6 PM - 12 AM)</option>
                    <option value="morning">मॉर्निंग (Morning 10 AM - 4 PM)</option>
                    <option value="full_day">फुल डे (Full Day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">संभावित पैक्स (Pax):</label>
                  <input
                    type="number"
                    value={inquiryForm.expectedPax}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, expectedPax: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">अनुमानित बजट (₹):</label>
                  <input
                    type="number"
                    value={inquiryForm.budgetEstimate}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, budgetEstimate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">हॉल किसने दिखाया / अटेंड किया:</label>
                  <input
                    type="text"
                    value={inquiryForm.attendedByStaff}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, attendedByStaff: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">रेफरल स्रोत:</label>
                  <input
                    type="text"
                    value={inquiryForm.referredBy}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, referredBy: e.target.value })}
                    placeholder="उदा. डॉ. शर्मा / इंस्टाग्राम"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">ग्राहक फीडबैक व नोट्स:</label>
                <textarea
                  rows={2}
                  value={inquiryForm.clientFeedback}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, clientFeedback: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInquiryModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xs"
                >
                  पूछताछ दर्ज करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. PRINTABLE PLATE AUDIT ACKNOWLEDGMENT SLIP MODAL */}
      {showPlateSlipModal && selectedBookingForPlateAudit && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowPlateSlipModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-teal-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-teal-300" />
                <h3 className="font-black text-sm">
                  प्लेट गिनती सत्यापन पत्र (Plate Count Verification Slip)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs"
                >
                  प्रिंट
                </button>
                <button
                  onClick={() => setShowPlateSlipModal(false)}
                  className="p-1.5 rounded-xl bg-teal-800 text-teal-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center border-b pb-2">
                <h3 className="font-black text-base uppercase text-slate-900">रॉयल पैलेस बैंक्वेट्स</h3>
                <p className="text-slate-500 text-[11px]">भौतिक प्लेट सत्यापन व स्वीकृति रसीद</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p><strong>इवेंट:</strong> {selectedBookingForPlateAudit.eventName} ({selectedBookingForPlateAudit.bookingNo})</p>
                <p><strong>तारीख व शिफ्ट:</strong> {selectedBookingForPlateAudit.eventDate} ({selectedBookingForPlateAudit.timeSlot})</p>
                <p><strong>वेन्यू:</strong> {selectedBookingForPlateAudit.hallName}</p>
                <p><strong>सत्यापनकर्ता:</strong> {plateAuditForm.verifiedByHostName} ({plateAuditForm.hostRelation})</p>
              </div>

              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span>न्यूनतम गारंटीकृत प्लेट्स:</span>
                  <strong className="font-mono">{selectedBookingForPlateAudit.minGuaranteedPax} प्लेट्स</strong>
                </div>
                <div className="flex justify-between font-bold text-teal-950">
                  <span>वास्तविक गिने गए कुल प्लेट्स:</span>
                  <strong className="font-mono text-base">{plateAuditForm.actualPlatesCounted} प्लेट्स</strong>
                </div>
                <div className="flex justify-between text-rose-700 font-bold border-t border-teal-200 pt-1">
                  <span>अतिरिक्त प्लेट्स:</span>
                  <span className="font-mono">
                    +{Math.max(0, plateAuditForm.actualPlatesCounted - selectedBookingForPlateAudit.minGuaranteedPax)} प्लेट्स (@ ₹{selectedBookingForPlateAudit.finalRatePerPlate})
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-teal-200 pt-1">
                  <span>अतिरिक्त देय राशि:</span>
                  <span className="font-mono">
                    +₹{(Math.max(0, plateAuditForm.actualPlatesCounted - selectedBookingForPlateAudit.minGuaranteedPax) * (selectedBookingForPlateAudit.finalRatePerPlate || 600)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-600 italic">
                स्वीकृति नोट: "{plateAuditForm.hostSignatureNotes}"
              </p>

              <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 pt-1 font-bold">
                    सत्यापनकर्ता हस्ताक्षर (Host Signee)
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{plateAuditForm.verifiedByHostName}</p>
                </div>
                <div>
                  <div className="border-t border-slate-800 pt-1 font-bold">
                    फ्लोर कैप्टन हस्ताक्षर
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">बैंक्वेट ऑपरेशंस टीम</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. WIZARD MODAL */}
      <BanquetBookingWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        onBookingSuccess={() => {
          fetchBanquetData();
          fetchInquiries();
        }}
        halls={halls}
      />
    </div>
  );
}
