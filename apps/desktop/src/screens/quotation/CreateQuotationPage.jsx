import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Camera,
  Upload,
  Search,
  Share2,
  Send,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Filter,
  Tag,
  Package,
  Layers,
  UserPlus,
  Building,
  Phone,
  MapPin,
  Calendar,
  X,
  MessageCircle,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing quotation
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data Masters
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);

  // Customer Mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState('existing');
  const [saveNewPartyToList, setSaveNewPartyToList] = useState(true);

  // Active Rate Tier: 'A' (Retail), 'B' (Wholesale), 'C' (Special/Dealer)
  const [activeRateTier, setActiveRateTier] = useState('A');

  // Product Filter State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Camera / Slip OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // WhatsApp Review Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Main Form Data
  const [formData, setFormData] = useState({
    partyId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    quotationNumber: '',
    rateTier: 'A',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    expectedPurchaseDate: '',
    followUpDate: '',
    items: [],
    notes: '1. यह कोटेशन 15 दिनों तक मान्य है।\n2. ऑर्डर कन्फर्म होने के 3 दिनों के भीतर माल दिया जाएगा।\n3. जीएसटी नियमानुसार लागू है।',
    subTotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partiesRes, productsRes, companyRes] = await Promise.all([
          api.get('/api/parties').catch(() => ({ parties: [] })),
          api.get('/api/inventory').catch(() => ({ products: [] })),
          api.get('/api/company').catch(() => null)
        ]);

        const loadedParties = partiesRes.parties || partiesRes.data?.parties || [];
        const loadedProducts = productsRes.products || productsRes.data?.products || [];
        setParties(loadedParties);
        setProducts(loadedProducts);

        if (companyRes?.companies && companyRes.companies.length > 0) {
          setCurrentCompany(companyRes.companies[0]);
        } else if (companyRes?.company) {
          setCurrentCompany(companyRes.company);
        }

        if (id) {
          const quotationRes = await api.get(`/api/quotations/${id}`);
          const q = quotationRes.data?.data || quotationRes.data;
          if (q) {
            const hasExistingParty = Boolean(q.partyId?._id || q.partyId);
            setCustomerMode(hasExistingParty ? 'existing' : 'new');
            setActiveRateTier(q.rateTier || 'A');

            // Format items with rate tiers
            const enrichedItems = (q.items || []).map((it, idx) => {
              const matchedProd = loadedProducts.find(p => String(p._id) === String(it.productId));
              const rA = Number(it.rateA || matchedProd?.sellingPrice || it.rate || 0);
              const rB = Number(it.rateB || matchedProd?.wholesalePrice || Math.round(rA * 0.95));
              const rC = Number(it.rateC || matchedProd?.dealerPrice || matchedProd?.p3Rate || Math.round(rA * 0.90));
              return {
                id: it._id || `item_${Date.now()}_${idx}`,
                productId: it.productId || null,
                name: it.name || it.itemName || '',
                category: it.category || matchedProd?.category || '',
                brand: it.brand || matchedProd?.brand || '',
                quantity: Number(it.quantity || 1),
                unit: it.unit || matchedProd?.unit || 'Pcs',
                rateTier: it.rateTier || q.rateTier || 'A',
                rateA: rA,
                rateB: rB,
                rateC: rC,
                rate: Number(it.rate || rA),
                taxRate: Number(it.taxRate || matchedProd?.gstRate || 0),
                total: Number(it.total || (it.quantity * it.rate)),
                isUnknown: Boolean(it.isUnknown)
              };
            });

            setFormData({
              partyId: q.partyId?._id || q.partyId || '',
              customerName: q.customerName || q.partyId?.name || '',
              customerPhone: q.customerPhone || q.partyId?.mobileNumber || '',
              customerAddress: q.customerAddress || q.partyId?.address || '',
              quotationNumber: q.quotationNumber || '',
              rateTier: q.rateTier || 'A',
              date: q.date ? new Date(q.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '',
              expectedPurchaseDate: q.expectedPurchaseDate ? new Date(q.expectedPurchaseDate).toISOString().split('T')[0] : '',
              followUpDate: q.followUpDate ? new Date(q.followUpDate).toISOString().split('T')[0] : '',
              items: enrichedItems,
              notes: q.notes || '',
              subTotal: Number(q.subTotal || 0),
              totalTax: Number(q.totalTax || 0),
              totalAmount: Number(q.totalAmount || 0),
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch quotation data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Extract unique categories and brands for filters
  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category && String(p.category).trim()) set.add(String(p.category).trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const brandsList = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.brand && String(p.brand).trim()) set.add(String(p.brand).trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products list for product selector
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (productSearchTerm.trim()) {
        const term = productSearchTerm.toLowerCase();
        const nameMatch = String(p.name || '').toLowerCase().includes(term);
        const skuMatch = String(p.sku || '').toLowerCase().includes(term);
        const barMatch = String(p.barcode || '').toLowerCase().includes(term);
        const aliasMatch = Array.isArray(p.aliases) && p.aliases.some(a => String(a).toLowerCase().includes(term));
        if (!nameMatch && !skuMatch && !barMatch && !aliasMatch) return false;
      }
      return true;
    }).slice(0, 30); // Show max 30 in quick-picker to avoid lag
  }, [products, selectedCategory, selectedBrand, productSearchTerm]);

  // Recalculate totals whenever items change
  const calculateTotals = (itemsList = formData.items) => {
    let subTotal = 0;
    let totalTax = 0;
    itemsList.forEach(item => {
      const lineSub = Number(item.quantity || 0) * Number(item.rate || 0);
      const lineTax = (lineSub * Number(item.taxRate || 0)) / 100;
      subTotal += lineSub;
      totalTax += lineTax;
    });
    const totalAmount = subTotal + totalTax;
    setFormData(prev => ({
      ...prev,
      subTotal: +subTotal.toFixed(2),
      totalTax: +totalTax.toFixed(2),
      totalAmount: +totalAmount.toFixed(2),
    }));
  };

  useEffect(() => {
    calculateTotals(formData.items);
  }, [formData.items]);

  // Party Selection Handler
  const handlePartySelect = (partyId) => {
    if (!partyId) {
      setFormData(prev => ({
        ...prev,
        partyId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
      return;
    }
    const selected = parties.find(p => String(p._id) === String(partyId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        partyId: selected._id,
        customerName: selected.name || '',
        customerPhone: selected.mobileNumber || '',
        customerAddress: selected.address || ''
      }));
    }
  };

  // 1-Click Global Rate Tier Switcher (Rate A / Rate B / Rate C)
  const handleGlobalRateTierSwitch = (newTier) => {
    setActiveRateTier(newTier);
    setFormData(prev => {
      const updatedItems = prev.items.map(it => {
        let newRate = it.rate;
        if (newTier === 'A') {
          newRate = it.rateA || it.rate;
        } else if (newTier === 'B') {
          newRate = it.rateB || Math.round((it.rateA || it.rate) * 0.95);
        } else if (newTier === 'C') {
          newRate = it.rateC || Math.round((it.rateA || it.rate) * 0.90);
        }

        const qty = Number(it.quantity || 1);
        const tax = Number(it.taxRate || 0);
        const sub = qty * newRate;
        const total = +(sub + (sub * tax) / 100).toFixed(2);

        return {
          ...it,
          rateTier: newTier,
          rate: newRate,
          total
        };
      });

      return {
        ...prev,
        rateTier: newTier,
        items: updatedItems
      };
    });
  };

  // Add Item to Quotation from catalog
  const handleAddProduct = (product) => {
    const rateA = Number(product.sellingPrice || 0);
    const rateB = Number(product.wholesalePrice || Math.round(rateA * 0.95));
    const rateC = Number(product.dealerPrice || product.p3Rate || Math.round(rateA * 0.90));

    let initialRate = rateA;
    if (activeRateTier === 'B') initialRate = rateB;
    if (activeRateTier === 'C') initialRate = rateC;

    const taxRate = Number(product.gstRate || 0);
    const quantity = 1;
    const sub = quantity * initialRate;
    const total = +(sub + (sub * taxRate) / 100).toFixed(2);

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product._id,
      name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      quantity,
      unit: product.unit || 'Pcs',
      rateTier: activeRateTier,
      rateA,
      rateB,
      rateC,
      rate: initialRate,
      taxRate,
      total,
      isUnknown: false
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setProductSearchTerm('');
    setShowProductSuggestions(false);
  };

  // Add Custom / Blank Item
  const handleAddCustomItem = () => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: null,
      name: productSearchTerm.trim() || 'नया सामान',
      category: selectedCategory || '',
      brand: selectedBrand || '',
      quantity: 1,
      unit: 'Pcs',
      rateTier: activeRateTier,
      rateA: 0,
      rateB: 0,
      rateC: 0,
      rate: 0,
      taxRate: 0,
      total: 0,
      isUnknown: false
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setProductSearchTerm('');
    setShowProductSuggestions(false);
  };

  // Update Item in Table
  const handleUpdateItemField = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index] };

      if (field === 'rateTier') {
        item.rateTier = value;
        if (value === 'A') item.rate = item.rateA || item.rate;
        else if (value === 'B') item.rate = item.rateB || Math.round((item.rateA || item.rate) * 0.95);
        else if (value === 'C') item.rate = item.rateC || Math.round((item.rateA || item.rate) * 0.90);
      } else {
        item[field] = value;
        if (field === 'rate') {
          item.rateTier = 'custom';
          item.isUnknown = false; // Owner typed the rate!
        }
      }

      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const tax = Number(item.taxRate || 0);
      const sub = qty * rate;
      item.total = +(sub + (sub * tax) / 100).toFixed(2);

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Preset Validity Dates
  const handleSetValidityPreset = (days) => {
    const d = new Date(formData.date || new Date());
    d.setDate(d.getDate() + days);
    setFormData(prev => ({ ...prev, validUntil: d.toISOString().split('T')[0] }));
  };

  // 🤖 Inbuilt AI Image-to-Quotation Scanner
  const handleOcrFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setOcrLoading(true);
    setOcrStatus('📸 पर्ची फोटो पढ़ी जा रही है...');

    try {
      const file = files[0];
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setOcrStatus('🤖 AI पर्ची से सामान व मात्रा निकाल रहा है...');

      const openAiKey = localStorage.getItem('OPENAI_API_KEY') || '';
      const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';

      const res = await api.post('/billing/parse-image', {
        images: [base64],
        openaiApiKey: openAiKey.trim() || undefined,
        geminiApiKey: geminiKey.trim() || undefined
      }).catch(() => null);

      let parsedItems = [];
      let detectedPartyName = '';

      if (res?.data?.batch && Array.isArray(res.data.bills) && res.data.bills[0]) {
        parsedItems = res.data.bills[0].parsedItems || [];
        detectedPartyName = res.data.bills[0].partyName || '';
      } else if (res?.data?.parsedItems) {
        parsedItems = res.data.parsedItems;
        detectedPartyName = res.data.partyName || '';
      }

      if (parsedItems.length === 0) {
        alert('⚠️ पर्ची से सामान स्पष्ट नहीं हो सका। कृपया साफ़ फोटो लें या नीचे मैन्युअल जोड़ें।');
        return;
      }

      setOcrStatus('📦 दुकान के सामानों व रेट्स से मिलान किया जा रहा है...');

      // Match parsed items against store's product catalog
      let matchedCount = 0;
      let unknownCount = 0;

      const newScannedItems = parsedItems.map((p, idx) => {
        const pName = (p.name || '').trim().toLowerCase();
        let matchedProd = products.find(prod => {
          const prodName = (prod.name || '').toLowerCase();
          return prodName === pName || (Array.isArray(prod.aliases) && prod.aliases.some(a => String(a).toLowerCase() === pName));
        });

        if (!matchedProd && pName) {
          const tokens = pName.split(/\s+/).filter(t => t.length >= 3);
          if (tokens.length > 0) {
            matchedProd = products.find(prod => {
              const prodName = (prod.name || '').toLowerCase();
              return tokens.some(t => prodName.includes(t));
            });
          }
        }

        const qty = Number(p.quantity || p.qty || 1);
        let rateA = 0;
        let rateB = 0;
        let rateC = 0;
        let initialRate = 0;
        let isUnknown = false;

        if (matchedProd) {
          matchedCount++;
          rateA = Number(matchedProd.sellingPrice || 0);
          rateB = Number(matchedProd.wholesalePrice || Math.round(rateA * 0.95));
          rateC = Number(matchedProd.dealerPrice || matchedProd.p3Rate || Math.round(rateA * 0.90));
          initialRate = activeRateTier === 'B' ? rateB : activeRateTier === 'C' ? rateC : rateA;
        } else {
          unknownCount++;
          isUnknown = true;
          // If slip had a price, use it; otherwise leave as 0 for owner review
          const slipPrice = Number(p.price || p.rate || 0);
          rateA = slipPrice;
          rateB = slipPrice;
          rateC = slipPrice;
          initialRate = slipPrice;
        }

        const taxRate = Number(matchedProd?.gstRate || 0);
        const sub = qty * initialRate;
        const total = +(sub + (sub * taxRate) / 100).toFixed(2);

        return {
          id: `scanned_${Date.now()}_${idx}`,
          productId: matchedProd?._id || null,
          name: matchedProd ? matchedProd.name : (p.name || `सामान ${idx + 1}`),
          category: matchedProd?.category || '',
          brand: matchedProd?.brand || '',
          quantity: qty,
          unit: p.unit || matchedProd?.unit || 'Pcs',
          rateTier: activeRateTier,
          rateA,
          rateB,
          rateC,
          rate: initialRate,
          taxRate,
          total,
          isUnknown
        };
      });

      // If customer name was found on slip and not currently set
      if (detectedPartyName && !formData.customerName) {
        setFormData(prev => ({ ...prev, customerName: detectedPartyName }));
        setCustomerMode('new');
      }

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, ...newScannedItems]
      }));

      alert(
        `✨ AI ने पर्ची से ${newScannedItems.length} सामान कोटेशन में जोड़ दिए!\n` +
        `• ${matchedCount} सामान दुकान के रेट (रेट ${activeRateTier}) से लिंक हो गए।\n` +
        (unknownCount > 0 ? `• ⚠️ ${unknownCount} सामान नए/अज्ञात हैं (नीचे पीला बॉर्डर दिखेगा), कृपया उनका रेट भर लें।` : '')
      );
    } catch (err) {
      console.error('Quotation AI Scan error:', err);
      alert('पर्ची पढ़ने में समस्या आई। कृपया साफ़ फोटो खींचकर पुनः प्रयास करें।');
    } finally {
      setOcrLoading(false);
      setOcrStatus('');
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Submit Quotation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.customerName.trim() && !formData.partyId) {
      alert('कृपया ग्राहक का नाम दर्ज करें या पार्टी चुनें!');
      return;
    }

    if (formData.items.length === 0) {
      alert('कृपया कोटेशन में कम से कम 1 सामान जोड़ें!');
      return;
    }

    // Check if any item has 0 rate and confirm
    const zeroRateItems = formData.items.filter(it => Number(it.rate || 0) <= 0);
    if (zeroRateItems.length > 0) {
      const ok = window.confirm(`⚠️ ${zeroRateItems.length} सामान का रेट ₹0 है। क्या आप वाकई इसे ऐसे ही सेव करना चाहते हैं?`);
      if (!ok) return;
    }

    setSaving(true);
    try {
      // 1. If new party mode and checkbox checked, save new party to parties list
      let finalPartyId = formData.partyId;
      if (customerMode === 'new' && saveNewPartyToList && !finalPartyId && formData.customerName.trim()) {
        try {
          const partyRes = await api.post('/api/parties', {
            name: formData.customerName.trim(),
            mobileNumber: formData.customerPhone.trim() || undefined,
            address: formData.customerAddress.trim() || undefined,
            type: 'Customer'
          });
          const created = partyRes.party || partyRes.data?.party || partyRes.data;
          if (created?._id) {
            finalPartyId = created._id;
          }
        } catch (partyErr) {
          console.warn('Auto party create warning:', partyErr.message);
        }
      }

      const payload = {
        ...formData,
        partyId: finalPartyId || undefined,
        rateTier: activeRateTier,
        items: formData.items.map(it => ({
          productId: it.productId || undefined,
          name: it.name,
          category: it.category,
          brand: it.brand,
          quantity: Number(it.quantity || 1),
          unit: it.unit || 'Pcs',
          rate: Number(it.rate || 0),
          rateTier: it.rateTier || activeRateTier,
          rateA: Number(it.rateA || 0),
          rateB: Number(it.rateB || 0),
          rateC: Number(it.rateC || 0),
          taxRate: Number(it.taxRate || 0),
          total: Number(it.total || 0),
          isUnknown: Boolean(it.isUnknown)
        }))
      };

      let savedQuotation = null;
      if (id) {
        const updateRes = await api.put(`/api/quotations/${id}`, payload);
        savedQuotation = updateRes.data?.data || updateRes.data;
        alert('✅ कोटेशन सफलतापूर्वक अपडेट हो गया!');
      } else {
        const createRes = await api.post('/api/quotations', payload);
        savedQuotation = createRes.data?.data || createRes.data;
        alert('✅ नया कोटेशन सफलतापूर्वक सेव हो गया!');
      }

      navigate('/quotations');
    } catch (err) {
      console.error('Failed to save quotation:', err);
      alert('कोटेशन सेव करने में त्रुटि: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Prepare & Open WhatsApp Review Modal
  const handleOpenWhatsAppModal = () => {
    const phone = formData.customerPhone || '';
    const shopName = currentCompany?.name || 'हमारी दुकान';
    const cName = formData.customerName || 'सम्मानित ग्राहक';

    let itemLines = '';
    formData.items.forEach((it, i) => {
      itemLines += `${i + 1}️⃣ *${it.name}* (${it.quantity} ${it.unit || 'Pcs'}) @ ₹${it.rate} = ₹${it.total}\n`;
    });

    const msg =
      `नमस्ते *${cName}* जी! 🙏\n\n` +
      `🏢 *${shopName}* की ओर से आपके लिए तैयार कोटेशन विवरण:\n` +
      `📅 दिनांक: ${formData.date}\n` +
      (formData.validUntil ? `⏳ वैधता: ${formData.validUntil} तक\n` : '') +
      `🏷️ लागू रेट: रेट ${activeRateTier}\n\n` +
      `📦 *सामान सूची:*\n` +
      itemLines +
      `\n` +
      `💰 *कुल योग: ₹${Number(formData.totalAmount).toLocaleString('en-IN')}*\n\n` +
      (formData.notes ? `📝 *नियम व शर्तें:*\n${formData.notes}\n\n` : '') +
      `ऑर्डर कन्फर्म करने हेतु कृपया इस संदेश का उत्तर दें या कॉल करें। धन्यवाद!`;

    setWhatsappPhone(phone);
    setWhatsappMessage(msg);
    setShowWhatsAppModal(true);
  };

  // Send WhatsApp Direct in Background
  const handleSendWhatsAppReview = async () => {
    if (!whatsappPhone.trim()) {
      alert('कृपया ग्राहक का मोबाइल नंबर दर्ज करें!');
      return;
    }
    setSendingWhatsApp(true);
    try {
      const res = await api.post('/api/whatsapp/send-direct', {
        toMobile: whatsappPhone.trim(),
        messageText: whatsappMessage,
        channel: 'billing'
      });

      if (res.data?.success) {
        alert('✅ WhatsApp कोटेशन संदेश बैकग्राउंड में ग्राहक को भेज दिया गया!');
        setShowWhatsAppModal(false);
      } else {
        alert('WhatsApp भेजने में विफल: ' + (res.data?.message || 'अज्ञात त्रुटि'));
      }
    } catch (err) {
      // Fallback to wa.me URL
      const cleanPhone = whatsappPhone.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/91${cleanPhone}?text=${encodedMsg}`, '_blank');
      setShowWhatsAppModal(false);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      {/* Hidden File Inputs for AI Slip Scanner */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleOcrFileSelect}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleOcrFileSelect}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {id ? '✏️ कोटेशन एडिट करें (Edit Quotation)' : '📝 नया कोटेशन बनाएं (Create Quotation)'}
              </h1>
              {formData.quotationNumber && (
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                  #{formData.quotationNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ग्राहकों को पेशेवर कोटेशन/एस्टीमेट जारी करें, AI से पर्ची स्कैन करें या 1-क्लिक में रेट टियर बदलें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenWhatsAppModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <MessageCircle size={15} /> <span>WhatsApp शेयर</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Save size={15} /> <span>{saving ? 'सेव हो रहा है...' : (id ? 'अपडेट कोटेशन' : 'कोटेशन सेव करें')}</span>
          </button>
        </div>
      </div>

      {/* 🤖 Inbuilt AI Slip Scanner Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles size={22} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <span>🤖 इनबिल्ट AI पर्ची स्कैनर (Handwritten Bill / Slip Scanner)</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Auto-Quotation
                </span>
              </h3>
              <p className="text-xs text-purple-100 mt-0.5 max-w-2xl leading-relaxed">
                कागज़ की पर्ची, हाथ से लिखा कच्चा बिल या पुरानी कोटेशन की फोटो खींचें — AI पर्ची के सभी सामान पढ़कर दुकान की इन्वेंट्री से रेट (रेट A) स्वतः कोटेशन में जोड़ देगा!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={ocrLoading}
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-indigo-900 hover:bg-purple-50 rounded-xl text-xs font-extrabold shadow transition active:scale-95 cursor-pointer"
            >
              <Camera size={15} className="text-indigo-600" /> <span>📸 कैमरा फोटो</span>
            </button>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Upload size={15} /> <span>🖼️ गैलरी अपलोड</span>
            </button>
          </div>
        </div>

        {ocrLoading && (
          <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3">
            <RefreshCw size={18} className="animate-spin text-amber-300 shrink-0" />
            <p className="text-xs font-bold text-amber-100">{ocrStatus || 'AI पर्ची पढ़ रहा है...'}</p>
          </div>
        )}
      </div>

      {/* Customer & Quotation Metadata Section */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">ग्राहक व कोटेशन विवरण</h3>
              <p className="text-[11px] text-slate-500">मौजूदा पार्टी चुनें या नए ग्राहक का नाम सीधे टाइप करें।</p>
            </div>
          </div>

          {/* Toggle Existing vs New Customer */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                customerMode === 'existing'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building size={13} /> <span>मौजूदा पार्टी चुनें</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerMode('new');
                setFormData(prev => ({ ...prev, partyId: '' }));
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                customerMode === 'new'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus size={13} /> <span>✍️ नया ग्राहक (Inline New)</span>
            </button>
          </div>
        </div>

        {/* Customer Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {customerMode === 'existing' ? (
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                पार्टी / खाता चुनें <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.partyId}
                onChange={(e) => handlePartySelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
              >
                <option value="">-- पार्टी सूची में से चुनें --</option>
                {parties.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.mobileNumber ? `(${p.mobileNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ग्राहक का पूरा नाम <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="उदा. श्री रमेश जी, वर्मा ट्रेडर्स"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 text-slate-800"
              />
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  id="savePartyCheck"
                  checked={saveNewPartyToList}
                  onChange={(e) => setSaveNewPartyToList(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="savePartyCheck" className="cursor-pointer">
                  💾 पार्टी लेजर में भी स्वतः जोड़ें
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              मोबाइल नंबर (WhatsApp हेतु)
            </label>
            <input
              type="text"
              placeholder="उदा. 9876543210"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ग्राहक का पता / शहर
            </label>
            <input
              type="text"
              placeholder="उदा. मेन रोड, रायपुर"
              value={formData.customerAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              कोटेशन दिनांक
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                कोटेशन वैधता (Valid Until)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold">त्वरित चुनें:</span>
                {[
                  { days: 7, label: '7 दिन' },
                  { days: 15, label: '15 दिन' },
                  { days: 30, label: '30 दिन' }
                ].map(p => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => handleSetValidityPreset(p.days)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              📅 संभावित खरीद दिनांक (Expected Purchase)
            </label>
            <input
              type="date"
              value={formData.expectedPurchaseDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedPurchaseDate: e.target.value }))}
              className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
              placeholder="कब सामान लेने की संभावना है"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ⏰ अगला फॉलो-अप कॉल (Follow-up Call)
            </label>
            <input
              type="date"
              value={formData.followUpDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
              className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white text-slate-800"
              placeholder="कब फोन करना है"
            />
          </div>
        </div>
      </div>

      {/* ⚡ 1-Click Global Rate Tier Switcher Toolbar */}
      <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-orange-50 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>1-क्लिक रेट टियर चयन (1-Click Rate Tier Switcher)</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.2 rounded-full border border-amber-300">
                  सभी सामान पर लागू
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                एक क्लिक में पूरे कोटेशन को रिटेल (रेट A), होलसेल (रेट B), या स्पेशल/डीलर (रेट C) में बदलें।
              </p>
            </div>
          </div>

          {/* Rate Tier Buttons */}
          <div className="inline-flex p-1 bg-white rounded-2xl border border-amber-300 shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleGlobalRateTierSwitch('A')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeRateTier === 'A'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🏷️ रेट A (रिटेल)</span>
              {activeRateTier === 'A' && <Check size={14} />}
            </button>
            <button
              type="button"
              onClick={() => handleGlobalRateTierSwitch('B')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeRateTier === 'B'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>📦 रेट B (होलसेल)</span>
              {activeRateTier === 'B' && <Check size={14} />}
            </button>
            <button
              type="button"
              onClick={() => handleGlobalRateTierSwitch('C')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeRateTier === 'C'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🌟 रेट C (स्पेशल/डीलर)</span>
              {activeRateTier === 'C' && <Check size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 🔍 Category, Brand & Product Picker Section */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              📦
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">इन्वेंट्री से सामान जोड़ें (Add Items)</h3>
              <p className="text-[11px] text-slate-500">
                कैटेगरी या ब्रांड चुनकर आसानी से 10-10 सामान सेलेक्ट करें, या नाम से सर्च करें।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} /> <span>+ कस्टम / अनाम सामान लिखें</span>
          </button>
        </div>

        {/* Filter Dropdowns + Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Layers size={13} className="text-indigo-600" />
              <span>1. श्रेणी / कैटेगरी चुनें (Category)</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 text-slate-800"
            >
              <option value="">-- सभी श्रेणियां ({categoriesList.length}) --</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Tag size={13} className="text-indigo-600" />
              <span>2. ब्रांड चुनें (Brand)</span>
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 text-slate-800"
            >
              <option value="">-- सभी ब्रांड्स ({brandsList.length}) --</option>
              {brandsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Search size={13} className="text-indigo-600" />
              <span>3. सामान का नाम या बारकोड सर्च करें</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="उदा. Havells Wire 1.5mm, Basmati Rice..."
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setShowProductSuggestions(true);
                }}
                onFocus={() => setShowProductSuggestions(true)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800 pr-8"
              />
              {productSearchTerm && (
                <button
                  type="button"
                  onClick={() => setProductSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtered Product Selection Cards / Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              उपलब्ध सामान {selectedCategory && `[${selectedCategory}]`} {selectedBrand && `[${selectedBrand}]`} ({filteredProducts.length}):
            </span>
            {(selectedCategory || selectedBrand || productSearchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setProductSearchTerm('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                फ़िल्टर साफ़ करें (Clear)
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              कोई सामान नहीं मिला। आप ऊपर <button type="button" onClick={handleAddCustomItem} className="text-blue-600 font-bold underline">कस्टम सामान जोड़ें</button> दबाकर नया सामान लिख सकते हैं।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
              {filteredProducts.map(p => {
                const rA = Number(p.sellingPrice || 0);
                const rB = Number(p.wholesalePrice || Math.round(rA * 0.95));
                const rC = Number(p.dealerPrice || p.p3Rate || Math.round(rA * 0.90));
                const currentTierRate = activeRateTier === 'B' ? rB : activeRateTier === 'C' ? rC : rA;

                return (
                  <div
                    key={p._id}
                    onClick={() => handleAddProduct(p)}
                    className="p-2.5 bg-white hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 truncate group-hover:text-indigo-700">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        {p.category && <span className="bg-slate-100 px-1.5 py-0.2 rounded">{p.category}</span>}
                        <span>स्टॉक: <b>{p.currentStock ?? '-'}</b> {p.unit || 'Pcs'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-emerald-700">₹{currentTierRate}</p>
                      <button
                        type="button"
                        className="text-[10px] font-black bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded-lg transition"
                      >
                        + जोड़ें
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 📋 Quotation Items Table (Inline Editable) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>📋 कोटेशन सामान सूची (Quotation Items)</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {formData.items.length} सामान
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              सामान का नाम, मात्रा, रेट या टैक्स सीधे टेबल में एडिट करें। किसी भी समय सुरक्षित रूप से बदला जा सकता है।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Plus size={14} /> <span>पंक्ति जोड़ें (Add Row)</span>
            </button>
          </div>
        </div>

        {formData.items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Package size={40} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">कोटेशन में अभी कोई सामान नहीं है।</p>
            <p className="text-[11px] text-slate-400">
              ऊपर AI पर्ची स्कैनर का प्रयोग करें या इन्वेंट्री से सामान चुनें।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3">सामान का नाम (Item Description)</th>
                  <th className="p-3 w-28 text-center">मात्रा (Qty)</th>
                  <th className="p-3 w-24 text-center">इकाई (Unit)</th>
                  <th className="p-3 w-36 text-center">रेट (Rate ₹)</th>
                  <th className="p-3 w-24 text-center">टैक्स (GST %)</th>
                  <th className="p-3 w-32 text-right">कुल राशि (₹)</th>
                  <th className="p-3 w-12 text-center">हटाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {formData.items.map((item, index) => (
                  <tr key={item.id || index} className={`hover:bg-slate-50/80 transition ${item.isUnknown ? 'bg-amber-50/50' : ''}`}>
                    <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                    
                    {/* Item Name */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItemField(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                      />
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        {item.category && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">{item.category}</span>}
                        {item.brand && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">{item.brand}</span>}
                        {item.isUnknown && (
                          <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                            <AlertCircle size={10} /> ⚠️ नया / रेट जांचें
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemField(index, 'quantity', e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                      />
                    </td>

                    {/* Unit */}
                    <td className="p-3 text-center">
                      <select
                        value={item.unit || 'Pcs'}
                        onChange={(e) => handleUpdateItemField(index, 'unit', e.target.value)}
                        className="w-20 px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Kg">Kg</option>
                        <option value="Ltr">Ltr</option>
                        <option value="Mtr">Mtr</option>
                        <option value="Nos">Nos</option>
                        <option value="Dozen">Dozen</option>
                        <option value="Set">Set</option>
                      </select>
                    </td>

                    {/* Rate & Tier */}
                    <td className="p-3 text-center">
                      <div className="space-y-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) => handleUpdateItemField(index, 'rate', e.target.value)}
                            className={`w-28 pl-6 pr-2 py-1.5 border rounded-lg text-xs font-black text-right focus:ring-2 outline-none ${
                              item.isUnknown && Number(item.rate) <= 0
                                ? 'border-amber-400 bg-amber-50 focus:ring-amber-500 text-rose-700'
                                : 'border-slate-300 bg-white focus:ring-blue-500 text-slate-900'
                            }`}
                          />
                        </div>
                        {/* Per-item Rate Tier Selector */}
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <button
                            type="button"
                            title={`रेट A: ₹${item.rateA || 0}`}
                            onClick={() => handleUpdateItemField(index, 'rateTier', 'A')}
                            className={`px-1.5 py-0.2 rounded font-extrabold ${item.rateTier === 'A' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            title={`रेट B: ₹${item.rateB || 0}`}
                            onClick={() => handleUpdateItemField(index, 'rateTier', 'B')}
                            className={`px-1.5 py-0.2 rounded font-extrabold ${item.rateTier === 'B' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            title={`रेट C: ₹${item.rateC || 0}`}
                            onClick={() => handleUpdateItemField(index, 'rateTier', 'C')}
                            className={`px-1.5 py-0.2 rounded font-extrabold ${item.rateTier === 'C' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            C
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* GST % */}
                    <td className="p-3 text-center">
                      <select
                        value={item.taxRate || 0}
                        onChange={(e) => handleUpdateItemField(index, 'taxRate', e.target.value)}
                        className="w-18 px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>

                    {/* Total */}
                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      ₹{Number(item.total).toFixed(2)}
                    </td>

                    {/* Delete */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Notes & Terms */}
          <div className="w-full sm:w-1/2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                📝 कोटेशन शर्तें व नोट्स (Terms & Conditions)
              </label>
              <span className="text-[10px] text-slate-400">ग्राहकों के बिल/WhatsApp पर दिखेगा</span>
            </div>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="उदा. 15 दिन वैधता, 50% अग्रिम भुगतान..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-800"
            />
          </div>

          {/* Amount Calculation Box */}
          <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 self-end">
            <div className="flex justify-between text-xs text-slate-600">
              <span>उप-योग (Sub Total):</span>
              <span className="font-bold">₹{formData.subTotal}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>कुल टैक्स (Total GST):</span>
              <span className="font-bold">₹{formData.totalTax}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900">
              <span className="text-sm font-extrabold">कुल देय राशि (Total Amount):</span>
              <span className="text-lg font-black text-blue-700">₹{formData.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save & Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/quotations')}
          className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          रद्द करें (Cancel)
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenWhatsAppModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition active:scale-95 cursor-pointer"
          >
            <MessageCircle size={16} /> <span>WhatsApp समीक्षा व भेजें</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
          >
            <Save size={16} /> <span>{saving ? 'सेव हो रहा है...' : (id ? 'कोटेशन अपडेट करें' : 'कोटेशन सेव करें')}</span>
          </button>
        </div>
      </div>

      {/* 💬 WhatsApp Review & Send Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">WhatsApp संदेश समीक्षा (Review & Send)</h4>
                  <p className="text-[11px] text-slate-500">भेजने से पहले संदेश व नंबर जांचें और मनचाहा बदलाव करें।</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ग्राहक का WhatsApp नंबर:
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="उदा. 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                संदेश सामग्री (Editable WhatsApp Message):
              </label>
              <textarea
                rows={9}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 bg-slate-50 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                बंद करें
              </button>
              <button
                type="button"
                disabled={sendingWhatsApp}
                onClick={handleSendWhatsAppReview}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition active:scale-95 cursor-pointer"
              >
                <Send size={15} /> <span>{sendingWhatsApp ? 'भेजा जा रहा है...' : 'अभी WhatsApp पर भेजें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
