import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Unlock,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  Lock,
  ExternalLink
} from "lucide-react";
import api from "../../services/api";

const fmt = (num) => Number(num || 0).toLocaleString("en-IN");

export default function CreditLimitHubModal({
  isOpen,
  onClose,
  onPartyUpdated
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("list"); // "list" | "new"
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  // New Sanction Form State
  const [allParties, setAllParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [sanctioning, setSanctioning] = useState(false);
  const [sanctionData, setSanctionData] = useState(null); // { partyId, waLink, mandateText, ... }
  const [sanctionOtpInput, setSanctionOtpInput] = useState("");
  const [verifyingSanction, setVerifyingSanction] = useState(false);

  // Action Loading states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCreditParties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/credit-limit/parties").catch(() => null);
      if (res?.data?.parties) {
        setParties(res.data.parties);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPartiesForSelect = async () => {
    try {
      const res = await api.get("/api/parties").catch(() => null);
      const list = Array.isArray(res?.data?.parties) ? res.data.parties : (Array.isArray(res?.data) ? res.data : []);
      setAllParties(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCreditParties();
      fetchAllPartiesForSelect();
      setStatusMessage(null);
      setSanctionData(null);
      setSanctionOtpInput("");
    }
  }, [isOpen]);

  // Request Credit Limit Sanction (Generates OTP and WhatsApp Mandate)
  const handleRequestSanction = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPartyId) {
      return setStatusMessage({ type: "error", text: "कृपया पहले ग्राहक/पार्टी चुनें!" });
    }
    if (!limitAmount || Number(limitAmount) <= 0) {
      return setStatusMessage({ type: "error", text: "कृपया मान्य क्रेडिट लिमिट दर्ज करें!" });
    }

    setSanctioning(true);
    setStatusMessage(null);
    try {
      const res = await api.post("/api/credit-limit/sanction-request", {
        partyId: selectedPartyId,
        creditLimit: Number(limitAmount)
      });
      setSanctionData(res.data);
      setStatusMessage({ 
        type: "success", 
        text: `OTP तैयार है! नीचे 'WhatsApp पर भेजें' बटन दबाकर ग्राहक को भेजें और ग्राहक से OTP पूछकर दर्ज करें।` 
      });
      // Auto open WhatsApp link if available
      if (res.data?.waLink) {
        window.open(res.data.waLink, "_blank");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "क्रेडिट लिमिट अनुरोध विफल रहा!";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSanctioning(false);
    }
  };

  // Verify Sanction OTP to Activate Credit Line
  const handleVerifySanction = async (e) => {
    if (e) e.preventDefault();
    if (!sanctionOtpInput.trim()) {
      return setStatusMessage({ type: "error", text: "कृपया ग्राहक द्वारा बताया गया 4-अंकों का OTP दर्ज करें!" });
    }

    setVerifyingSanction(true);
    setStatusMessage(null);
    try {
      const res = await api.post("/api/credit-limit/verify-sanction", {
        partyId: sanctionData.partyId || selectedPartyId,
        otpCode: sanctionOtpInput.trim()
      });
      setStatusMessage({ type: "success", text: res.data?.message || "क्रेडिट लाइन सफलतापूर्वक सक्रिय हुई!" });
      setSanctionData(null);
      setSanctionOtpInput("");
      setLimitAmount("");
      setSelectedPartyId("");
      fetchCreditParties();
      if (onPartyUpdated) onPartyUpdated(res.data?.party);
      setTimeout(() => setActiveTab("list"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "गलत OTP दर्ज किया गया है!";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setVerifyingSanction(false);
    }
  };

  // 1-Click Resend Daily Bill Approval WhatsApp Message & OTP
  const handleResendBillApproval = async (party) => {
    setActionLoadingId(party._id);
    try {
      const res = await api.post("/api/credit-limit/resend-approval", {
        partyId: party._id,
        billId: party.pendingApprovalBill?._id || party.pendingApprovalBillId
      });
      setStatusMessage({ 
        type: "success", 
        text: `दैनिक हिसाब व OTP तैयार है! WhatsApp विंडो खुल रही है...` 
      });
      if (res.data?.waLink) {
        window.open(res.data.waLink, "_blank");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "पुनः भेजने में समस्या आई!";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Manual Unlock by Shopkeeper ("काम न रुके")
  const handleUnlockPartyLimit = async (party) => {
    if (!window.confirm(`क्या आप ${party.name} की क्रेडिट लिमिट तुरंत अनलॉक करना चाहते हैं? इससे बिना OTP नया बिल जारी किया जा सकेगा।`)) {
      return;
    }
    setActionLoadingId(party._id);
    try {
      const res = await api.post("/api/credit-limit/unlock", {
        partyId: party._id,
        reason: "दुकानदार द्वारा त्वरित अनलॉक (काम न रुके)"
      });
      setStatusMessage({ type: "success", text: res.data?.message || "क्रेडिट लिमिट अनलॉक कर दी गई है!" });
      fetchCreditParties();
      if (onPartyUpdated) onPartyUpdated(res.data?.party);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "अनलॉक करने में समस्या आई!";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredParties = parties.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.mobileNumber || "").includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">डिजिटल क्रेडिट लिमिट हब</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-bold">
                  IT Act Mandate
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ग्राहकों की पूर्व-स्वीकृत उधारी सीमा, दैनिक 5-बिंदु हिसाब व ऑटो-अनलॉक प्रबंधन
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab("list"); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-black transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "list"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>सक्रिय क्रेडिट लाइन खाते ({parties.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("new"); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-black transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "new"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus size={14} />
            <span>➕ नई क्रेडिट लिमिट आवंटित करें</span>
          </button>
        </div>

        {/* STATUS ALERT */}
        {statusMessage && (
          <div className={`p-3 text-xs font-bold flex items-center justify-between gap-2 border-b shrink-0 ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: LIST OF CREDIT LIMIT CUSTOMERS */}
          {activeTab === "list" && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="ग्राहक का नाम या मोबाइल नंबर खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-indigo-500" />
                  <span>क्रेडिट खाते लोड हो रहे हैं...</span>
                </div>
              ) : filteredParties.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <CreditCard size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">कोई क्रेडिट लिमिट खाता नहीं मिला</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    ग्राहकों को पूर्व-स्वीकृत उधारी सीमा देने के लिए ऊपर 'नई क्रेडिट लिमिट आवंटित करें' टैब पर क्लिक करें।
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> नई लिमिट जोड़ें
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredParties.map((p) => {
                    const isLocked = p.hasPendingBillApproval || p.creditLimitStatus === "LOCKED";
                    const isPendingOtp = p.creditLimitStatus === "PENDING_OTP";

                    return (
                      <div
                        key={p._id}
                        className={`p-3.5 rounded-2xl border transition shadow-xs space-y-2.5 ${
                          isLocked 
                            ? "bg-rose-50/70 border-rose-300" 
                            : isPendingOtp 
                            ? "bg-amber-50/70 border-amber-300" 
                            : "bg-white border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        {/* Top Row: Name, Phone, Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{p.name}</span>
                              {isLocked ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-600 text-white font-black flex items-center gap-1">
                                  <Lock size={10} /> बिल अप्रूवल पेंडिंग (Locked)
                                </span>
                              ) : isPendingOtp ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black flex items-center gap-1">
                                  <ShieldAlert size={10} /> OTP पेंडिंग
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black border border-emerald-300 flex items-center gap-1">
                                  <ShieldCheck size={10} /> सक्रिय क्रेडिट लाइन
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              📱 {p.mobileNumber || "नंबर दर्ज नहीं"}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">स्वीकृत लिमिट</span>
                            <span className="text-base font-black text-indigo-900 font-mono">₹{fmt(p.creditLimit)}</span>
                          </div>
                        </div>

                        {/* Progress Bar: Limit vs Balance */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-600">
                              वर्तमान उधारी: <strong className="text-rose-600">₹{fmt(p.usedBalance)}</strong>
                            </span>
                            <span className="text-slate-600">
                              उपलब्ध शेष लिमिट: <strong className="text-emerald-600">₹{fmt(p.availableLimit)}</strong>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.usagePercent > 90 ? "bg-rose-500" : p.usagePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, p.usagePercent))}%` }}
                            />
                          </div>
                        </div>

                        {/* Pending Bill Warning if Locked */}
                        {isLocked && (
                          <div className="p-2 rounded-xl bg-white/90 border border-rose-200 text-[11px] text-rose-900 flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold block">
                                ⚠️ पिछला बिल अभी तक ग्राहक ने WhatsApp OTP से स्वीकृत नहीं किया है।
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {p.creditLimitLockedReason || "बिल स्वीकृति पेंडिंग है। शेष लिमिट सुरक्षा हेतु लॉक है।"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-end gap-2">
                          {isLocked && (
                            <button
                              type="button"
                              disabled={actionLoadingId === p._id}
                              onClick={() => handleResendBillApproval(p)}
                              className="px-2.5 py-1.5 bg-[#25D366] hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="सामान्य WhatsApp पर हिसाब व OTP भेजें"
                            >
                              <Send size={13} />
                              <span>📲 पुनः WhatsApp हिसाब भेजें</span>
                            </button>
                          )}

                          {isLocked && (
                            <button
                              type="button"
                              disabled={actionLoadingId === p._id}
                              onClick={() => handleUnlockPartyLimit(p)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                              title="काम न रुके - बिना OTP नया बिल बनाने हेतु अनलॉक करें"
                            >
                              <Unlock size={13} />
                              <span>काम न रुके (अनलॉक)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALLOCATE NEW CREDIT LIMIT WITH OTP */}
          {activeTab === "new" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-1">
                <span className="font-black flex items-center gap-1.5">
                  <Sparkles size={15} className="text-indigo-600" />
                  <span>डिजिटल क्रेडिट लाइन सैंक्शन प्रक्रिया:</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  1. ग्राहक और लिमिट तय करें। 2. ग्राहक के WhatsApp पर कानूनी वचनपत्र व 4-अंकों का OTP जाएगा। 3. ग्राहक से OTP लेकर दर्ज करने पर उसकी क्रेडिट लाइन सक्रिय हो जाएगी।
                </p>
              </div>

              {!sanctionData ? (
                <form onSubmit={handleRequestSanction} className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      👤 ग्राहक/पार्टी चुनें:
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => setSelectedPartyId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                    >
                      <option value="">-- पार्टी का चयन करें --</option>
                      {allParties.map((pty) => (
                        <option key={pty._id || pty.id} value={pty._id || pty.id}>
                          {pty.name} ({pty.mobileNumber || pty.phone || "No Phone"}) {pty.creditLimit ? `[मौजूदा लिमिट: ₹${fmt(pty.creditLimit)}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      💰 स्वीकृत क्रेडिट लिमिट राशि (₹):
                    </label>
                    <input
                      type="number"
                      placeholder="उदा. 20000"
                      value={limitAmount}
                      onChange={(e) => setLimitAmount(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600"
                      min="100"
                      step="500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sanctioning || !selectedPartyId || !limitAmount}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send size={15} />
                    <span>{sanctioning ? "OTP जनरेट हो रहा है..." : "🚀 WhatsApp पर OTP व वचनपत्र भेजें"}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 animate-in fade-in">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-emerald-950 uppercase">
                      वचनपत्र व OTP तैयार है!
                    </span>
                    <p className="text-[11px] text-slate-600">
                      नीचे 'WhatsApp पर भेजें' बटन दबाकर ग्राहक को वचनपत्र भेजें, और ग्राहक द्वारा बताया गया OTP यहाँ दर्ज करें।
                    </p>
                  </div>

                  {sanctionData.waLink && (
                    <a
                      href={sanctionData.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#25D366] hover:bg-green-600 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <Send size={15} />
                      <span>🟢 सामान्य WhatsApp पर खोलें व भेजें</span>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <form onSubmit={handleVerifySanction} className="space-y-3 pt-2 border-t border-emerald-200">
                    <div>
                      <label className="text-xs font-black text-emerald-900 block mb-1 text-center">
                        🔐 ग्राहक से प्राप्त 4-अंकों का OTP दर्ज करें:
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="••••"
                        value={sanctionOtpInput}
                        onChange={(e) => setSanctionOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-44 mx-auto p-2.5 bg-white border-2 border-emerald-400 rounded-xl text-center text-xl font-mono font-black tracking-widest outline-none focus:border-emerald-600 block shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingSanction || sanctionOtpInput.length < 4}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>{verifyingSanction ? "सत्यापित हो रहा है..." : "✅ OTP सत्यापित करें और क्रेडिट लाइन चालू करें"}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            भुगतान (Payment In) प्राप्त होने पर उपलब्ध क्रेडिट सीमा तुरंत स्वतः बहाल (Restore) हो जाती है।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition"
          >
            बंद करें
          </button>
        </div>

      </div>
    </div>
  );
}
