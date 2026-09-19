import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Receipt,
  PackagePlus,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  Volume2,
  Check,
  ChevronRight,
  ExternalLink,
  Store,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { parseSpeechToItems, parseSingleItemText } from "../../utils/voiceOrderParser";
import UdharOtpVerificationModal from "../../components/modals/UdharOtpVerificationModal";
import { useCompany } from "../../contexts/CompanyContext";

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany() || {};

  // Mode: "billing" (बोलकर बिल बनाएं) or "inventory" (बोलकर स्टॉक जोड़ें)
  const [activeMode, setActiveMode] = useState("billing");

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [recognitionLanguage, setRecognitionLanguage] = useState("hi-IN"); // hi-IN or en-IN
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Manual text input fallback
  const [manualText, setManualText] = useState("");

  // Loaded inventory for fuzzy matching
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Parsed Items List for Review
  const [parsedItems, setParsedItems] = useState([]);

  // Billing Form Details
  const [customerName, setCustomerName] = useState("नकद ग्राहक (Walk-in)");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH"); // CASH, UPI, UDHAR
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [lateInterestPercent, setLateInterestPercent] = useState(2);

  // Inventory default category
  const [defaultCategory, setDefaultCategory] = useState("General");

  // Udhar OTP modal state
  const [showUdharModal, setShowUdharModal] = useState(false);
  const [activeUdharBill, setActiveUdharBill] = useState(null);

  // Submit / Loading State
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load Inventory Products for Fuzzy Matching
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoadingInventory(true);
      const res = await api.get("/api/inventory?limit=2000").catch(() => null);
      const items = res?.data?.products || res?.data || [];
      if (Array.isArray(items)) {
        setInventoryList(items);
      }
    } catch (err) {
      console.warn("Failed to load inventory for voice matching:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLanguage;

    recognition.onresult = (event) => {
      let currentInterim = "";
      let finalSpeech = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript + " ";
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimText(currentInterim);

      if (finalSpeech.trim()) {
        const full = (transcript + " " + finalSpeech).trim();
        setTranscript(full);
        handleSpeechParsed(finalSpeech.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
        alert("माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [recognitionLanguage, inventoryList, transcript]);

  // Toggle Mic
  const toggleListening = () => {
    if (!speechSupported) {
      alert("आपके ब्राउज़र में आवाज़ पहचान (Web Speech API) उपलब्ध नहीं है। आप नीचे बॉक्स में बोलकर टाइप या लिख सकते हैं।");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setSuccessMessage(null);
      } catch (err) {
        console.error("Start speech error:", err);
      }
    }
  };

  // When speech is recognized, parse and append to items
  const handleSpeechParsed = (speechChunk) => {
    const newItems = parseSpeechToItems(speechChunk, inventoryList);
    if (newItems.length > 0) {
      setParsedItems((prev) => [...prev, ...newItems]);
    }
  };

  // Manual Text Submit
  const handleManualParse = (e) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    const newItems = parseSpeechToItems(manualText.trim(), inventoryList);
    if (newItems.length > 0) {
      setParsedItems((prev) => [...prev, ...newItems]);
      setManualText("");
    } else {
      alert("कोई सामान नहीं पहचाना गया। कृपया सही प्रारूप में लिखें जैसे: '2 प्लेट पनीर 250'");
    }
  };

  // Stepper handlers
  const updateItemQty = (id, delta) => {
    setParsedItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newQty = Math.max(0.5, (Number(it.quantity) || 1) + delta);
          return {
            ...it,
            quantity: newQty,
            total: Math.round(newQty * (Number(it.rate) || 0))
          };
        }
        return it;
      })
    );
  };

  const updateItemField = (id, field, value) => {
    setParsedItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === "rate" || field === "quantity") {
            const q = Number(field === "quantity" ? value : it.quantity) || 1;
            const r = Number(field === "rate" ? value : it.rate) || 0;
            updated.total = Math.round(q * r);
          }
          return updated;
        }
        return it;
      })
    );
  };

  const removeItem = (id) => {
    setParsedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addNewBlankItem = () => {
    const blank = {
      id: `manual_${Date.now()}`,
      name: "",
      spokenName: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      costPrice: 0,
      total: 0,
      category: defaultCategory || "General",
      productId: null,
      isMatched: false,
      matchScore: 0,
      isNewItem: true,
      autoCreateInInventory: true
    };
    setParsedItems((prev) => [...prev, blank]);
  };

  // Grand Total Calculation
  const grandTotal = parsedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalStockToAdd = parsedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Submit Voice Bill
  const handleCreateVoiceBill = async () => {
    if (parsedItems.length === 0) {
      return alert("कृपया पहले बोलकर या लिखकर कम से कम 1 सामान जोड़ें!");
    }

    const invalidItems = parsedItems.filter((i) => !i.name || !i.name.trim());
    if (invalidItems.length > 0) {
      return alert("कृपया सभी सामानों के नाम भरें!");
    }

    try {
      setSubmitting(true);
      const genBillNo = `VOICE-${Date.now().toString().slice(-6)}`;
      const finalCustName = customerName.trim() || "नकद ग्राहक (Walk-in)";
      const finalPhone = customerPhone.trim();

      const payload = {
        billNumber: genBillNo,
        customerName: finalCustName,
        partyName: finalCustName,
        customerMobile: finalPhone || undefined,
        customerPhone: finalPhone || undefined,
        paymentMode: paymentMode,
        paymentMethod: paymentMode === "UDHAR" ? "credit" : paymentMode === "UPI" ? "online" : "cash",
        status: paymentMode === "UDHAR" ? "issued" : "paid",
        dueDate: paymentMode === "UDHAR" ? dueDate : undefined,
        lateInterestPercent: paymentMode === "UDHAR" ? (Number(lateInterestPercent) || 2) : 0,
        isUdharProtected: paymentMode === "UDHAR",
        autoCreateNewProducts: true, // Auto register in inventory!
        items: parsedItems.map((item) => ({
          productId: item.productId || undefined,
          name: item.name.trim(),
          category: item.category || defaultCategory || "General",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "pcs",
          rate: Number(item.rate) || 0,
          costPrice: Number(item.costPrice) || Math.round((Number(item.rate) || 0) * 0.75),
          total: Number(item.total) || 0,
          autoCreateInInventory: item.isNewItem || !item.productId
        })),
        subTotal: grandTotal,
        finalAmount: grandTotal,
        totalAmount: grandTotal,
        total: grandTotal,
        notes: `Voice Order via AI (${parsedItems.length} items)`
      };

      const res = await api.post("/api/billing", payload);
      const createdBill = res?.data?.bill || payload;

      setSuccessMessage(`🎉 बिल #${createdBill.billNumber || genBillNo} सफलतापूर्वक तैयार हो गया! कुल राशि: ₹${grandTotal}`);

      // If legal udhar protection is returned, open verification modal
      if (res?.data?.udharProtection) {
        setActiveUdharBill({
          ...createdBill,
          ...res.data.udharProtection,
          _id: createdBill._id || res?.data?.bill?._id
        });
        setShowUdharModal(true);
      }

      // Reset items
      setParsedItems([]);
      setTranscript("");
    } catch (err) {
      console.error("Create voice bill error:", err);
      alert("बिल बनाने में त्रुटि: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Voice Inventory Entry
  const handleSaveVoiceInventory = async () => {
    if (parsedItems.length === 0) {
      return alert("कृपया पहले बोलकर सामान जोड़ें!");
    }

    const invalid = parsedItems.filter((i) => !i.name || !i.name.trim());
    if (invalid.length > 0) {
      return alert("कृपया सभी सामानों के नाम दर्ज करें!");
    }

    try {
      setSubmitting(true);
      const payload = {
        items: parsedItems.map((item) => ({
          name: item.name.trim(),
          category: item.category || defaultCategory || "General",
          unit: item.unit || "Pcs",
          quantity: Number(item.quantity) || 0,
          stock: Number(item.quantity) || 0,
          sellingPrice: Number(item.rate) || 0,
          costPrice: Number(item.costPrice) || Math.round((Number(item.rate) || 0) * 0.75)
        }))
      };

      const res = await api.post("/api/inventory/voice-batch-add", payload);
      setSuccessMessage(`📦 ${res.data.message || "इन्वेंटरी सफलतापूर्वक अपडेट हो गई!"}`);

      // Reload inventory so new products become matched next time
      loadInventory();
      setParsedItems([]);
      setTranscript("");
    } catch (err) {
      console.error("Voice batch inventory error:", err);
      alert("इन्वेंटरी जोड़ने में त्रुटि: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 🔝 HEADER BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="वापस जाएं"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-wide flex items-center gap-1.5">
                <span>AI स्मार्ट वॉइस असिस्टेंट</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                  Voice POS & Stock
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">
                बोलकर 1-क्लिक में बिल बनाएं व इन्वेंटरी स्टॉक दर्ज करें
              </p>
            </div>
          </div>
        </div>

        {/* Language & Action */}
        <div className="flex items-center gap-2">
          <select
            value={recognitionLanguage}
            onChange={(e) => setRecognitionLanguage(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-200 outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
            <option value="en-IN">🇬🇧 Hinglish / English</option>
          </select>
        </div>
      </header>

      {/* 🔀 MODE SELECTOR TABS */}
      <div className="max-w-4xl w-full mx-auto p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode("billing")}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === "billing"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt size={16} />
            <span>बोलकर बिल बनाएं (Voice Billing)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("inventory")}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === "inventory"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PackagePlus size={16} />
            <span>बोलकर इन्वेंटरी जोड़ें (Rapid Stock)</span>
          </button>
        </div>
      </div>

      {/* 🎙️ CENTRAL VOICE CAPTURE HUB */}
      <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 flex-1 flex flex-col space-y-4">
        <div className="bg-slate-950 rounded-3xl border border-slate-800/80 p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          {/* Audio Wave Pulsing Effect */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-64 h-64 rounded-full bg-purple-500 animate-ping" />
            </div>
          )}

          {/* Big Mic Button */}
          <button
            onClick={toggleListening}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer active:scale-90 ${
              isListening
                ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 ring-8 ring-rose-500/30 text-white animate-pulse"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-4 ring-purple-500/20"
            }`}
            title={isListening ? "आवाज़ सुनना रोकें" : "बोलना शुरू करें"}
          >
            {isListening ? <Mic size={38} className="animate-bounce" /> : <Mic size={36} />}
          </button>

          {/* Status Label */}
          <div className="mt-3 space-y-1">
            <h3 className="font-black text-sm sm:text-base text-white">
              {isListening ? "🔴 सुन रहे हैं... कृपया बोलें" : "🎙️ बोलने के लिए माइक पर क्लिक करें"}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-md">
              {activeMode === "billing"
                ? "उदा: 'दो प्लेट पनीर बटर मसाला 250 और 4 बटर नान 40' या '5 किलो बासमती चावल 60'"
                : "उदा: 'दस पैकेट अमूल दूध 30 रुपए' या 'बीस पैकेट फॉर्च्यून तेल 145 रुपए'"}
            </p>
          </div>

          {/* Live Transcript Display */}
          {(interimText || transcript) && (
            <div className="mt-4 w-full max-w-xl bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 text-left animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                <span>🔊 आवाज़ रिकॉर्डिंग:</span>
                {transcript && (
                  <button
                    onClick={() => {
                      setTranscript("");
                      setInterimText("");
                    }}
                    className="text-rose-400 hover:underline cursor-pointer"
                  >
                    साफ़ करें
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-200 font-medium">
                {transcript}
                {interimText && <span className="text-purple-300 font-bold italic animate-pulse"> {interimText}</span>}
              </p>
            </div>
          )}

          {/* Success Notification */}
          {successMessage && (
            <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Text input fallback */}
          <form onSubmit={handleManualParse} className="mt-4 w-full max-w-xl flex gap-2">
            <input
              type="text"
              placeholder="या यहाँ बोलकर/टाइप करें (उदा. 3 पीस पारले जी 10 वाला)..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0"
            >
              + जोड़ें
            </button>
          </form>
        </div>

        {/* 📋 REVIEW & EDIT SECTION (बनने के बाद यूजर को दिखाना व बदलाव करना) */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h4 className="font-black text-sm text-white">
                सत्यापन व बदलाव ({parsedItems.length} आइटम्स)
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addNewBlankItem}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1"
              >
                <Plus size={12} /> नया आइटम
              </button>
              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setParsedItems([])}
                  className="px-2 py-1 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
                >
                  सभी हटाएं
                </button>
              )}
            </div>
          </div>

          {parsedItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <Volume2 size={32} className="mx-auto opacity-30 text-purple-400" />
              <p className="font-bold">अभी कोई सामान नहीं जुड़ा है</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                माइक बटन दबाएं और बोलें। आपके बोलने के अनुसार सिस्टम तुरंत सामान पहचानेगा और यहाँ दिखाएगा।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                >
                  {/* Item Row Top: Name + Match Badge + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemField(item.id, "name", e.target.value)}
                          placeholder="सामान का नाम..."
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg font-bold text-xs text-white outline-none focus:border-purple-400 flex-1 min-w-[150px]"
                        />
                      </div>

                      {/* Fuzzy Match Status Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        {item.isMatched && item.matchedInventoryItem ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                            ✓ {item.matchScore}% मैच: {item.matchedInventoryItem.name} (स्टॉक: {item.matchedInventoryItem.currentStock || 0})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                            ✨ नया सामान (ऑटो इन्वेंटरी में जुड़ेगा)
                          </span>
                        )}
                        {item.spokenName && item.spokenName !== item.name && (
                          <span className="text-slate-500">बोला गया: "{item.spokenName}"</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Item Controls Row: Qty Stepper, Unit, Rate, Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60">
                    {/* Qty Stepper */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">मात्रा (Qty):</label>
                      <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded transition cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.id, "quantity", parseFloat(e.target.value) || 1)}
                          className="w-full text-center bg-transparent text-xs font-bold text-white outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded transition cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Unit Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">यूनिट (Unit):</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(item.id, "unit", e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white outline-none focus:border-purple-400 cursor-pointer"
                      >
                        {["pcs", "kg", "gm", "ltr", "plate", "packet", "box", "meter", "bag", "dozen"].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rate / Price */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {activeMode === "inventory" ? "बिक्री दर (Sale Price ₹):" : "दर (Rate ₹):"}
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItemField(item.id, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none focus:border-purple-400 font-mono text-right"
                      />
                    </div>

                    {/* Subtotal or Cost Price */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {activeMode === "inventory" ? "खरीद दर (Cost ₹):" : "कुल (Total ₹):"}
                      </label>
                      {activeMode === "inventory" ? (
                        <input
                          type="number"
                          value={item.costPrice}
                          onChange={(e) => updateItemField(item.id, "costPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none focus:border-purple-400 font-mono text-right"
                          placeholder="0"
                        />
                      ) : (
                        <div className="px-2 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs font-black text-amber-400 font-mono text-right">
                          ₹{item.total}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 💳 ACTION & SUBMIT PANEL */}
        {parsedItems.length > 0 && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 space-y-3 mb-6">
            {activeMode === "billing" ? (
              <>
                {/* Billing Customer & Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      👤 ग्राहक का नाम:
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="ग्राहक का नाम..."
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      📱 WhatsApp मोबाइल (पर्ची / OTP हेतु):
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-अंकों का मोबाइल नंबर..."
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1">भुगतान माध्यम (Payment Mode):</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CASH", label: "💵 नकद (Cash)" },
                      { id: "UPI", label: "📲 UPI / QR" },
                      { id: "UDHAR", label: "📒 उधारी 🛡️" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          paymentMode === m.id
                            ? m.id === "UDHAR"
                              ? "bg-rose-600 text-white border-rose-500 shadow-md font-black"
                              : "bg-emerald-600 text-white border-emerald-500 shadow-md font-black"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legal Udhar Card */}
                {paymentMode === "UDHAR" && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>लीगल उधारी सुरक्षा (IT Act 2000 Section 10A)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">📅 तय तारीख (Due Date):</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-400 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">⚖️ विलंब ब्याज % (प्रति माह):</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={lateInterestPercent}
                          onChange={(e) => setLateInterestPercent(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-400 font-medium"
                          placeholder="2"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      📱 बिल बनते ही ग्राहक के WhatsApp पर कानूनी वचनपत्र और डिलीवरी OTP जाएगा। OTP लेकर ही डिलीवरी सत्यापित करें।
                    </p>
                  </div>
                )}

                {/* Total & Submit Button */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block">कुल देय राशि (Grand Total):</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">₹{grandTotal}</span>
                  </div>

                  <button
                    onClick={handleCreateVoiceBill}
                    disabled={submitting}
                    className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMode === "UDHAR"
                        ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-600/30"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-emerald-500/20"
                    }`}
                  >
                    {submitting ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    <span>
                      {submitting
                        ? "बिल तैयार हो रहा है..."
                        : paymentMode === "UDHAR"
                        ? "🛡️ उधारी बिल बनाएं व लीगल OTP भेजें"
                        : "⚡ बिल बनाएं व प्रिंट करें"}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Inventory Mode Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      🏷️ डिफ़ॉल्ट श्रेणी (Default Category):
                    </label>
                    <input
                      type="text"
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      placeholder="General / किराना / रेस्टोरेंट..."
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-slate-400 font-bold">
                      📦 जुड़ने वाले कुल सामान:
                    </span>
                    <span className="text-lg font-black text-purple-300 font-mono">
                      {parsedItems.length} उत्पाद ({totalStockToAdd} कुल मात्रा)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveVoiceInventory}
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <RefreshCw size={18} className="animate-spin" /> : <PackagePlus size={18} />}
                    <span>{submitting ? "इन्वेंटरी में जुड़ रहा है..." : "📦 सभी सामान इन्वेंटरी में जोड़ें"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 🛡️ LEGAL UDHAR OTP MODAL */}
      <UdharOtpVerificationModal
        isOpen={showUdharModal}
        onClose={() => setShowUdharModal(false)}
        billData={activeUdharBill}
        onVerified={(verified) => {
          alert(`🎉 [बिल #${verified.billNumber}] डिलीवरी OTP सफलतापूर्वक सत्यापित हो गया! सामान हैंडओवर करें।`);
          setShowUdharModal(false);
        }}
      />
    </div>
  );
}
