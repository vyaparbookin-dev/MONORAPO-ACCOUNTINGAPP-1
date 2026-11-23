import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  MessageSquare, Send, Gift, Sparkles, Tag, Check, Copy, 
  RefreshCw, QrCode, Phone, MapPin, ExternalLink, Calendar, 
  Users, ShoppingBag, ShieldCheck, Flame, Percent, CheckCircle2,
  X, AlertCircle, ArrowRight, Clock
} from 'lucide-react';
import { openWhatsAppDirectly } from '../parties/PartiesPage';

// 📋 High-Converting Pre-Designed Offer & Festival Templates
const PRESET_TEMPLATES = [
  {
    id: 'discount_sale',
    name: '💥 बंपर डिस्काउंट सेल',
    badge: 'सर्वाधिक लोकप्रिय',
    badgeColor: 'bg-rose-100 text-rose-800',
    icon: Flame,
    title: '🎉 विशेष डिस्काउंट ऑफर (FLAT 15% OFF)',
    discount: '15% की छूट',
    validityDays: 5,
    tagline: 'सीमित समय के लिए विशेष बचत मौका!',
    notes: 'सभी प्रकार के सामानों पर लागू। जल्दी आएं और ऑफर का लाभ उठाएं।'
  },
  {
    id: 'festival_special',
    name: '🪔 त्योहार महा-बचत ऑफर',
    badge: 'त्योहार स्पेशल',
    badgeColor: 'bg-amber-100 text-amber-900',
    icon: Sparkles,
    title: '✨ पावन पर्व की हार्दिक शुभकामनाएं व महा-बचत सेल',
    discount: '₹250 फ्लैट छूट',
    validityDays: 7,
    tagline: 'त्योहार के शुभ अवसर पर अपने परिवार के लिए करें बंपर खरीदारी!',
    notes: 'न्यूनतम ₹1,500 की खरीदारी पर मान्य।'
  },
  {
    id: 'new_stock',
    name: '🔥 नया स्टॉक आगमन',
    badge: 'न्यू अराइवल',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: ShoppingBag,
    title: '🆕 नया स्टॉक व प्रीमियम कलेक्शन उपलब्ध!',
    discount: 'विशेष इंट्रोडक्टरी रेट्स',
    validityDays: 10,
    tagline: 'हमारी दुकान पर ताज़ा व नया सामान आ चुका है!',
    notes: 'सर्वोत्तम क्वालिटी एवं बाज़ार से कम दामों पर उपलब्ध।'
  },
  {
    id: 'loyalty_reward',
    name: '🎁 VIP ग्राहक सम्मान ऑफर',
    badge: 'लॉयल्टी रिवार्ड',
    badgeColor: 'bg-purple-100 text-purple-800',
    icon: Gift,
    title: '🤝 सम्मानित ग्राहक विशेष धन्यवाद ऑफर',
    discount: '₹200 लॉयल्टी कैश-बैक',
    validityDays: 15,
    tagline: 'हमारे साथ निरंतर जुड़े रहने के लिए आपका धन्यवाद!',
    notes: 'आप हमारे खास ग्राहक हैं, आपके अगले बिल पर विशेष छूट।'
  },
  {
    id: 'clearance_flash',
    name: '⏳ 24-घंटे फ्लैश सेल',
    badge: 'सीमित समय',
    badgeColor: 'bg-orange-100 text-orange-900',
    icon: Clock,
    title: '⚡ 24-घंटे की महा-क्लीयरेंस सेल!',
    discount: 'FLAT 20% OFF',
    validityDays: 2,
    tagline: 'केवल आज और कल के लिए मान्य - स्टॉक खत्म होने तक!',
    notes: 'पहले आओ, पहले पाओ के आधार पर।'
  },
  {
    id: 'paid_bill_receipt',
    name: '🧾 चुकता बिल व आभार रसीद',
    badge: 'बिल रसीद',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
    title: '🧾 भुगतान पावती व चुकता बिल (PAID RECEIPT)',
    discount: 'खाता चुकता',
    validityDays: 0,
    tagline: 'आपका भुगतान प्राप्त हुआ, बहुत-बहुत धन्यवाद!',
    notes: 'आपका खाता पूर्णतः चुकता व अपडेट कर दिया गया है।'
  }
];

export default function MarketingOffersPage() {
  const { selectedCompany, updateCompany } = useCompany() || {};
  const [parties, setParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);

  // Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState('discount_sale');
  const [offerTitle, setOfferTitle] = useState('🎉 विशेष डिस्काउंट ऑफर (FLAT 15% OFF)');
  const [discountValue, setDiscountValue] = useState('15% की छूट');
  const [couponCode, setCouponCode] = useState('OFFER15');
  const [minOrder, setMinOrder] = useState('₹999');
  const [validDays, setValidDays] = useState(5);
  const [offerNotes, setOfferNotes] = useState('सभी प्रकार के सामानों पर लागू। जल्दी आएं और ऑफर का लाभ उठाएं।');

  // Toggles
  const [includeGps, setIncludeGps] = useState(true);
  const [includeUpi, setIncludeUpi] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(true);

  // Recipient State
  const [recipientType, setRecipientType] = useState('party'); // 'party' | 'custom'
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customRecipientName, setCustomRecipientName] = useState('');

  // Editable Message State
  const [customizedMessage, setCustomizedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // WhatsApp Engine Session Status
  const [waStatus, setWaStatus] = useState({ isConnected: false, userPhone: null });
  const [sendingDirect, setSendingDirect] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Quick Shop Settings Sync State
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [quickUpiInput, setQuickUpiInput] = useState('');
  const [quickGpsInput, setQuickGpsInput] = useState('');
  const [savingQuickSetting, setSavingQuickSetting] = useState(false);

  // Fetch WhatsApp Engine Status for Marketing Channel
  const fetchWaStatus = async () => {
    try {
      const res = await api.get('/api/whatsapp/status?channel=marketing');
      if (res?.data?.success) {
        const marketingConn = Boolean(res.data.channels?.marketing?.isConnected);
        const billingConn = Boolean(res.data.channels?.billing?.isConnected);
        const effectiveConn = marketingConn || billingConn;
        const effectivePhone = marketingConn
          ? res.data.channels?.marketing?.userPhone
          : (res.data.channels?.billing?.userPhone || res.data.userPhone);

        setWaStatus({
          isConnected: effectiveConn,
          userPhone: effectivePhone || null,
          userName: res.data.userName || null,
          isDedicated: marketingConn,
          isInherited: !marketingConn && billingConn
        });
      }
    } catch (e) {}
  };

  // Fetch Parties for recipient picker
  useEffect(() => {
    fetchWaStatus();
    const loadParties = async () => {
      setLoadingParties(true);
      try {
        const res = await api.get('/api/parties');
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.parties || []);
        setParties(list);
        if (list.length > 0) {
          setSelectedPartyId(list[0]._id || list[0].id || '');
        }
      } catch (e) {}
      finally {
        setLoadingParties(false);
      }
    };
    loadParties();
  }, []);

  // Sync initial UPI and GPS from Company
  useEffect(() => {
    if (selectedCompany) {
      setQuickUpiInput(selectedCompany.upiId || '');
      setQuickGpsInput(selectedCompany.mapLocationUrl || '');
    }
  }, [selectedCompany]);

  // Selected party object
  const activeParty = useMemo(() => {
    return parties.find(p => (p._id || p.id) === selectedPartyId) || null;
  }, [parties, selectedPartyId]);

  // Auto-fill target phone
  const targetPhone = useMemo(() => {
    if (recipientType === 'party') {
      return (activeParty?.mobileNumber || activeParty?.phone || '').replace(/\D/g, '');
    }
    return customPhone.replace(/\D/g, '');
  }, [recipientType, activeParty, customPhone]);

  // Switch template
  const handleSelectTemplate = (t) => {
    setSelectedTemplateId(t.id);
    setOfferTitle(t.title);
    setDiscountValue(t.discount);
    setValidDays(t.validityDays);
    setOfferNotes(t.notes);
    if (t.id === 'discount_sale') setCouponCode('OFFER15');
    else if (t.id === 'festival_special') setCouponCode('FESTIVAL250');
    else if (t.id === 'loyalty_reward') setCouponCode('VIPREWARD');
    else setCouponCode('');
  };

  // Calculate validity date string
  const validDateStr = useMemo(() => {
    if (validDays <= 0) return '';
    const d = new Date();
    d.setDate(d.getDate() + Number(validDays));
    return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [validDays]);

  // Generate Message Text dynamically
  const generatedText = useMemo(() => {
    const comp = selectedCompany || {};
    const shopName = comp.name || 'हमारी दुकान';
    const shopPhone = comp.whatsappBusinessNumber || comp.phone || '';
    const callingPhone = comp.callingContactNumber || '';
    const mapLocationUrl = comp.mapLocationUrl || '';
    const shopAddress = comp.address || '';
    const upiId = comp.upiId ? String(comp.upiId).trim() : '';

    const recName = recipientType === 'party' 
      ? (activeParty?.name || 'सम्मानित ग्राहक') 
      : (customRecipientName.trim() || 'सम्मानित ग्राहक');

    let text = `नमस्ते *${recName}* जी,\n\n`;
    text += `${offerTitle}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (shopName) text += `🏪 *${shopName}*\n`;
    if (discountValue) text += `🎁 *ऑफर डिस्काउंट:* *${discountValue}*\n`;
    if (couponCode) text += `🏷️ *कूपन कोड:* *${couponCode}*\n`;
    if (minOrder) text += `🛍️ *न्यूनतम खरीद:* ${minOrder}\n`;
    if (validDateStr) text += `⏳ *अंतिम तिथि:* *${validDateStr}* तक मान्य\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (offerNotes) text += `📝 ${offerNotes}\n\n`;

    if (includeUpi && upiId) {
      text += `💳 *ऑनलाइन पेमेंट UPI ID:* ${upiId}\n`;
    }
    if (includeGps && mapLocationUrl) {
      text += `📍 *दुकान लोकेशन (Google Maps):* ${mapLocationUrl}\n`;
    }
    if (includeAddress && shopAddress) {
      text += `🏠 *दुकान का पता:* ${shopAddress}\n`;
    }
    if (includeContact && shopPhone) {
      text += `📞 *WhatsApp / संपर्क:* ${shopPhone}\n`;
      if (callingPhone && callingPhone !== shopPhone) {
        text += `📞 *कॉलिंग नंबर:* ${callingPhone}\n`;
      }
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `पधारने का कष्ट करें! हम आपकी सेवा के लिए तत्पर हैं। 🙏\n`;
    text += `*- ${shopName}*`;

    return text;
  }, [
    selectedCompany,
    offerTitle,
    discountValue,
    couponCode,
    minOrder,
    validDateStr,
    offerNotes,
    includeGps,
    includeUpi,
    includeContact,
    includeAddress,
    recipientType,
    activeParty,
    customRecipientName
  ]);

  // Keep customizedMessage in sync with generatedText unless user typed custom text
  useEffect(() => {
    setCustomizedMessage(generatedText);
  }, [generatedText]);

  // Quick Save Shop Profile Setting (UPI / GPS)
  const handleSaveQuickCompanySetting = async (field, val) => {
    if (!selectedCompany?._id) {
      alert("दुकान प्रोफाइल उपलब्ध नहीं है!");
      return;
    }
    setSavingQuickSetting(true);
    try {
      const payload = { ...selectedCompany, [field]: (val || '').trim() };
      const res = await api.put(`/api/company/${selectedCompany._id}`, payload);
      const updated = res.data?.company || res.data || payload;
      if (updateCompany) updateCompany(updated);
      alert(`✅ ${field === 'upiId' ? 'UPI ID' : 'GPS लोकेशन'} सफलतापूर्वक सुरक्षित हो गया और प्रोफाइल से सिंक हो गया!`);
    } catch (e) {
      alert("सेटिंग सेव करने में त्रुटि: " + (e.response?.data?.error || e.message));
    } finally {
      setSavingQuickSetting(false);
    }
  };

  // ⚡ 1-Click Background Send (via server Baileys engine)
  const handleSendBackground = async () => {
    if (!targetPhone || targetPhone.length < 10) {
      alert("कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें या पार्टी चुनें!");
      return;
    }
    if (!waStatus.isConnected) {
      alert("बैकग्राउंड WhatsApp इंजन कनेक्ट नहीं है! कृपया पहले QR कोड लिंक करें।");
      return;
    }

    setSendingDirect(true);
    setStatusMsg('');
    try {
      const res = await api.post('/api/whatsapp/send-direct', {
        toMobile: targetPhone,
        messageText: customizedMessage,
        channel: 'marketing'
      });
      if (res?.data?.success) {
        setStatusMsg(`✅ ऑफर संदेश WhatsApp (${targetPhone}) पर बैकग्राउंड में सफलतापूर्वक भेज दिया गया!`);
        setTimeout(() => setStatusMsg(''), 6000);
      } else {
        alert("संदेश भेजने में त्रुटि: " + (res?.data?.message || 'कृपया पुनः प्रयास करें'));
      }
    } catch (err) {
      alert("व्हाट्सएप सेंड विफल: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingDirect(false);
    }
  };

  // 🟢 Open in WhatsApp Web / Desktop App
  const handleOpenWeb = () => {
    if (!targetPhone || targetPhone.length < 10) {
      alert("कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें या पार्टी चुनें!");
      return;
    }
    openWhatsAppDirectly(targetPhone, customizedMessage);
  };

  // 📋 Copy message
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(customizedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      alert("कॉपी विफल!");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen font-sans space-y-5">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 mb-2">
            <Gift size={14} className="text-emerald-600" />
            <span>WhatsApp मार्केटिंग व प्रमोशन हब</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            📢 प्रमोशनल ऑफर्स व त्योहार संदेश (Campaign Hub)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ग्राहकों को त्योहार विश, डिस्काउंट कूपन, नया स्टॉक व स्पेशल ऑफर्स सीधे 1-क्लिक में WhatsApp पर भेजें
          </p>
        </div>

        {/* WhatsApp Session Status Pill */}
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-3 shrink-0 ${
          waStatus.isConnected ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${waStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <span className="font-black text-slate-900 block text-xs">
                {waStatus.isConnected ? `⚡ ऑटो-सेंड सक्रिय (+${waStatus.userPhone})` : '⚠️ ऑटो-सेंड डिस्कनेक्ट'}
              </span>
              <span className="text-[10px] text-slate-500">
                {waStatus.isConnected ? 'बिना WhatsApp खोले जाएगा' : 'QR कोड लिंक करें'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchWaStatus}
            className="p-1.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 text-slate-600 cursor-pointer transition shadow-2xs"
            title="स्टेटस रिफ्रेश करें"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ⚡ Quick Profile Settings Sync Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">⚙️</span>
            <span>दुकान विवरण (UPI & GPS - यहाँ से सेट करें, प्रोफाइल में ऑटो-सेव होगा):</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            {showQuickSettings ? 'छुपाएं ▲' : '+ सेटिंग्स खोलें / बदलें ▼'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            selectedCompany?.upiId ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span>💳 UPI ID:</span>
            <strong className="font-mono">{selectedCompany?.upiId || 'सेट नहीं है'}</strong>
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            selectedCompany?.mapLocationUrl ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span>📍 दुकान GPS:</span>
            <strong>{selectedCompany?.mapLocationUrl ? 'सेट है' : 'सेट नहीं है'}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <span>📞 दुकान नंबर:</span>
            <strong>{selectedCompany?.whatsappBusinessNumber || selectedCompany?.phone || 'दर्ज नहीं'}</strong>
          </div>
        </div>

        {showQuickSettings && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-slate-700 font-bold mb-1">💳 UPI ID (कस्टमर पेमेंट लिंक हेतु)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="उदा. 9828228943@okbizaxis"
                  value={quickUpiInput}
                  onChange={(e) => setQuickUpiInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  disabled={savingQuickSetting || !quickUpiInput.trim()}
                  onClick={() => handleSaveQuickCompanySetting('upiId', quickUpiInput)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingQuickSetting ? '...' : 'सेव'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">📍 Google Maps GPS लोकेशन लिंक</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={quickGpsInput}
                  onChange={(e) => setQuickGpsInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  disabled={savingQuickSetting || !quickGpsInput.trim()}
                  onClick={() => handleSaveQuickCompanySetting('mapLocationUrl', quickGpsInput)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingQuickSetting ? '...' : 'सेव'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Templates Selector Cards */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
          1. रेडीमेड मार्केटिंग व त्योहार टेम्पलेट चुनें:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTemplateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-2 shadow-xs ${
                  isSelected 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102' 
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : t.badgeColor
                  }`}>
                    {t.badge}
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-xs leading-tight">{t.name}</h4>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {t.discount}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Form Controls (Left) vs Phone Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Customizer & Recipient Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-3">
              <span>✍️ 2. ऑफर विवरण कस्टमाइज़ करें</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">📢 ऑफर हेडिंग / शीर्षक</label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🎁 छूट विवरण (Discount)</label>
                  <input
                    type="text"
                    placeholder="उदा. 15% OFF, ₹200 छूट"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🏷️ कूपन कोड (वैकल्पिक)</label>
                  <input
                    type="text"
                    placeholder="उदा. DIWALI15"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold font-mono text-slate-800 outline-none uppercase focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">🛍️ न्यूनतम खरीद</label>
                  <input
                    type="text"
                    placeholder="उदा. ₹999 पर मान्य"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">⏳ कितने दिन मान्य? (Validity)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">📝 अतिरिक्त विवरण / नोट्स</label>
                <textarea
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 resize-none text-xs"
                />
              </div>

              {/* Toggles */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">⚙️ संदेश में क्या शामिल करें?</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeGps(!includeGps)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      includeGps ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs' : 'bg-white text-slate-400 border-slate-200 line-through'
                    }`}
                  >
                    <span>{includeGps ? '☑️' : '⬜'} 📍 दुकान GPS मैप लिंक</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeUpi(!includeUpi)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      includeUpi ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' : 'bg-white text-slate-400 border-slate-200 line-through'
                    }`}
                  >
                    <span>{includeUpi ? '☑️' : '⬜'} 💳 UPI पेमेंट ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeContact(!includeContact)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      includeContact ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-2xs' : 'bg-white text-slate-400 border-slate-200 line-through'
                    }`}
                  >
                    <span>{includeContact ? '☑️' : '⬜'} 📞 दुकान संपर्क नंबर</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeAddress(!includeAddress)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      includeAddress ? 'bg-slate-800 text-white border-slate-700 shadow-2xs' : 'bg-white text-slate-400 border-slate-200 line-through'
                    }`}
                  >
                    <span>{includeAddress ? '☑️' : '⬜'} 🏠 दुकान पता</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Picker */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-3">
              <span>👤 3. किसे भेजना है? (Target Recipient)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRecipientType('party')}
                  className={`py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    recipientType === 'party' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600'
                  }`}
                >
                  <Users size={14} />
                  <span>पार्टी सूची से चुनें</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('custom')}
                  className={`py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    recipientType === 'custom' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600'
                  }`}
                >
                  <Phone size={14} />
                  <span>सीधा मोबाइल नंबर</span>
                </button>
              </div>

              {recipientType === 'party' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ग्राहक / पार्टी चुनें</label>
                  <select
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:border-indigo-500 bg-white"
                  >
                    {parties.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name} {p.mobileNumber && p.mobileNumber !== '9999999999' ? `(${p.mobileNumber})` : ''} - ₹{Math.abs(Number(p.currentBalance || p.balance || 0))}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ग्राहक का नाम (वैकल्पिक)</label>
                    <input
                      type="text"
                      placeholder="उदा. राहुल जी"
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">10-अंकों का WhatsApp मोबाइल नंबर *</label>
                    <div className="flex items-center gap-1 border border-slate-300 rounded-xl px-3 py-2 bg-white">
                      <span className="font-bold text-slate-500">+91</span>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="9876543210"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full outline-none font-bold text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WhatsApp Phone Mockup & Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-600" />
                <span>📱 लाइव WhatsApp पूर्वावलोकन</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'कॉपी हुआ!' : 'कॉपी'}</span>
              </button>
            </div>

            {/* Smartphone Frame */}
            <div className="rounded-3xl border-4 border-slate-800 bg-[#E5DDD5] p-3 shadow-inner space-y-2">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075E54] text-white p-2.5 rounded-2xl flex items-center gap-2 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-900 font-bold flex items-center justify-center text-xs">
                  {selectedCompany?.name ? selectedCompany.name.charAt(0) : '🏪'}
                </div>
                <div className="leading-tight">
                  <span className="font-black text-xs block truncate">
                    {selectedCompany?.name || 'आपकी दुकान'}
                  </span>
                  <span className="text-[9px] text-emerald-200">Business WhatsApp</span>
                </div>
              </div>

              {/* Chat Bubble (Editable) */}
              <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm border border-emerald-100 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap select-all">
                {customizedMessage}
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </span>
              </div>
            </div>

            {/* Editable Textarea for final tweaks */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>📝 भेजने से पहले सीधे टेक्स्ट एडिट करें:</span>
                <button
                  type="button"
                  onClick={() => setCustomizedMessage(generatedText)}
                  className="text-indigo-600 hover:underline cursor-pointer font-bold text-[10px]"
                >
                  🔄 मूल रीसेट
                </button>
              </div>
              <textarea
                rows={5}
                value={customizedMessage}
                onChange={(e) => setCustomizedMessage(e.target.value)}
                className="w-full p-2.5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono leading-relaxed border border-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 resize-none select-all"
              />
            </div>

            {/* Status Message Toast */}
            {statusMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Multi-Channel WhatsApp Profile Notice */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 font-bold">
                {waStatus.isConnected ? (
                  waStatus.isDedicated ? (
                    <span className="text-indigo-800">📢 समर्पित मार्केटिंग WhatsApp (+91 {waStatus.userPhone})</span>
                  ) : (
                    <span className="text-blue-800">🔄 बिलिंग WhatsApp बैकअप (+91 {waStatus.userPhone})</span>
                  )
                ) : (
                  <span className="text-slate-500">⚪ WhatsApp QR लिंक नहीं है</span>
                )}
              </span>
              <a
                href="/company"
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                title="सभी 3 WhatsApp नंबर बिज़नेस प्रोफाइल से प्रबंधित करें"
              >
                ⚙️ बिज़नेस प्रोफाइल
              </a>
            </div>

            {/* Action Send Buttons */}
            <div className="space-y-2 pt-2">
              {/* PRIMARY HERO BUTTON */}
              {waStatus.isConnected ? (
                <button
                  type="button"
                  disabled={sendingDirect}
                  onClick={handleSendBackground}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-60"
                  title="बिना WhatsApp खोले सीधे सर्वर से 1-क्लिक में भेजें"
                >
                  <Send size={16} />
                  <span>
                    {sendingDirect ? 'भेजा जा रहा है...' : `⚡ 1-क्लिक ऑटो-सेंड (+${waStatus.userPhone})`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenWeb}
                  className="w-full py-3.5 bg-[#25D366] hover:bg-green-600 text-white font-black text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  title="WhatsApp Web या Desktop App में खोलें"
                >
                  <MessageSquare size={16} />
                  <span>🟢 WhatsApp पर खोलें व भेजें</span>
                </button>
              )}

              {/* SECONDARY BUTTONS */}
              <div className="grid grid-cols-2 gap-2">
                {waStatus.isConnected ? (
                  <button
                    type="button"
                    onClick={handleOpenWeb}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300"
                    title="यदि Chrome के WhatsApp से भेजना चाहें"
                  >
                    <span>🌐 Web में खोलें</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchWaStatus}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200"
                    title="QR स्टेटस रिफ्रेश करें"
                  >
                    <span>🔄 QR चेक करें</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300"
                >
                  <Copy size={13} />
                  <span>{copied ? 'कॉपी हुआ!' : 'कॉपी करें'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
