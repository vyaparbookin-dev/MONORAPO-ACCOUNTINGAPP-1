import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Video,
  Share2,
  Building2,
  Sparkles,
  MapPin,
  Phone
} from "lucide-react";
import api from "../../services/api";

export default function PublicCustomerReviewPage() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      setLoadingCompany(true);
      try {
        const res = await api.get(`/api/company/public-info/${companyId}`);
        if (res.data?.success && res.data.company) {
          setCompany(res.data.company);
        }
      } catch (err) {
        console.warn("Failed to fetch public company info:", err);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, "").length < 10) {
      alert("कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें ताकि कूपन आपको मिल सके।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/company/public-review/${companyId}`, {
        name: name.trim() || "Valued Customer",
        mobileNumber: mobileNumber.trim(),
        rating,
        reviewText: reviewText.trim()
      });

      setResultData(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error("Public review error:", err);
      alert("फीडबैक सबमिट करने में समस्या आई। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  const effectiveCompanyName = company?.name || "Vyapar Business";
  const effectiveCoupon = resultData?.couponCode || company?.reviewRewardCouponCode || "STAR5";
  const effectiveDiscount = resultData?.couponDiscount || company?.reviewRewardCouponDiscount || 10;
  const effectiveGoogleUrl = resultData?.googleReviewUrl || company?.googleReviewUrl;
  const effectiveInstagram = resultData?.instagramUrl || company?.instagramUrl;
  const effectiveFacebook = resultData?.facebookUrl || company?.facebookUrl;
  const effectiveYoutube = resultData?.youtubeUrl || company?.youtubeUrl;
  const effectiveWhatsapp = resultData?.whatsappBusinessNumber || company?.whatsappBusinessNumber;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-slate-800 p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 mb-2 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">{effectiveCompanyName}</h1>
          {company?.businessDescription && (
            <p className="text-xs text-amber-100 font-medium mt-0.5">{company.businessDescription}</p>
          )}
          {company?.address && (
            <p className="text-[11px] text-white/70 flex items-center justify-center gap-1 mt-1">
              <MapPin size={11} /> {company.address}
            </p>
          )}
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="space-y-5 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {name ? `${name} जी, धन्यवाद!` : "आपका बहुत-बहुत धन्यवाद!"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">आपका फीडबैक सफलतापूर्वक दर्ज हो गया है।</p>
              </div>

              {rating <= 3 ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>⚠️ निजी फीडबैक (Private Feedback)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    आपका सुझाव सीधे ओनर व मैनेजमेंट तक पहुंचा दिया गया है। हम अपनी सेवा को और बेहतर बनाने के लिए आपकी सलाह पर तुरंत काम कर रहे हैं।
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {/* Public Google Review Booster */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-indigo-200 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="text-amber-500" size={16} />
                      <span>Google Maps पर भी अपना अनुभव साझा करें:</span>
                    </p>
                    <a
                      href={effectiveGoogleUrl || `https://www.google.com/search?q=${encodeURIComponent(effectiveCompanyName + " reviews")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition"
                    >
                      <ExternalLink size={14} /> ⭐⭐⭐⭐⭐ Google Review दें
                    </a>
                  </div>

                  {/* 🎁 Unlocked Reward Coupon */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                        <Gift size={22} />
                      </span>
                      <div>
                        <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block">
                          5-Star Reward Coupon
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono tracking-widest">
                          {effectiveCoupon}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold ml-1.5">
                          ({effectiveDiscount}% छूट)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(effectiveCoupon)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      {copiedCoupon ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCoupon ? "कॉपी हुआ" : "कॉपी"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    💡 यह कूपन कोड अगली खरीदारी / विज़िट पर बिलिंग काउंटर पर दिखाएं।
                  </p>

                  {/* 🌐 Social Follow / Subscribe Hub */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Share2 size={14} className="text-indigo-600" />
                      <span>ऑफ़र्स व अपडेट्स के लिए हमें फॉलो करें:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      {effectiveInstagram && (
                        <a
                          href={effectiveInstagram}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-xl border border-pink-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <Smartphone size={15} /> Instagram
                        </a>
                      )}
                      {effectiveFacebook && (
                        <a
                          href={effectiveFacebook}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <Share2 size={15} /> Facebook
                        </a>
                      )}
                      {effectiveYoutube && (
                        <a
                          href={effectiveYoutube}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <Video size={15} /> YouTube
                        </a>
                      )}
                      {effectiveWhatsapp && (
                        <a
                          href={`https://wa.me/${String(effectiveWhatsapp).replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-black text-slate-800 flex items-center justify-center gap-1.5">
                  <Star className="text-amber-500 fill-amber-500" size={16} />
                  <span>अपना अनुभव रेट करें व डिस्काउंट कूपन पाएं!</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  कृपया 1 से 5 स्टार चुनें और अपनी राय साझा करें
                </p>
              </div>

              {/* Star Rating Selector */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-900">
                  {rating === 5 ? "⭐⭐⭐⭐⭐ बेहतरीन (Excellent!)" :
                   rating === 4 ? "⭐⭐⭐⭐ बहुत अच्छा (Very Good)" :
                   rating === 3 ? "⭐⭐⭐ सामान्य (Average)" :
                   rating === 2 ? "⭐⭐ सुधार की आवश्यकता (Needs Improvement)" :
                   "⭐ असंतोषजनक (Poor)"}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  आपका शुभ नाम (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राहुल शर्मा"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Customer Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>मोबाइल नंबर (10 अंक) *</span>
                  <span className="text-[10px] text-indigo-600 font-bold">🎁 कूपन SMS/WhatsApp हेतु</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  फीडबैक या सुझाव (वैकल्पिक)
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा. सर्विस बहुत अच्छी लगी, स्टाफ का व्यवहार अच्छा था..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={15} />
                <span>{submitting ? "सबमिट हो रहा है..." : "फीडबैक सबमिट करें व कूपन पाएं →"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[10px] text-slate-400 font-medium">
          Powered by VyaparBook • Smart Digital Reviews & CRM
        </div>
      </div>
    </div>
  );
}
