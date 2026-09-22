import React, { useState } from "react";
import {
  X,
  Star,
  UserCheck,
  Building,
  CheckCircle2,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Award,
  HeartHandshake,
  Gift,
  Copy,
  Check,
  Smartphone,
  Video
} from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";

export default function CustomerFeedbackReviewModal({
  isOpen,
  onClose,
  customerName = "Valued Customer",
  customerPhone = "",
  eventName = "",
  bookedByStaff = "Staff Member",
  organizedByManager = "Floor Manager",
  companyName = "Our Business",
  googleReviewUrl = "",
  instagramUrl = "",
  facebookUrl = "",
  youtubeUrl = "",
  whatsappBusinessNumber = "",
  reviewRewardCouponCode = "",
  reviewRewardCouponDiscount = 0,
  onSaveFeedback
}) {
  const { selectedCompany } = useCompany() || {};
  
  // Fallbacks to Company Settings
  const effectiveCompanyName = companyName || selectedCompany?.name || "Our Business";
  const effectiveGoogleReviewUrl = googleReviewUrl || selectedCompany?.googleReviewUrl || "";
  const effectiveInstagramUrl = instagramUrl || selectedCompany?.instagramUrl || "";
  const effectiveFacebookUrl = facebookUrl || selectedCompany?.facebookUrl || "";
  const effectiveYoutubeUrl = youtubeUrl || selectedCompany?.youtubeUrl || "";
  const effectiveWhatsappNumber = whatsappBusinessNumber || selectedCompany?.whatsappBusinessNumber || selectedCompany?.phone || "";
  const effectiveCouponCode = reviewRewardCouponCode || selectedCompany?.reviewRewardCouponCode || "STAR5";
  const effectiveCouponDiscount = reviewRewardCouponDiscount || selectedCompany?.reviewRewardCouponDiscount || 10;

  // 1. Private Staff Ratings (Internal Only)
  const [bookingRating, setBookingRating] = useState(5);
  const [organizerRating, setOrganizerRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [internalNotes, setInternalNotes] = useState("");

  // 2. Public Firm Rating (Google Review Funnel)
  const [firmRating, setFirmRating] = useState(5);
  const [publicReviewText, setPublicReviewText] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const feedbackPayload = {
      customerName,
      customerPhone,
      eventName,
      bookedByStaff,
      organizedByManager,
      staffRatings: {
        bookingRating,
        organizerRating,
        serviceRating,
        internalNotes
      },
      firmRating,
      publicReviewText,
      rewardCouponCode: firmRating >= 4 ? effectiveCouponCode : null,
      timestamp: new Date().toISOString()
    };

    if (onSaveFeedback) {
      onSaveFeedback(feedbackPayload);
    }
    setSavedSuccess(true);
  };

  const handleOpenGoogleReview = () => {
    const url = effectiveGoogleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(effectiveCompanyName + " reviews")}`;
    window.open(url, "_blank");
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(effectiveCouponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleSendWhatsAppFeedbackLink = () => {
    let text = "";
    if (firmRating >= 4) {
      text = `नमस्ते ${customerName}! ${effectiveCompanyName} को 5⭐ रेटिंग देने के लिए आपका बहुत-बहुत धन्यवाद! 🙏\n\n🎁 आपके लिए स्पेशल रिव्यू कूपन कोड: *${effectiveCouponCode}* (${effectiveCouponDiscount}% की छूट)। इसे आप अपने अगले बिल पर इस्तेमाल कर सकते हैं!\n\n⭐ कृपया हमारे Google Maps पर भी अपना अनुभव साझा करें:\n${effectiveGoogleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(effectiveCompanyName + " reviews")}`}\n`;
      if (effectiveInstagramUrl) text += `\n📸 Instagram पर फॉलो करें: ${effectiveInstagramUrl}`;
      if (effectiveFacebookUrl) text += `\n📘 Facebook पर लाइक करें: ${effectiveFacebookUrl}`;
      if (effectiveYoutubeUrl) text += `\n▶️ YouTube पर सब्सक्राइब करें: ${effectiveYoutubeUrl}`;
    } else {
      text = `नमस्ते ${customerName}! ${effectiveCompanyName} को अपना महत्वपूर्ण फीडबैक देने के लिए धन्यवाद। हम अपनी सेवा को और बेहतर बनाने के लिए आपकी सलाह पर तुरंत काम कर रहे हैं।`;
    }

    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "");
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">कस्टमर फीडबैक व गूगल रिव्यू सिस्टम</h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Smart Review & Reward</span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                3⭐ पर निजी सुधार + 4-5⭐ पर पब्लिक गूगल रिव्यू, सोशल फॉलो व कूपन रिवॉर्ड
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {savedSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-800">फीडबैक सफलतापूर्वक दर्ज हो गया!</h3>

              {firmRating <= 3 ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>⚠️ 3-स्टार या उससे कम रेटिंग (100% प्राइवेट फीडबैक)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    यह फीडबैक केवल दुकान/फर्म के आंतरिक सुधार के लिए सुरक्षित किया गया है। इसे <b>गूगल पर सार्वजनिक पोस्ट नहीं किया जाएगा</b>, जिससे आपकी पब्लिक रेटिंग सुरक्षित रहे।
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-lg mx-auto text-left">
                  {/* Public Google Review Box */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-indigo-200 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="text-amber-500" size={16} />
                      <span>🎉 ग्राहक ने {firmRating}⭐ रेटिंग दी है! इसे Google Maps पर पोस्ट करवाएं:</span>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleOpenGoogleReview}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow flex items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                      >
                        <ExternalLink size={13} /> ⭐⭐⭐⭐⭐ गूगल रिव्यू पेज खोलें
                      </button>
                      <button
                        onClick={handleSendWhatsAppFeedbackLink}
                        className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl shadow flex items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                      >
                        <MessageCircle size={13} /> व्हाट्सएप पर कूपन व लिंक भेजें
                      </button>
                    </div>
                  </div>

                  {/* 🎁 Review Reward Coupon */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                        <Gift size={20} />
                      </span>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">5-Star Review Reward Coupon</span>
                        <span className="text-sm font-black text-slate-900 font-mono tracking-widest">{effectiveCouponCode}</span>
                        <span className="text-xs text-emerald-700 font-bold ml-2">({effectiveCouponDiscount}% छूट)</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCoupon}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      {copiedCoupon ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCoupon ? 'कॉपी हो गया' : 'कॉपी करें'}</span>
                    </button>
                  </div>

                  {/* 🌐 Social Follow & Subscribe Buttons */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Share2 size={14} className="text-indigo-600" />
                      <span>हमारे सोशल मीडिया पर फॉलो/सब्सक्राइब करें:</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      {effectiveInstagramUrl && (
                        <a
                          href={effectiveInstagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-xl border border-pink-200 flex flex-col items-center gap-1 transition"
                        >
                          <Smartphone size={16} /> Instagram
                        </a>
                      )}
                      {effectiveFacebookUrl && (
                        <a
                          href={effectiveFacebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 flex flex-col items-center gap-1 transition"
                        >
                          <Share2 size={16} /> Facebook
                        </a>
                      )}
                      {effectiveYoutubeUrl && (
                        <a
                          href={effectiveYoutubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 flex flex-col items-center gap-1 transition"
                        >
                          <Video size={16} /> YouTube
                        </a>
                      )}
                      {effectiveWhatsappNumber && (
                        <a
                          href={`https://wa.me/${String(effectiveWhatsappNumber).replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 flex flex-col items-center gap-1 transition"
                        >
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition">
                  विंडो बंद करें
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Event & Staff Context Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">ग्राहक / होस्ट</span>
                  <span className="font-bold text-slate-800">{customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">इवेंट / आर्डर बुक किया</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <UserCheck size={13} /> {bookedByStaff}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">इवेंट फ्लोर मैनेजर</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    <Award size={13} /> {organizedByManager}
                  </span>
                </div>
              </div>

              {/* TIER 1: PRIVATE STAFF PERFORMANCE RATINGS */}
              <div className="space-y-4 border-b border-slate-200 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    <span>1. स्टाफ परफॉर्मेंस रेटिंग (100% प्राइवेट - सिर्फ ओनर के लिए)</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    Internal HR Rating
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rating 1: Booking Staff */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>डील क्लोजिंग व व्यवहार ({bookedByStaff}):</span>
                      <span className="text-amber-500 font-black">{bookingRating} / 5 ⭐</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setBookingRating(star)}
                          className="p-1.5 hover:scale-125 transition cursor-pointer"
                        >
                          <Star
                            size={20}
                            className={star <= bookingRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating 2: Event Floor Manager */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>इवेंट मैनेजमेंट व टाइमिंग ({organizedByManager}):</span>
                      <span className="text-amber-500 font-black">{organizerRating} / 5 ⭐</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setOrganizerRating(star)}
                          className="p-1.5 hover:scale-125 transition cursor-pointer"
                        >
                          <Star
                            size={20}
                            className={star <= organizerRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating 3: Food & Service */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>भोजन का स्वाद, स्वच्छता व सर्विस स्टाफ शिष्टाचार:</span>
                    <span className="text-amber-500 font-black">{serviceRating} / 5 ⭐</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setServiceRating(star)}
                        className="p-1.5 hover:scale-125 transition cursor-pointer"
                      >
                        <Star
                          size={20}
                          className={star <= serviceRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="स्टाफ के बारे में इंटरनल ओनर नोट्स (e.g. Sunil did great job, Bonus recommended)"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* TIER 2: PUBLIC GOOGLE REVIEW SMART BOOSTER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={16} className="text-amber-600" />
                    <span>2. फर्म / बैंक्वेट हॉल की स्टार रेटिंग ({companyName})</span>
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                    Public Google Review
                  </span>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-2 border-amber-300 rounded-2xl space-y-3 text-center">
                  <p className="text-xs font-bold text-slate-700">ग्राहक ने पूरी फर्म को कितने स्टार दिए?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFirmRating(star)}
                        className="p-2 hover:scale-125 transition cursor-pointer"
                      >
                        <Star
                          size={28}
                          className={star <= firmRating ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                        />
                      </button>
                    ))}
                  </div>

                  {firmRating >= 4 ? (
                    <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                      <Sparkles size={15} className="text-emerald-700" />
                      <span>उत्कृष्ट! {firmRating}⭐ रेटिंग से आपका Google Maps Business रैंक ऊपर जाएगा!</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-900 font-bold flex items-center justify-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-700" />
                      <span>कम रेटिंग! यह फीडबैक 100% प्राइवेट रहेगा ताकि आप ग्राहक की समस्या हल कर सकें।</span>
                    </div>
                  )}
                </div>

                <textarea
                  rows={2}
                  placeholder="ग्राहक का फीडबैक / टेस्टिमोनियल (e.g. Food was delicious, beautiful decoration)"
                  value={publicReviewText}
                  onChange={(e) => setPublicReviewText(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSendWhatsAppFeedbackLink}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle size={14} /> व्हाट्सएप फीडबैक लिंक
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition"
                  >
                    फीडबैक सेव करें →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
