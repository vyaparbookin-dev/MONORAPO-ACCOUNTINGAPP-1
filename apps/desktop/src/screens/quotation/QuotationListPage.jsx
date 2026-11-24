import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Search, Edit, Trash2, Send, Phone, Calendar,
  MessageCircle, Sparkles, CheckCircle, Clock, AlertCircle, RefreshCw,
  ChevronRight, ArrowUpRight, User, DollarSign, Bot
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function QuotationListPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('crm'); // 'crm' or 'all'
  const [statusFilter, setStatusFilter] = useState('all');

  // Follow-up Note Modal State
  const [selectedQuoForNote, setSelectedQuoForNote] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [followUpStatusInput, setFollowUpStatusInput] = useState('CALL_DONE');
  const [nextDateInput, setNextDateInput] = useState('');
  const [expectedDateInput, setExpectedDateInput] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Conversion & WhatsApp States
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/quotations');
      setQuotations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Filtered quotations
  const filteredQuotations = quotations.filter(q => {
    const qNum = String(q?.quotationNumber || '').toLowerCase();
    const cName = String(q?.customerName || q?.partyId?.name || '').toLowerCase();
    const cPhone = String(q?.customerPhone || q?.partyId?.mobileNumber || '').toLowerCase();
    const sTerm = String(searchTerm || '').toLowerCase();
    const matchesSearch = qNum.includes(sTerm) || cName.includes(sTerm) || cPhone.includes(sTerm);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'converted' && q.status !== 'converted') return false;
      if (statusFilter === 'pending' && (q.status === 'converted' || q.status === 'rejected')) return false;
      if (statusFilter === 'due_today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const fDateStr = q.followUpDate ? new Date(q.followUpDate).toISOString().slice(0, 10) : '';
        if (fDateStr !== todayStr) return false;
      }
    }
    return true;
  });

  // CRM Pending quotations
  const crmQuotations = filteredQuotations.filter(q => q.status !== 'converted' && q.status !== 'rejected');

  // KPI Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTodayCount = quotations.filter(q => {
    if (q.status === 'converted' || q.status === 'rejected') return false;
    const fStr = q.followUpDate ? new Date(q.followUpDate).toISOString().slice(0, 10) : '';
    return fStr === todayStr;
  }).length;

  const totalPipelineValue = quotations
    .filter(q => q.status !== 'converted' && q.status !== 'rejected')
    .reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);

  const convertedCount = quotations.filter(q => q.status === 'converted').length;

  // 🧾 1-Click Convert to Sale Bill
  const handleConvertToBill = async (quotation) => {
    const cName = quotation.customerName || quotation.partyId?.name || "ग्राहक";
    if (!window.confirm(`क्या आप कोटेशन #${quotation.quotationNumber} (${cName} - ₹${Number(quotation.totalAmount).toLocaleString('en-IN')}) को बिक्री बिल में बदलना चाहते हैं?`)) {
      return;
    }

    setActionLoadingId(quotation._id);
    try {
      const res = await api.post(`/api/quotations/${quotation._id}/convert-to-bill`, {
        paymentMode: "CREDIT"
      });
      if (res.data?.success) {
        alert(`🎉 बधाई! कोटेशन सफलतापूर्वक बिल में बदल गया!\nबिल नंबर: ${res.data.data?.bill?.billNumber || 'नया बिल'}`);
        fetchQuotations();
      }
    } catch (err) {
      console.error("Convert error:", err);
      alert("बिल में बदलने में विफल: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 💬 Send WhatsApp
  const handleSendWhatsApp = async (quotation) => {
    const phone = quotation.customerPhone || quotation.partyId?.mobileNumber;
    if (!phone) {
      alert("ग्राहक का मोबाइल नंबर दर्ज नहीं है! कृपया कोटेशन एडिट करके मोबाइल नंबर भरें।");
      return;
    }

    setActionLoadingId(quotation._id);
    try {
      const res = await api.post(`/api/quotations/${quotation._id}/send-whatsapp`, {
        toMobile: phone
      });
      if (res.data?.success) {
        alert("✅ कोटेशन WhatsApp पर भेज दिया गया!");
        fetchQuotations();
      } else if (res.data?.isQrRequired) {
        // Fallback to wa.me if server Baileys is not linked
        const text = encodeURIComponent(res.data.formattedText || `कोटेशन #${quotation.quotationNumber}`);
        const cleanP = String(phone).replace(/\D/g, '').slice(-10);
        window.open(`https://wa.me/91${cleanP}?text=${text}`, '_blank');
      } else {
        alert(res.data?.message || "WhatsApp भेजने में असमर्थ!");
      }
    } catch (err) {
      console.error("WhatsApp Send Error:", err);
      const cleanP = String(phone).replace(/\D/g, '').slice(-10);
      window.open(`https://wa.me/91${cleanP}`, '_blank');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 🤖 Trigger AI Voice Assistant Follow-up Call
  const handleAiCall = async (quotation) => {
    const phone = quotation.customerPhone || quotation.partyId?.mobileNumber;
    if (!phone) {
      alert("ग्राहक का मोबाइल नंबर उपलब्ध नहीं है!");
      return;
    }
    if (!window.confirm(`🤖 क्या आप ग्राहक ${quotation.customerName || ''} (${phone}) को AI वॉइस कॉल रिमाइंडर चलाना चाहते हैं?`)) {
      return;
    }

    setActionLoadingId(quotation._id);
    try {
      const res = await api.post(`/api/quotations/${quotation._id}/ai-call`);
      if (res.data?.success) {
        alert(`🤖 AI वॉइस फॉलो-अप सफलतापूर्वक दर्ज हो गया!\n\nAI स्क्रिप्ट:\n"${res.data.aiScript}"`);
        fetchQuotations();
      }
    } catch (err) {
      alert("AI कॉल में विफल: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 📝 Open Follow-up Note Modal
  const openFollowUpModal = (quotation) => {
    setSelectedQuoForNote(quotation);
    setFollowUpNote(quotation.followUpNotes || '');
    setFollowUpResponse('');
    setFollowUpStatusInput(quotation.followUpStatus || 'CALL_DONE');
    setNextDateInput(quotation.followUpDate ? new Date(quotation.followUpDate).toISOString().slice(0, 10) : '');
    setExpectedDateInput(quotation.expectedPurchaseDate ? new Date(quotation.expectedPurchaseDate).toISOString().slice(0, 10) : '');
  };

  // 💾 Save Follow-up Log
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedQuoForNote) return;

    setSubmittingNote(true);
    try {
      const res = await api.post(`/api/quotations/${selectedQuoForNote._id}/follow-up`, {
        notes: followUpNote,
        customerResponse: followUpResponse,
        followUpStatus: followUpStatusInput,
        nextFollowUpDate: nextDateInput || undefined,
        expectedPurchaseDate: expectedDateInput || undefined,
        calledBy: "दुकानदार"
      });

      if (res.data?.success) {
        alert("✅ फॉलो-अप विवरण सफलतापूर्वक सेव हो गया!");
        setSelectedQuoForNote(null);
        fetchQuotations();
      }
    } catch (err) {
      alert("फॉलो-अप सेव करने में विफल: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                कोटेशन व ग्राहक फॉलो-अप (Quotation CRM)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                कोटेशन बनाएं, WhatsApp पर भेजें, कॉलिंग ट्रैक करें और 1-क्लिक में बिल में बदलें
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/quotations/create"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>+ नया कोटेशन बनाएं</span>
          </Link>
          <button
            onClick={fetchQuotations}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">आज कॉल करने हैं</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600"><Phone size={14} /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">{dueTodayCount} ग्राहक</div>
          <span className="text-[10px] text-amber-600 font-semibold">फॉलो-अप शेड्यूल आज का</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">पेंडिंग ऑर्डर संभावना</span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600"><DollarSign size={14} /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">₹{totalPipelineValue.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-indigo-600 font-semibold">{crmQuotations.length} खुले कोटेशन</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">सफलतापूर्वक बिल में बदले</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={14} /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{convertedCount} बिल बने</div>
          <span className="text-[10px] text-emerald-600 font-semibold">कन्वर्टेड ग्राहक</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">कुल जारी कोटेशन</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600"><FileText size={14} /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">{quotations.length}</div>
          <span className="text-[10px] text-slate-500 font-semibold">लाइफटाइम रिकॉर्ड</span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('crm')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'crm'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone size={14} className={activeTab === 'crm' ? "text-indigo-600" : ""} />
              <span>📞 फॉलो-अप व कॉलिंग ट्रैकर ({crmQuotations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} />
              <span>📋 सभी कोटेशन ({quotations.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">सभी स्टेटस</option>
              <option value="due_today">⚡ आज कॉल वाले</option>
              <option value="pending">⏳ पेंडिंग फॉलो-अप</option>
              <option value="converted">✅ बिल में बदले गए</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="कोटेशन नं., ग्राहक का नाम या मोबाइल नंबर खोजें..."
            className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loader />
      ) : activeTab === 'crm' ? (
        /* CRM & Follow-Up View */
        <div className="space-y-3">
          {crmQuotations.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                <CheckCircle size={32} />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">कोई पेंडिंग फॉलो-अप नहीं है!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                सभी ग्राहकों के फॉलो-अप पूरे हो चुके हैं या कोटेशन बिल में बदल चुके हैं।
              </p>
            </div>
          ) : (
            crmQuotations.map((q) => {
              const phone = q.customerPhone || q.partyId?.mobileNumber || '';
              const expDateStr = q.expectedPurchaseDate ? new Date(q.expectedPurchaseDate).toISOString().slice(0, 10) : '';
              const fDateStr = q.followUpDate ? new Date(q.followUpDate).toISOString().slice(0, 10) : '';
              const isDueToday = fDateStr === todayStr;
              const isOverdue = fDateStr && fDateStr < todayStr;
              const isExpApproaching = expDateStr && expDateStr >= todayStr;

              return (
                <div
                  key={q._id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex flex-col items-center justify-center font-bold shrink-0">
                        <FileText size={18} />
                        <span className="text-[9px] font-black">{q.rateTier ? `रेट ${q.rateTier}` : 'A'}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/quotations/${q._id}`} className="font-black text-sm text-slate-900 hover:text-blue-600 transition">
                            #{q.quotationNumber}
                          </Link>
                          <span className="text-slate-300">•</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {q.customerName || q.partyId?.name || "अनाम ग्राहक"}
                          </span>
                          {phone && (
                            <span className="text-xs text-slate-500 font-mono font-bold">
                              📞 {phone}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>दिनांक: {q.date ? new Date(q.date).toLocaleDateString('hi-IN') : '-'}</span>
                          <span>•</span>
                          <span>सामान: {(q.items || []).length} प्रकार</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-lg font-black text-slate-900">
                        ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isDueToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            🚨 आज कॉल करना है
                          </span>
                        )}
                        {isOverdue && !isDueToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            ⚠️ कॉल ओवरड्यू
                          </span>
                        )}
                        {expDateStr && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            📅 खरीद संभावना: {new Date(q.expectedPurchaseDate).toLocaleDateString('hi-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discussion Summary & Last Note */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <span>📝 बातचीत नोट:</span>
                        <span className="font-medium text-slate-600">
                          {q.followUpNotes || "अभी तक कोई बातचीत दर्ज नहीं की गई है। कॉल करके नोट लिखें।"}
                        </span>
                      </div>
                      {q.aiCallSummary && (
                        <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                          <Bot size={13} /> <span>{q.aiCallSummary}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openFollowUpModal(q)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px] transition cursor-pointer shrink-0"
                    >
                      ✏️ नोट लिखें / स्टेटस बदलें
                    </button>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    {/* Call Button */}
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Phone size={14} className="text-emerald-600" />
                        <span>कॉल करें</span>
                      </a>
                    ) : (
                      <button disabled className="px-3 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs">
                        नंबर नहीं है
                      </button>
                    )}

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(q)}
                      disabled={actionLoadingId === q._id}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <MessageCircle size={14} />
                      <span>{actionLoadingId === q._id ? "भेज रहा है..." : "WhatsApp भेजें"}</span>
                    </button>

                    {/* AI Call Assistant */}
                    <button
                      type="button"
                      onClick={() => handleAiCall(q)}
                      disabled={actionLoadingId === q._id}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="AI स्वचालित वॉइस फॉलो-अप"
                    >
                      <Bot size={14} className="text-purple-600" />
                      <span>🤖 AI फॉलो-अप कॉल</span>
                    </button>

                    {/* 🧾 Convert to Bill Button */}
                    <button
                      type="button"
                      onClick={() => handleConvertToBill(q)}
                      disabled={actionLoadingId === q._id}
                      className="ml-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      <span>🧾 1-क्लिक बिल में बदलें</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* All Quotations Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">कोटेशन नं.</th>
                  <th className="p-4">ग्राहक</th>
                  <th className="p-4">दिनांक</th>
                  <th className="p-4">खरीद संभावना</th>
                  <th className="p-4 text-right">कुल रकम</th>
                  <th className="p-4 text-center">स्टेटस</th>
                  <th className="p-4 text-center">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => {
                  const phone = q.customerPhone || q.partyId?.mobileNumber || '';
                  return (
                    <tr key={q._id} className="hover:bg-indigo-50/30 transition">
                      <td className="p-4 font-black">
                        <Link to={`/quotations/${q._id}`} className="text-blue-600 hover:underline">
                          #{q.quotationNumber}
                        </Link>
                        {q.rateTier && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-700">
                            रेट {q.rateTier}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{q.customerName || q.partyId?.name || "अनाम ग्राहक"}</div>
                        {phone && <div className="text-[10px] text-slate-400 font-mono">📞 {phone}</div>}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {q.date ? new Date(q.date).toLocaleDateString('hi-IN') : '-'}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {q.expectedPurchaseDate ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {new Date(q.expectedPurchaseDate).toLocaleDateString('hi-IN')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">
                        ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          q.status === 'converted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          q.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          q.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          q.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {q.status === 'converted' ? '✅ बिल बन गया' : q.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {q.status !== 'converted' && (
                            <button
                              onClick={() => handleConvertToBill(q)}
                              disabled={actionLoadingId === q._id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shadow-xs cursor-pointer"
                              title="बिल में बदलें"
                            >
                              🧾 बिल बनाएं
                            </button>
                          )}
                          <button
                            onClick={() => handleSendWhatsApp(q)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="WhatsApp भेजें"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <Link to={`/quotations/${q._id}`} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition" title="देखें">
                            <FileText size={15} />
                          </Link>
                          <Link to={`/quotations/edit/${q._id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="एडिट करें">
                            <Edit size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-up Note & Discussion Modal */}
      {selectedQuoForNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  📞 ग्राहक बातचीत व फॉलो-अप दर्ज करें
                </h3>
                <p className="text-[11px] text-slate-500">
                  कोटेशन #{selectedQuoForNote.quotationNumber} • {selectedQuoForNote.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoForNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  📝 ग्राहक से क्या बात हुई? (चर्चा / डिस्काउंट / जरूरत)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. ग्राहक ने 2 दिन बाद 50 बोरी सीमेंट लेने को कहा है, 5% डिस्काउंट पर बात बनी..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    📅 संभावित खरीद दिनांक (Expected)
                  </label>
                  <input
                    type="date"
                    value={expectedDateInput}
                    onChange={(e) => setExpectedDateInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ⏰ अगला फॉलो-अप कॉल दिनांक
                  </label>
                  <input
                    type="date"
                    value={nextDateInput}
                    onChange={(e) => setNextDateInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  🎯 ग्राहक का रुझान / स्थिति (Status)
                </label>
                <select
                  value={followUpStatusInput}
                  onChange={(e) => setFollowUpStatusInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="CALL_DONE">✅ बात हो गई (Call Completed)</option>
                  <option value="INTERESTED">🌟 बहुत उत्सुक है (Highly Interested)</option>
                  <option value="NEEDS_DISCOUNT">🏷️ डिस्काउंट की मांग कर रहा है</option>
                  <option value="PENDING">⏳ दोबारा कॉल करना है (Call Back)</option>
                  <option value="LOST">❌ कहीं और से ले लिया (Not Interested)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuoForNote(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  {submittingNote ? "सेव हो रहा है..." : "💾 सेव करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
