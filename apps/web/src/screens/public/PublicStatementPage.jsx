import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import * as XLSX from "xlsx";
import { 
  Building2, Phone, MapPin, Calendar, Clock, Download, 
  Printer, ArrowLeft, CheckCircle2, AlertTriangle, QrCode, 
  ExternalLink, FileSpreadsheet, ShieldCheck, RefreshCw,
  Eye, Image, X, FileText, Search, ZoomIn, ChevronLeft, ChevronRight,
  Layers, DownloadCloud
} from "lucide-react";
import { getWebSafeImageUrl } from "../../utils/photoStorage";

export default function PublicStatementPage() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("table"); // 'table' | 'gallery'
  const [previewPhotosList, setPreviewPhotosList] = useState([]);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [previewDetails, setPreviewDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenPhotoPreview = (tx, initialIndex = 0) => {
    const list = (tx.billImageUrls && tx.billImageUrls.length > 0)
      ? tx.billImageUrls
      : (tx.billImageUrl ? [tx.billImageUrl] : []);
    if (list.length === 0) return;
    setPreviewPhotosList(list);
    setPreviewActiveIndex(initialIndex);
    setPreviewDetails(tx);
  };

  const handleDownloadAllPhotos = (photos, billNo) => {
    if (!photos || photos.length === 0) return;
    photos.forEach((url, idx) => {
      setTimeout(() => {
        const safe = getWebSafeImageUrl(url);
        const a = document.createElement("a");
        a.href = safe;
        a.download = `Bill_${billNo || "slip"}_page_${idx + 1}.jpg`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { document.body.removeChild(a); } catch (e) {}
        }, 300);
      }, idx * 400);
    });
  };

  const fetchPublicStatement = async () => {
    if (!partyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/parties/public/${partyId}/statement`);
      if (res.data && res.data.success) {
        setData(res.data);
      } else {
        setError(res.data?.error || "खाता विवरण लोड नहीं हो सका।");
      }
    } catch (err) {
      console.error("Public statement load error:", err);
      setError(err.response?.data?.error || err.message || "खाता विवरण लोड करने में त्रुटि आई।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStatement();
  }, [partyId]);

  const handleExportExcel = () => {
    if (!data?.transactions) return;
    const partyName = data.party?.name || "Customer";
    const rawRows = (data.transactions || []).map((t) => {
      const txDate = t.date ? new Date(t.date).toLocaleDateString("hi-IN") : "-";
      const daysDiff = Math.max(0, Math.floor((new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24)));
      const photoUrl = t.billImageUrl || (t.billImageUrls && t.billImageUrls[0]) || "";
      return {
        "दिनांक (Date)": txDate,
        "विवरण (Particulars)": t.details || (t.debit > 0 ? "बिल / बिक्री" : "जमा / भुगतान"),
        "रिफरेंस / बिल नं.": t.billNumber || t.refNo || "-",
        "देरी / अवधि (Days)": t.debit > 0 ? `${daysDiff} दिन से बकाया` : "जमा",
        "बिल रकम (Debit ₹)": Number(t.debit || 0),
        "जमा रकम (Credit ₹)": Number(t.credit || 0),
        "शेष बाकी (Balance ₹)": Number(t.runningBalance || 0),
        "बिल पर्ची / फोटो लिंक (Click to View)": photoUrl ? "📷 फोटो खोलें (Click to View Photo)" : "कोई फोटो नहीं"
      };
    });

    const ws = XLSX.utils.json_to_sheet(rawRows);
    
    // Add real clickable Excel hyperlinks for rows with a photo
    (data.transactions || []).forEach((t, i) => {
      const photoUrl = t.billImageUrl || (t.billImageUrls && t.billImageUrls[0]) || "";
      if (photoUrl) {
        const cellRef = XLSX.utils.encode_cell({ c: 7, r: i + 1 });
        if (ws[cellRef]) {
          ws[cellRef].l = { Target: photoUrl, Tooltip: "बिल पर्ची फोटो खोलें" };
        }
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    XLSX.writeFile(wb, `Statement_${partyName.replace(/\s+/g, "_")}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <Loader />
        <p className="mt-4 text-xs font-bold text-slate-500 animate-pulse">
          खाता विवरण लोड हो रहा है, कृपया प्रतीक्षा करें...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-black text-slate-900">खाता विवरण उपलब्ध नहीं है</h2>
          <p className="text-xs text-slate-500 mt-2">{error || "कृपया सही लिंक की जांच करें या विक्रेता से संपर्क करें।"}</p>
          <button
            onClick={fetchPublicStatement}
            className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <RefreshCw size={14} /> <span>पुनः प्रयास करें (Retry)</span>
          </button>
        </div>
      </div>
    );
  }

  const { company, party, currentBalance, totalDebit, totalCredit, transactions = [] } = data;
  const isDue = currentBalance > 0;
  const isAdvance = currentBalance < 0;
  const absBal = Math.abs(currentBalance || 0);

  // Generate UPI payment URL
  const merchantPhone = company?.phone || "7828289433";
  const upiId = company?.upiId || `${merchantPhone}@upi`;
  const merchantName = company?.name || "Ganesh Hardware";
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${absBal}&cu=INR&tn=${encodeURIComponent(`Bill Payment ${party?.name || ''}`)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayUrl)}`;

  // Find max overdue days
  let oldestOverdueDays = 0;
  transactions.forEach((t) => {
    if (Number(t.debit) > 0 && t.date) {
      const d = Math.max(0, Math.floor((new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24)));
      if (d > oldestOverdueDays) oldestOverdueDays = d;
    }
  });

  // Filter transactions with photos
  const photoTransactions = transactions.filter(t => t.billImageUrl || (t.billImageUrls && t.billImageUrls.length > 0));

  // Search filtered transactions
  const displayTransactions = transactions.filter(t => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const details = (t.details || "").toLowerCase();
    const ref = (t.billNumber || t.refNo || "").toLowerCase();
    return details.includes(q) || ref.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16 print:bg-white print:pb-0">
      {/* Top Brand Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-300 text-[11px] font-bold border border-indigo-400/20 mb-2">
                <ShieldCheck size={14} />
                <span>डिजिटल खाता लेजर विवरण</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{merchantName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1">
                {company?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-indigo-400" />
                    <span>{company.address}</span>
                  </span>
                )}
                {merchantPhone && (
                  <a href={`tel:${merchantPhone}`} className="flex items-center gap-1 hover:text-white transition">
                    <Phone size={13} className="text-indigo-400" />
                    <span>{merchantPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions (Print / Excel) */}
            <div className="flex items-center gap-2 print:hidden w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                title="Excel फाइल डाउनलोड करें (फोटो लिंक सहित)"
              >
                <FileSpreadsheet size={15} />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                title="प्रिंट या PDF डाउनलोड करें"
              >
                <Printer size={15} />
                <span>PDF / Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
        {/* Customer Profile & Balance Hero Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">खाताधारक / ग्राहक</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{party?.name || "सम्मानित ग्राहक"}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {party?.phone && <span>📞 {party.phone}</span>}
                {party?.address && <span>📍 {party.address}</span>}
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                  {party?.partyType === "supplier" ? "सप्लायर" : "ग्राहक"}
                </span>
                {photoTransactions.length > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    📷 {photoTransactions.length} बिल पर्चियां संलग्न
                  </span>
                )}
              </div>
            </div>

            {/* Total Balance Badge */}
            <div className={`p-4 rounded-2xl border text-right w-full sm:w-auto shrink-0 ${
              isDue ? "bg-rose-50 border-rose-200" : isAdvance ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
            }`}>
              <span className={`text-[11px] font-bold block ${isDue ? "text-rose-700" : isAdvance ? "text-emerald-700" : "text-slate-500"}`}>
                {isDue ? "🔴 कुल बकाया राशि (देय / Due)" : isAdvance ? "🟢 अग्रिम जमा (Advance Credit)" : "⚪ हिसाब पूर्णतः चुकता"}
              </span>
              <p className={`text-2xl sm:text-3xl font-black mt-0.5 ${isDue ? "text-rose-600" : isAdvance ? "text-emerald-700" : "text-slate-800"}`}>
                ₹{absBal.toLocaleString("en-IN")}
              </p>
              {isDue && oldestOverdueDays > 0 && (
                <span className="text-[10px] font-black bg-rose-200/80 text-rose-800 px-2 py-0.5 rounded-md inline-block mt-1">
                  ⏳ सबसे पुराना बिल: {oldestOverdueDays} दिन से बकाया
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 📱 INSTANT UPI PAYMENT CARD (WHEN BALANCE IS DUE) */}
        {isDue && absBal > 0 && (
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-700/40 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30">
                  <QrCode size={14} />
                  <span>तुरंत ऑनलाइन भुगतान सुविधा (Instant UPI)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  ₹{absBal.toLocaleString("en-IN")} का भुगतान तुरंत करें
                </h3>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  दाहिनी ओर दिए गए QR कोड को किसी भी UPI ऐप (Google Pay, PhonePe, Paytm, BHIM) से स्कैन करके सीधे भुगतान करें।
                </p>
                <div className="bg-emerald-800/40 rounded-2xl p-3 border border-emerald-700/50 text-xs font-mono space-y-1">
                  <div><span className="text-emerald-300">UPI ID:</span> <span className="font-bold text-white select-all">{upiId}</span></div>
                  <div><span className="text-emerald-300">UPI / Mobile:</span> <span className="font-bold text-white">{merchantPhone}</span></div>
                </div>

                {/* 1-Click Mobile UPI App Launch Button */}
                <div className="pt-1">
                  <a
                    href={upiPayUrl}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-green-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95"
                  >
                    <span>🟢 UPI ऐप (PhonePe / GPay) से सीधे Pay करें</span>
                  </a>
                </div>
              </div>

              {/* Dynamic QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-2xl flex flex-col items-center justify-center shrink-0 border-4 border-emerald-400/30">
                <img
                  src={qrImageUrl}
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain rounded-lg"
                />
                <span className="text-[10px] font-black text-slate-700 mt-1.5 tracking-wider">
                  SCAN TO PAY ₹{absBal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 📋 VIEW TOGGLE (LEDGER TABLE vs BILL PHOTOS GALLERY) */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("table")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === "table"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <FileText size={14} />
                <span>खाता लेजर ({transactions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("gallery")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === "gallery"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Image size={14} />
                <span>बिल पर्चियां व फोटो ({photoTransactions.length})</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="बिल नं. या विवरण खोजें..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* VIEW 1: TABLE VIEW */}
          {activeView === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">दिनांक</th>
                    <th className="px-4 py-3">विवरण / बिल नं.</th>
                    <th className="px-4 py-3">अवधि / स्थिति</th>
                    <th className="px-4 py-3 text-right">बिल (Debit)</th>
                    <th className="px-4 py-3 text-right">जमा (Credit)</th>
                    <th className="px-4 py-3 text-right">शेष बाकी</th>
                    <th className="px-4 py-3 text-center">📷 पर्ची / फोटो</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        कोई खाता प्रविष्टि मौजूद नहीं है
                      </td>
                    </tr>
                  ) : (
                    displayTransactions.map((t, idx) => {
                      const isDebit = Number(t.debit) > 0;
                      const isCredit = Number(t.credit) > 0;
                      const txDate = t.date ? new Date(t.date) : null;
                      const formattedDate = txDate ? txDate.toLocaleDateString("hi-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
                      const daysAgo = txDate ? Math.max(0, Math.floor((new Date() - txDate) / (1000 * 60 * 60 * 24))) : 0;
                      const rawPhoto = t.billImageUrl || (t.billImageUrls && t.billImageUrls[0]);
                      const safePhoto = getWebSafeImageUrl(rawPhoto);

                      return (
                        <tr key={t._id || idx} className="hover:bg-indigo-50/40 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{t.details || (isDebit ? "बिल" : "जमा")}</div>
                            {(t.billNumber || t.refNo) && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                रिफरेंस: #{t.billNumber || t.refNo}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {isDebit ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                daysAgo > 20 ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                daysAgo > 7 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                <span>⏳ {daysAgo} दिन से बकाया</span>
                              </span>
                            ) : isCredit ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                                <CheckCircle2 size={10} /> <span>जमा प्रविष्टि</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-rose-600 whitespace-nowrap">
                            {isDebit ? `₹${Number(t.debit).toLocaleString("en-IN")}` : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-emerald-700 whitespace-nowrap">
                            {isCredit ? `₹${Number(t.credit).toLocaleString("en-IN")}` : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                            ₹{Number(t.runningBalance || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {(() => {
                              const pList = (t.billImageUrls && t.billImageUrls.length > 0)
                                ? t.billImageUrls
                                : (t.billImageUrl ? [t.billImageUrl] : []);
                              if (pList.length === 0) return <span className="text-slate-300 text-[10px]">-</span>;

                              const primarySafe = getWebSafeImageUrl(pList[0]);
                              return (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div
                                    className="relative cursor-pointer group"
                                    onClick={() => handleOpenPhotoPreview(t, 0)}
                                  >
                                    <img
                                      src={primarySafe}
                                      alt="Bill Preview"
                                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:scale-110 transition shadow-xs"
                                      title="पर्ची बड़ी देखें"
                                    />
                                    {pList.length > 1 && (
                                      <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white font-black text-[9px] px-1 rounded-full shadow-xs">
                                        +{pList.length - 1}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPhotoPreview(t, 0)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="बिल फोटो देखें व डाउनलोड करें"
                                  >
                                    <Eye size={12} />
                                    <span>{pList.length > 1 ? `${pList.length} पर्चियां` : "देखें"}</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">कुल योग (Totals):</td>
                      <td className="px-4 py-3 text-right text-rose-600">₹{Number(totalDebit || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">₹{Number(totalCredit || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-indigo-900">₹{absBal.toLocaleString("en-IN")}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* VIEW 2: PHOTO GALLERY VIEW (FOR EASY BROWSING & DOWNLOADING BILL PHOTOS) */}
          {activeView === "gallery" && (
            <div className="p-5">
              {photoTransactions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Image size={36} className="mx-auto text-slate-300" />
                  <p className="font-bold text-sm">इस खाते में अभी कोई बिल फोटो या पर्ची संलग्न नहीं है।</p>
                  <p className="text-xs text-slate-400">दुकानदार द्वारा पर्ची अपलोड किए जाने पर यहाँ सभी फोटो एक साथ दिखाई देंगी।</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photoTransactions.map((t, idx) => {
                    const pList = (t.billImageUrls && t.billImageUrls.length > 0)
                      ? t.billImageUrls
                      : (t.billImageUrl ? [t.billImageUrl] : []);
                    const primarySafe = getWebSafeImageUrl(pList[0]);
                    const txDate = t.date ? new Date(t.date).toLocaleDateString("hi-IN") : "-";

                    return (
                      <div
                        key={t._id || idx}
                        className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 flex flex-col justify-between hover:shadow-md transition group"
                      >
                        <div
                          onClick={() => handleOpenPhotoPreview(t, 0)}
                          className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-200 cursor-pointer"
                        >
                          <img
                            src={primarySafe}
                            alt="Bill Slip"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          {pList.length > 1 && (
                            <span className="absolute top-2 right-2 bg-indigo-600/95 backdrop-blur-xs text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                              <Layers size={11} /> {pList.length} पर्चियां
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn size={24} />
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                            <span>{txDate}</span>
                            <span className="text-rose-600 font-black">₹{Number(t.debit || t.credit || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate" title={t.details || t.billNumber || "बिल"}>
                            {t.details || t.billNumber || "बिल पर्ची"}
                          </p>

                          <div className="pt-1 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoPreview(t, 0)}
                              className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye size={11} /> <span>{pList.length > 1 ? `${pList.length} पर्चियां` : "देखें"}</span>
                            </button>
                            {pList.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadAllPhotos(pList, t.billNumber || idx + 1)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer"
                                title={`सभी ${pList.length} पर्चियां एक साथ डाउनलोड करें`}
                              >
                                <DownloadCloud size={13} />
                              </button>
                            ) : (
                              <a
                                href={primarySafe}
                                download={`Bill_${t.billNumber || t.refNo || idx + 1}.jpg`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer"
                                title="डाउनलोड करें"
                              >
                                <Download size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-white rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200 space-y-1">
          <p className="font-bold text-slate-700">
            कृपया खाता विवरण का मिलान कर लें। किसी भी त्रुटि या सहायता हेतु संपर्क करें: {merchantPhone}
          </p>
          <p className="text-[11px] text-slate-400">
            - {merchantName}, {company?.address || "सारंगढ़"}
          </p>
        </div>
      </div>

      {/* 🖼️ HIGH-RESOLUTION BILL PHOTO MODAL & CAROUSEL & DOWNLOAD DIALOG */}
      {previewPhotosList.length > 0 && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex justify-center items-center z-[130] p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-5 flex flex-col max-h-[94vh] border border-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Image size={18} className="text-indigo-600" />
                    <span>बिल पर्ची / फोटो विवरण</span>
                  </h3>
                  {previewPhotosList.length > 1 && (
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black px-2 py-0.5 rounded-full">
                      पर्ची {previewActiveIndex + 1} / {previewPhotosList.length}
                    </span>
                  )}
                </div>
                {previewDetails && (
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    {previewDetails.details || 'बिल'} • {previewDetails.date ? new Date(previewDetails.date).toLocaleDateString('hi-IN') : ''} • रकम: <span className="font-black text-slate-800">₹{Number(previewDetails.debit || previewDetails.credit || 0).toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewPhotosList([]);
                  setPreviewActiveIndex(0);
                  setPreviewDetails(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div className="relative flex-1 bg-slate-950 rounded-2xl my-2.5 p-2 flex items-center justify-center min-h-[280px] max-h-[55vh] overflow-hidden">
              <img
                src={getWebSafeImageUrl(previewPhotosList[previewActiveIndex])}
                alt={`Bill Slip Page ${previewActiveIndex + 1}`}
                className="max-h-[52vh] w-auto object-contain rounded-xl shadow-lg"
              />

              {previewPhotosList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewActiveIndex(prev => (prev > 0 ? prev - 1 : previewPhotosList.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer shadow-lg transition"
                    title="पिछली पर्ची"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewActiveIndex(prev => (prev < previewPhotosList.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer shadow-lg transition"
                    title="अगली पर्ची"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Scrollable Thumbnail Strip (when multiple photos exist) */}
            {previewPhotosList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 justify-center max-w-full mb-2">
                {previewPhotosList.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPreviewActiveIndex(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      i === previewActiveIndex
                        ? "border-indigo-600 scale-105 shadow-md"
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getWebSafeImageUrl(url)}
                      alt={`Thumb ${i + 1}`}
                      className="w-12 h-12 object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-bold text-center">
                      #{i + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Download & Close Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setPreviewPhotosList([]);
                  setPreviewActiveIndex(0);
                  setPreviewDetails(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                बंद करें
              </button>

              <div className="flex items-center gap-2">
                {/* Download active single photo */}
                <a
                  href={getWebSafeImageUrl(previewPhotosList[previewActiveIndex])}
                  download={`Bill_${previewDetails?.billNumber || 'slip'}_page_${previewActiveIndex + 1}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="यह फोटो डाउनलोड करें"
                >
                  <Download size={14} />
                  <span>यह फोटो (#{previewActiveIndex + 1})</span>
                </a>

                {/* Bulk download all photos button */}
                {previewPhotosList.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadAllPhotos(previewPhotosList, previewDetails?.billNumber || previewDetails?.refNo)}
                    className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    title="सभी पर्चियां एक साथ डाउनलोड करें"
                  >
                    <DownloadCloud size={15} />
                    <span>⬇️ सभी {previewPhotosList.length} पर्चियां एक साथ डाउनलोड करें</span>
                  </button>
                ) : (
                  <a
                    href={getWebSafeImageUrl(previewPhotosList[0])}
                    download={`Bill_${previewDetails?.billNumber || previewDetails?.refNo || 'slip'}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Download size={15} />
                    <span>⬇️ बिल फोटो डाउनलोड करें</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
