import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  Calendar,
  Filter,
  FileText,
  FileCode,
  Sparkles,
  Building2,
  Home,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";

/**
 * Normalizes category names to standard Wealth Tracker categories
 */
export function normalizeWealthCategory(rawCat, title = "") {
  const text = `${rawCat || ""} ${title || ""}`.toLowerCase();

  if (text.includes("पेट्रोल") || text.includes("fuel") || text.includes("diesel") || text.includes("बाइक") || text.includes("गाड़ी") || text.includes("travel")) {
    return "Fuel";
  }
  if (text.includes("राशन") || text.includes("किराना") || text.includes("grocery") || text.includes("atta") || text.includes("oil") || text.includes("masala")) {
    return "Groceries";
  }
  if (text.includes("दूध") || text.includes("सब्जी") || text.includes("फल") || text.includes("milk") || text.includes("vegetable") || text.includes("daily")) {
    return "Daily Needs";
  }
  if (text.includes("दवाई") || text.includes("डॉक्टर") || text.includes("medical") || text.includes("medicine") || text.includes("hospital") || text.includes("health")) {
    return "Medical";
  }
  if (text.includes("रिचार्ज") || text.includes("recharge") || text.includes("mobile") || text.includes("wifi") || text.includes("phone")) {
    return "Recharge";
  }
  if (text.includes("स्कूल") || text.includes("कॉलेज") || text.includes("फीस") || text.includes("education") || text.includes("tuition") || text.includes("books")) {
    return "Education";
  }
  if (text.includes("बिजली") || text.includes("गैस") || text.includes("पानी") || text.includes("utilities") || text.includes("electricity") || text.includes("bill")) {
    return "Utilities";
  }
  if (text.includes("कपड़े") || text.includes("शॉपिंग") || text.includes("shopping") || text.includes("clothes") || text.includes("shoes")) {
    return "Shopping";
  }
  if (text.includes("खाना") || text.includes("होटल") || text.includes("dining") || text.includes("restaurant") || text.includes("food") || text.includes("swiggy") || text.includes("zomato") || text.includes("नाश्ता")) {
    return "Food & Dining";
  }
  if (text.includes("बचत") || text.includes("निवेश") || text.includes("sip") || text.includes("mutual") || text.includes("fd") || text.includes("rd") || text.includes("gold") || text.includes("invest")) {
    return "Investment";
  }
  if (text.includes("सैलरी") || text.includes("मजदूरी") || text.includes("salary") || text.includes("staff") || text.includes("advance")) {
    return "Salary";
  }
  if (text.includes("किराया") || text.includes("rent") || text.includes("dukan rent") || text.includes("room")) {
    return "Rent";
  }
  if (text.includes("मेंटेनेंस") || text.includes("maintenance") || text.includes("repair") || text.includes("रिपेयर")) {
    return "Maintenance";
  }

  // Fallback: Clean up raw category string
  const clean = String(rawCat || title || "Expense")
    .replace(/[()]/g, "")
    .replace(/[/\\|]/g, " ")
    .trim();
  return clean || "Misc";
}

/**
 * Determines whether payment was online or offline
 */
export function getWealthPaymentMode(item) {
  const raw = String(item.paymentMode || item.paymentMethod || item.mode || "").toLowerCase();
  if (
    raw.includes("online") ||
    raw.includes("upi") ||
    raw.includes("bank") ||
    raw.includes("gpay") ||
    raw.includes("phonepe") ||
    raw.includes("paytm") ||
    raw.includes("card") ||
    raw.includes("netbanking") ||
    raw.includes("transfer") ||
    raw.includes("cheque")
  ) {
    return "online";
  }
  return "offline"; // default for cash, cash_drawer, etc.
}

/**
 * Format date to strict YYYY-MM-DD
 */
export function formatToYYYYMMDD(dateVal) {
  if (!dateVal) return new Date().toISOString().split("T")[0];
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WealthTrackerExportModal({
  isOpen,
  onClose,
  expenses = [],
  companyName = "VyaparBook",
  defaultType = "all"
}) {
  if (!isOpen) return null;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // State
  const [periodType, setPeriodType] = useState("current_month"); // 'current_month', 'last_month', 'custom_month', 'custom_range', 'all'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [expenseFilterType, setExpenseFilterType] = useState(defaultType); // 'all', 'drawings', 'operating'
  const [useStandardCategories, setUseStandardCategories] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rawTextOnly, setRawTextOnly] = useState(true); // raw format without intro header for automated apps

  // Period change handler
  const handlePeriodTypeChange = (p) => {
    setPeriodType(p);
    const curr = new Date();
    if (p === "current_month") {
      const start = new Date(curr.getFullYear(), curr.getMonth(), 1);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(curr.toISOString().split("T")[0]);
      setSelectedMonth(currentMonthStr);
    } else if (p === "last_month") {
      const prev = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      const prevEnd = new Date(curr.getFullYear(), curr.getMonth(), 0);
      setStartDate(prev.toISOString().split("T")[0]);
      setEndDate(prevEnd.toISOString().split("T")[0]);
      const prevMonthStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(prevMonthStr);
    } else if (p === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleMonthPickerChange = (monthVal) => {
    setSelectedMonth(monthVal);
    if (!monthVal) return;
    const [y, m] = monthVal.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Filter expenses
  const filteredList = useMemo(() => {
    return (expenses || []).filter((exp) => {
      // 1. Date filter
      const itemDateStr = formatToYYYYMMDD(exp.date || exp.createdAt || exp.rawDate);
      if (startDate && itemDateStr < startDate) return false;
      if (endDate && itemDateStr > endDate) return false;

      // 2. Type filter
      const type = String(exp.expenseType || exp.type || "").toLowerCase();
      const member = String(exp.familyMember || "").trim();
      const isDrawing =
        type.includes("drawing") ||
        type.includes("ghar") ||
        type.includes("personal") ||
        type.includes("family") ||
        (member && member !== "Shop");

      if (expenseFilterType === "drawings" && !isDrawing) return false;
      if (expenseFilterType === "operating" && isDrawing) return false;

      return true;
    }).sort((a, b) => {
      const da = formatToYYYYMMDD(a.date || a.createdAt);
      const db = formatToYYYYMMDD(b.date || b.createdAt);
      return da.localeCompare(db);
    });
  }, [expenses, startDate, endDate, expenseFilterType]);

  // Transform to Structured Array for Wealth Tracker
  const structuredData = useMemo(() => {
    return filteredList.map((item) => {
      const date = formatToYYYYMMDD(item.date || item.createdAt);
      const amt = Number(item.amount || 0);
      const amount = amt % 1 === 0 ? amt : Number(amt.toFixed(2));

      const rawCategory = item.category || "Expense";
      const category = useStandardCategories
        ? normalizeWealthCategory(rawCategory, item.title || item.description)
        : String(rawCategory).replace(/\|/g, "-").trim() || "Expense";

      const memberTag = item.familyMember && item.familyMember !== "Shop" ? `[${item.familyMember}] ` : "";
      const rawNote = `${memberTag}${item.title || item.description || item.notes || category}`.trim();
      const note = rawNote.replace(/\|/g, "-").replace(/[\r\n]+/g, " ").trim() || category;

      const mode = getWealthPaymentMode(item);

      return {
        date,
        amount,
        category,
        note,
        mode
      };
    });
  }, [filteredList, useStandardCategories]);

  // Generate clean text lines: YYYY-MM-DD | AMOUNT | CATEGORY | NOTE | MODE
  const textLines = useMemo(() => {
    return structuredData.map((d) => `${d.date} | ${d.amount} | ${d.category} | ${d.note} | ${d.mode}`);
  }, [structuredData]);

  const totalAmount = useMemo(() => {
    return structuredData.reduce((s, d) => s + d.amount, 0);
  }, [structuredData]);

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    if (textLines.length === 0) {
      alert("एक्सपोर्ट करने के लिए कोई खर्च मौजूद नहीं है!");
      return;
    }
    const fullText = textLines.join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert("कॉपी नहीं हो सका, कृपया मैन्युअल कॉपी करें।");
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    if (textLines.length === 0) {
      alert("शेयर करने के लिए कोई खर्च मौजूद नहीं है!");
      return;
    }

    const appLink = typeof window !== 'undefined' ? `${window.location.origin}/mobile-app?view=ghar-kharch` : 'https://vyaparbook.in/mobile-app?view=ghar-kharch';

    let messageHeader = "";
    if (!rawTextOnly) {
      const typeLabel =
        expenseFilterType === "drawings"
          ? "🏡 फैमिली घर खर्च (Personal / Family Drawings)"
          : expenseFilterType === "operating"
          ? "🏢 दुकान खर्च (Business Operating Expenses)"
          : "📊 सभी खर्च (All Shop + Ghar Expenses)";

      messageHeader += `📊 *Wealth Tracker Expenses Export*\n`;
      messageHeader += `🏢 ${companyName}\n`;
      messageHeader += `📂 श्रेणी: ${typeLabel}\n`;
      messageHeader += `📅 अवधि: ${startDate || "आरंभ"} से ${endDate || "आज"}\n`;
      messageHeader += `💰 कुल खर्च: ₹${totalAmount.toLocaleString("en-IN")} (${structuredData.length} प्रविष्टियां)\n`;
      messageHeader += `--------------------------------\n`;
      messageHeader += `*Format:* Date | Amount | Category | Note | Mode\n`;
      messageHeader += `--------------------------------\n`;
    }

    const footer = !rawTextOnly ? `\n--------------------------------\n_VyaparBook Wealth Tracker Export_` : "";

    // Fit maximum items within safe URL character limit (~2800 characters)
    let currentLength = messageHeader.length + footer.length + 300;
    const itemLines = [];
    let includedCount = 0;

    for (const line of textLines) {
      if (currentLength + line.length > 2800) {
        break;
      }
      itemLines.push(line);
      currentLength += line.length + 1;
      includedCount++;
    }

    const remainingCount = textLines.length - includedCount;
    if (remainingCount > 0) {
      itemLines.push(`\n...और ${remainingCount} अन्य प्रविष्टियां बाकी हैं।`);
    }

    // Always include direct link for 1-click full view and copy
    itemLines.push(`\n🔗 पूरा लेजर देखने व 1-क्लिक कॉपी हेतु लिंक:\n${appLink}`);

    const message = messageHeader + itemLines.join("\n") + footer;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Download JSON
  const handleDownloadJSON = () => {
    if (structuredData.length === 0) {
      alert("डाउनलोड करने के लिए कोई डेटा नहीं है!");
      return;
    }
    const jsonStr = JSON.stringify(structuredData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealth_tracker_expenses_${startDate || "all"}_to_${endDate || "now"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Text (.txt)
  const handleDownloadTXT = () => {
    if (textLines.length === 0) {
      alert("डाउनलोड करने के लिए कोई डेटा नहीं है!");
      return;
    }
    const txtStr = textLines.join("\n");
    const blob = new Blob([txtStr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealth_tracker_${startDate || "all"}_to_${endDate || "now"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0F172A] leading-tight">
                Export / Share for Wealth Tracker
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Family Wealth Tracker व बजट ऐप्स के लिए 1-क्लिक स्टैंडर्ड फॉर्मेट
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* 1. Date / Month Range Filter */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                <span>अवधि व महीना चुनें (Select Period / Month)</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {structuredData.length} एंट्रियां मिल गईं
              </span>
            </div>

            {/* Quick Period Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handlePeriodTypeChange("current_month")}
                className={`py-2 rounded-xl transition text-center cursor-pointer ${
                  periodType === "current_month"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                🗓️ इस महीने
              </button>
              <button
                type="button"
                onClick={() => handlePeriodTypeChange("last_month")}
                className={`py-2 rounded-xl transition text-center cursor-pointer ${
                  periodType === "last_month"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ⏮️ पिछला महीना
              </button>
              <button
                type="button"
                onClick={() => handlePeriodTypeChange("custom_month")}
                className={`py-2 rounded-xl transition text-center cursor-pointer ${
                  periodType === "custom_month"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                📅 महीना चुनें
              </button>
              <button
                type="button"
                onClick={() => handlePeriodTypeChange("custom_range")}
                className={`py-2 rounded-xl transition text-center cursor-pointer col-span-3 sm:col-span-1 ${
                  periodType === "custom_range"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                📆 तारीख रेंज
              </button>
            </div>

            {/* Specific Month Picker */}
            {periodType === "custom_month" && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">महीना:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthPickerChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Specific Date Range Inputs */}
            {periodType === "custom_range" && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">तारीख से (From):</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">तारीख तक (To):</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Expense Category Filter (All / Ghar / Shop) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Filter size={14} className="text-amber-600" />
              <span>खर्च प्रकार (Expense Category Filter)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setExpenseFilterType("all")}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  expenseFilterType === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>📊 सभी खर्च</span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilterType("drawings")}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  expenseFilterType === "drawings"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🏡 सिर्फ घर खर्च</span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilterType("operating")}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  expenseFilterType === "operating"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🏢 सिर्फ दुकान खर्च</span>
              </button>
            </div>
          </div>

          {/* 3. Formatting Toggles */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-2.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={useStandardCategories}
                onChange={(e) => setUseStandardCategories(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
              <span>स्टैंडर्ड श्रेणियां (Groceries, Fuel, Medical...)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={rawTextOnly}
                onChange={(e) => setRawTextOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
              />
              <span>सिर्फ क्लीन डेटा भेजें (बिना हेडर के)</span>
            </label>
          </div>

          {/* 4. Live Preview Box */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                <span>लाइव प्रीव्यू (Format: YYYY-MM-DD | AMOUNT | CATEGORY | NOTE | MODE)</span>
              </span>
              <span className="text-xs font-black text-emerald-700">
                कुल: ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-3 rounded-2xl font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto border border-slate-800 shadow-inner">
              {textLines.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">
                  चयनित अवधि में कोई खर्च नहीं मिला। कृपया तारीख या फ़िल्टर बदलें।
                </div>
              ) : (
                textLines.map((line, idx) => (
                  <div key={idx} className="whitespace-pre hover:bg-slate-800/60 px-1 rounded transition">
                    {line}
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              * यह फॉर्मेट Wealth Tracker, Excel, Google Sheets और ऑटोमेशन ऐप्स द्वारा सीधे 100% सटीक रीड किया जाता है।
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-slate-100 pt-3 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Copy for Wealth Tracker Button */}
            <button
              onClick={handleCopyClipboard}
              disabled={textLines.length === 0}
              className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? "कॉपी हो गया! ✅" : "📋 Copy for Wealth Tracker"}</span>
            </button>

            {/* 2. Share on WhatsApp Button */}
            <button
              onClick={handleShareWhatsApp}
              disabled={textLines.length === 0}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={18} />
              <span>💬 Share on WhatsApp</span>
            </button>
          </div>

          {/* Optional Downloads (JSON & TXT) */}
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={handleDownloadJSON}
              disabled={structuredData.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileCode size={13} className="text-amber-600" />
              <span>Download JSON ({structuredData.length})</span>
            </button>
            <button
              onClick={handleDownloadTXT}
              disabled={textLines.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Download size={13} className="text-indigo-600" />
              <span>Download .txt File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
