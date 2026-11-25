import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  MessageSquare, Send, Gift, Sparkles, Tag, Check, Copy, 
  RefreshCw, QrCode, Phone, MapPin, ExternalLink, Calendar, 
  Users, ShoppingBag, ShieldCheck, Flame, Percent, CheckCircle2,
  X, AlertCircle, ArrowRight, Clock, Search, Filter, User, FileText, Eye, History
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


// 📱 Helper to validate 10-digit Indian Mobile Numbers
const isValidPhone = (ph) => {
  if (!ph) return false;
  const digits = String(ph).replace(/\D/g, '');
  if (digits.length < 10) return false;
  const last10 = digits.slice(-10);
  if (/^0+$/.test(last10) || /^9{10}$/.test(last10) || /^1{10}$/.test(last10)) return false;
  return true;
};

export default function MarketingOffersPage() {
  const { selectedCompany, updateCompany } = useCompany() || {};
  const [parties, setParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);

  // 📜 Main Page Navigation Tab: 'campaign' (ऑफर बनाएं) | 'outbox' (संदेश इतिहास)
  const [activeMainTab, setActiveMainTab] = useState('campaign');

  // 📜 WhatsApp Outbox & Audit Trail States
  const [outboxLogs, setOutboxLogs] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [outboxStats, setOutboxStats] = useState({ totalSent: 0, totalFailed: 0, todaySent: 0, byType: {} });
  const [outboxSearch, setOutboxSearch] = useState('');
  const [outboxTypeFilter, setOutboxTypeFilter] = useState('all');
  const [outboxStatusFilter, setOutboxStatusFilter] = useState('all');
  const [outboxPage, setOutboxPage] = useState(1);
  const [outboxTotalPages, setOutboxTotalPages] = useState(1);
  const [outboxTotalCount, setOutboxTotalCount] = useState(0);
  const [viewingLogMessage, setViewingLogMessage] = useState(null);

  const fetchOutboxLogs = async (page = 1) => {
    setOutboxLoading(true);
    try {
      const params = {
        page,
        limit: 30,
        search: outboxSearch,
        messageType: outboxTypeFilter,
        status: outboxStatusFilter
      };
      const [resLogs, resStats] = await Promise.all([
        api.get('/api/whatsapp/logs', { params }),
        api.get('/api/whatsapp/logs/stats')
      ]);
      if (resLogs.data?.success) {
        setOutboxLogs(resLogs.data.logs || []);
        setOutboxTotalPages(resLogs.data.totalPages || 1);
        setOutboxTotalCount(resLogs.data.totalCount || 0);
        setOutboxPage(resLogs.data.currentPage || 1);
      }
      if (resStats.data?.success) {
        setOutboxStats(resStats.data.stats || {});
      }
    } catch (err) {
      console.warn("Error fetching WhatsApp logs:", err.message);
    } finally {
      setOutboxLoading(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'outbox') {
      fetchOutboxLogs(1);
    }
  }, [activeMainTab, outboxTypeFilter, outboxStatusFilter]);

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

  // Recipient State: 'multiple' (मल्टीपल संपर्क / ब्रॉडकास्ट) | 'party' (सिंगल पार्टी) | 'custom' (सीधा नंबर)
  const [recipientType, setRecipientType] = useState('multiple');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customRecipientName, setCustomRecipientName] = useState('');

  // 👥 Multi-Select & Broadcast States
  const [selectedPartyIds, setSelectedPartyIds] = useState(new Set());
  const [multiFilter, setMultiFilter] = useState('all'); // 'all' | 'customer' | 'due' | 'supplier'
  const [multiSearch, setMultiSearch] = useState('');
  const [personalizeName, setPersonalizeName] = useState(true);

  // ⚡ Live Broadcast Engine States
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const broadcastStoppedRef = useRef(false);
  const [broadcastProgress, setBroadcastProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    currentContact: '',
    statusText: ''
  });
  const [broadcastLogs, setBroadcastLogs] = useState([]);

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
          // Pre-select all parties with valid mobile numbers
          const validIds = new Set(
            list.filter(p => isValidPhone(p.mobileNumber || p.phone)).map(p => p._id || p.id)
          );
          setSelectedPartyIds(validIds);
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

  // 🔍 Filtered Parties for Multi-Select List
  const filteredParties = useMemo(() => {
    return parties.filter(p => {
      if (multiFilter === 'customer' && p.type && p.type.toLowerCase() === 'supplier') return false;
      if (multiFilter === 'supplier' && (!p.type || p.type.toLowerCase() !== 'supplier')) return false;
      if (multiFilter === 'due') {
        const bal = Number(p.currentBalance || p.balance || 0);
        if (bal <= 0) return false;
      }
      if (multiSearch.trim()) {
        const q = multiSearch.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const phoneMatch = (p.mobileNumber || p.phone || '').includes(q);
        if (!nameMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [parties, multiFilter, multiSearch]);

  const validFilteredParties = useMemo(() => {
    return filteredParties.filter(p => isValidPhone(p.mobileNumber || p.phone));
  }, [filteredParties]);

  const selectedValidTargets = useMemo(() => {
    return parties.filter(p => selectedPartyIds.has(p._id || p.id) && isValidPhone(p.mobileNumber || p.phone));
  }, [parties, selectedPartyIds]);

  const handleToggleParty = (id) => {
    setSelectedPartyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedPartyIds(prev => {
      const next = new Set(prev);
      validFilteredParties.forEach(p => next.add(p._id || p.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedPartyIds(new Set());
  };

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

    const recName = recipientType === 'multiple'
      ? (selectedValidTargets[0]?.name || 'सम्मानित ग्राहक')
      : (recipientType === 'party' 
          ? (activeParty?.name || 'सम्मानित ग्राहक') 
          : (customRecipientName.trim() || 'सम्मानित ग्राहक'));

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

  // ⚡ 1-Click Multi-Contact WhatsApp Broadcast Engine
  const handleStartBroadcast = async () => {
    if (!waStatus.isConnected) {
      alert("⚠️ ऑटो-सेंड WhatsApp इंजन कनेक्ट नहीं है!\n\nमल्टीपल संपर्कों को 1-क्लिक में ब्रॉडकास्ट भेजने के लिए कृपया ऊपर दिए गए 'QR चेक करें' बटन से WhatsApp लिंक करें।");
      return;
    }
    const targets = selectedValidTargets;
    if (targets.length === 0) {
      alert("कृपया सूची में से कम से कम एक मान्य मोबाइल नंबर वाले संपर्क का चयन करें!");
      return;
    }

    if (!window.confirm(`📢 क्या आप वाकई चुने गए ${targets.length} ग्राहकों को WhatsApp ब्रॉडकास्ट संदेश भेजना चाहते हैं?`)) {
      return;
    }

    setIsBroadcasting(true);
    setShowBroadcastModal(true);
    broadcastStoppedRef.current = false;
    setBroadcastProgress({
      total: targets.length,
      sent: 0,
      failed: 0,
      currentContact: '',
      statusText: 'ब्रॉडकास्ट शुरू हो रहा है...'
    });
    setBroadcastLogs([]);

    let sentCount = 0;
    let failCount = 0;
    const logs = [];

    for (let i = 0; i < targets.length; i++) {
      if (broadcastStoppedRef.current) {
        setBroadcastProgress(prev => ({
          ...prev,
          statusText: '🛑 उपयोगकर्ता द्वारा ब्रॉडकास्ट बीच में रोक दिया गया।'
        }));
        break;
      }

      const party = targets[i];
      const rawPhone = (party.mobileNumber || party.phone || '').replace(/\D/g, '');
      const phone = rawPhone.slice(-10);
      const partyName = party.name || 'सम्मानित ग्राहक';

      setBroadcastProgress(prev => ({
        ...prev,
        currentContact: `${partyName} (+91 ${phone})`,
        statusText: `भेजा जा रहा है (${i + 1}/${targets.length}): ${partyName}...`
      }));

      // Personalize message with customer's name if enabled
      let msgToSend = customizedMessage;
      if (personalizeName) {
        if (/नमस्ते \*.*?\* जी,/i.test(msgToSend)) {
          msgToSend = msgToSend.replace(/नमस्ते \*.*?\* जी,/i, `नमस्ते *${partyName}* जी,`);
        } else {
          msgToSend = `नमस्ते *${partyName}* जी,\n\n` + msgToSend;
        }
      }

      try {
        const res = await api.post('/api/whatsapp/send-direct', {
          toMobile: phone,
          messageText: msgToSend,
          channel: 'marketing',
          recipientName: partyName,
          messageType: 'marketing'
        });

        if (res?.data?.success) {
          sentCount++;
          logs.unshift({
            name: partyName,
            phone,
            status: 'success',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
        } else {
          failCount++;
          logs.unshift({
            name: partyName,
            phone,
            status: 'failed',
            error: res?.data?.message || 'विफल',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
        }
      } catch (err) {
        failCount++;
        logs.unshift({
          name: partyName,
          phone,
          status: 'failed',
          error: err.response?.data?.message || err.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }

      setBroadcastProgress(prev => ({
        ...prev,
        sent: sentCount,
        failed: failCount
      }));
      setBroadcastLogs([...logs]);

      // Anti-spam delay between messages (1.5 to 2.5 seconds random interval)
      if (i < targets.length - 1 && !broadcastStoppedRef.current) {
        const delayMs = Math.floor(Math.random() * 1000) + 1500;
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    setIsBroadcasting(false);
    setBroadcastProgress(prev => ({
      ...prev,
      statusText: broadcastStoppedRef.current 
        ? `🛑 ब्रॉडकास्ट रोक दिया गया (${sentCount} सफल, ${failCount} विफल)` 
        : `🎉 ब्रॉडकास्ट संपन्न! कुल ${sentCount} संदेश सफलतापूर्वक भेजे गए (${failCount} विफल)।`
    }));
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
        channel: 'marketing',
        recipientName: recipientType === 'party' ? (activeParty?.name || 'ग्राहक') : (customRecipientName || 'ग्राहक'),
        messageType: 'marketing'
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
    if (window.confirm("⚠️ ध्यान दें: Chrome ब्राउज़र में जो भी WhatsApp लॉगिन होगा, उससे संदेश जाएगा। क्या आप Chrome में खोलना चाहते हैं?")) {
      openWhatsAppDirectly(targetPhone, customizedMessage);
    }
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
            📢 WhatsApp मार्केटिंग, ऑफर्स व संदेश ऑडिट हब
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ग्राहकों को त्योहार विश, डिस्काउंट कूपन, नया स्टॉक व स्पेशल ऑफर्स भेजें और सभी भेजे गए संदेशों का पूरा इतिहास ट्रैक करें
          </p>

          {/* 🌟 MAIN NAVIGATION TABS */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveMainTab('campaign')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-2xs ${
                activeMainTab === 'campaign'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Gift size={15} />
              <span>1. ऑफर व त्योहार संदेश बनाएं</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('outbox');
                fetchOutboxLogs(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-2xs ${
                activeMainTab === 'outbox'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <History size={15} />
              <span>2. भेजे गए संदेश इतिहास (Outbox Audit Log)</span>
            </button>
          </div>
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

      {/* TAB 1: CAMPAIGN BUILDER VIEW */}
      {activeMainTab === 'campaign' && (
        <div className="space-y-5 animate-in fade-in">
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
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>👤 3. किसे भेजना है? (Target Recipient)</span>
              </h3>
              {recipientType === 'multiple' && (
                <span className="text-[11px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                  चुने गए: {selectedValidTargets.length} संपर्क
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* 3 Tabs: Multiple Broadcast vs Single Party vs Custom Number */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRecipientType('multiple')}
                  className={`py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    recipientType === 'multiple' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} className="shrink-0" />
                  <span className="truncate">👥 मल्टीपल ब्रॉडकास्ट</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('party')}
                  className={`py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    recipientType === 'party' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User size={14} className="shrink-0" />
                  <span className="truncate">👤 एकल पार्टी</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('custom')}
                  className={`py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    recipientType === 'custom' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone size={14} className="shrink-0" />
                  <span className="truncate">📞 सीधा नंबर</span>
                </button>
              </div>

              {/* 👥 TAB 1: MULTIPLE RECIPIENTS / BROADCAST */}
              {recipientType === 'multiple' && (
                <div className="space-y-3 animate-in fade-in">
                  {/* Search and Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="नाम या मोबाइल नंबर से खोजें..."
                        value={multiSearch}
                        onChange={(e) => setMultiSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-8 py-2 text-xs outline-none focus:border-indigo-500 font-medium"
                      />
                      {multiSearch && (
                        <button
                          type="button"
                          onClick={() => setMultiSearch('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMultiFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          multiFilter === 'all'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        सभी ({parties.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilter('customer')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          multiFilter === 'customer'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        केवल ग्राहक ({parties.filter(p => !p.type || p.type.toLowerCase() !== 'supplier').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilter('due')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          multiFilter === 'due'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        उधारी वाले ({parties.filter(p => Number(p.currentBalance || p.balance || 0) > 0).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilter('supplier')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          multiFilter === 'supplier'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        सप्लायर ({parties.filter(p => p.type && p.type.toLowerCase() === 'supplier').length})
                      </button>
                    </div>
                  </div>

                  {/* Select All / Deselect All Bar */}
                  <div className="flex items-center justify-between text-xs bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold border border-indigo-200 cursor-pointer shadow-2xs active:scale-95 transition"
                      >
                        ☑️ सभी {validFilteredParties.length} चुनें
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200 cursor-pointer shadow-2xs active:scale-95 transition"
                      >
                        ⬜ सब हटाएं
                      </button>
                    </div>
                    <div className="font-extrabold text-indigo-900 text-xs">
                      चयनित: <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[11px] font-mono">{selectedValidTargets.length}</span>
                    </div>
                  </div>

                  {/* Scrollable Checkbox List */}
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white shadow-inner">
                    {filteredParties.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-bold">
                        कोई पार्टी नहीं मिली
                      </div>
                    ) : (
                      filteredParties.map(p => {
                        const pid = p._id || p.id;
                        const hasPhone = isValidPhone(p.mobileNumber || p.phone);
                        const isSelected = selectedPartyIds.has(pid);
                        const rawPhone = (p.mobileNumber || p.phone || '').replace(/\D/g, '');
                        const displayPhone = rawPhone.slice(-10);
                        const balance = Number(p.currentBalance || p.balance || 0);

                        return (
                          <div
                            key={pid}
                            onClick={() => hasPhone && handleToggleParty(pid)}
                            className={`p-2.5 flex items-center justify-between gap-2 text-xs transition select-none ${
                              !hasPhone 
                                ? 'opacity-40 bg-slate-50 cursor-not-allowed' 
                                : isSelected 
                                  ? 'bg-indigo-50/70 hover:bg-indigo-50 cursor-pointer' 
                                  : 'hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected && hasPhone}
                                disabled={!hasPhone}
                                onChange={() => {}}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-black text-slate-900 truncate">{p.name}</span>
                                  {p.type && p.type.toLowerCase() === 'supplier' ? (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded shrink-0">सप्लायर</span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1 rounded shrink-0">ग्राहक</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {hasPhone ? `+91 ${displayPhone}` : '⚠️ मोबाइल नंबर नहीं है'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`font-mono font-bold text-[11px] block ${balance > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                {balance > 0 ? `₹${balance.toLocaleString('en-IN')} लेना` : balance < 0 ? `₹${Math.abs(balance).toLocaleString('en-IN')} देना` : '₹0'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Personalization Toggle */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-slate-800 block text-xs">
                        👤 प्रत्येक ग्राहक को उनके नाम से संदेश भेजें
                      </span>
                      <span className="text-[10px] text-slate-500">
                        हर ग्राहक को उनके नाम के साथ 'नमस्ते *[पार्टी नाम]* जी' लिखा हुआ संदेश जाएगा
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPersonalizeName(!personalizeName)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        personalizeName ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                          personalizeName ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 👤 TAB 2: SINGLE PARTY SELECTOR */}
              {recipientType === 'party' && (
                <div className="space-y-2 animate-in fade-in">
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
              )}

              {/* 📞 TAB 3: CUSTOM MOBILE NUMBER */}
              {recipientType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
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
              {recipientType === 'multiple' ? (
                <>
                  {/* BROADCAST HERO BUTTON */}
                  {waStatus.isConnected ? (
                    <button
                      type="button"
                      disabled={isBroadcasting || selectedValidTargets.length === 0}
                      onClick={handleStartBroadcast}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                      title="चुने गए सभी संपर्कों को WhatsApp ब्रॉडकास्ट भेजें"
                    >
                      <Send size={16} />
                      <span>
                        {isBroadcasting
                          ? 'ब्रॉडकास्ट भेजा जा रहा है...'
                          : `⚡ ${selectedValidTargets.length} संपर्कों को ब्रॉडकास्ट भेजें`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        alert("⚠️ ऑटो-सेंड WhatsApp इंजन कनेक्ट नहीं है!\n\nमल्टीपल संपर्कों को 1-क्लिक में बैकग्राउंड ब्रॉडकास्ट भेजने के लिए ऊपर 'QR चेक करें' दबाकर अपना WhatsApp QR कोड स्कैन करें।");
                      }}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
                    >
                      <QrCode size={16} />
                      <span>⚠️ ब्रॉडकास्ट के लिए WhatsApp QR लिंक करें</span>
                    </button>
                  )}

                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                    💡 <strong>ब्रॉडकास्ट सुरक्षा:</strong> प्रत्येक ग्राहक को बिना आपका फोन खोले सीधे सर्वर से सुरक्षित अंतराल (Anti-Spam Delay 1.5-2.5 सेकंड) के साथ भेजा जाएगा ताकि आपका WhatsApp नंबर सुरक्षित रहे।
                  </div>
                </>
              ) : (
                <>
                  {/* SINGLE HERO BUTTON */}
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
                </>
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
      )}

      {/* TAB 2: WHATSAPP OUTBOX & AUDIT TRAIL VIEW */}
      {activeMainTab === 'outbox' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Live Stats Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-bold block">कुल संदेश भेजे</span>
                <strong className="text-2xl font-black text-slate-900 font-mono">{outboxStats.totalSent || 0}</strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-emerald-700 text-xs font-bold block">आज भेजे गए (Today)</span>
                <strong className="text-2xl font-black text-emerald-700 font-mono">{outboxStats.todaySent || 0}</strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-rose-700 text-xs font-bold block">विफल संदेश (Failed)</span>
                <strong className="text-2xl font-black text-rose-700 font-mono">{outboxStats.totalFailed || 0}</strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-blue-700 text-xs font-bold block">सफलता दर (Success)</span>
                <strong className="text-2xl font-black text-blue-700 font-mono">
                  {outboxStats.totalSent + outboxStats.totalFailed > 0
                    ? Math.round((outboxStats.totalSent / (outboxStats.totalSent + outboxStats.totalFailed)) * 100)
                    : 100}%
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
          </div>

          {/* Filter, Search & Refresh Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="ग्राहक का नाम, मोबाइल नंबर, इनवॉइस # या संदेश..."
                  value={outboxSearch}
                  onChange={(e) => setOutboxSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOutboxLogs(1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-9 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                />
                {outboxSearch && (
                  <button
                    type="button"
                    onClick={() => { setOutboxSearch(''); fetchOutboxLogs(1); }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => fetchOutboxLogs(1)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  <RefreshCw size={13} className={outboxLoading ? 'animate-spin' : ''} />
                  <span>रिफ्रेश</span>
                </button>
              </div>
            </div>

            {/* Type & Status Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 text-[11px]">प्रकार:</span>
              {[
                { id: 'all', label: 'सभी प्रकार' },
                { id: 'marketing', label: '📢 ऑफर्स / त्योहार' },
                { id: 'invoice', label: '🧾 बिल इनवॉइस' },
                { id: 'recovery', label: '⏳ उधारी तकादा' },
                { id: 'receipt', label: '💵 भुगतान पावती' },
                { id: 'direct', label: '💬 सीधा संदेश' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOutboxTypeFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    outboxTypeFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <span className="font-bold text-slate-500 text-[11px] ml-auto">स्थिति:</span>
              {[
                { id: 'all', label: 'सभी' },
                { id: 'sent', label: '✅ सफल' },
                { id: 'failed', label: '❌ विफल' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOutboxStatusFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    outboxStatusFilter === s.id
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outbox Data Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black text-[11px]">
                    <th className="p-3.5">तारीख व समय</th>
                    <th className="p-3.5">प्राप्तकर्ता (ग्राहक)</th>
                    <th className="p-3.5">संदेश प्रकार</th>
                    <th className="p-3.5">सेंडर WhatsApp</th>
                    <th className="p-3.5">भेजने वाला यूजर</th>
                    <th className="p-3.5">डिलीवरी स्थिति</th>
                    <th className="p-3.5 text-center">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {outboxLoading ? (
                    <tr>
                      <td colSpan="7" className="p-10 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>संदेश इतिहास लोड हो रहा है...</span>
                      </td>
                    </tr>
                  ) : outboxLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400">
                        <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                        <span className="font-bold block text-sm text-slate-600">कोई WhatsApp संदेश रिकॉर्ड नहीं मिला</span>
                        <span className="text-xs text-slate-400">जब आप बिल, कोटेशन, तकादा या ऑफर भेजेंगे, वे यहाँ अपने आप दर्ज होंगे।</span>
                      </td>
                    </tr>
                  ) : (
                    outboxLogs.map((log) => {
                      const dateStr = new Date(log.sentAt).toLocaleString('hi-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const typeBadge = {
                        marketing: { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: '📢 ऑफर / त्योहार' },
                        invoice: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: '🧾 बिल इनवॉइस' },
                        recovery: { bg: 'bg-amber-100 text-amber-900 border-amber-200', label: '⏳ उधारी तकादा' },
                        receipt: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: '💵 भुगतान पावती' },
                        quotation: { bg: 'bg-teal-100 text-teal-800 border-teal-200', label: '📝 कोटेशन' },
                        direct: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: '💬 सीधा संदेश' }
                      }[log.messageType] || { bg: 'bg-slate-100 text-slate-700', label: log.messageType };

                      return (
                        <tr key={log._id || log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {dateStr}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{log.recipientName || 'ग्राहक'}</div>
                            <div className="font-mono text-slate-500 text-[10px]">+91 {log.recipientPhone}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${typeBadge.bg}`}>
                              {typeBadge.label}
                            </span>
                            {log.documentNumber && (
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                                #{log.documentNumber}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                            {log.senderPhone ? `+91 ${log.senderPhone.slice(-10)}` : '—'}
                            <span className="text-[9px] text-slate-400 block uppercase">[{log.channel || 'billing'}]</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block text-[11px]">
                              {log.sentByUserName || 'व्यापारी'}
                            </span>
                            {log.sentByUserId && (
                              <span className="text-[9px] text-slate-400 font-mono block">
                                ID: {log.sentByUserId.slice(-6)}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.status === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>सफल (Sent)</span>
                              </span>
                            ) : (
                              <div className="leading-tight">
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px]">
                                  <AlertCircle size={12} className="text-rose-600" />
                                  <span>विफल</span>
                                </span>
                                {log.statusReason && (
                                  <span className="text-[9px] text-rose-500 block max-w-xs truncate mt-0.5" title={log.statusReason}>
                                    {log.statusReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewingLogMessage(log)}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-[11px] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="भेजा गया पूरा संदेश देखें"
                            >
                              <Eye size={12} />
                              <span>देखें</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {outboxTotalPages > 1 && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  कुल <strong>{outboxTotalCount}</strong> संदेशों में से पृष्ठ <strong>{outboxPage}</strong> of <strong>{outboxTotalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={outboxPage <= 1}
                    onClick={() => fetchOutboxLogs(outboxPage - 1)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ◀ पिछला
                  </button>
                  <button
                    type="button"
                    disabled={outboxPage >= outboxTotalPages}
                    onClick={() => fetchOutboxLogs(outboxPage + 1)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                  >
                    अगला ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 MODAL: VIEW SENT MESSAGE DETAILS */}
      {viewingLogMessage && (
        <div className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-800">
                  💬 भेजा गया WhatsApp संदेश
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(viewingLogMessage.sentAt).toLocaleString('hi-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingLogMessage(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient & Sender Pill */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">प्राप्तकर्ता:</span>
                <span className="font-black text-slate-900">{viewingLogMessage.recipientName} (+91 {viewingLogMessage.recipientPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">सेंडर नंबर:</span>
                <span className="font-mono text-slate-700">{viewingLogMessage.senderPhone ? `+91 ${viewingLogMessage.senderPhone.slice(-10)}` : 'डिफ़ॉल्ट'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">भेजने वाला यूजर:</span>
                <span className="font-bold text-indigo-700">{viewingLogMessage.sentByUserName || 'व्यापारी'}</span>
              </div>
            </div>

            {/* Message Bubble */}
            <div className="bg-[#E5DDD5] p-3 rounded-2xl shadow-inner max-h-72 overflow-y-auto">
              <div className="bg-white p-3 rounded-xl rounded-tl-none text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                {viewingLogMessage.messageText}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewingLogMessage.messageText);
                  alert("संदेश कॉपी कर लिया गया!");
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={13} />
                <span>कॉपी करें</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingLogMessage(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📢 LIVE BROADCAST PROGRESS & REPORT MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'}`} />
                <h3 className="font-black text-base text-slate-800">
                  {isBroadcasting ? "📢 WhatsApp ब्रॉडकास्ट प्रगति..." : "🎉 ब्रॉडकास्ट संपन्न"}
                </h3>
              </div>
              {!isBroadcasting && (
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span className="truncate pr-2">{broadcastProgress.statusText}</span>
                <span className="font-mono text-indigo-700 shrink-0">
                  {broadcastProgress.total > 0
                    ? `${Math.round(((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-300 rounded-full font-bold text-[9px] text-white flex items-center justify-center"
                  style={{
                    width: `${broadcastProgress.total > 0
                      ? Math.round(((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100)
                      : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Live Stats Counters */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold">कुल संपर्क</span>
                <strong className="text-base font-black text-slate-800 font-mono">{broadcastProgress.total}</strong>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-bold">सफल भेजे</span>
                <strong className="text-base font-black text-emerald-700 font-mono">{broadcastProgress.sent}</strong>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-700 block font-bold">विफल</span>
                <strong className="text-base font-black text-rose-700 font-mono">{broadcastProgress.failed}</strong>
              </div>
            </div>

            {/* Activity Log */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600 block">गतिविधि विवरण (Delivery Log):</span>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 p-1 text-[11px] font-sans">
                {broadcastLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">शुरू होने की प्रतीक्षा...</div>
                ) : (
                  broadcastLogs.map((log, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {log.status === 'success' ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold text-slate-800 truncate">{log.name}</span>
                        <span className="text-slate-400 font-mono text-[10px] shrink-0">(+91 {log.phone})</span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${log.status === 'success' ? 'text-emerald-700 font-bold' : 'text-rose-600'}`}>
                        {log.status === 'success' ? `सफल (${log.time})` : `विफल: ${log.error || ''}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-2">
              {isBroadcasting ? (
                <button
                  type="button"
                  onClick={() => {
                    broadcastStoppedRef.current = true;
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <X size={15} /> 🛑 ब्रॉडकास्ट रोकें (Stop Broadcast)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check size={15} /> ✓ संपन्न • विंडो बंद करें
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}