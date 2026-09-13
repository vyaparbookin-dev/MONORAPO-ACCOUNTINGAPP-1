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
  FileText
} from "lucide-react";
import BanquetBookingWizardModal from "./BanquetBookingWizardModal";

export default function BanquetHubPage() {
  const [halls, setHalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHallFilter, setSelectedHallFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedBookingForBeo, setSelectedBookingForBeo] = useState(null);
  const [selectedBookingForIndent, setSelectedBookingForIndent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPay, setSelectedBookingForPay] = useState(null);
  const [payAmountInput, setPayAmountInput] = useState("");

  useEffect(() => {
    fetchBanquetData();
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

  // Generate Kitchen Indent API Call
  const handleLoadKitchenIndent = async (booking) => {
    try {
      const res = await api.post(`/api/banquet/bookings/${booking._id}/kitchen-indent`);
      setSelectedBookingForIndent({
        ...booking,
        kitchenIndent: res.data?.indent || booking.kitchenIndent
      });
    } catch (err) {
      console.error("Error generating indent:", err);
      setSelectedBookingForIndent(booking);
    }
  };

  // Print BEO Function
  const handlePrintBEO = () => {
    window.print();
  };

  // WhatsApp Share BEO
  const shareWhatsAppBEO = (b) => {
    let msg = `*🏰 BANQUET EVENT ORDER (BEO) - BOOKING CONFIRMATION*\n`;
    msg += `*Booking No:* ${b.bookingNo}\n`;
    msg += `*Host:* ${b.customerName} (${b.customerMobile})\n`;
    msg += `*Event:* ${b.eventName}\n`;
    msg += `*Venue:* ${b.hallName}\n`;
    msg += `*Date & Slot:* ${b.eventDate} (${b.timeSlot.toUpperCase()})\n`;
    msg += `*Guaranteed Pax:* ${b.minGuaranteedPax} Plates\n`;
    msg += `*Plate Rate:* ₹${b.finalRatePerPlate}/plate (${b.packageName})\n`;
    msg += `----------------------------------\n`;
    msg += `*Total Budget:* ₹${(b.totalEstimatedAmount || 0).toLocaleString("en-IN")}\n`;
    msg += `*Advance Paid:* ₹${(b.advancePaid || 0).toLocaleString("en-IN")}\n`;
    msg += `*Balance Due:* ₹${(b.balanceDue || 0).toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*Special Notes:* ${b.notes || "Grand Royal Setup"}\n`;
    msg += `*Banquet Manager Contact:* Available at Reception\n`;

    const encoded = encodeURIComponent(msg);
    const phoneClean = (b.customerMobile || "").replace(/\D/g, "");
    window.open(`https://wa.me/91${phoneClean}?text=${encoded}`, "_blank");
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-3xl font-black shadow-inner">
            🏰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                बैंक्वेट हॉल व कन्वेंशन मैनेजमेंट हब
              </h1>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Enterprise Module
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              मल्टी-हॉल स्लॉट लॉकिंग • ऑन-डिमांड डिश स्वैपिंग • सिटिंग व क्रॉकरी चेकलिस्ट • लीगल BEO कॉन्ट्रैक्ट स्लिप
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchBanquetData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
            title="रीफ्रेश करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setShowWizardModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition transform hover:scale-105"
          >
            <Plus size={16} />
            <span>+ नई बैंक्वेट बुकिंग दर्ज करें (Lock Slot)</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 font-bold block flex items-center gap-1.5">
            <Building size={14} className="text-indigo-600" /> कुल वेन्यू हॉल्स / लॉन
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalHallsCount}</p>
          <p className="text-[10px] text-indigo-700 font-medium">बॉल रूम, पार्टी हॉल, लॉन</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 font-bold block flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" /> एक्टिव / आगामी बुकिंग्स
          </span>
          <p className="text-2xl font-black text-blue-900 font-mono">{upcomingBookingsCount}</p>
          <p className="text-[10px] text-blue-700 font-medium">कन्फर्म्ड स्लॉट लॉक्ड</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 font-bold block flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600" /> कुल बैंक्वेट बिजनेस
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            ₹{totalBanquetRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">अनुमानित कुल रेवेन्यू</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 font-bold block flex items-center gap-1.5">
            <DollarSign size={14} className="text-amber-600" /> एडवांस टोकन जमा
          </span>
          <p className="text-2xl font-black text-amber-900 font-mono">
            ₹{totalAdvanceCollected.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-amber-700 font-medium">गल्ले / बैंक में प्राप्त</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-slate-500 font-bold block flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-rose-600" /> पेंडिंग बैलेंस वसूली
          </span>
          <p className="text-2xl font-black text-rose-700 font-mono">
            ₹{totalBalanceDue.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-rose-600 font-medium">फंक्शन की रात देय</p>
        </div>
      </div>

      {/* Multi-Hall Venue Status & Slot Locking Showcase */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2 border-b pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="text-indigo-600" size={18} />
              मल्टी-वेन्यू स्टेटस व स्लॉट लॉकिंग मैट्रिक्स (Venues & Slot Lock Overview):
            </h2>
            <p className="text-xs text-slate-500">
              प्रत्येक हॉल की क्षमता, सिटिंग स्टाइल, फ्री प्लेट नियम व उपलब्ध स्लॉट्स
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🟢 उपलब्ध (Available)
            </span>
            <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              🔴 स्लॉट लॉक्ड (Booked)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {halls.map((h) => {
            const hallBookings = bookings.filter((b) => b.hallId === h._id && (b.status === "confirmed" || b.status === "ongoing"));
            return (
              <div
                key={h._id}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 hover:border-indigo-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{h.name}</h3>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">{h.code}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-900">
                    {h.venueType.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 text-[11px]">
                  <p>👥 क्षमता: <strong>{h.capacitySeated} सिटिंग</strong> / {h.capacityFloating} फ्लोटिंग</p>
                  <p>🍽️ फ्री हॉल नियम: <strong>{h.freeHallMinPax}+ प्लेट्स</strong> पर हॉल किराया ₹0 (फ्री)</p>
                  <p>🏢 कम प्लेट्स पर रेंट: <strong>₹{h.lowPaxHallRent}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700">
                    आगामी बुकिंग्स: <strong className="text-indigo-900">{hallBookings.length} इवेंट्स</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedHallFilter(h._id);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>इवेंट्स देखें</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings Ledger & Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              बैंक्वेट बुकिंग्स व इवेंट शेड्यूलर लेजर (Banquet Event Ledger):
            </h2>
            <p className="text-xs text-slate-500">
              सभी आगामी व संपन्न पार्टियों का विवरण • BEO स्लिप • किचन राशन मांग-पत्र • पेमेंट सेटलमेंट
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedHallFilter}
              onChange={(e) => setSelectedHallFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 outline-none"
            >
              <option value="all">🏢 सभी वेन्यू (All Halls)</option>
              {halls.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 outline-none"
            >
              <option value="all">📋 सभी स्टेटस (All Status)</option>
              <option value="confirmed">🔴 कन्फर्म्ड (Locked)</option>
              <option value="ongoing">🟣 जारी है (Ongoing)</option>
              <option value="completed">✓ संपन्न (Completed)</option>
            </select>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-3">बुकिंग नं. व इवेंट</th>
                <th className="p-3">आयोजक (Host)</th>
                <th className="p-3">वेन्यू व स्लॉट</th>
                <th className="p-3">तारीख व समय</th>
                <th className="p-3 text-center">प्लेट्स व रेट</th>
                <th className="p-3 text-right">कुल बजट / एडवांस</th>
                <th className="p-3 text-center">रसोई मोड</th>
                <th className="p-3 text-center">एक्शन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-indigo-50/30 transition">
                    <td className="p-3">
                      <span className="font-mono font-black text-indigo-700 block text-xs">{b.bookingNo}</span>
                      <span className="font-bold text-slate-900 block mt-0.5">{b.eventName}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{b.customerMobile}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">{b.hallName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-0.5 bg-indigo-100 text-indigo-900">
                        {b.timeSlot === "morning" ? "🌅 लंच शिफ्ट" : b.timeSlot === "evening" ? "🌆 डिनर शिफ्ट" : "🌟 फुल डे"}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold font-mono text-slate-900 block">{b.eventDate}</span>
                      <span className="text-[10px] text-slate-500">सर्विंग: {b.foodServingTime}</span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-slate-900 block">{b.minGuaranteedPax} प्लेट्स</span>
                      <span className="text-[10px] text-emerald-700 font-bold font-mono">₹{b.finalRatePerPlate}/plate</span>
                    </td>

                    <td className="p-3 text-right">
                      <span className="font-mono font-black text-slate-900 block">
                        ₹{(b.totalEstimatedAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block font-mono">
                        जमा: ₹{(b.advancePaid || 0).toLocaleString("en-IN")}
                      </span>
                      {b.balanceDue > 0 ? (
                        <span className="text-[10px] text-rose-600 font-bold block font-mono">
                          शेष: ₹{b.balanceDue.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold block">100% चुकता ✓</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {b.kitchenSyncMode === "shared_restaurant" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300">
                          🔄 साझा रसोई
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                          📦 स्वतंत्र स्टोर
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* BEO Contract Button */}
                        <button
                          onClick={() => setSelectedBookingForBeo(b)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-xs flex items-center gap-1 transition"
                          title="BEO कॉन्ट्रैक्ट स्लिप"
                        >
                          <FileText size={11} />
                          <span>BEO स्लिप</span>
                        </button>

                        {/* Kitchen Indent Button */}
                        <button
                          onClick={() => handleLoadKitchenIndent(b)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[10px] shadow-xs flex items-center gap-1 transition"
                          title="किचन सामग्री मांग-पत्र"
                        >
                          <ChefHat size={11} />
                          <span>किचन इंडेंट</span>
                        </button>

                        {/* Settle Payment Button */}
                        {b.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBookingForPay(b);
                              setPayAmountInput(b.balanceDue.toString());
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-xs flex items-center gap-1 transition"
                            title="पेमेंट दर्ज करें"
                          >
                            <DollarSign size={11} />
                            <span>जमा करें</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    कोई बैंक्वेट बुकिंग नहीं मिली। ऊपर "+ नई बैंक्वेट बुकिंग दर्ज करें" बटन से पहली बुकिंग स्लॉट लॉक करें।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. BOOKING WIZARD MODAL */}
      {showWizardModal && (
        <BanquetBookingWizardModal
          isOpen={showWizardModal}
          onClose={() => setShowWizardModal(false)}
          halls={halls}
          onBookingSuccess={() => {
            fetchBanquetData();
          }}
        />
      )}

      {/* 2. PRINTABLE BEO (BANQUET EVENT ORDER) MODAL */}
      {selectedBookingForBeo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedBookingForBeo(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Actions Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <span className="font-black text-sm uppercase tracking-wide">
                  Banquet Event Order (BEO) Contract Slip — {selectedBookingForBeo.bookingNo}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBEO}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition"
                >
                  <Printer size={14} />
                  <span>A4 / थर्मल प्रिंट</span>
                </button>
                <button
                  onClick={() => shareWhatsAppBEO(selectedBookingForBeo)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition"
                >
                  <Share2 size={14} />
                  <span>व्हाट्सएप BEO</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForBeo(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-5 text-xs text-slate-900 font-sans print:p-0 print:m-0">
              {/* Banquet Brand Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  🏰 ROYAL PALACE BANQUET & CONVENTION CENTER
                </h2>
                <p className="text-[11px] text-slate-600">
                  सिविल लाइन्स, जबलपुर • फोन: +91 98260XXXXX • GSTIN: 23AAAAA0000A1Z5
                </p>
                <span className="inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-black uppercase tracking-widest mt-1">
                  OFFICIAL BANQUET EVENT ORDER (BEO) & BOOKING CONTRACT
                </span>
              </div>

              {/* Event & Host Grid */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-300 rounded-xl">
                <div className="space-y-1">
                  <p><strong>बुकिंग नंबर:</strong> <span className="font-mono">{selectedBookingForBeo.bookingNo}</span></p>
                  <p><strong>इवेंट / पार्टी:</strong> {selectedBookingForBeo.eventName}</p>
                  <p><strong>वेन्यू हॉल:</strong> {selectedBookingForBeo.hallName}</p>
                  <p><strong>तारीख व शिफ्ट:</strong> {selectedBookingForBeo.eventDate} ({selectedBookingForBeo.timeSlot.toUpperCase()})</p>
                </div>
                <div className="space-y-1">
                  <p><strong>आयोजक / ग्राहक:</strong> {selectedBookingForBeo.customerName}</p>
                  <p><strong>मोबाइल:</strong> <span className="font-mono">{selectedBookingForBeo.customerMobile}</span> {selectedBookingForBeo.alternateMobile && `(${selectedBookingForBeo.alternateMobile})`}</p>
                  <p><strong>शहर व पता:</strong> {selectedBookingForBeo.city}, {selectedBookingForBeo.customerAddress}</p>
                  <p><strong>सर्विंग टाइमिंग:</strong> {selectedBookingForBeo.foodServingTime}</p>
                </div>
              </div>

              {/* Menu Breakdown for Kitchen & Host */}
              <div className="space-y-2 border border-slate-300 rounded-xl p-3.5">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <h4 className="font-black text-slate-900 uppercase text-xs">
                    कैटरिंग मेनू व्यंजन ({selectedBookingForBeo.packageName} @ ₹{selectedBookingForBeo.finalRatePerPlate}/प्लेट):
                  </h4>
                  <span className="font-mono font-bold">
                    गारंटीकृत प्लेट्स: {selectedBookingForBeo.minGuaranteedPax} Pax
                  </span>
                </div>

                {/* Swapped Dishes Highlight */}
                {selectedBookingForBeo.swappedDishes?.length > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <span className="font-bold text-amber-900 text-[11px] block">
                      🔄 बदले गए व्यंजन (Customized Swapped Dishes):
                    </span>
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
                  <h5 className="font-bold uppercase text-slate-900 border-b pb-1">💐 डेकोरेशन व सुविधाएं:</h5>
                  <p>• स्टेज थीम: <strong>{selectedBookingForBeo.seatingConfig?.stageTheme}</strong></p>
                  <p>• अतिरिक्त ऐडऑन्स:</p>
                  {(selectedBookingForBeo.addons || []).filter(a => a.isIncluded).map((a, i) => (
                    <p key={i} className="text-slate-700">• {a.name} (+₹{a.price})</p>
                  ))}
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
                          ₹{item.costAllocated.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedBookingForIndent(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTLE PAYMENT MODAL */}
      {showPaymentModal && selectedBookingForPay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-900 text-sm">बैंक्वेट पेमेंट जमा करें</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={16} /></button>
            </div>

            <div className="space-y-1">
              <p><strong>बुकिंग:</strong> {selectedBookingForPay.bookingNo} ({selectedBookingForPay.customerName})</p>
              <p><strong>कुल बजट:</strong> ₹{selectedBookingForPay.totalEstimatedAmount}</p>
              <p><strong>अब तक जमा:</strong> ₹{selectedBookingForPay.advancePaid}</p>
              <p className="text-rose-600 font-bold"><strong>शेष देय:</strong> ₹{selectedBookingForPay.balanceDue}</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">अतिरिक्त जमा राशि दर्ज करें (₹):</label>
              <input
                type="number"
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(e.target.value)}
                className="w-full p-2.5 border border-emerald-300 rounded-xl font-mono font-black text-base text-emerald-800 outline-none"
              />
            </div>

            <button
              onClick={handleSettlePayment}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition"
            >
              ✓ भुगतान सुरक्षित करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
