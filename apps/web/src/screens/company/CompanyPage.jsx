import React, { useState, useEffect } from "react";
import { Edit, Save, X, Building2, Mail, Phone, MapPin, FileText, Plus, Trash2, Briefcase, CreditCard, UserCheck, Share2, QrCode, Star, Gift, Percent, Video, MessageCircle, ExternalLink, Smartphone, Printer, Copy, Check } from "lucide-react";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";

const CompanyPage = () => {
  const { companies, selectedCompany, selectCompany, addCompany, updateCompany, deleteCompany, refetchCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const getInitialFormState = (company = null) => ({
    name: company?.name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    alternatePhone: company?.alternatePhone || "",
    alternatePhone2: company?.alternatePhone2 || "",
    address: company?.address || "",
    gstNumber: company?.gstNumber || "",
    gstType: company?.gstType || "regular",
    panNumber: company?.panNumber || "",
    businessType: Array.isArray(company?.businessType) 
      ? company.businessType 
      : company?.businessType 
        ? [company.businessType] 
        : ["retail"],
    industryType: company?.industryType || "",
    modulesEnabled: Array.isArray(company?.modulesEnabled) ? company.modulesEnabled : [],
    businessDescription: company?.businessDescription || "",
    bankName: company?.bankName || "",
    accountName: company?.accountName || "",
    accountNumber: company?.accountNumber || "",
    ifscCode: company?.ifscCode || "",
    upiId: company?.upiId || "",
    customQrCode: company?.customQrCode || "",
    caName: company?.caName || "",
    caPhone: company?.caPhone || "",
    googleReviewUrl: company?.googleReviewUrl || "",
    instagramUrl: company?.instagramUrl || "",
    facebookUrl: company?.facebookUrl || "",
    youtubeUrl: company?.youtubeUrl || "",
    whatsappBusinessNumber: company?.whatsappBusinessNumber || "",
    callingContactNumber: company?.callingContactNumber || "",
    mapLocationUrl: company?.mapLocationUrl || "",
    reviewRewardCouponCode: company?.reviewRewardCouponCode || "STAR5",
    reviewRewardCouponDiscount: company?.reviewRewardCouponDiscount || 10
  });

  const [formData, setFormData] = useState(getInitialFormState());

  // 📲 Dynamic 3-Channel WhatsApp QR Engine State for Business Profile
  const [waChannels, setWaChannels] = useState({
    billing: { isConnected: false, status: 'DISCONNECTED', qrDataUrl: null, userPhone: null },
    recovery: { isConnected: false, status: 'DISCONNECTED', qrDataUrl: null, userPhone: null, isInherited: false, effectivePhone: null },
    marketing: { isConnected: false, status: 'DISCONNECTED', qrDataUrl: null, userPhone: null, isInherited: false, effectivePhone: null }
  });
  const [activeWaModalChannel, setActiveWaModalChannel] = useState('billing');
  const [showWhatsAppQrModal, setShowWhatsAppQrModal] = useState(false);
  const [loadingWaAction, setLoadingWaAction] = useState(false);

  const fetchWhatsAppStatus = async (targetChannel = null) => {
    try {
      const url = targetChannel ? `/api/whatsapp/status?channel=${targetChannel}` : '/api/whatsapp/status';
      const res = await api.get(url);
      if (res?.data?.success && res.data.channels) {
        setWaChannels(prev => {
          const incoming = res.data.channels;
          const updated = { ...prev };
          for (const ch of ['billing', 'recovery', 'marketing']) {
            if (incoming[ch]) {
              updated[ch] = {
                ...incoming[ch],
                // 🛡️ Preserve existing QR Data URL if backend is currently processing
                qrDataUrl: incoming[ch].qrDataUrl || prev[ch]?.qrDataUrl || null
              };
            }
          }
          return updated;
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWhatsAppStatus();
  }, []);

  useEffect(() => {
    let timer = null;
    if (showWhatsAppQrModal) {
      timer = setInterval(() => fetchWhatsAppStatus(activeWaModalChannel), 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showWhatsAppQrModal, activeWaModalChannel]);

  const handleOpenWhatsAppModal = (channel = 'billing') => {
    setActiveWaModalChannel(channel);
    setShowWhatsAppQrModal(true);
    if (!waChannels[channel]?.isConnected) {
      handleStartWhatsAppSession(channel, false);
    }
  };

  const handleStartWhatsAppSession = async (channel = activeWaModalChannel, forceNew = false) => {
    setLoadingWaAction(true);
    try {
      const res = await api.post('/api/whatsapp/start-session', { channel, forceNew });
      if (res?.data?.success) {
        setWaChannels(prev => ({
          ...prev,
          [channel]: {
            ...prev[channel],
            status: res.data.status || prev[channel]?.status,
            qrDataUrl: res.data.qrDataUrl || prev[channel]?.qrDataUrl
          }
        }));
      }
    } catch (err) {
      console.warn("WhatsApp session start warning:", err.message);
    } finally {
      setLoadingWaAction(false);
    }
  };

  const handleDisconnectWhatsApp = async (channel = activeWaModalChannel) => {
    const channelTitles = {
      billing: "बिलिंग व बिक्री",
      recovery: "उधारी वसूली",
      marketing: "मार्केटिंग व ऑफर्स"
    };
    if (!window.confirm(`क्या आप वाकई ${channelTitles[channel] || channel} WhatsApp को डिस्कनेक्ट करना चाहते हैं?`)) return;
    setLoadingWaAction(true);
    try {
      const res = await api.post('/api/whatsapp/disconnect', { channel });
      if (res?.data?.success) {
        await fetchWhatsAppStatus();
        alert(`✅ ${channelTitles[channel] || ''} WhatsApp सफलतापूर्वक डिस्कनेक्ट हो गया!`);
      }
    } catch (err) {
      alert("डिस्कनेक्ट विफल: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingWaAction(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      setFormData(getInitialFormState(selectedCompany));
    }
  }, [selectedCompany]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessTypeChange = (type) => {
    setFormData((prev) => {
      const currentTypes = Array.isArray(prev.businessType) ? prev.businessType : [];
      if (currentTypes.includes(type)) {
        return { ...prev, businessType: currentTypes.filter((t) => t !== type) };
      } else {
        return { ...prev, businessType: [...currentTypes, type] };
      }
    });
  };

  const handleModuleToggle = (moduleId) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.modulesEnabled) ? prev.modulesEnabled : [];
      const updated = current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId];

      return { ...prev, modulesEnabled: updated };
    });
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File size should be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, customQrCode: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const response = await api.post("/api/company", formData);
        addCompany(response.company || response);
        setIsAdding(false);
        alert("Company added successfully!");
      } else {
        const response = await api.put(`/api/company/${selectedCompany._id}`, formData);
        updateCompany(response.company || response);
        setIsEditing(false);
        alert("Company updated successfully!");
      }
    } catch (err) {
      console.error("Failed to save company:", err);
      alert("Failed to save company");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAdding(false);
    setFormData(getInitialFormState(selectedCompany));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

  const renderMobileWhatsAppPreview = (info = {}, isLiveEditing = false) => {
    const shopName = info.name || "आपकी दुकान / फर्म का नाम";
    const shopPhone = info.whatsappBusinessNumber || info.phone || "7828289433";
    const callingPhone = info.callingContactNumber || "";
    const shopAddress = info.address || "दुकान का मुख्य पता";
    const mapLocationUrl = info.mapLocationUrl || "";
    const upiId = info.upiId ? String(info.upiId).trim() : "";

    return (
      <div className="mt-3 bg-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2.5 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              📱
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                <span>ग्राहकों के मोबाइल पर ऐसा दिखेगा (WhatsApp Message Preview)</span>
                {isLiveEditing && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-500/30 animate-pulse">
                    लाइव डेमो
                  </span>
                )}
              </h5>
              <p className="text-[10px] text-slate-400">
                {isLiveEditing
                  ? "💡 आपके विवरण भरते ही यह संदेश रियल-टाइम में स्वतः बदल रहा है।"
                  : "💡 ग्राहकों को भेजे जाने वाले बिल व हिसाब का वास्तविक WhatsApp संदेश रूप:"}
              </p>
            </div>
          </div>
        </div>

        {/* Simulated Mobile WhatsApp Chat Bubble */}
        <div className="bg-[#EFEAE2] rounded-xl p-3 text-slate-900 shadow-inner max-w-md mx-auto border border-[#E0D8CC]">
          {/* Mock WhatsApp Chat Header */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#D8CEBF]">
            <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {shopName.charAt(0) || "🏢"}
            </div>
            <div className="flex-1 min-w-0">
              <h6 className="font-bold text-xs text-slate-900 truncate">{shopName}</h6>
              <span className="text-[10px] text-emerald-700 font-semibold block">online • WhatsApp Business</span>
            </div>
          </div>

          {/* Incoming Message Bubble */}
          <div className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/60 text-[11px] font-sans leading-relaxed space-y-1.5 select-all">
            <p className="font-medium text-slate-800">
              नमस्ते <b>सम्मानित ग्राहक</b> जी,
            </p>

            <div className="space-y-0.5 text-slate-800 border-l-2 border-emerald-500 pl-2">
              <p className="font-black text-slate-900">🏢 *{shopName}*</p>
              {shopAddress && <p className="text-slate-700">📍 पता: {shopAddress}</p>}
              {mapLocationUrl ? (
                <p className="text-blue-700 font-semibold break-all">
                  🗺️ दुकान लोकेशन: <span className="underline">{mapLocationUrl}</span>
                </p>
              ) : (
                <p className="text-[10px] text-amber-700 italic">
                  (📍 GPS लिंक खाली है - लिंक डालने पर यहाँ Google Maps दिखेगा)
                </p>
              )}
              <p className="font-bold text-emerald-800">💬 WhatsApp: {shopPhone}</p>
              {callingPhone && callingPhone !== shopPhone ? (
                <p className="font-bold text-slate-800">📞 कॉल / संपर्क हेतु: {callingPhone}</p>
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  (कॉलिंग नंबर खाली होने पर WhatsApp नंबर ही संपर्क माना जाएगा)
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-1 space-y-0.5">
              <p className="font-extrabold text-slate-900">📋 *खाता विवरण (Statement of Account)*</p>
              <p className="font-black text-rose-700">⚖️ *वर्तमान कुल बकाया: ₹12,450 (लेने हैं)*</p>
              <p className="text-slate-500 text-[10px]">📅 विवरण दिनांक: 23/11/2026</p>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg text-[10px] border border-slate-100 font-mono space-y-0.5">
              <p className="font-bold text-slate-700">📜 हालिया बिल विवरण:</p>
              <p>1️⃣ 20/11/2026: बिल #104 — <b>₹8,450</b> (⏳ 3 दिन से बकाया)</p>
              <p>2️⃣ 15/11/2026: बिल #101 — <b>₹4,000</b> (⏳ 8 दिन से बकाया)</p>
            </div>

            {upiId ? (
              <div className="bg-emerald-50/80 p-2 rounded-lg text-[10px] border border-emerald-200">
                <p className="font-bold text-emerald-950">📱 *ऑनलाइन भुगतान (GPay / PhonePe / Paytm):*</p>
                <p className="font-mono text-emerald-900">UPI ID: <b>{upiId}</b></p>
                <p className="text-blue-600 font-bold underline mt-0.5">👉 1-क्लिक भुगतान लिंक</p>
              </div>
            ) : (
              <div className="bg-slate-100 p-1.5 rounded-lg text-[10px] text-slate-500 italic">
                (💳 UPI ID खाली है - डालने पर यहाँ 1-क्लिक पेमेंट लिंक व QR कोड जुड़ेगा)
              </div>
            )}

            <div className="bg-blue-50/80 p-2 rounded-lg text-[10px] border border-blue-200">
              <p className="font-bold text-blue-950">🌐 *पूरा लेजर, बिल पर्ची व PDF देखने हेतु लिंक:*</p>
              <p className="text-blue-700 underline font-mono text-[9px]">https://monorapo-accountingapp-1-web.vercel.app/statement/...</p>
            </div>

            <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400">
              <span>धन्यवाद! 🙏 - {shopName}</span>
              <span className="text-[9px] text-slate-400">10:30 AM ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWhatsAppControlHub = (info = {}, isEditingMode = false) => {
    const isBillingConn = Boolean(waChannels.billing?.isConnected);
    const isRecoveryConn = Boolean(waChannels.recovery?.isConnected);
    const isMarketingConn = Boolean(waChannels.marketing?.isConnected);

    return (
      <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-teal-50/80 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <MessageCircle size={22} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>📲 3-चैनल WhatsApp बिज़नेस कंट्रोल हब</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  One-Stop Central Manager
                </span>
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                बिक्री बिल, उधारी वसूली व मार्केटिंग हेतु अलग-अलग WhatsApp नंबर जोड़ें, या केवल 1 नंबर से ही सब कुछ संचालित करें।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppModal('billing')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <QrCode size={14} /> <span>QR मैनेजर खोलें</span>
            </button>
          </div>
        </div>

        {/* 3 Channels Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Slot 1: Invoices & Billing */}
          <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${isBillingConn ? 'bg-white border-emerald-400 shadow-xs ring-2 ring-emerald-500/20' : 'bg-white/80 border-slate-200'}`}>
            <div>
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  स्लॉट 1: मुख्य बिलिंग
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBillingConn ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {isBillingConn ? 'सक्रिय ✓' : 'बंद'}
                </span>
              </div>
              <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>🧾 बिलिंग व बिक्री WhatsApp</span>
              </h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                दुकान के नए बिल, रसीद, काउंटर पर्ची व UPI भुगतान लिंक ग्राहकों को भेजने हेतु।
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
              <p className="text-xs font-black text-slate-900">
                {isBillingConn ? (
                  <span className="text-emerald-700">📱 +91 {waChannels.billing?.userPhone}</span>
                ) : (
                  <span className="text-rose-600 font-bold">⚠️ QR लिंक नहीं है</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppModal('billing')}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                    isBillingConn
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {isBillingConn ? '⚙️ बिलिंग नंबर बदलें' : '📲 बिलिंग QR लिंक करें'}
                </button>
                {isBillingConn && (
                  <button
                    type="button"
                    onClick={() => handleDisconnectWhatsApp('billing')}
                    disabled={loadingWaAction}
                    className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer shrink-0"
                    title="डिस्कनेक्ट करें"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slot 2: Recovery & Due Reminders */}
          <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${isRecoveryConn ? 'bg-white border-amber-400 shadow-xs ring-2 ring-amber-500/20' : 'bg-white/80 border-slate-200'}`}>
            <div>
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  स्लॉट 2: उधारी वसूली
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRecoveryConn ? 'bg-amber-600 text-white' : isBillingConn ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                  {isRecoveryConn ? 'अलग नंबर ✓' : isBillingConn ? 'स्मार्ट बैकअप 🔄' : 'बंद'}
                </span>
              </div>
              <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>⚖️ उधारी वसूली व तगादा WhatsApp</span>
              </h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                लेजर स्टेटमेंट, बकाया उधारी तगादा व लेट-पेमेंट रिमाइंडर भेजने हेतु।
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
              <p className="text-xs font-black text-slate-900">
                {isRecoveryConn ? (
                  <span className="text-amber-800">📱 +91 {waChannels.recovery?.userPhone} (समर्पित नंबर)</span>
                ) : isBillingConn ? (
                  <span className="text-blue-700 font-bold text-[11px] flex items-center gap-1">
                    🔄 बिलिंग नंबर (+91 {waChannels.billing?.userPhone}) से स्वतः जाएगा
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">⚠️ लिंक नहीं है</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppModal('recovery')}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                    isRecoveryConn
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      : 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                  }`}
                >
                  {isRecoveryConn ? '⚙️ वसूली नंबर बदलें' : '📲 अलग वसूली QR लिंक'}
                </button>
                {isRecoveryConn && (
                  <button
                    type="button"
                    onClick={() => handleDisconnectWhatsApp('recovery')}
                    disabled={loadingWaAction}
                    className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer shrink-0"
                    title="डिस्कनेक्ट करें"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slot 3: Marketing & Festival Offers */}
          <div className={`p-4 rounded-2xl border transition flex flex-col justify-between ${isMarketingConn ? 'bg-white border-indigo-400 shadow-xs ring-2 ring-indigo-500/20' : 'bg-white/80 border-slate-200'}`}>
            <div>
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                  स्लॉट 3: मार्केटिंग व ऑफर्स
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMarketingConn ? 'bg-indigo-600 text-white' : isBillingConn ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                  {isMarketingConn ? 'अलग नंबर ✓' : isBillingConn ? 'स्मार्ट बैकअप 🔄' : 'बंद'}
                </span>
              </div>
              <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>📢 मार्केटिंग व ऑफर्स WhatsApp</span>
              </h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                बंपर डिस्काउंट सेल, त्योहार बधाई, VIP कूपन व ब्रॉडकास्ट संदेश भेजने हेतु।
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
              <p className="text-xs font-black text-slate-900">
                {isMarketingConn ? (
                  <span className="text-indigo-800">📱 +91 {waChannels.marketing?.userPhone} (समर्पित नंबर)</span>
                ) : isBillingConn ? (
                  <span className="text-blue-700 font-bold text-[11px] flex items-center gap-1">
                    🔄 बिलिंग नंबर (+91 {waChannels.billing?.userPhone}) से स्वतः जाएगा
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">⚠️ लिंक नहीं है</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppModal('marketing')}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                    isMarketingConn
                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-300 hover:bg-indigo-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                  }`}
                >
                  {isMarketingConn ? '⚙️ मार्केटिंग नंबर बदलें' : '📲 अलग मार्केटिंग QR लिंक'}
                </button>
                {isMarketingConn && (
                  <button
                    type="button"
                    onClick={() => handleDisconnectWhatsApp('marketing')}
                    disabled={loadingWaAction}
                    className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer shrink-0"
                    title="डिस्कनेक्ट करें"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Contact & Location Fields */}
        {isEditingMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-emerald-200/80 bg-white/60 p-3 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                WhatsApp Business नंबर (बिलों व रसीदों पर प्रदर्शित)
              </label>
              <input
                type="text"
                name="whatsappBusinessNumber"
                value={formData.whatsappBusinessNumber}
                onChange={handleChange}
                placeholder="उदा. 919876543210 या 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                हेल्पलाइन / कॉलिंग नंबर (यदि WhatsApp से अलग हो)
              </label>
              <input
                type="text"
                name="callingContactNumber"
                value={formData.callingContactNumber}
                onChange={handleChange}
                placeholder="खाली रखने पर WhatsApp नंबर ही संपर्क माना जाएगा"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-emerald-700" />
                <span>दुकान का GPS / Google Maps लोकेशन लिंक (वैकल्पिक)</span>
              </label>
              <input
                type="url"
                name="mapLocationUrl"
                value={formData.mapLocationUrl}
                onChange={handleChange}
                placeholder="उदा. https://maps.app.goo.gl/... या https://goo.gl/maps/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800"
              />
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-emerald-200/80 text-xs text-slate-700 space-y-1 bg-white/60 p-3 rounded-2xl">
            <div className="flex flex-wrap items-center gap-4">
              <p><b>बिलों पर WhatsApp नंबर:</b> {info.whatsappBusinessNumber || info.phone || "सेट नहीं है"}</p>
              {info.callingContactNumber && <p><b>📞 हेल्पलाइन कॉल:</b> {info.callingContactNumber}</p>}
            </div>
            {info.mapLocationUrl && (
              <p className="flex items-center gap-1 text-[11px] mt-1">
                <MapPin size={12} className="text-emerald-600 shrink-0" />
                <b>दुकान GPS:</b>
                <a href={info.mapLocationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold truncate max-w-sm">
                  {info.mapLocationUrl}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Live Message Preview */}
        {renderMobileWhatsAppPreview(info, isEditingMode)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage your companies and business types</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing(false);
            setFormData(getInitialFormState());
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      {/* Company List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company._id}
            onClick={() => {
              selectCompany(company);
              // Flush stale cache and hard reload to prevent ghost data
              localStorage.setItem("companyId", company._id);
              localStorage.setItem("companyName", company.name);
              localStorage.removeItem("categories");
              localStorage.removeItem("subCategories");
              window.location.href = "/dashboard";
            }}
            className={`p-4 border rounded-lg cursor-pointer transition relative group ${
              selectedCompany && selectedCompany._id === company._id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
                  deleteCompany(company._id);
                }
              }}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full z-10"
              title="Delete Company"
            >
              <Trash2 size={18} />
            </button>
            <h3 className="font-semibold text-lg pr-8">{company.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{Array.isArray(company.businessType) ? company.businessType.join(', ') : company.businessType}</p>
            <p className="text-sm text-gray-500">{company.address}</p>
          </div>
        ))}
      </div>

      {/* Selected Company Details */}
      {selectedCompany && !isAdding && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Company Details</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Edit size={20} />
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <form className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / Firm Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">मुख्य मोबाइल नंबर (Primary Mobile) *</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="उदा. 9876543210" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">अतिरिक्त मोबाइल नंबर 1 (Secondary Phone)</label>
                    <input type="text" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} placeholder="वैकल्पिक मोबाइल नंबर" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">अतिरिक्त नंबर 2 / लैंडलाइन (3rd Contact)</label>
                    <input type="text" name="alternatePhone2" value={formData.alternatePhone2} onChange={handleChange} placeholder="दूसरा वैकल्पिक या लैंडलाइन नंबर" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="1" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* 📲 3-Channel WhatsApp Business Control Hub */}
                {renderWhatsAppControlHub(formData, true)}
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type (Select multiple)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "retail", label: "Retail" },
                    { id: "wholesale", label: "Wholesale" },
                    { id: "manufacturing", label: "Manufacturing" },
                    { id: "service", label: "Services" },
                    { id: "trading", label: "Trading" }
                  ].map((type) => (
                    <label key={type.id} className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={Array.isArray(formData.businessType) && formData.businessType.includes(type.id)} onChange={() => handleBusinessTypeChange(type.id)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
                    <input type="text" name="industryType" list="industry-options" placeholder="e.g. Hardware, Paints or Custom" value={formData.industryType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    <datalist id="industry-options">
                      <option value="Hardware & Electricals" />
                      <option value="Electronics & Mobiles" />
                      <option value="Jewellery" />
                      <option value="Clothing & Fashion" />
                      <option value="Medical & Pharmacy" />
                      <option value="Bakery" />
                      <option value="Restaurant & Cafe" />
                      <option value="Hotel & Resort" />
                      <option value="Hotel & Restaurant (Combined)" />
                      <option value="FMCG & Grocery" />
                      <option value="Construction & Builder" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What does your firm do? (For Visiting Card)</label>
                    <input type="text" name="businessDescription" placeholder="e.g. Hardware, Sanitaryware, Electronics" value={formData.businessDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                    <select name="gstType" value={formData.gstType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="unregistered">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (For Bill QR Code)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. yourbusiness@upi" />
                  </div>
                  
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Payment QR Code (GPay/PhonePe) *Optional</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                        {formData.customQrCode ? (
                          <img src={formData.customQrCode} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">No QR</span>
                        )}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <p className="text-xs text-gray-500 mt-1">Upload your shop's fixed QR code (Max 2MB)</p>
                        {formData.customQrCode && <button type="button" onClick={() => setFormData({ ...formData, customQrCode: "" })} className="text-xs text-red-600 mt-1 hover:underline">Remove QR</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CA Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">CA / Accountant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Name</label>
                    <input type="text" name="caName" value={formData.caName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Phone</label>
                    <input type="text" name="caPhone" value={formData.caPhone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* 🌐 Social Media & Google Business Hub */}
              <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/70 p-5 rounded-2xl border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2.5">
                  <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                    <Share2 className="text-indigo-600" size={20} /> 🌐 सोशल मीडिया, Google Business व कूपन रिवॉर्ड हब
                  </h3>
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 font-extrabold px-3 py-1 rounded-full border border-indigo-200">
                    Social & Review Funnel
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  यहाँ अपने सोशल प्रोफाइल्स व Google Reviews लिंक डालें। 4 या 5-स्टार रिव्यू देने वाले ग्राहकों को ऑटोमैटिक कूपन कोड मिलेगा और आपके Instagram, Facebook व YouTube पर फॉलोअर्स बढ़ेंगे।
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" /> Google My Business / Review लिंक (Google Maps)
                    </label>
                    <input
                      type="url"
                      name="googleReviewUrl"
                      value={formData.googleReviewUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://g.page/r/... या https://maps.google.com/..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-pink-600" /> Instagram Profile लिंक
                    </label>
                    <input
                      type="url"
                      name="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://instagram.com/your_shop"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Share2 size={14} className="text-blue-600" /> Facebook Page लिंक
                    </label>
                    <input
                      type="url"
                      name="facebookUrl"
                      value={formData.facebookUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://facebook.com/your_page"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Video size={14} className="text-red-600" /> YouTube Channel लिंक
                    </label>
                    <input
                      type="url"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://youtube.com/@your_channel"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-emerald-600" /> WhatsApp Business नंबर / लिंक
                    </label>
                    <input
                      type="text"
                      name="whatsappBusinessNumber"
                      value={formData.whatsappBusinessNumber}
                      onChange={handleChange}
                      placeholder="उदा. 919876543210 या https://wa.me/919876543210"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Gift size={14} className="text-amber-600" /> 4/5⭐ कूपन कोड
                      </label>
                      <input
                        type="text"
                        name="reviewRewardCouponCode"
                        value={formData.reviewRewardCouponCode}
                        onChange={handleChange}
                        placeholder="STAR5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black uppercase focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Percent size={14} className="text-indigo-600" /> छूट प्रतिशत (%)
                      </label>
                      <input
                        type="number"
                        name="reviewRewardCouponDiscount"
                        value={formData.reviewRewardCouponDiscount}
                        onChange={handleChange}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm">
                  <Save size={20} /> Save Details
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">
                  <X size={20} /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic & Business Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="text-blue-600 mt-1" size={24} />
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-bold text-lg text-gray-900">{selectedCompany.name}</p>
                      {selectedCompany.businessDescription && (
                        <p className="text-sm text-blue-600 font-medium">{selectedCompany.businessDescription}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                    <p className="font-medium text-gray-800 capitalize">{(Array.isArray(selectedCompany.businessType) ? selectedCompany.businessType.join(' & ') : selectedCompany.businessType)} {selectedCompany.industryType && `- ${selectedCompany.industryType}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">{selectedCompany.address || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-1" size={20} />
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">संपर्क नंबर (Contact Numbers)</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg text-xs border border-gray-200">
                          मुख्य: {selectedCompany.phone || "उपलब्ध नहीं"}
                        </span>
                        {selectedCompany.alternatePhone && (
                          <span className="font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-lg text-xs border border-gray-200">
                            अन्य 1: {selectedCompany.alternatePhone}
                          </span>
                        )}
                        {selectedCompany.alternatePhone2 && (
                          <span className="font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-lg text-xs border border-gray-200">
                            अन्य 2: {selectedCompany.alternatePhone2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedCompany.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Tax & Bank Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Firm Type & GST Details</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                          selectedCompany.gstType === 'composition' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          selectedCompany.gstType === 'unregistered' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {selectedCompany.gstType === 'composition' ? 'Composition Firm' : selectedCompany.gstType === 'unregistered' ? 'Unregistered Firm' : 'Regular Firm'}
                        </span>
                        {selectedCompany.gstNumber && (
                          <span className="font-medium text-gray-800 uppercase text-sm border-l pl-2 border-gray-300">
                            GSTIN: {selectedCompany.gstNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Bank Account Details</p>
                      <p className="font-medium text-gray-800">
                        {selectedCompany.bankName ? `${selectedCompany.bankName} - ${selectedCompany.accountNumber}` : "Not provided"}
                      </p>
                      {selectedCompany.ifscCode && <p className="text-xs text-gray-500">IFSC: {selectedCompany.ifscCode.toUpperCase()}</p>}
                    </div>
                  </div>
                  {selectedCompany.customQrCode && (
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <QrCode className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Payment QR Code</p>
                        <img src={selectedCompany.customQrCode} alt="Payment QR" className="w-32 h-32 border rounded-lg shadow-sm" />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <FileText size={16} className="text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs uppercase px-2 py-1 border rounded font-bold tracking-wider ${
                            selectedCompany.gstType === 'composition' ? 'bg-orange-900 border-orange-700 text-orange-300' :
                            selectedCompany.gstType === 'unregistered' ? 'bg-gray-800 border-gray-600 text-gray-300' :
                            'bg-green-900 border-green-700 text-green-300'
                          }`}>
                            {selectedCompany.gstType === 'composition' ? 'COMPOSITION' : selectedCompany.gstType === 'unregistered' ? 'UNREGISTERED' : 'REGULAR GST'}
                          </span>
                          {selectedCompany.gstNumber && (
                            <span className="text-xs uppercase bg-gray-800 px-2 py-1 border border-gray-600 rounded font-medium tracking-wider text-gray-200">GST: {selectedCompany.gstNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">CA Details</p>
                      <p className="font-medium text-gray-800">{selectedCompany.caName || "Not provided"}</p>
                      {selectedCompany.caPhone && <p className="text-xs text-gray-500">{selectedCompany.caPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 📲 3-Channel WhatsApp Business Control Hub */}
              {renderWhatsAppControlHub(selectedCompany, false)}

              {/* 🌐 Social Media & Google Reviews Display Hub */}
              <div className="mt-6 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-lg border border-indigo-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl">
                      <Share2 className="text-indigo-400" size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                        🌐 सोशल मीडिया, Google Reviews व कूपन रिवॉर्ड
                      </h3>
                      <p className="text-xs text-indigo-200/70">
                        ग्राहकों से 5-स्टार Google रिव्यू प्राप्त करें और Instagram / Facebook पर फॉलोअर्स बढ़ाएं
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowStandeeModal(true)}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="काउंटर पर रखने हेतु स्टैंडी QR पोस्टर देखें या प्रिंट करें"
                    >
                      <Printer size={13} /> 🖨️ काउंटर स्टैंडी QR कोड
                    </button>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-black px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Gift size={13} /> {selectedCompany.reviewRewardCouponCode || 'STAR5'} ({selectedCompany.reviewRewardCouponDiscount || 10}% OFF)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Google Reviews */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Star size={14} className="fill-amber-300" /> Google Review
                      </span>
                      {selectedCompany.googleReviewUrl && (
                        <a href={selectedCompany.googleReviewUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.googleReviewUrl || "लिंक सेट नहीं है (Edit में जोड़ें)"}
                    </p>
                  </div>

                  {/* Instagram */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                        <Smartphone size={14} /> Instagram
                      </span>
                      {selectedCompany.instagramUrl && (
                        <a href={selectedCompany.instagramUrl} target="_blank" rel="noreferrer" className="text-pink-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.instagramUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>

                  {/* Facebook */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <Share2 size={14} /> Facebook Page
                      </span>
                      {selectedCompany.facebookUrl && (
                        <a href={selectedCompany.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.facebookUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>

                  {/* YouTube */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <Video size={14} /> YouTube
                      </span>
                      {selectedCompany.youtubeUrl && (
                        <a href={selectedCompany.youtubeUrl} target="_blank" rel="noreferrer" className="text-rose-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.youtubeUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Digital Visiting Card Preview - ONLY MAIN DETAILS */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Digital Visiting Card Preview</h3>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition">
                    <Share2 size={16} /> Share Card
                  </button>
                </div>
                
                <div className="max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-xl overflow-hidden border border-gray-700 relative">
                  {/* Decorative shapes */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 opacity-20 rounded-tr-full"></div>
                  
                  <div className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-6 border-b border-gray-700 pb-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white mb-1">{selectedCompany.name || "Company Name"}</h2>
                        <p className="text-blue-400 font-medium text-sm tracking-wide uppercase">{selectedCompany.businessDescription || selectedCompany.businessType || "Business Description"}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <span>{selectedCompany.phone || "+91 XXXXXXXXXX"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span>{selectedCompany.email || "email@example.com"}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-gray-400 mt-1" />
                        <span className="leading-tight pr-4">{selectedCompany.address || "Company Address Details"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Company Form */}
      {isAdding && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
          <form className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / Firm Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">मुख्य मोबाइल नंबर (Primary Mobile) *</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="उदा. 9876543210" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">अतिरिक्त मोबाइल नंबर 1 (Secondary Phone)</label>
                    <input type="text" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} placeholder="वैकल्पिक मोबाइल नंबर" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">अतिरिक्त नंबर 2 / लैंडलाइन (3rd Contact)</label>
                    <input type="text" name="alternatePhone2" value={formData.alternatePhone2} onChange={handleChange} placeholder="दूसरा वैकल्पिक या लैंडलाइन नंबर" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="1" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* 📲 3-Channel WhatsApp Business Control Hub */}
                {renderWhatsAppControlHub(formData, true)}
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type (Select multiple)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "retail", label: "Retail" },
                    { id: "wholesale", label: "Wholesale" },
                    { id: "manufacturing", label: "Manufacturing" },
                    { id: "service", label: "Services" },
                    { id: "trading", label: "Trading" }
                  ].map((type) => (
                    <label key={type.id} className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={Array.isArray(formData.businessType) && formData.businessType.includes(type.id)} onChange={() => handleBusinessTypeChange(type.id)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
                    <input type="text" name="industryType" list="industry-options" placeholder="e.g. Hardware, Paints or Custom" value={formData.industryType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    <datalist id="industry-options">
                      <option value="Hardware & Electricals" />
                      <option value="Electronics & Mobiles" />
                      <option value="Jewellery" />
                      <option value="Clothing & Fashion" />
                      <option value="Medical & Pharmacy" />
                      <option value="Bakery" />
                      <option value="Restaurant & Cafe" />
                      <option value="Hotel & Resort" />
                      <option value="Hotel & Restaurant (Combined)" />
                      <option value="FMCG & Grocery" />
                      <option value="Construction & Builder" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What does your firm do? (For Visiting Card)</label>
                    <input type="text" name="businessDescription" placeholder="e.g. Hardware, Sanitaryware, Electronics" value={formData.businessDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                    <select name="gstType" value={formData.gstType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="unregistered">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (For Bill QR Code)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. yourbusiness@upi" />
                  </div>
                  
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Payment QR Code (GPay/PhonePe) *Optional</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                        {formData.customQrCode ? (
                          <img src={formData.customQrCode} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">No QR</span>
                        )}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <p className="text-xs text-gray-500 mt-1">Upload your shop's fixed QR code (Max 2MB)</p>
                        {formData.customQrCode && <button type="button" onClick={() => setFormData({ ...formData, customQrCode: "" })} className="text-xs text-red-600 mt-1 hover:underline">Remove QR</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CA Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">CA / Accountant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Name</label>
                    <input type="text" name="caName" value={formData.caName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Phone</label>
                    <input type="text" name="caPhone" value={formData.caPhone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm">
                  <Save size={20} /> Create Company
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">
                  <X size={20} /> Cancel
                </button>
              </div>
          </form>
        </div>
      )}

      {/* Standee QR Modal */}
      {showStandeeModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Actions Bar */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="text-amber-400" size={18} />
                <span className="font-black text-xs">काउंटर रिव्यू स्टैंडी (Print Ready)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/review/${selectedCompany._id || selectedCompany.id}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedLink ? "कॉपी हुआ!" : "लिंक"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 shadow transition cursor-pointer"
                >
                  <Printer size={13} /> प्रिंट करें
                </button>
                <button
                  type="button"
                  onClick={() => setShowStandeeModal(false)}
                  className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Standee Poster Preview */}
            <div className="p-6 text-center bg-gradient-to-b from-amber-50/70 via-white to-indigo-50/50 flex flex-col items-center select-none">
              {/* Top Crown/Star */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/30 mb-2.5 border-2 border-white">
                ⭐
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                {selectedCompany.name || "हमारे प्रतिष्ठान"}
              </h2>
              <p className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase mb-4">
                {selectedCompany.businessType ? (Array.isArray(selectedCompany.businessType) ? selectedCompany.businessType.join(" • ") : selectedCompany.businessType) : "आपका हार्दिक स्वागत करता है"}
              </p>

              {/* Standee QR Card */}
              <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-amber-400/80 mb-4 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${window.location.origin}/review/${selectedCompany._id || selectedCompany.id}`)}&margin=10`}
                  alt="Review Standee QR"
                  className="w-52 h-52 object-contain rounded-xl mx-auto"
                />
                <div className="mt-2 text-[10px] font-black text-slate-600 tracking-wide flex items-center justify-center gap-1">
                  📱 कैमरा या Google Lens से स्कैन करें
                </div>
              </div>

              {/* Rating Prompt & Reward Banner */}
              <div className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-3 rounded-2xl shadow-md mb-3 text-center">
                <div className="flex justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={15} className="fill-slate-950 text-slate-950" />
                  ))}
                </div>
                <p className="text-xs font-black tracking-wide">
                  5-स्टार रेटिंग दें व पाएं {selectedCompany.reviewRewardCouponDiscount || 10}% OFF कूपन!
                </p>
                <p className="text-[10px] font-bold opacity-90 mt-0.5">
                  कूपन कोड: <span className="font-mono bg-white/40 px-1.5 py-0.5 rounded text-slate-950 font-black">{selectedCompany.reviewRewardCouponCode || "STAR5"}</span>
                </p>
              </div>

              {/* Social Footnote */}
              <p className="text-[10px] text-slate-500 font-bold">
                📸 Instagram • 👍 Facebook • 📺 YouTube पर भी जुड़े रहें
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📲 WHATSAPP MULTI-CHANNEL QR CODE PAIRING MODAL */}
      {showWhatsAppQrModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">3-चैनल WhatsApp QR मैनेजर</h3>
                  <p className="text-[10px] text-slate-500 font-bold">चैनल चुनें व QR स्कैन करके बैकग्राउंड सेंडिंग जोड़ें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppQrModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Channel Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              {[
                { id: 'billing', label: '🧾 1. बिलिंग', color: 'emerald' },
                { id: 'recovery', label: '⚖️ 2. वसूली', color: 'amber' },
                { id: 'marketing', label: '📢 3. मार्केटिंग', color: 'indigo' }
              ].map(tab => {
                const isConn = Boolean(waChannels[tab.id]?.isConnected);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveWaModalChannel(tab.id);
                      if (!waChannels[tab.id]?.isConnected) {
                        handleStartWhatsAppSession(tab.id, false);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 text-xs font-extrabold rounded-lg transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                      activeWaModalChannel === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isConn && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Channel Details */}
            {waChannels[activeWaModalChannel]?.isConnected ? (
              <div className="text-center py-3 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check size={36} />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-800 text-base">
                    {activeWaModalChannel === 'recovery'
                      ? '⚖️ उधारी वसूली WhatsApp कनेक्टेड है!'
                      : activeWaModalChannel === 'marketing'
                      ? '📢 मार्केटिंग WhatsApp कनेक्टेड है!'
                      : '🧾 बिलिंग WhatsApp कनेक्टेड है!'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    लिंक मोबाइल: <span className="font-bold text-slate-900">+91 {waChannels[activeWaModalChannel]?.userPhone}</span>
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-900 text-left leading-relaxed">
                  🚀 <b>बैकग्राउंड सेंडिंग सक्रिय है!</b><br />
                  {activeWaModalChannel === 'recovery' && 'अब ग्राहकों को खाता विवरण, बकाया उधारी व लेट पेमेंट रिमाइंडर सीधे इसी नंबर से जाएंगे।'}
                  {activeWaModalChannel === 'marketing' && 'अब ग्राहकों को प्रोमोशनल ऑफर्स, डिस्काउंट व त्योहार के संदेश सीधे इसी नंबर से जाएंगे।'}
                  {activeWaModalChannel === 'billing' && 'अब ग्राहकों को दुकान के बिल, रसीद व पेमेंट लिंक सीधे इसी नंबर से जाएंगे।'}
                </div>

                <button
                  type="button"
                  onClick={() => handleDisconnectWhatsApp(activeWaModalChannel)}
                  disabled={loadingWaAction}
                  className="w-full py-2.5 rounded-2xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                >
                  {loadingWaAction ? "डिस्कनेक्ट हो रहा है..." : "इस चैनल को डिस्कनेक्ट करें (Disconnect)"}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-xs text-slate-600 font-medium">
                  {activeWaModalChannel === 'recovery' && '⚖️ उधारी वसूली व तगादे के लिए जिस फोन का उपयोग करना है, उसका WhatsApp लिंक करें:'}
                  {activeWaModalChannel === 'marketing' && '📢 मार्केटिंग, त्योहार व ऑफर्स के लिए जिस फोन का उपयोग करना है, उसका WhatsApp लिंक करें:'}
                  {activeWaModalChannel === 'billing' && '🧾 दुकान के बिल व रसीदें भेजने के लिए मुख्य WhatsApp लिंक करें:'}
                </div>

                {waChannels[activeWaModalChannel]?.qrDataUrl ? (
                  <div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner mb-2">
                      <img
                        src={waChannels[activeWaModalChannel].qrDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-52 h-52 mx-auto rounded-xl object-contain"
                      />
                    </div>
                    <div className="text-left bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-700 space-y-1">
                      <p className="font-extrabold text-slate-900">📲 कैसे कनेक्ट करें:</p>
                      <p>1. जिस फोन से संदेश भेजना है उसमें <b>WhatsApp</b> खोलें</p>
                      <p>2. ऊपर 3 डॉट्स (⋮) या Settings ➔ <b>Linked Devices</b> दबाएं</p>
                      <p>3. <b>Link a Device</b> दबाकर इस QR कोड को स्कैन करें</p>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-bold mt-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      स्कैन होने की प्रतीक्षा कर रहा है...
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3.5">
                    <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto shadow-sm" />
                    <p className="text-xs font-bold text-slate-700">QR कोड तैयार किया जा रहा है...</p>
                    <p className="text-[10px] text-slate-400">कृपया कुछ सेकंड प्रतीक्षा करें, QR कोड स्वतः स्क्रीन पर आ जाएगा।</p>
                    <button
                      type="button"
                      onClick={() => handleStartWhatsAppSession(activeWaModalChannel, true)}
                      disabled={loadingWaAction}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
                    >
                      {loadingWaAction ? "लोड हो रहा है..." : "पुनः QR कोड लोड करें (Refresh QR)"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;