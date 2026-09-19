import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  Send,
  RefreshCw,
  AlertTriangle,
  X,
  FileText,
  Calendar,
  Percent,
  CheckCircle2
} from "lucide-react";
import api from "../../services/api";

export default function UdharOtpVerificationModal({
  isOpen,
  onClose,
  billData,
  onVerified
}) {
  if (!isOpen || !billData) return null;

  const billId = billData._id || billData.id;
  const custName = billData.customerName || "ग्राहक";
  const rawMobile = billData.customerMobile || billData.phone || "";
  const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
  const totalAmt = Number(billData.finalAmount || billData.total || billData.amount || 0);
  const lateInterest = billData.lateInterestPercent ?? 2;
  const dueDateDisplay = billData.dueDate
    ? new Date(billData.dueDate).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" })
    : "15 दिन";

  const [otpInput, setOtpInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [bypassing, setBypassing] = useState(false);
  const [currentOtpCode, setCurrentOtpCode] = useState(billData.otpCode || "");
  const [currentLegalText, setCurrentLegalText] = useState(billData.legalAgreementText || "");
  const [copied, setCopied] = useState(false);
  const [showLegalText, setShowLegalText] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: "success" | "error", text: string }

  // Update states if billData changes
  useEffect(() => {
    if (billData) {
      setCurrentOtpCode(billData.otpCode || "");
      setCurrentLegalText(billData.legalAgreementText || "");
      setOtpInput("");
      setStatusMessage(null);
    }
  }, [billData]);

  // Construct default WhatsApp text if empty
  const waText = currentLegalText || 
`📜 *कानूनी उधारी वचनपत्र (IT Act 2000 Section 10A)*

नमस्ते *${custName}*,
बिल संख्या: *${billData.billNumber || "N/A"}*
कुल उधारी राशि: *₹${totalAmt.toLocaleString("en-IN")}*
भुगतान की देय तारीख: *${dueDateDisplay}*
विलंब ब्याज दर: *${lateInterest}% प्रति माह*

*वचनपत्र (Undertaking):* 
मैं प्रमाणित करता हूँ कि मैंने उपरोक्त बिल का समस्त सामान सही स्थिति में प्राप्त कर लिया है। मैं इस बकाया राशि का भुगतान नियत देय तारीख तक करने का वचन देता हूँ। नियत तारीख के बाद विलंब ब्याज देय होगा।

🔐 *माल प्राप्ति/हैंडओवर का OTP:*
👉 *[ ${currentOtpCode} ]*

_(कृपया यह OTP दुकानदार को तभी बताएं जब आप सामान प्राप्त कर लें।)_`;

  // 1. WhatsApp Direct Share Link (Works on Normal WhatsApp & Web)
  const handleOpenWhatsApp = () => {
    if (billData.waLink) {
      window.open(billData.waLink, "_blank");
      return;
    }
    const phoneParam = cleanMobile ? `91${cleanMobile}` : "";
    const waUrl = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  // 2. Copy Legal Undertaking
  const handleCopyLegalText = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput.trim()) {
      setStatusMessage({ type: "error", text: "कृपया ग्राहक द्वारा बताया गया 4-अंकों का OTP दर्ज करें!" });
      return;
    }

    setVerifying(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/api/billing/${billId}/verify-udhar-otp`, { otpCode: otpInput.trim() });
      setStatusMessage({ type: "success", text: "✅ उधारी डिलीवरी और कानूनी सहमति 100% सत्यापित हुई!" });
      if (onVerified) onVerified(res.data?.bill || { ...billData, isOtpVerified: true, handoverStatus: "VERIFIED_HANDED_OVER" });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("OTP verification error:", err);
      const errMsg = err.response?.data?.message || err.message || "गलत OTP दर्ज किया गया है!";
      setStatusMessage({ type: "error", text: errMsg });
    } finally {
      setVerifying(false);
    }
  };

  // 4. Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/api/billing/${billId}/resend-udhar-otp`);
      if (res.data?.otpCode) {
        setCurrentOtpCode(res.data.otpCode);
        if (res.data.legalAgreementText) setCurrentLegalText(res.data.legalAgreementText);
      }
      setStatusMessage({ type: "success", text: "नया OTP जनरेट हुआ! नीचे दिए बटन से WhatsApp पर भेजें।" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.response?.data?.message || "OTP दोबारा भेजने में विफल।" });
    } finally {
      setResending(false);
    }
  };

  // 5. Bypass OTP Handover
  const handleBypass = async () => {
    if (!window.confirm("⚠️ क्या आप बिना OTP के इस उधारी बिल का माल हैंडओवर करना चाहते हैं? भविष्य में कानूनी सुरक्षा के लिए OTP सत्यापन अनुशंसित है।")) {
      return;
    }
    setBypassing(true);
    try {
      const res = await api.post(`/api/billing/${billId}/bypass-udhar-otp`, { reason: "दुकानदार द्वारा मैनुअल बायपास" });
      setStatusMessage({ type: "success", text: "⚠️ उधारी हैंडओवर बायपास कर दिया गया।" });
      if (onVerified) onVerified(res.data?.bill || { ...billData, handoverStatus: "BYPASSED" });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMessage({ type: "error", text: "बायपास विफल।" });
    } finally {
      setBypassing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 px-5 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <ShieldCheck size={22} className="text-amber-100" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">
                कानूनी उधारी वचनपत्र एवं OTP सत्यापन
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                IT Act 2000 Sec 10A • अकाट्य डिलीवरी व उधारी प्रमाण
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* BILL & CUSTOMER SUMMARY CARD */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-black text-sm text-slate-900">{custName}</div>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Smartphone size={12} /> {cleanMobile ? `+91 ${cleanMobile}` : "फोन नंबर दर्ज नहीं"}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">कुल उधारी</span>
                <span className="text-xl font-black text-rose-600">₹{totalAmt.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar size={13} className="text-indigo-600" />
                <span>देय तारीख: <strong>{dueDateDisplay}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Percent size={13} className="text-rose-600" />
                <span>विलंब ब्याज: <strong>{lateInterest}% / माह</strong></span>
              </div>
            </div>
          </div>

          {/* 📋 CREDIT LINE 5-POINT DAILY BREAKDOWN */}
          {billData.isCreditLineBill && billData.creditLineSnapshot && (
            <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-2xl text-xs space-y-1.5 text-slate-800 animate-in fade-in">
              <span className="text-[10px] font-black uppercase text-indigo-900 block tracking-wider">
                📋 दैनिक क्रेडिट लाइन हिसाब (Credit Line Breakdown)
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div>• आज का बिल: <strong>₹{Number(billData.creditLineSnapshot.billAmount || totalAmt).toLocaleString('en-IN')}</strong></div>
                <div>• पिछला बकाया: <strong>₹{Number(billData.creditLineSnapshot.previousBalance || 0).toLocaleString('en-IN')}</strong></div>
                <div>• कुल बकाया: <strong className="text-rose-600">₹{Number(billData.creditLineSnapshot.newTotalBalance || 0).toLocaleString('en-IN')}</strong></div>
                <div>• स्वीकृत लिमिट: <strong>₹{Number(billData.creditLineSnapshot.sanctionedLimit || 0).toLocaleString('en-IN')}</strong></div>
                <div className="col-span-2 text-emerald-800 font-bold">
                  • बची हुई उपलब्ध लिमिट: ₹{Number(billData.creditLineSnapshot.remainingLimit || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP ACTION BUTTONS */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-green-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 transition"
              >
                <Send size={15} />
                <span>WhatsApp पर वचनपत्र व OTP भेजें</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLegalText}
                className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                title="संदेश कॉपी करें"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span>{copied ? "कॉपी हुआ!" : "कॉपी"}</span>
              </button>
            </div>
            
            {/* View Full Legal Agreement Text Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowLegalText(!showLegalText)}
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <FileText size={12} />
                <span>{showLegalText ? "कानूनी वचनपत्र ड्राफ्ट छुपाएं" : "📜 पूरा कानूनी वचनपत्र ड्राफ्ट देखें"}</span>
              </button>
            </div>

            {showLegalText && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in">
                {waText}
              </div>
            )}
          </div>

          {/* OTP INPUT & VERIFICATION BOX */}
          <div className="p-5 bg-amber-50/60 border-2 border-amber-300 rounded-2xl space-y-3 text-center">
            <div>
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                🔐 ग्राहक से OTP पूछकर दर्ज करें:
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ग्राहक को WhatsApp पर 4-अंकों का OTP भेजा गया है
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  inputMode="numeric"
                  autoFocus
                  placeholder="• • • •"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-3 text-center text-2xl font-black tracking-[0.5em] bg-white border-2 border-amber-400 rounded-2xl outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-slate-900 shadow-sm"
                />
              </div>

              {/* Status Alert Message */}
              {statusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-black text-center ${
                  statusMessage.type === "success" 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}>
                  {statusMessage.text}
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={verifying || otpInput.length < 4}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-sm rounded-xl shadow-md cursor-pointer active:scale-95 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>{verifying ? "सत्यापित हो रहा है..." : "✅ OTP सत्यापित करें और माल हैंडओवर करें"}</span>
              </button>
            </form>

            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                <span>{resending ? "भेज रहा है..." : "नया OTP जनरेट करें"}</span>
              </button>

              <button
                type="button"
                onClick={handleBypass}
                disabled={bypassing}
                className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer transition text-[11px]"
              >
                ⚠️ बिना OTP बायपास करें
              </button>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0 text-xs">
          <div className="text-[11px] text-slate-400 font-medium">
            सत्यापित होने पर बिल में 🛡️ लीगल शील्ड दर्ज हो जाएगी
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold cursor-pointer"
          >
            बंद करें
          </button>
        </div>

      </div>
    </div>
  );
}
