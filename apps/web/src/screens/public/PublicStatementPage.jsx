import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import * as XLSX from "xlsx";
import { 
  Building2, Phone, MapPin, Calendar, Clock, Download, 
  Printer, ArrowLeft, CheckCircle2, AlertTriangle, QrCode, 
  ExternalLink, FileSpreadsheet, ShieldCheck, RefreshCw
} from "lucide-react";

export default function PublicStatementPage() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
    const rows = (data.transactions || []).map((t) => {
      const txDate = t.date ? new Date(t.date).toLocaleDateString("hi-IN") : "-";
      const daysDiff = Math.max(0, Math.floor((new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24)));
      return {
        "दिनांक (Date)": txDate,
        "विवरण (Particulars)": t.details || (t.debit > 0 ? "बिल / बिक्री" : "जमा / भुगतान"),
        "रिफरेंस / बिल नं.": t.billNumber || t.refNo || "-",
        "देरी / अवधि (Days)": t.debit > 0 ? `${daysDiff} दिन से बकाया` : "जमा",
        "बिल रकम (Debit ₹)": Number(t.debit || 0),
        "जमा रकम (Credit ₹)": Number(t.credit || 0),
        "शेष बाकी (Balance ₹)": Number(t.runningBalance || 0)
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
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
                title="Excel फाइल डाउनलोड करें"
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

        {/* 📋 ITEMIZED STATEMENT LEDGER TABLE */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                <span>विस्तृत खाता विवरण (Itemized Ledger)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                दिनांक-वार सभी बिल, खरीद व भुगतान प्रविष्टियाँ
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600">
              कुल प्रविष्टियाँ: <span className="text-indigo-700 font-black">{transactions.length}</span>
            </div>
          </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      कोई खाता प्रविष्टि मौजूद नहीं है
                    </td>
                  </tr>
                ) : (
                  transactions.map((t, idx) => {
                    const isDebit = Number(t.debit) > 0;
                    const isCredit = Number(t.credit) > 0;
                    const txDate = t.date ? new Date(t.date) : null;
                    const formattedDate = txDate ? txDate.toLocaleDateString("hi-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
                    const daysAgo = txDate ? Math.max(0, Math.floor((new Date() - txDate) / (1000 * 60 * 60 * 24))) : 0;

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
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
    </div>
  );
}
