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
  AlertCircle
} from "lucide-react";
import api from "../../services/api";

export default function MobileQuotationModal({
  isOpen,
  onClose,
  inventoryItems = [],
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

  // Form State
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
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
        // Fallback to local storage
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

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Status filter
      if (statusFilter === "pending" && (q.status === "converted" || q.status === "invoiced")) return false;
      if (statusFilter === "converted" && q.status !== "converted" && q.status !== "invoiced") return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const qText = searchQuery.toLowerCase();
      const cName = String(q.customerName || q.partyId?.name || "").toLowerCase();
      const cPhone = String(q.customerPhone || q.partyId?.mobileNumber || "");
      const qNum = String(q.quotationNumber || "").toLowerCase();
      const cAddr = String(q.customerAddress || q.partyId?.address || "").toLowerCase();
      const hasItem = (q.items || []).some((it) => String(it.name || "").toLowerCase().includes(qText));

      return cName.includes(qText) || cPhone.includes(qText) || qNum.includes(qText) || cAddr.includes(qText) || hasItem;
    });
  }, [quotations, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = quotations.length;
    const totalAmt = quotations.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);
    const pendingList = quotations.filter((q) => q.status !== "converted" && q.status !== "invoiced");
    const pendingAmt = pendingList.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);
    const convertedList = quotations.filter((q) => q.status === "converted" || q.status === "invoiced");
    const convertedAmt = convertedList.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);

    return {
      totalCount,
      totalAmt,
      pendingCount: pendingList.length,
      pendingAmt,
      convertedCount: convertedList.length,
      convertedAmt
    };
  }, [quotations]);

  // Reset Form
  const resetForm = () => {
    setEditingQuotationId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setValidUntil("");
    setQuotationDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setItems([]);
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setViewMode("form");
  };

  const handleOpenEdit = (quotation) => {
    setEditingQuotationId(quotation._id || quotation.id);
    setCustomerName(quotation.customerName || quotation.partyId?.name || "");
    setCustomerPhone(quotation.customerPhone || quotation.partyId?.mobileNumber || "");
    setCustomerAddress(quotation.customerAddress || quotation.partyId?.address || "");
    setValidUntil(quotation.validUntil ? quotation.validUntil.split("T")[0] : "");
    setQuotationDate(quotation.date ? quotation.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setNotes(quotation.notes || "");
    setItems(
      (quotation.items || []).map((it, idx) => ({
        id: it._id || it.id || `item_${idx}_${Date.now()}`,
        productId: it.productId || null,
        name: it.name || it.itemName || "",
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit || "Pcs",
        rate: Number(it.rate || it.price || 0),
        taxRate: Number(it.taxRate || 0),
        total: Number(it.total || (it.quantity || 1) * (it.rate || 0))
      }))
    );
    setViewMode("form");
  };

  // Add Item
  const handleAddItemFromCatalog = (product) => {
    const rate = Number(product.sellingPrice || product.salePrice || product.rate || 0);
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product._id || product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || "Pcs",
      rate,
      taxRate: Number(product.gstRate || 0),
      total: rate
    };
    setItems((prev) => [...prev, newItem]);
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleAddManualCustomItem = () => {
    const rawName = itemSearchTerm.trim() || "नया सामान";
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: null,
      name: rawName,
      quantity: 1,
      unit: "Pcs",
      rate: 0,
      taxRate: 0,
      total: 0
    };
    setItems((prev) => [...prev, newItem]);
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleUpdateItemField = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[index], [field]: value };
      if (field === "quantity" || field === "rate" || field === "taxRate") {
        const qty = Number(field === "quantity" ? value : it.quantity) || 0;
        const rate = Number(field === "rate" ? value : it.rate) || 0;
        const tax = Number(field === "taxRate" ? value : it.taxRate) || 0;
        const sub = qty * rate;
        it.total = +(sub + (sub * tax) / 100).toFixed(2);
      }
      next[index] = it;
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const formSubTotal = useMemo(() => {
    return items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  }, [items]);

  const formTotalAmount = useMemo(() => {
    return items.reduce((s, it) => s + (Number(it.total) || (Number(it.quantity || 0) * Number(it.rate || 0))), 0);
  }, [items]);

  // Camera / Slip OCR Scanner for Quotation
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

      setOcrStatus("🤖 AI पर्ची के सामान व मात्रा पढ़ रहा है...");

      const openAiKey = localStorage.getItem("OPENAI_API_KEY") || "";
      const geminiKey = localStorage.getItem("GEMINI_API_KEY") || "";

      const res = await api.post("/billing/parse-image", {
        images: [base64],
        openaiApiKey: openAiKey.trim() || undefined,
        geminiApiKey: geminiKey.trim() || undefined
      }).catch(() => null);

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
        alert("पर्ची से कोई सामान स्पष्ट नहीं हो सका। आप नीचे सीधे सामान सर्च करके जोड़ सकते हैं।");
        return;
      }

      // Match items against 1600+ catalog
      const matched = parsedItems.map((p, idx) => {
        const pName = (p.name || "").trim().toLowerCase();
        let catItem = inventoryItems.find((ci) => {
          const cName = (ci.name || "").toLowerCase();
          return cName === pName || (Array.isArray(ci.aliases) && ci.aliases.some((a) => String(a).toLowerCase() === pName));
        });

        if (!catItem && pName) {
          const tokens = pName.split(/\s+/).filter((t) => t.length >= 3);
          if (tokens.length > 0) {
            catItem = inventoryItems.find((ci) => {
              const cName = (ci.name || "").toLowerCase();
              return tokens.some((t) => cName.includes(t));
            });
          }
        }

        const qty = Number(p.quantity || p.qty || 1);
        const rate = Number(p.price || p.rate || (catItem ? catItem.sellingPrice || catItem.salePrice : 0));
        const total = +(qty * rate).toFixed(2);

        return {
          id: `scanned_${Date.now()}_${idx}`,
          productId: catItem?._id || catItem?.id || null,
          name: catItem ? catItem.name : (p.name || `सामान ${idx + 1}`),
          quantity: qty,
          unit: p.unit || catItem?.unit || "Pcs",
          rate,
          taxRate: Number(catItem?.gstRate || 0),
          total
        };
      });

      if (detectedPartyName && !customerName) {
        setCustomerName(detectedPartyName);
      }

      setItems((prev) => [...prev, ...matched]);
      alert(`✨ AI ने पर्ची से ${matched.length} सामान सफलता से कोटेशन में जोड़ दिए हैं! आप नीचे रेट या मात्रा चेक करके एडिट कर सकते हैं।`);
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
        customerName: customerName.trim() || "अनाम ग्राहक",
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        validUntil: validUntil || undefined,
        date: quotationDate,
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: it.productId || undefined,
          name: it.name,
          quantity: Number(it.quantity || 1),
          unit: it.unit || "Pcs",
          rate: Number(it.rate || 0),
          taxRate: Number(it.taxRate || 0),
          total: Number(it.total || 0)
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
        } else {
          savedQuo = { ...payload, _id: editingQuotationId, quotationNumber: editingQuotationId };
        }
      } else {
        const res = await api.post("/api/quotations", payload).catch(() => null);
        if (res?.data?.success) {
          savedQuo = res.data.data;
        } else {
          const autoNo = `QUO-${Date.now().toString().slice(-4)}`;
          savedQuo = { ...payload, _id: `quo_local_${Date.now()}`, quotationNumber: autoNo };
        }
      }

      // Update local storage
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
        alert("✅ कोटेशन सुरक्षित रूप से सेव हो गया है! (दुकान का कोई स्टॉक नहीं कटा)");
      }
    } catch (err) {
      console.error("Save quotation error:", err);
      alert("कोटेशन सेव करने में त्रुटि आई।");
    } finally {
      setSaving(false);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (quo) => {
    const qId = quo._id || quo.id;
    if (!window.confirm(`क्या आप कोटेशन #${quo.quotationNumber} को हटाना चाहते हैं?`)) return;

    try {
      await api.delete(`/api/quotations/${qId}`).catch(() => null);
      let local = JSON.parse(localStorage.getItem("vb_local_quotations") || "[]");
      local = local.filter((q) => (q._id || q.id) !== qId);
      localStorage.setItem("vb_local_quotations", JSON.stringify(local));
      setQuotations((prev) => prev.filter((q) => (q._id || q.id) !== qId));
    } catch (e) {
      alert("हटाने में समस्या आई।");
    }
  };

  // Convert Quotation to Sale Bill
  const handleConvertQuotationToBill = async (quo) => {
    const confirmConvert = window.confirm(
      `🧾 क्या आप कोटेशन #${quo.quotationNumber} (₹${quo.totalAmount}) को पक्के बिक्री बिल में बदलना चाहते हैं?\n\n(ध्यान दें: पक्का बिल बनने पर दुकान से स्टॉक घट जाएगा)`
    );
    if (!confirmConvert) return;

    try {
      if (typeof onConvertToBill === "function") {
        await onConvertToBill(quo);
      } else {
        // Fallback: update status to converted
        await api.patch(`/api/quotations/${quo._id || quo.id}/status`, { status: "converted" }).catch(() => null);
      }

      // Mark locally as converted
      const qId = quo._id || quo.id;
      setQuotations((prev) =>
        prev.map((q) => ((q._id || q.id) === qId ? { ...q, status: "converted" } : q))
      );
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
      : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const validStr = quo.validUntil
      ? new Date(quo.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null;

    let msg = `📋 *कोटेशन / कच्चा एस्टीमेट (Quotation)*\n`;
    msg += `🏢 *${companyName}*\n`;
    if (companyPhone) msg += `📞 फोन: ${companyPhone}\n`;
    msg += `----------------------------------\n`;
    msg += `🧾 *कोटेशन सं.:* #${qNo}\n`;
    msg += `👤 *ग्राहक:* ${cName}\n`;
    if (quo.customerPhone) msg += `📱 *मोबाइल:* ${quo.customerPhone}\n`;
    if (quo.customerAddress) msg += `📍 *स्थान:* ${quo.customerAddress}\n`;
    msg += `📅 *तारीख:* ${dateStr}\n`;
    if (validStr) msg += `⏳ *मान्य तिथि (कब तक):* ${validStr}\n`;
    msg += `----------------------------------\n`;
    msg += `*सामान विवरण (Items & Rates):*\n`;

    (quo.items || []).forEach((it, idx) => {
      const itemTot = Number(it.total || (it.quantity || 1) * (it.rate || 0));
      msg += `${idx + 1}. *${it.name || it.itemName}*\n`;
      msg += `   • ${it.quantity} ${it.unit || "Pcs"} × ₹${Number(it.rate || 0).toLocaleString("en-IN")} = ₹${itemTot.toLocaleString("en-IN")}\n`;
    });

    msg += `----------------------------------\n`;
    msg += `💰 *कुल अनुमानित राशि: ₹${Number(quo.totalAmount || 0).toLocaleString("en-IN")}*\n`;
    msg += `----------------------------------\n`;
    if (quo.notes) msg += `📝 *नोट:* ${quo.notes}\n`;
    msg += `_यह केवल अनुमानित दर (Quotation) है। माल की अंतिम उपलब्धता व दर पर बिल तैयार किया जाएगा।_\n`;
    msg += `_व्यापार सुरक्षित सिस्टम_`;

    const cleanPhone = String(quo.customerPhone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
  };

  // Catalog item search suggestions
  const catalogSuggestions = useMemo(() => {
    if (!itemSearchTerm.trim()) return [];
    const term = itemSearchTerm.toLowerCase();
    return (inventoryItems || [])
      .filter((ci) => {
        const cName = (ci.name || "").toLowerCase();
        const code = String(ci.barcode || ci.sku || "").toLowerCase();
        return cName.includes(term) || code.includes(term);
      })
      .slice(0, 10);
  }, [inventoryItems, itemSearchTerm]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center safe-top animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
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
              <p className="text-[10px] text-blue-100 font-medium">
                {viewMode === "form" ? "सामान व दर दर्ज करें • बिना स्टॉक कटे" : "कच्चा हिसाब दें • 1-क्लिक में बिल में बदलें"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "list" && (
              <button
                onClick={handleOpenCreate}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> + नया कोटेशन
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* HIDDEN FILE INPUTS FOR CAMERA & GALLERY SCANNER */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleOcrFileSelect}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleOcrFileSelect}
          className="hidden"
        />

        {/* OCR LOADING OVERLAY */}
        {ocrLoading && (
          <div className="bg-amber-50 p-4 border-b border-amber-200 flex items-center justify-center gap-3 shrink-0">
            <RefreshCw className="animate-spin text-amber-600" size={20} />
            <span className="text-xs font-bold text-amber-900">{ocrStatus}</span>
          </div>
        )}

        {/* VIEW MODE: LIST */}
        {viewMode === "list" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white border-b border-slate-200 shrink-0">
              <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-blue-700 font-bold block">कुल कोटेशन</span>
                <span className="text-sm font-black text-blue-900">{stats.totalCount}</span>
                <span className="text-[9px] text-slate-500 block truncate">₹{stats.totalAmt.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] text-amber-700 font-bold block">⏳ पेंडिंग</span>
                <span className="text-sm font-black text-amber-900">{stats.pendingCount}</span>
                <span className="text-[9px] text-slate-500 block truncate">₹{stats.pendingAmt.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block">✅ पक्के बिल</span>
                <span className="text-sm font-black text-emerald-900">{stats.convertedCount}</span>
                <span className="text-[9px] text-slate-500 block truncate">₹{stats.convertedAmt.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ग्राहक का नाम, मोबाइल नं., कोटेशन सं. सर्च करें..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs font-bold">
                {[
                  { id: "all", label: `सभी (${stats.totalCount})` },
                  { id: "pending", label: `⏳ पेंडिंग (${stats.pendingCount})` },
                  { id: "converted", label: `✅ पक्के बिल बने (${stats.convertedCount})` }
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
                    <h4 className="text-xs font-extrabold text-amber-950">पर्ची से सीधे कोटेशन बनाएं</h4>
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
                  const cAddr = quo.customerAddress || quo.partyId?.address || "";
                  const isConverted = quo.status === "converted" || quo.status === "invoiced";
                  const itemsCount = (quo.items || []).length;
                  const dateStr = quo.date
                    ? new Date(quo.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "आज";
                  const validStr = quo.validUntil
                    ? new Date(quo.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : null;

                  return (
                    <div
                      key={qId}
                      className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-2.5"
                    >
                      {/* Card Top: Number, Date, Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            #{quo.quotationNumber || "QUO"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">📅 {dateStr}</span>
                        </div>
                        {isConverted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle size={10} /> पक्का बिल बन गया
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200 flex items-center gap-1">
                            <Clock size={10} /> ⏳ पेंडिंग एस्टीमेट
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                            <span>👤 {cName}</span>
                          </h4>
                          {cPhone && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                              <Phone size={11} className="text-slate-400" /> {cPhone}
                            </p>
                          )}
                          {cAddr && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                              <MapPin size={10} className="text-slate-400" /> {cAddr}
                            </p>
                          )}
                          {validStr && (
                            <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                              ⏳ कब तक लेंगे: <strong>{validStr}</strong>
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-semibold">अनुमानित राशि</span>
                          <span className="text-base font-black text-slate-900">
                            ₹{Number(quo.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{itemsCount} सामान</span>
                        </div>
                      </div>

                      {/* Items Summary Snippet */}
                      {(quo.items || []).length > 0 && (
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                          {(quo.items || []).map((it, idx) => (
                            <span key={idx} className="mr-2">
                              • {it.name || it.itemName} ({it.quantity} {it.unit || "Pcs"})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleShareWhatsApp(quo)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                            title="WhatsApp पर कोटेशन भेजें"
                          >
                            <Share2 size={12} /> WhatsApp
                          </button>

                          {!isConverted && (
                            <button
                              onClick={() => handleConvertQuotationToBill(quo)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                              title="पक्के बिल में बदलें"
                            >
                              <ShoppingCart size={12} /> 🧾 बिल में बदलें
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => handleOpenEdit(quo)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                            title="एडिट करें"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuotation(quo)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs transition cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash2 size={14} />
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
              
              {/* CUSTOMER DETAILS SECTION (ALL OPTIONAL) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>👤 ग्राहक विवरण</span>
                    <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      सब वैकल्पिक (Optional)
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400">खाली छोड़ सकते हैं</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ग्राहक का नाम</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="उदा. रमेश कुमार (वैकल्पिक)"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">मोबाइल नंबर</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="98XXXXXXXX (वैकल्पिक)"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">पता / जगह / साइट</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="उदा. आजाद चौक / साइट 2"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">कब तक लेंगे (मान्य तिथि)</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* CAMERA / SCANNER SHORTCUT */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-2xl text-white shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                    📸
                  </div>
                  <div>
                    <h4 className="text-xs font-black">पर्ची या लिस्ट की फोटो लें</h4>
                    <p className="text-[10px] opacity-90">AI सामान और रेट अपने आप भर देगा</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-orange-950 font-black text-xs rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    कैमरा
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white/20 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    गैलरी
                  </button>
                </div>
              </div>

              {/* ITEM ADDING & CATALOG SEARCH */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-black text-slate-800">
                    📦 सामान जोड़ें ({items.length} आइटम जुड़े)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">1600+ कैटलॉग से सर्च करें</span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => {
                      setItemSearchTerm(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    placeholder="सामान का नाम टाइप करें..."
                    className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 font-bold"
                  />
                  {itemSearchTerm && (
                    <button
                      onClick={handleAddManualCustomItem}
                      className="absolute right-1.5 top-1.5 px-2.5 py-1.5 bg-indigo-600 text-white font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer"
                    >
                      + जोड़ें
                    </button>
                  )}

                  {/* Dropdown suggestions */}
                  {showItemSuggestions && catalogSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-52 overflow-y-auto z-30 divide-y divide-slate-100">
                      {catalogSuggestions.map((product) => (
                        <div
                          key={product._id || product.id}
                          onClick={() => handleAddItemFromCatalog(product)}
                          className="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{product.name}</span>
                            <span className="text-[10px] text-slate-400">
                              स्टॉक: {product.currentStock ?? product.stock ?? 0} {product.unit || "Pcs"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-700 block">
                              ₹{Number(product.sellingPrice || product.salePrice || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] text-indigo-600 font-extrabold">+ टैप करें</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ITEMS LIST (EDITABLE CARDS) */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-slate-700">कोटेशन सामान सूची:</span>
                    <span className="text-[11px] font-bold text-indigo-600">कुल: ₹{formTotalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  {items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleUpdateItemField(idx, "name", e.target.value)}
                          placeholder="सामान का नाम..."
                          className="flex-1 font-bold text-xs text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-600 outline-none pb-0.5"
                        />
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[9px] text-slate-400 block font-bold">मात्रा (Qty)</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItemField(idx, "quantity", e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block font-bold">दर / रेट (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.rate}
                            onChange={(e) => handleUpdateItemField(idx, "rate", e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block font-bold">कुल रकम (₹)</label>
                          <div className="p-1.5 bg-slate-100 rounded-lg font-black text-slate-900 text-right truncate">
                            ₹{Number(it.total || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  ऊपर से सामान सर्च करके जोड़ें या पर्ची की फोटो खींचें
                </div>
              )}

              {/* NOTES / REMARK */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">अतिरिक्त टिप्पणी / नोट्स (वैकल्पिक)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. यह रेट 7 दिनों तक मान्य है..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* FORM FOOTER BUTTONS */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-600">कुल अनुमानित राशि:</span>
                <span className="text-xl font-black text-indigo-900">
                  ₹{formTotalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSaveQuotation(false)}
                  disabled={saving || items.length === 0}
                  className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText size={15} /> 💾 सेव करें
                </button>

                <button
                  onClick={() => handleSaveQuotation(true)}
                  disabled={saving || items.length === 0}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={15} /> 📲 सेव व WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
