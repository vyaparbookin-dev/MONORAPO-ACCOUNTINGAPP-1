import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Share2,
  RefreshCw,
  Search,
  Camera,
  Upload,
  Calendar,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  X,
  ChevronRight,
  Printer,
  Sparkles,
  Edit,
  ShoppingCart,
  Send,
  AlertCircle,
  Check,
  Layers,
  Tag,
  Building,
  UserPlus
} from "lucide-react";
import api from "../../services/api";

export default function MobileQuotationModal({
  isOpen,
  onClose,
  inventoryItems = [],
  parties = [],
  onConvertToBill,
  currentCompany
}) {
  if (!isOpen) return null;

  // View modes: 'list', 'form'
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'converted'

  // Customer Mode in Form: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState("existing");
  const [selectedPartyId, setSelectedPartyId] = useState("");

  // Rate Tier State: 'A' (Retail), 'B' (Wholesale), 'C' (Special/Dealer)
  const [activeRateTier, setActiveRateTier] = useState("A");

  // Category & Brand Filter State for adding products
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  // Form State
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("1. यह कोटेशन 15 दिनों तक मान्य है।\n2. जीएसटी नियमानुसार लागू है।");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Item Search in Form
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Camera / Slip OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const companyName = currentCompany?.name || "मेरी दुकान / व्यापार";
  const companyPhone = currentCompany?.phone || currentCompany?.mobileNumber || "";

  // Load Quotations
  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/quotations").catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setQuotations(res.data.data);
        try {
          localStorage.setItem("vb_local_quotations", JSON.stringify(res.data.data));
        } catch (e) {}
      } else {
        const local = JSON.parse(localStorage.getItem("vb_local_quotations") || "[]");
        setQuotations(local);
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem("vb_local_quotations") || "[]");
      setQuotations(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Extract unique categories and brands from inventory
  const categoriesList = useMemo(() => {
    const set = new Set();
    (inventoryItems || []).forEach((p) => {
      if (p.category && String(p.category).trim()) set.add(String(p.category).trim());
    });
    return Array.from(set).sort();
  }, [inventoryItems]);

  const brandsList = useMemo(() => {
    const set = new Set();
    (inventoryItems || []).forEach((p) => {
      if (p.brand && String(p.brand).trim()) set.add(String(p.brand).trim());
    });
    return Array.from(set).sort();
  }, [inventoryItems]);

  // Filtered Products for Mobile Quick-Add
  const filteredProducts = useMemo(() => {
    return (inventoryItems || []).filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (itemSearchTerm.trim()) {
        const term = itemSearchTerm.toLowerCase();
        const nameMatch = String(p.name || "").toLowerCase().includes(term);
        const codeMatch = String(p.barcode || p.sku || "").toLowerCase().includes(term);
        const aliasMatch = Array.isArray(p.aliases) && p.aliases.some((a) => String(a).toLowerCase().includes(term));
        if (!nameMatch && !codeMatch && !aliasMatch) return false;
      }
      return true;
    }).slice(0, 20);
  }, [inventoryItems, selectedCategory, selectedBrand, itemSearchTerm]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter === "pending" && (q.status === "converted" || q.status === "invoiced")) return false;
      if (statusFilter === "converted" && q.status !== "converted" && q.status !== "invoiced") return false;

      if (!searchQuery.trim()) return true;
      const qText = searchQuery.toLowerCase();
      const cName = String(q.customerName || q.partyId?.name || "").toLowerCase();
      const cPhone = String(q.customerPhone || q.partyId?.mobileNumber || "");
      const qNum = String(q.quotationNumber || "").toLowerCase();
      const cAddr = String(q.customerAddress || q.partyId?.address || q.partyId?.city || "").toLowerCase();
      const dStr = q.date ? new Date(q.date).toLocaleDateString("hi-IN") : "";
      const dIso = q.date ? new Date(q.date).toISOString().slice(0, 10) : "";
      const expStr = q.expectedPurchaseDate ? new Date(q.expectedPurchaseDate).toLocaleDateString("hi-IN") : "";
      const hasItem = (q.items || []).some((it) => String(it.name || "").toLowerCase().includes(qText));

      return (
        cName.includes(qText) ||
        cPhone.includes(qText) ||
        qNum.includes(qText) ||
        cAddr.includes(qText) ||
        dStr.includes(qText) ||
        dIso.includes(qText) ||
        expStr.includes(qText) ||
        hasItem
      );
    });
  }, [quotations, statusFilter, searchQuery]);

  // Reset Form
  const resetForm = () => {
    setEditingQuotationId(null);
    setCustomerMode("existing");
    setSelectedPartyId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setValidUntil("");
    setExpectedPurchaseDate("");
    setFollowUpDate("");
    setQuotationDate(new Date().toISOString().split("T")[0]);
    setNotes("1. यह कोटेशन 15 दिनों तक मान्य है।\n2. जीएसटी नियमानुसार लागू है।");
    setItems([]);
    setActiveRateTier("A");
    setSelectedCategory("");
    setSelectedBrand("");
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setViewMode("form");
  };

  const handleOpenEdit = (quotation) => {
    setEditingQuotationId(quotation._id || quotation.id);
    const hasParty = Boolean(quotation.partyId?._id || quotation.partyId);
    setCustomerMode(hasParty ? "existing" : "new");
    setSelectedPartyId(quotation.partyId?._id || quotation.partyId || "");
    setCustomerName(quotation.customerName || quotation.partyId?.name || "");
    setCustomerPhone(quotation.customerPhone || quotation.partyId?.mobileNumber || "");
    setCustomerAddress(quotation.customerAddress || quotation.partyId?.address || "");
    setValidUntil(quotation.validUntil ? quotation.validUntil.split("T")[0] : "");
    setExpectedPurchaseDate(quotation.expectedPurchaseDate ? quotation.expectedPurchaseDate.split("T")[0] : "");
    setFollowUpDate(quotation.followUpDate ? quotation.followUpDate.split("T")[0] : "");
    setQuotationDate(quotation.date ? quotation.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setNotes(quotation.notes || "");
    setActiveRateTier(quotation.rateTier || "A");

    const enrichedItems = (quotation.items || []).map((it, idx) => {
      const matched = (inventoryItems || []).find((p) => String(p._id || p.id) === String(it.productId));
      const rA = Number(it.rateA || matched?.sellingPrice || it.rate || 0);
      const rB = Number(it.rateB || matched?.wholesalePrice || Math.round(rA * 0.95));
      const rC = Number(it.rateC || matched?.dealerPrice || matched?.p3Rate || Math.round(rA * 0.90));
      return {
        id: it._id || it.id || `item_${idx}_${Date.now()}`,
        productId: it.productId || null,
        name: it.name || it.itemName || "",
        category: it.category || matched?.category || "",
        brand: it.brand || matched?.brand || "",
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit || matched?.unit || "Pcs",
        rateTier: it.rateTier || quotation.rateTier || "A",
        rateA: rA,
        rateB: rB,
        rateC: rC,
        rate: Number(it.rate || rA),
        taxRate: Number(it.taxRate || 0),
        total: Number(it.total || (it.quantity || 1) * (it.rate || 0)),
        isUnknown: Boolean(it.isUnknown)
      };
    });

    setItems(enrichedItems);
    setViewMode("form");
  };

  // Party Selection Handler
  const handlePartySelect = (partyId) => {
    setSelectedPartyId(partyId);
    if (!partyId) {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      return;
    }
    const p = parties.find((party) => String(party._id || party.id) === String(partyId));
    if (p) {
      setCustomerName(p.name || "");
      setCustomerPhone(p.mobileNumber || "");
      setCustomerAddress(p.address || "");
    }
  };

  // 1-Click Global Rate Tier Switcher (Rate A / Rate B / Rate C)
  const handleGlobalRateTierSwitch = (newTier) => {
    setActiveRateTier(newTier);
    setItems((prev) =>
      prev.map((it) => {
        let newRate = it.rate;
        if (newTier === "A") newRate = it.rateA || it.rate;
        else if (newTier === "B") newRate = it.rateB || Math.round((it.rateA || it.rate) * 0.95);
        else if (newTier === "C") newRate = it.rateC || Math.round((it.rateA || it.rate) * 0.90);

        const qty = Number(it.quantity || 1);
        const sub = qty * newRate;
        const tax = Number(it.taxRate || 0);
        const total = +(sub + (sub * tax) / 100).toFixed(2);

        return {
          ...it,
          rateTier: newTier,
          rate: newRate,
          total
        };
      })
    );
  };

  // Add Item From Catalog
  const handleAddItemFromCatalog = (product) => {
    const rateA = Number(product.sellingPrice || product.salePrice || 0);
    const rateB = Number(product.wholesalePrice || Math.round(rateA * 0.95));
    const rateC = Number(product.dealerPrice || product.p3Rate || Math.round(rateA * 0.90));
    const initialRate = activeRateTier === "B" ? rateB : activeRateTier === "C" ? rateC : rateA;

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product._id || product.id,
      name: product.name,
      category: product.category || "",
      brand: product.brand || "",
      quantity: 1,
      unit: product.unit || "Pcs",
      rateTier: activeRateTier,
      rateA,
      rateB,
      rateC,
      rate: initialRate,
      taxRate: Number(product.gstRate || 0),
      total: initialRate,
      isUnknown: false
    };

    setItems((prev) => [...prev, newItem]);
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  // Add Manual Custom Item
  const handleAddManualCustomItem = () => {
    const rawName = itemSearchTerm.trim() || "नया सामान";
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: null,
      name: rawName,
      category: selectedCategory || "",
      brand: selectedBrand || "",
      quantity: 1,
      unit: "Pcs",
      rateTier: activeRateTier,
      rateA: 0,
      rateB: 0,
      rateC: 0,
      rate: 0,
      taxRate: 0,
      total: 0,
      isUnknown: false
    };
    setItems((prev) => [...prev, newItem]);
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  // Update Item Fields in Table
  const handleUpdateItemField = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[index] };

      if (field === "rateTier") {
        it.rateTier = value;
        if (value === "A") it.rate = it.rateA || it.rate;
        else if (value === "B") it.rate = it.rateB || Math.round((it.rateA || it.rate) * 0.95);
        else if (value === "C") it.rate = it.rateC || Math.round((it.rateA || it.rate) * 0.90);
      } else {
        it[field] = value;
        if (field === "rate") {
          it.rateTier = "custom";
          it.isUnknown = false;
        }
      }

      const qty = Number(it.quantity || 0);
      const rate = Number(it.rate || 0);
      const tax = Number(it.taxRate || 0);
      const sub = qty * rate;
      it.total = +(sub + (sub * tax) / 100).toFixed(2);

      next[index] = it;
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const formSubTotal = useMemo(() => {
    return items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.rate || 0), 0);
  }, [items]);

  const formTotalAmount = useMemo(() => {
    return items.reduce((s, it) => s + (Number(it.total) || Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  }, [items]);

  // 🤖 Camera / Slip OCR Scanner for Quotation
  const handleOcrFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setOcrLoading(true);
    setOcrStatus("📸 पर्ची स्कैन हो रही है...");

    try {
      const file = files[0];
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setOcrStatus("🤖 AI पर्ची से सामान व मात्रा पढ़ रहा है...");

      const openAiKey = localStorage.getItem("OPENAI_API_KEY") || "";
      const geminiKey = localStorage.getItem("GEMINI_API_KEY") || "";

      const res = await api
        .post("/api/billing/parse-image", {
          images: [base64],
          openaiApiKey: openAiKey.trim() || undefined,
          geminiApiKey: geminiKey.trim() || undefined
        })
        .catch(() => null);

      let parsedItems = [];
      let detectedPartyName = "";

      if (res?.data?.batch && Array.isArray(res.data.bills) && res.data.bills[0]) {
        parsedItems = res.data.bills[0].parsedItems || [];
        detectedPartyName = res.data.bills[0].partyName || "";
      } else if (res?.data?.parsedItems) {
        parsedItems = res.data.parsedItems;
        detectedPartyName = res.data.partyName || "";
      }

      if (parsedItems.length === 0) {
        alert("⚠️ पर्ची से सामान स्पष्ट नहीं हो सका। कृपया साफ़ फोटो लें या नीचे मैन्युअल जोड़ें।");
        return;
      }

      setOcrStatus("🔍 दुकान के 1600+ सामानों से सटीक मिलान किया जा रहा है...");

      // Smart Product Matching against inventoryItems
      let matchedCount = 0;
      let unknownCount = 0;

      const matched = parsedItems.map((p, idx) => {
        const pName = (p.name || "").trim().toLowerCase();

        // 1. Exact Name or Alias Match
        let catItem = (inventoryItems || []).find((ci) => {
          const cName = (ci.name || "").toLowerCase().trim();
          return cName === pName || (Array.isArray(ci.aliases) && ci.aliases.some((a) => String(a).toLowerCase().trim() === pName));
        });

        // 2. Smart Token Overlap Match (>= 50% words)
        if (!catItem && pName) {
          const tokens = pName.split(/[\s,._\-/]+/).filter((t) => t.length >= 2);
          if (tokens.length > 0) {
            let bestScore = 0;
            let bestItem = null;
            for (const ci of inventoryItems) {
              const cName = (ci.name || "").toLowerCase();
              let matches = 0;
              for (const t of tokens) {
                if (cName.includes(t)) matches++;
              }
              const score = matches / tokens.length;
              if (score >= 0.5 && score > bestScore) {
                bestScore = score;
                bestItem = ci;
              }
            }
            if (bestItem) catItem = bestItem;
          }
        }

        const qty = Number(p.quantity || p.qty || 1);
        let rateA = 0;
        let rateB = 0;
        let rateC = 0;
        let initialRate = 0;
        let isUnknown = false;

        if (catItem) {
          matchedCount++;
          rateA = Number(catItem.sellingPrice || catItem.salePrice || 0);
          rateB = Number(catItem.wholesalePrice || Math.round(rateA * 0.95));
          rateC = Number(catItem.dealerPrice || catItem.p3Rate || Math.round(rateA * 0.90));
          initialRate = activeRateTier === "B" ? rateB : activeRateTier === "C" ? rateC : rateA;
        } else {
          unknownCount++;
          isUnknown = true;
          const slipPrice = Number(p.price || p.rate || 0);
          rateA = slipPrice;
          rateB = slipPrice;
          rateC = slipPrice;
          initialRate = slipPrice;
        }

        const taxRate = Number(catItem?.gstRate || 0);
        const sub = qty * initialRate;
        const total = +(sub + (sub * taxRate) / 100).toFixed(2);

        return {
          id: `scanned_${Date.now()}_${idx}`,
          productId: catItem?._id || catItem?.id || null,
          name: catItem ? catItem.name : p.name || `सामान ${idx + 1}`,
          category: catItem?.category || "",
          brand: catItem?.brand || "",
          quantity: qty,
          unit: p.unit || catItem?.unit || "Pcs",
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

      if (detectedPartyName && !customerName) {
        setCustomerName(detectedPartyName);
        setCustomerMode("new");
      }

      setItems((prev) => [...prev, ...matched]);
      alert(
        `✨ AI ने पर्ची से ${matched.length} सामान कोटेशन में जोड़े!\n` +
          `• ${matchedCount} सामान दुकान के रेट (रेट ${activeRateTier}) से लिंक हो गए।\n` +
          (unknownCount > 0 ? `• ⚠️ ${unknownCount} सामान नए/अज्ञात हैं, कृपया उनका रेट भर लें।` : "")
      );
    } catch (err) {
      console.error("Quotation OCR error:", err);
      alert("पर्ची पढ़ने में समस्या आई। कृपया साफ़ फोटो अपलोड करें।");
    } finally {
      setOcrLoading(false);
      setOcrStatus("");
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  // Save Quotation
  const handleSaveQuotation = async (andShareWhatsApp = false) => {
    if (items.length === 0) {
      alert("कृपया कोटेशन में कम से कम 1 सामान जोड़ें!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        partyId: customerMode === "existing" && selectedPartyId ? selectedPartyId : undefined,
        customerName: customerName.trim() || "अनाम ग्राहक",
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        validUntil: validUntil || undefined,
        expectedPurchaseDate: expectedPurchaseDate || undefined,
        followUpDate: followUpDate || undefined,
        rateTier: activeRateTier,
        date: quotationDate,
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: it.productId || undefined,
          name: it.name,
          category: it.category || undefined,
          brand: it.brand || undefined,
          quantity: Number(it.quantity || 1),
          unit: it.unit || "Pcs",
          rate: Number(it.rate || 0),
          rateTier: it.rateTier || activeRateTier,
          rateA: Number(it.rateA || 0),
          rateB: Number(it.rateB || 0),
          rateC: Number(it.rateC || 0),
          taxRate: Number(it.taxRate || 0),
          total: Number(it.total || 0),
          isUnknown: Boolean(it.isUnknown)
        })),
        subTotal: formSubTotal,
        totalTax: +(formTotalAmount - formSubTotal).toFixed(2),
        totalAmount: formTotalAmount,
        status: "pending"
      };

      let savedQuo = null;
      if (editingQuotationId) {
        const res = await api.put(`/api/quotations/${editingQuotationId}`, payload).catch(() => null);
        if (res?.data?.success) {
          savedQuo = res.data.data;
        }
      } else {
        const res = await api.post("/api/quotations", payload).catch(() => null);
        if (res?.data?.success) {
          savedQuo = res.data.data;
        }
      }

      if (!savedQuo) {
        savedQuo = {
          _id: editingQuotationId || `quo_local_${Date.now()}`,
          quotationNumber: `QUO-${Math.floor(1000 + Math.random() * 9000)}`,
          ...payload,
          createdAt: new Date().toISOString()
        };
      }

      try {
        let local = JSON.parse(localStorage.getItem("vb_local_quotations") || "[]");
        if (editingQuotationId) {
          local = local.map((q) => (q._id === editingQuotationId || q.id === editingQuotationId ? savedQuo : q));
        } else {
          local = [savedQuo, ...local];
        }
        localStorage.setItem("vb_local_quotations", JSON.stringify(local));
      } catch (e) {}

      await fetchQuotations();
      setViewMode("list");

      if (andShareWhatsApp) {
        handleShareWhatsApp(savedQuo);
      } else {
        alert("✅ कोटेशन सुरक्षित रूप से सेव हो गया है!");
      }
    } catch (err) {
      console.error("Save quotation error:", err);
      alert("कोटेशन सेव करने में त्रुटि आई।");
    } finally {
      setSaving(false);
    }
  };

  // Convert Quotation to Sale Bill
  const handleConvertQuotationToBill = async (quo) => {
    const confirmConvert = window.confirm(
      `🧾 क्या आप कोटेशन #${quo.quotationNumber} (₹${quo.totalAmount}) को पक्के बिक्री बिल में बदलना चाहते हैं?`
    );
    if (!confirmConvert) return;

    try {
      if (typeof onConvertToBill === "function") {
        await onConvertToBill(quo);
      } else {
        await api.post(`/api/quotations/${quo._id || quo.id}/convert-to-bill`).catch(async () => {
          await api.patch(`/api/quotations/${quo._id || quo.id}/status`, { status: "converted" }).catch(() => null);
        });
      }

      const qId = quo._id || quo.id;
      setQuotations((prev) => prev.map((q) => ((q._id || q.id) === qId ? { ...q, status: "converted" } : q)));
      try {
        let local = JSON.parse(localStorage.getItem("vb_local_quotations") || "[]");
        local = local.map((q) => ((q._id || q.id) === qId ? { ...q, status: "converted" } : q));
        localStorage.setItem("vb_local_quotations", JSON.stringify(local));
      } catch (e) {}

      alert("🎉 कोटेशन सफलतापूर्वक पक्के बिल में बदल दिया गया है!");
    } catch (err) {
      console.error("Convert to bill error:", err);
      alert("बिल में बदलने में समस्या आई।");
    }
  };

  // WhatsApp Share Formatting
  const handleShareWhatsApp = (quo) => {
    const qNo = quo.quotationNumber || "QUO";
    const cName = quo.customerName || quo.partyId?.name || "ग्राहक";
    const dateStr = quo.date
      ? new Date(quo.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "आज";

    let msg = `📋 *कोटेशन / एस्टीमेट (Quotation)*\n`;
    msg += `🏢 *${companyName}*\n`;
    if (companyPhone) msg += `📞 फोन: ${companyPhone}\n`;
    msg += `----------------------------------\n`;
    msg += `🧾 *कोटेशन सं.:* #${qNo}\n`;
    msg += `👤 *ग्राहक:* ${cName}\n`;
    if (quo.customerPhone) msg += `📱 *मोबाइल:* ${quo.customerPhone}\n`;
    if (quo.rateTier) msg += `🏷️ *लागू रेट:* रेट ${quo.rateTier}\n`;
    msg += `📅 *तारीख:* ${dateStr}\n`;
    msg += `----------------------------------\n`;
    msg += `*सामान विवरण (Items & Rates):*\n`;

    (quo.items || []).forEach((it, idx) => {
      const itemTot = Number(it.total || (it.quantity || 1) * (it.rate || 0));
      msg += `${idx + 1}. *${it.name || it.itemName}*\n`;
      msg += `   • ${it.quantity} ${it.unit || "Pcs"} × ₹${Number(it.rate || 0).toLocaleString("en-IN")} = ₹${itemTot.toLocaleString("en-IN")}\n`;
    });

    msg += `----------------------------------\n`;
    msg += `💰 *कुल राशि: ₹${Number(quo.totalAmount || 0).toLocaleString("en-IN")}*\n`;
    msg += `----------------------------------\n`;
    if (quo.notes) msg += `📝 *नोट:* ${quo.notes}\n`;

    const cleanPhone = String(quo.customerPhone || "").replace(/[^0-9]/g, "");
    const waUrl =
      cleanPhone.length >= 10
        ? `https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${encodeURIComponent(msg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center safe-top animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-[94vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            {viewMode === "form" ? (
              <button
                onClick={() => setViewMode("list")}
                className="p-1.5 -ml-1 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
                📝
              </div>
            )}
            <div>
              <h2 className="text-sm font-black tracking-wide flex items-center gap-1.5">
                {viewMode === "form" ? (editingQuotationId ? "कोटेशन एडिट करें" : "नया कोटेशन / एस्टीमेट") : "कोटेशन व एस्टीमेट हब"}
              </h2>
              <p className="text-[10px] text-blue-200">
                {viewMode === "form" ? "AI पर्ची स्कैन करें या रेट A/B/C चुनें" : `${quotations.length} कुल कोटेशन रिकॉर्ड`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "list" && (
              <button
                onClick={handleOpenCreate}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={15} /> + नया कोटेशन
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* HIDDEN OCR INPUTS */}
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

        {/* VIEW MODE: QUOTATION LIST */}
        {viewMode === "list" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* SEARCH & FILTERS */}
            <div className="p-3 bg-white border-b border-slate-200 shrink-0 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="कोटेशन नंबर, ग्राहक का नाम या फोन..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
                {[
                  { id: "all", label: "सभी" },
                  { id: "pending", label: "⏳ पेंडिंग" },
                  { id: "converted", label: "✓ पक्का बिल बना" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer ${
                      statusFilter === f.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK AI SCANNER PROMO STRIP */}
            <div className="px-3 pt-2 shrink-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    📸
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950">AI पर्ची से सीधे कोटेशन बनाएं</h4>
                    <p className="text-[10px] text-amber-800">हाथ की पर्ची की फोटो लें, AI तुरंत एस्टीमेट बना देगा</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Camera size={13} /> फोटो लें
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-2 py-1.5 bg-white border border-amber-300 text-amber-900 font-extrabold text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Upload size={13} /> गैलरी
                  </button>
                </div>
              </div>
            </div>

            {/* QUOTATION LIST CARDS */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs font-medium">कोटेशन लोड हो रहे हैं...</p>
                </div>
              ) : filteredQuotations.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">कोई कोटेशन नहीं मिला</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                    {searchQuery ? "सर्च के अनुसार कोई रिकॉर्ड नहीं मिला।" : "अभी तक कोई कोटेशन या एस्टीमेट नहीं बनाया गया है।"}
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    <Plus size={16} /> + पहला कोटेशन बनाएं
                  </button>
                </div>
              ) : (
                filteredQuotations.map((quo) => {
                  const qId = quo._id || quo.id;
                  const cName = quo.customerName || quo.partyId?.name || "अनाम ग्राहक";
                  const cPhone = quo.customerPhone || quo.partyId?.mobileNumber || "";
                  const isConverted = quo.status === "converted" || quo.status === "invoiced";
                  const itemsCount = (quo.items || []).length;
                  const dateStr = quo.date
                    ? new Date(quo.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "आज";

                  return (
                    <div
                      key={qId}
                      className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            #{quo.quotationNumber || "QUO"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">📅 {dateStr}</span>
                          {quo.rateTier && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              रेट {quo.rateTier}
                            </span>
                          )}
                        </div>
                        {isConverted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle size={10} /> पक्का बिल बन गया
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200 flex items-center gap-1">
                            <Clock size={10} /> ⏳ पेंडिंग
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">👤 {cName}</h4>
                          {cPhone && <p className="text-[11px] text-slate-500 font-medium mt-0.5">📱 {cPhone}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-slate-900">
                            ₹{Number(quo.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{itemsCount} सामान</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => handleShareWhatsApp(quo)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                        >
                          <Share2 size={13} /> WhatsApp
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!isConverted && (
                            <button
                              onClick={() => handleConvertQuotationToBill(quo)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                            >
                              <ShoppingCart size={13} /> 🧾 पक्का बिल बनाएं
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(quo)}
                            className="p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE: CREATE / EDIT FORM */}
        {viewMode === "form" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5">

              {/* 🤖 AI SLIP SCANNER BANNER */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-3.5 rounded-2xl text-white shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-amber-300">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black">🤖 AI पर्ची स्कैनर (Handwritten Slip)</h4>
                      <p className="text-[10px] text-purple-100">फोटो खींचे, AI 1600+ सामानों से रेट A स्वतः लिंक करेगा</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white text-indigo-900 font-extrabold text-[11px] rounded-xl shadow-xs active:scale-95 transition"
                    >
                      📸 कैमरा
                    </button>
                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2 py-1.5 bg-white/20 text-white font-bold text-[11px] rounded-xl border border-white/30"
                    >
                      🖼️ गैलरी
                    </button>
                  </div>
                </div>
                {ocrLoading && (
                  <div className="p-2 bg-black/30 rounded-xl text-[11px] font-bold text-amber-200 flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-amber-300" />
                    <span>{ocrStatus || "AI पर्ची पढ़ रहा है..."}</span>
                  </div>
                )}
              </div>

              {/* ⚡ 1-CLICK RATE TIER SWITCHER */}
              <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>⚡ 1-क्लिक रेट टियर (Rate Tier):</span>
                  </h4>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    सभी सामान पर लागू
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGlobalRateTierSwitch("A")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      activeRateTier === "A"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>🏷️ रेट A (रिटेल)</span>
                    {activeRateTier === "A" && <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalRateTierSwitch("B")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      activeRateTier === "B"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>📦 रेट B (होलसेल)</span>
                    {activeRateTier === "B" && <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalRateTierSwitch("C")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      activeRateTier === "C"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>🌟 रेट C (स्पेशल)</span>
                    {activeRateTier === "C" && <Check size={12} />}
                  </button>
                </div>
              </div>

              {/* CUSTOMER SELECTION: EXISTING OR INLINE NEW */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800">👤 ग्राहक विवरण</h3>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCustomerMode("existing")}
                      className={`px-2 py-1 rounded-md transition ${
                        customerMode === "existing" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      मौजूदा पार्टी
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode("new");
                        setSelectedPartyId("");
                      }}
                      className={`px-2 py-1 rounded-md transition ${
                        customerMode === "new" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      ✍️ नया ग्राहक
                    </button>
                  </div>
                </div>

                {customerMode === "existing" ? (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">पार्टी सूची में से चुनें</label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => handlePartySelect(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none"
                    >
                      <option value="">-- पार्टी चुनें --</option>
                      {parties.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name} {p.mobileNumber ? `(${p.mobileNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ग्राहक का नाम</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="उदा. रमेश कुमार"
                        className="w-full p-2 bg-blue-50/40 border border-blue-200 rounded-xl text-xs text-slate-900 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">मोबाइल नंबर</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="98XXXXXXXX"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 📅 Expected Purchase Date & Follow-up Date */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-blue-900 block mb-0.5">📅 संभावित खरीद दिनांक</label>
                    <input
                      type="date"
                      value={expectedPurchaseDate}
                      onChange={(e) => setExpectedPurchaseDate(e.target.value)}
                      className="w-full p-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">⏰ फॉलो-अप कॉल दिनांक</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 🔍 CATEGORY & BRAND FILTERS + PRODUCT SEARCH */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-black text-slate-800">📦 सामान जोड़ें (1600+ इन्वेंट्री)</h3>
                  <button
                    type="button"
                    onClick={handleAddManualCustomItem}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    + नया सामान लिखें
                  </button>
                </div>

                {/* Filter Dropdowns */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">1. श्रेणी (Category)</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-slate-800"
                    >
                      <option value="">-- सभी श्रेणियां ({categoriesList.length}) --</option>
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">2. ब्रांड (Brand)</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-slate-800"
                    >
                      <option value="">-- सभी ब्रांड्स ({brandsList.length}) --</option>
                      {brandsList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="सामान का नाम या बारकोड..."
                    className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none"
                  />
                  {itemSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setItemSearchTerm("")}
                      className="absolute right-2.5 top-2.5 text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtered Product Quick-Add Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    टैप करके जोड़ें ({filteredProducts.length} सामान उपलब्ध):
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {filteredProducts.map((p) => {
                      const rA = Number(p.sellingPrice || p.salePrice || 0);
                      const rB = Number(p.wholesalePrice || Math.round(rA * 0.95));
                      const rC = Number(p.dealerPrice || p.p3Rate || Math.round(rA * 0.90));
                      const curRate = activeRateTier === "B" ? rB : activeRateTier === "C" ? rC : rA;

                      return (
                        <div
                          key={p._id || p.id}
                          onClick={() => handleAddItemFromCatalog(p)}
                          className="shrink-0 p-2 bg-indigo-50/60 hover:bg-indigo-100 border border-indigo-200 rounded-xl cursor-pointer transition active:scale-95 space-y-0.5"
                        >
                          <p className="text-[11px] font-black text-slate-900 max-w-[130px] truncate">{p.name}</p>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-emerald-700">₹{curRate}</span>
                            <span className="text-indigo-600 font-black">+ जोड़ें</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ITEMS LIST (EDITABLE CARDS) */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-slate-700">📋 जुड़े हुए सामान ({items.length}):</span>
                    <span className="text-[11px] font-black text-indigo-700">कुल योग: ₹{formTotalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  {items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className={`p-3 rounded-2xl border shadow-xs space-y-2 ${
                        it.isUnknown ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => handleUpdateItemField(idx, "name", e.target.value)}
                            className="w-full p-1 bg-transparent border-b border-dashed border-slate-300 text-xs font-bold text-slate-900 outline-none"
                          />
                          {it.isUnknown && (
                            <span className="inline-block mt-0.5 text-[9px] font-black text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded-full">
                              ⚠️ नया / रेट जांचें
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center text-xs">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">मात्रा</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItemField(idx, "quantity", e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">रेट (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.rate}
                            onChange={(e) => handleUpdateItemField(idx, "rate", e.target.value)}
                            className={`w-full p-1.5 border rounded-lg text-right font-black ${
                              it.isUnknown && Number(it.rate) <= 0
                                ? "border-amber-400 bg-amber-50 text-rose-700"
                                : "border-slate-200 bg-slate-50 text-slate-900"
                            }`}
                          />
                        </div>

                        <div className="text-right">
                          <label className="text-[9px] font-bold text-slate-400 block">योग (Total)</label>
                          <span className="font-black text-sm text-slate-900 block pt-1">
                            ₹{Number(it.total || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Per-item Rate Tier Toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-bold">रेट टियर:</span>
                        <div className="flex gap-1">
                          {["A", "B", "C"].map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => handleUpdateItemField(idx, "rateTier", tier)}
                              className={`px-2 py-0.5 rounded font-black ${
                                it.rateTier === tier ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              रेट {tier}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  <ShoppingCart size={28} className="mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">कोटेशन में कोई सामान नहीं जुड़ा है</p>
                  <p className="text-[10px] text-slate-400">ऊपर AI कैमरा दबाएं या इन्वेंट्री से सामान चुनें</p>
                </div>
              )}
            </div>

            {/* FORM BOTTOM ACTION BAR */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">कुल अनुमानित राशि:</span>
                <span className="text-lg font-black text-indigo-700">₹{formTotalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(false)}
                  disabled={saving}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} /> <span>{saving ? "सेव हो रहा है..." : "सेव करें"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(true)}
                  disabled={saving}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Share2 size={15} /> <span>सेव व WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
