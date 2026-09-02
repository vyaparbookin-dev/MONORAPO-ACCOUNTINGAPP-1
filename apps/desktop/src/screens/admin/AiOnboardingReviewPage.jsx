import React, { useState } from "react";
import {
  Bot,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Upload,
  RefreshCw,
  Building2,
  Phone,
  Eye,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from "lucide-react";

export default function AiOnboardingReviewPage() {
  // Active Customer Onboarding Tickets escalated to SuperAdmin
  const [tickets, setTickets] = useState([
    {
      id: "TKT-8842",
      customerName: "Rajesh Sharma",
      firmName: "Rajesh Paints & Hardware",
      phone: "9826199881",
      city: "Bilaspur",
      firmType: "GST_REGISTERED", // 'GST_REGISTERED' | 'NON_GST_RETAIL'
      gstin: "22AAAAA0000A1Z5",
      escalationReason: "AI Confidence Low on 3 items (Row 4, 7, 12). Customer asked for freight verification.",
      originalDocUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60",
      status: "PENDING_SUPERADMIN_REVIEW",
      items: [
        {"id": 1, "name": "Berger Walmasta White 20L", "hsn": "3209", "gst": 18, "qty": 8, "mrp": 4250, "discount": 35, "freight": 50, "cost": 2812.50, "status": "CONFIRMED"},
        {"id": 2, "name": "Berger Bison Acrylic Emulsion 10L", "hsn": "3209", "gst": 18, "qty": 12, "mrp": 2400, "discount": 35, "freight": 30, "cost": 1590.00, "status": "CONFIRMED"},
        {"id": 3, "name": "Astral CPVC Pipe 1 Inch (10 Ft)", "hsn": "3917", "gst": 18, "qty": 40, "mrp": 550, "discount": 40, "freight": 10, "cost": 340.00, "status": "CONFIRMED"},
        {"id": 4, "name": "Brg Prmr 10L (AI Unsure if Water or Oil Base)", "hsn": "3209", "gst": 18, "qty": 5, "mrp": 1450, "discount": 30, "freight": 20, "cost": 1035.00, "status": "FLAGGED_UNCERTAIN"},
      ]
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState(tickets[0]);
  const [aiCorrectionPrompt, setAiCorrectionPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [adminFeedbackLog, setAdminFeedbackLog] = useState([
    { originalInput: "Brg Wlmsta 20", mappedTo: "Berger Walmasta White 20L", correction: "Saved to AI Knowledge Base" }
  ]);

  // Handle Admin Instruction to AI (Natural Language Correction)
  const handleInstructAiToFix = (e) => {
    if (e) e.preventDefault();
    if (!aiCorrectionPrompt.trim()) return;

    setIsAiProcessing(true);
    setTimeout(() => {
      // Simulate AI correcting Row 4
      const updatedItems = selectedTicket.items.map(item => {
        if (item.id === 4) {
          return {
            ...item,
            name: "Berger BP White Primer (Water Base) 10L",
            hsn: "3209",
            gst: 18,
            mrp: 1450,
            discount: 35,
            cost: 962.50,
            status: "CONFIRMED"
          };
        }
        return item;
      });

      setSelectedTicket(prev => ({ ...prev, items: updatedItems }));
      setAdminFeedbackLog(prev => [
        { originalInput: "Brg Prmr 10L", mappedTo: "Berger BP White Primer 10L", correction: `Admin Instruction: ${aiCorrectionPrompt}` },
        ...prev
      ]);
      setAiCorrectionPrompt("");
      setIsAiProcessing(false);
      alert("🤖 AI ने आपके निर्देशानुसार एक्सेल शीट को अपडेट कर दिया है और इसे अपनी मेमोरी में याद रख लिया है!");
    }, 1200);
  };

  // 1-Click Approve and Push to Live Customer Store
  const handleApproveAndPush = () => {
    alert(`🎉 [Push Successful]: ${selectedTicket.items.length} आइटम्स ग्राहक '${selectedTicket.firmName}' के लाइव खाते में लोड हो गए हैं!

व्हाट्सएप पर ग्राहक (${selectedTicket.phone}) को कन्फर्मेशन मैसेज व एक्सेल शीट भेज दी गई है।`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black">AI + SuperAdmin Onboarding Console</h1>
            <p className="text-xs text-indigo-200 mt-1">
              WhatsApp AI स्टॉक ऑनबोर्डिंग, एक्सेल रिव्यू, GST सत्यापन व AI सेल्फ-लर्निंग मेमोरी
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-bold font-mono">
          1 Pending Customer Escalation
        </span>
      </div>

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile & Original Document */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" /> ग्राहक व फर्म प्रोफाइल
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>व्यापारी:</span><strong className="text-slate-900">{selectedTicket.customerName}</strong></div>
              <div className="flex justify-between"><span>दुकान/फर्म:</span><strong className="text-slate-900">{selectedTicket.firmName}</strong></div>
              <div className="flex justify-between"><span>WhatsApp:</span><strong className="text-indigo-600 font-mono">{selectedTicket.phone}</strong></div>
              <div className="flex justify-between">
                <span>फर्म का प्रकार:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                  {selectedTicket.firmType === 'GST_REGISTERED' ? `GST: ${selectedTicket.gstin}` : 'Non-GST Regular'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Eye size={16} className="text-indigo-600" /> मूल पर्ची / डिस्ट्रीब्यूटर बिल फोटो
            </h3>
            <div className="relative rounded-2xl overflow-hidden border">
              <img
                src={selectedTicket.originalDocUrl}
                alt="Original Bill"
                className="w-full h-48 object-cover hover:scale-105 transition duration-300"
              />
            </div>
            <p className="text-[11px] text-slate-500 italic">
              "AI ने इसी फोटो से OCR टेक्स्ट निकाला और Berger मास्टर लिस्ट से मैच किया।"
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Excel Spreadsheet & AI Assistant */}
        <div className="lg:col-span-2 space-y-4">
          {/* Spreadsheet Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={18} /> AI ड्राफ्टेड एक्सेल शीट (Draft Stock)
                </h3>
                <p className="text-xs text-slate-500">लाल रंग वाली पंक्तियों को चेक करें या AI को बोलकर ठीक करवाएं</p>
              </div>
              <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Download size={14} /> .XLSX डाउनलोड
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-2.5">आइटम का नाम</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">GST%</th>
                    <th className="p-2.5 text-center">स्टॉक</th>
                    <th className="p-2.5 text-center">MRP</th>
                    <th className="p-2.5 text-center">भाड़ा (₹)</th>
                    <th className="p-2.5 text-center">खरीद रेट (₹)</th>
                    <th className="p-2.5 text-center">स्टेटस</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedTicket.items.map((item) => (
                    <tr key={item.id} className={item.status === 'FLAGGED_UNCERTAIN' ? 'bg-amber-50/80 font-bold' : ''}>
                      <td className="p-2.5 text-slate-900">{item.name}</td>
                      <td className="p-2.5 text-center font-mono">{item.hsn}</td>
                      <td className="p-2.5 text-center">{item.gst}%</td>
                      <td className="p-2.5 text-center font-bold">{item.qty}</td>
                      <td className="p-2.5 text-center font-mono">₹{item.mrp}</td>
                      <td className="p-2.5 text-center font-mono text-indigo-600">+₹{item.freight}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-600">₹{item.cost}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          item.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Instruction / Fix Chat Box */}
            <form onSubmit={handleInstructAiToFix} className="p-3 bg-slate-50 rounded-2xl border flex gap-2">
              <input
                type="text"
                placeholder="AI को निर्देश दें (उदा: 'Row 4 का प्राइमर 10L वाटर बेस करो और 35% डिस्काउंट लगाओ')"
                value={aiCorrectionPrompt}
                onChange={(e) => setAiCorrectionPrompt(e.target.value)}
                className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={isAiProcessing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition"
              >
                <Sparkles size={14} className={isAiProcessing ? "animate-spin" : ""} />
                {isAiProcessing ? "सुधार रहा है..." : "AI को ठीक करने कहें →"}
              </button>
            </form>

            {/* Approve Button */}
            <button
              onClick={handleApproveAndPush}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> अप्रूव करें और ग्राहक 'राजेश पेंट्स' के स्टोर में लाइव डालें →
            </button>
          </div>

          {/* AI Self-Learning Memory Feedback Log */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" /> AI सेल्फ-लर्निंग मेमोरी (Future Learning Engine)
            </h4>
            <div className="space-y-1.5 text-[11px]">
              {adminFeedbackLog.map((log, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-xl border flex justify-between text-slate-600">
                  <span>इनपुट: <strong>"{log.originalInput}"</strong> $ightarrow$ मैपिंग: <strong>{log.mappedTo}</strong></span>
                  <span className="text-emerald-600 font-bold">{log.correction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
