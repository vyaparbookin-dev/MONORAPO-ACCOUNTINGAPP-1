import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Cake,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Search,
  MessageCircle,
  User,
  Users,
  RefreshCw,
  ArrowRight,
  Share2,
  FileText,
  DollarSign,
  Plus,
  Send,
  Heart
} from "lucide-react";

export default function CelebrationRemindersManager({ onOpenBookingWizard, venueContext = "Banquet & Restaurant" }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | '15_days' | '30_days' | 'urgent'
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/banquet/celebration-reminders");
      if (res.data?.success) {
        setReminders(res.data.reminders || []);
      }
    } catch (err) {
      console.error("Error fetching celebration reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      const note = editingNotes[bookingId] !== undefined ? editingNotes[bookingId] : "";
      await api.put(`/api/banquet/celebration-reminders/${bookingId}`, {
        followupStatus: newStatus,
        followupNotes: note
      });
      // Update locally
      setReminders(prev =>
        prev.map(r => (r.bookingId === bookingId ? { ...r, followupStatus: newStatus, followupNotes: note } : r))
      );
    } catch (err) {
      console.error("Error updating followup status:", err);
      alert("फॉलो-अप स्थिति अपडेट करने में त्रुटि हुई।");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (bookingId) => {
    setUpdatingId(bookingId);
    try {
      const current = reminders.find(r => r.bookingId === bookingId);
      const note = editingNotes[bookingId] !== undefined ? editingNotes[bookingId] : (current?.followupNotes || "");
      await api.put(`/api/banquet/celebration-reminders/${bookingId}`, {
        followupStatus: current?.followupStatus || "pending",
        followupNotes: note
      });
      setReminders(prev =>
        prev.map(r => (r.bookingId === bookingId ? { ...r, followupNotes: note } : r))
      );
      alert("फॉलो-अप नोट्स सुरक्षित कर लिए गए!");
    } catch (err) {
      console.error("Error saving note:", err);
      alert("नोट सुरक्षित करने में त्रुटि हुई।");
    } finally {
      setUpdatingId(null);
    }
  };

  // Build personalized WhatsApp text for Celebrant (mentioning Booker if different)
  const buildWhatsAppLink = (r) => {
    const celebrantName = r.celebrantName || "प्रिय मित्र";
    const cleanPhone = (r.celebrantMobile || "").replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const eventLabel =
      r.eventType === "birthday"
        ? "जन्मदिन (Birthday)"
        : r.eventType === "anniversary"
        ? "शादी की सालगिरह (Anniversary)"
        : r.eventName || "विशेष उत्सव";

    let msg = `नमस्ते ${celebrantName} जी! 🎉\n${venueContext} की ओर से सादर नमस्कार।\n\n`;

    if (r.isBookerDifferent && r.bookerName) {
      msg += `पिछले साल आपके ${r.bookerRelation || "रिश्तेदार"} श्री ${r.bookerName} जी ने आपका ${eventLabel} हमारे यहाँ आयोजित किया था।\n\n`;
    } else {
      msg += `पिछले साल आपका ${eventLabel} हमारे यहाँ धूमधाम से मनाया गया था।\n\n`;
    }

    msg += `आगामी तारीख (${r.nextCelebrationDate}) को आपका विशेष दिन आ रहा है! 🎂🎈\n\n`;
    msg += `इस वर्ष भी आपके इस यादगार उत्सव के लिए हमारे पास स्पेशल पार्टी पैकेज, स्वादिष्ट मेनू व आकर्षक डिस्काउंट उपलब्ध हैं।\n\n`;
    msg += `क्या हम आपके लिए पार्टी हॉल / टेबल स्लॉट सुरक्षित करें? संपर्क करें या रिप्लाई करें! ✨`;

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  // Filter logic
  const filteredReminders = reminders.filter(r => {
    // Stage filter
    if (activeFilter === "15_days" && r.daysRemaining > 15) return false;
    if (activeFilter === "30_days" && (r.daysRemaining < 16 || r.daysRemaining > 30)) return false;
    if (activeFilter === "urgent" && r.daysRemaining > 7) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCelebrant = (r.celebrantName || "").toLowerCase().includes(q);
      const matchCelebrantPhone = (r.celebrantMobile || "").includes(q);
      const matchBooker = (r.bookerName || "").toLowerCase().includes(q);
      const matchBookerPhone = (r.bookerMobile || "").includes(q);
      const matchEvent = (r.eventName || "").toLowerCase().includes(q);
      if (!matchCelebrant && !matchCelebrantPhone && !matchBooker && !matchBookerPhone && !matchEvent) {
        return false;
      }
    }
    return true;
  });

  // KPI Counts
  const totalCount = reminders.length;
  const urgentCount = reminders.filter(r => r.daysRemaining <= 7).length;
  const count15Days = reminders.filter(r => r.daysRemaining <= 15).length;
  const count30Days = reminders.filter(r => r.daysRemaining >= 16 && r.daysRemaining <= 30).length;
  const rebookedCount = reminders.filter(r => r.followupStatus === "confirmed_rebooking").length;

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-pink-500/20 text-pink-300 rounded-2xl border border-pink-500/30">
                <Cake size={22} />
              </span>
              <h2 className="text-lg md:text-xl font-black tracking-tight">
                🎂 उत्सव व जन्मदिन फॉलो-अप इंजन (30 & 15 Days Celebration CRM)
              </h2>
            </div>
            <p className="text-xs text-purple-200/90 max-w-2xl">
              रिश्तेदार/मित्र द्वारा पूर्व में बुक किए गए उत्सवों का स्वचालित रिमाइंडर। उत्सवकर्ता को उनके जन्मदिन / सालगिरह के <strong>30 दिन</strong> व <strong>15 दिन पहले</strong> 1-क्लिक कॉल व WhatsApp संदेश भेजकर समय रहते री-बुकिंग पक्की करें।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReminders}
              disabled={loading}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-white/20"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>रिफ्रेश</span>
            </button>
            {onOpenBookingWizard && (
              <button
                onClick={() => onOpenBookingWizard()}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 transition"
              >
                <Plus size={15} />
                <span>+ नई सेलिब्रेशन बुकिंग</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
        <div
          onClick={() => setActiveFilter("all")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            activeFilter === "all"
              ? "bg-purple-50 border-purple-400 shadow-sm ring-2 ring-purple-400/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase block">कुल आगामी उत्सव</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-purple-900">{totalCount}</span>
            <Cake size={20} className="text-purple-500" />
          </div>
          <span className="text-[10px] text-purple-600 font-bold block mt-0.5">अगले 45 दिनों में</span>
        </div>

        <div
          onClick={() => setActiveFilter("15_days")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            activeFilter === "15_days"
              ? "bg-rose-50 border-rose-400 shadow-sm ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold text-rose-600 uppercase block">🚨 15-दिन पूर्व अलर्ट</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-rose-600">{count15Days}</span>
            <Clock size={20} className="text-rose-500" />
          </div>
          <span className="text-[10px] text-rose-700 font-bold block mt-0.5">तुरंत संपर्क करें (Urgent)</span>
        </div>

        <div
          onClick={() => setActiveFilter("30_days")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            activeFilter === "30_days"
              ? "bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold text-amber-700 uppercase block">📅 30-दिन पूर्व अलर्ट</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-amber-700">{count30Days}</span>
            <Calendar size={20} className="text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-800 font-bold block mt-0.5">अर्ली पूछताछ व डिस्काउंट</span>
        </div>

        <div
          onClick={() => setActiveFilter("all")}
          className="p-3.5 bg-white rounded-2xl border border-slate-200"
        >
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">✅ री-बुकिंग कन्फर्म</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-emerald-700">{rebookedCount}</span>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">सफल पुनः बुकिंग</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `सभी (${totalCount})` },
            { id: "urgent", label: `🔥 आज/इस सप्ताह (${urgentCount})` },
            { id: "15_days", label: `🚨 15 दिन पूर्व (${count15Days})` },
            { id: "30_days", label: `📅 30 दिन पूर्व (${count30Days})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
                activeFilter === tab.id
                  ? "bg-purple-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="उत्सवकर्ता, रिश्तेदार या फोन नंबर खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 font-medium text-xs"
          />
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 space-y-2">
          <RefreshCw size={28} className="animate-spin mx-auto text-purple-600" />
          <p className="font-bold text-xs">आगामी उत्सवों और फॉलो-अप की गणना हो रही है...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 space-y-2">
          <Cake size={36} className="mx-auto text-purple-300" />
          <p className="font-bold text-sm text-slate-800">इस फ़िल्टर में कोई आगामी उत्सव फॉलो-अप नहीं मिला।</p>
          <p className="text-xs text-slate-500">
            जब आप बैंक्वेट, गेमज़ोन या रेस्टोरेंट में जन्मदिन / सालगिरह की बुकिंग दर्ज करते हैं, तो सिस्टम उनके 30 और 15 दिन पूर्व स्वतः यहाँ अलर्ट तैयार कर देता है।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReminders.map((r) => {
            const isUrgent = r.daysRemaining <= 7;
            const is15Days = r.daysRemaining > 7 && r.daysRemaining <= 15;
            const is30Days = r.daysRemaining > 15 && r.daysRemaining <= 30;

            const cardBorder = isUrgent
              ? "border-rose-400 bg-gradient-to-br from-rose-50/40 via-white to-white"
              : is15Days
              ? "border-orange-300 bg-gradient-to-br from-orange-50/30 via-white to-white"
              : is30Days
              ? "border-purple-200 bg-white"
              : "border-slate-200 bg-white";

            const badgeBg = isUrgent
              ? "bg-rose-600 text-white animate-pulse"
              : is15Days
              ? "bg-orange-500 text-white"
              : is30Days
              ? "bg-purple-700 text-white"
              : "bg-slate-700 text-white";

            return (
              <div
                key={r.bookingId}
                className={`p-5 rounded-3xl border shadow-sm space-y-4 transition hover:shadow-md ${cardBorder}`}
              >
                {/* Header Row: Event Type, Next Date & Countdown Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                        {r.eventType === "birthday"
                          ? "🎂 जन्मदिन (Birthday)"
                          : r.eventType === "anniversary"
                          ? "💍 सालगिरह (Anniversary)"
                          : r.eventType === "kitty_party"
                          ? "🎉 किटी पार्टी"
                          : "✨ विशेष उत्सव"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        #{r.bookingNo}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                      <span>{r.eventName}</span>
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black shadow-2xs whitespace-nowrap ${badgeBg}`}>
                    {r.daysRemaining === 0 ? "🎂 आज है उत्सव!" : `⏳ ${r.daysRemaining} दिन शेष`}
                  </span>
                </div>

                {/* Date and Past Booking Info */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">वार्षिक उत्सव तारीख:</span>
                    <strong className="text-purple-950 font-bold flex items-center gap-1">
                      <Calendar size={12} className="text-purple-600" />
                      {r.nextCelebrationDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">पिछली बुकिंग खर्च व हॉल:</span>
                    <strong className="text-slate-800 font-bold">
                      ₹{r.totalAmount?.toLocaleString("en-IN")} • {r.hallName || "मुख्य वेन्यू"}
                    </strong>
                  </div>
                </div>

                {/* Two Column Box: Celebrant (Direct Contact) vs Booker (Relative) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Celebrant Box - DIRECT FOLLOW UP */}
                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-900 flex items-center gap-1">
                        <Sparkles size={13} className="text-purple-600" />
                        🎯 जिनका उत्सव है (Celebrant):
                      </span>
                      <span className="text-[9px] bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded font-black">
                        फॉलो-अप लक्ष्य
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{r.celebrantName}</h4>
                      <p className="font-mono text-purple-800 font-bold text-xs">{r.celebrantMobile}</p>
                    </div>

                    {/* Direct 1-Click Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <a
                        href={`tel:${r.celebrantMobile}`}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 transition shadow-2xs"
                      >
                        <Phone size={12} />
                        <span>कॉल करें</span>
                      </a>
                      <a
                        href={buildWhatsAppLink(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 transition shadow-2xs"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Booker / Relative Box */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <User size={13} />
                        👤 बुक करने वाले (Booker):
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {r.isBookerDifferent ? r.bookerRelation : "स्वयं"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {r.bookerName || r.celebrantName}
                        {r.isBookerDifferent && (
                          <span className="text-[11px] text-slate-500 font-normal ml-1">
                            ({r.bookerRelation})
                          </span>
                        )}
                      </h4>
                      <p className="font-mono text-slate-600 text-xs">{r.bookerMobile || r.celebrantMobile}</p>
                    </div>

                    {r.isBookerDifferent && (
                      <div className="pt-1">
                        <a
                          href={`tel:${r.bookerMobile}`}
                          className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-center flex items-center justify-center gap-1 transition text-xs"
                        >
                          <Phone size={12} />
                          <span>रिश्तेदार को कॉल</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Status Dropdown & Notes */}
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">फॉलो-अप स्थिति:</span>
                      <select
                        value={r.followupStatus || "pending"}
                        onChange={(e) => handleStatusChange(r.bookingId, e.target.value)}
                        disabled={updatingId === r.bookingId}
                        className={`p-1.5 rounded-xl font-bold text-xs outline-none border transition ${
                          r.followupStatus === "confirmed_rebooking"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : r.followupStatus === "called_interested"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : r.followupStatus === "declined"
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-white text-slate-800 border-slate-300"
                        }`}
                      >
                        <option value="pending">⏳ कॉल पेंडिंग (Call Pending)</option>
                        <option value="called_interested">📞 बातचीत हुई - विचार कर रहे हैं (Interested)</option>
                        <option value="confirmed_rebooking">✅ पुनः बुकिंग पक्की (Re-booked)</option>
                        <option value="declined">❌ इस बार प्लान नहीं है (Declined)</option>
                      </select>
                    </div>

                    {onOpenBookingWizard && (
                      <button
                        onClick={() =>
                          onOpenBookingWizard({
                            customerName: r.bookerName || r.celebrantName,
                            customerMobile: r.bookerMobile || r.celebrantMobile,
                            celebrantName: r.celebrantName,
                            celebrantMobile: r.celebrantMobile,
                            eventType: r.eventType,
                            eventName: `${r.celebrantName} का ${r.eventType === "birthday" ? "जन्मदिन" : "उत्सव"} रि-बुकिंग`,
                            isBookerDifferentFromCelebrant: r.isBookerDifferent,
                            bookerName: r.bookerName,
                            bookerMobile: r.bookerMobile,
                            bookerRelation: r.bookerRelation,
                            eventDate: r.nextCelebrationDate
                          })
                        }
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black flex items-center justify-center gap-1 transition shadow-2xs text-[11px]"
                      >
                        <span>⚡ नई बुकिंग बनाएँ</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Notes input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="बातचीत का विवरण या टिप्पणी (उदा. 50 लोगों का बजट मांगा है)..."
                      value={editingNotes[r.bookingId] !== undefined ? editingNotes[r.bookingId] : (r.followupNotes || "")}
                      onChange={(e) => setEditingNotes({ ...editingNotes, [r.bookingId]: e.target.value })}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-purple-400"
                    />
                    <button
                      onClick={() => handleSaveNotes(r.bookingId)}
                      disabled={updatingId === r.bookingId}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition shrink-0"
                    >
                      सुरक्षित करें
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
