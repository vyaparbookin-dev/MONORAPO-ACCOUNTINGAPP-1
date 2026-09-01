import React from "react";
import {
  Smartphone,
  Laptop,
  Download,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Gamepad2,
  Building,
  ShoppingBag,
  Cpu,
  Scissors,
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  Share2,
  Star,
  Users,
  Layers,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-500/30">
              V
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                VyaparBook <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-bold">2.0 ERP</span>
              </span>
              <p className="text-[10px] text-gray-400">All-in-One Multi-Industry Cloud & Desktop Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition transform hover:scale-105"
            >
              Open Web App <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 overflow-hidden text-center">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-600/15 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black mb-2 animate-bounce">
            <Sparkles size={14} className="text-yellow-400" />
            <span>भारत का पहला 8-in-1 Multi-Industry Super ERP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            रेस्टोरेंट, बैंक्वेट, गेमज़ोन व सुपरमार्केट का{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              संपूर्ण ऑटोमेशन ईआरपी
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            दैनिक शुद्ध मुनाफा (Net Cash In-Hand), KOT टेबल बिलिंग, Swiggy/Zomato पेआउट ऑडिट, RFID कैशलेस प्लेकार्ड्स, 48H एक्सपायरी अलर्ट और 1-क्लिक व्हाट्सएप इनवॉइसिंग — सब कुछ एक ही सॉफ्टवेयर में!
          </p>

          {/* Primary Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition transform hover:scale-105"
            >
              <Zap size={18} className="text-yellow-300" />
              क्लाउड वेब ईआरपी खोलें (Launch Web App)
            </button>

            <button
              onClick={() => navigate("/billing")}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-purple-500 font-bold text-sm rounded-2xl shadow flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag size={18} className="text-emerald-400" />
              फास्ट पीओएस बिलिंग स्क्रीन (Open POS)
            </button>
          </div>

          {/* Device Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><Laptop size={15} className="text-cyan-400" /> Windows Desktop App</span>
            <span className="flex items-center gap-1.5"><Smartphone size={15} className="text-purple-400" /> Android Tablet & Mobile</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-green-400" /> 100% Offline SQLite + Supabase Cloud Sync</span>
          </div>
        </div>
      </section>

      {/* 8 Industry Verticals Grid */}
      <section className="px-6 py-16 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              हर बिज़नेस के लिए विशेष रूप से डिज़ाइन किए गए मॉड्यूल्स
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              1-क्लिक में अपने बिज़नेस का मोड चुनें और तुरंत शुरू करें
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Restaurant */}
            <div
              onClick={() => navigate("/billing")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-amber-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-amber-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                <ChefHat size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">🍽️ Restaurant & Cafe</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Table KOT, डिश रेसिपी BOM, गैस-बिजली ओवरहेड्स, Swiggy/Zomato पेआउट ऑडिट व 48H फ्रेशनेस गार्ड।
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                Open Module <ArrowRight size={13} />
              </span>
            </div>

            {/* 2. Banquet */}
            <div
              onClick={() => navigate("/billing")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-indigo-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-indigo-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">🏰 Banquet & Catering</h3>
                <p className="text-xs text-slate-400 mt-1">
                  हॉल बुकिंग, मिनिमम Pax गारंटी, क्रॉकरी ब्रेकज रिकवरी व पोस्ट-इवेंट डुअल सिग्नेचर हैंडओवर स्लिप।
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                Open Module <ArrowRight size={13} />
              </span>
            </div>

            {/* 3. Gamezone */}
            <div
              onClick={() => navigate("/gamezone-operations")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-purple-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-purple-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                <Gamepad2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">🎮 Gamezone & FEC Hub</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cashless RFID Smart Playcards, IoT मशीन टेलीमेट्री, हैप्पी आवर्स (50% Off) व डिजिटल टिकट रिडेम्पशन।
                </p>
              </div>
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                Launch Command Center <ArrowRight size={13} />
              </span>
            </div>

            {/* 4. Supermarket */}
            <div
              onClick={() => navigate("/fast-pos")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-emerald-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">🛒 Supermarket & Retail</h3>
                <p className="text-xs text-slate-400 mt-1">
                  हैंडहेल्ड बारकोड स्कैनिंग, बैच व एक्सपायरी ट्रैकिंग, 1-सेकंड फास्ट पीओएस व वजन कांटा कनेक्टिविटी।
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                Open Fast POS <ArrowRight size={13} />
              </span>
            </div>

            {/* 5. Mobile Electronics */}
            <div
              onClick={() => navigate("/billing")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-cyan-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-cyan-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">📱 Mobile & Electronics</h3>
                <p className="text-xs text-slate-400 mt-1">
                  डुअल IMEI 1 व 2 ट्रैकिंग, ब्रांड वारंटी, बैटरी सीरियल व इंस्टेंट इनवॉइस बारकोड स्टिकर।
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                Open Module <ArrowRight size={13} />
              </span>
            </div>

            {/* 6. Garments & Apparel */}
            <div
              onClick={() => navigate("/billing")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-pink-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-pink-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition">
                <Scissors size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">👗 Garments & Apparel</h3>
                <p className="text-xs text-slate-400 mt-1">
                  साइज मैट्रिक्स (S/M/L/XL), कलर वेरिएंट्स, स्टाइल कोड्स व बारकोड टैग जनरेटर।
                </p>
              </div>
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                Open Module <ArrowRight size={13} />
              </span>
            </div>

            {/* 7. Hardware & Pipe */}
            <div
              onClick={() => navigate("/billing")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-teal-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-teal-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">📐 Hardware, Wire & Pipe</h3>
                <p className="text-xs text-slate-400 mt-1">
                  कॉइल लंबाई, बंडल वजन केजी, रनिंग मीटर पाइप कनवर्टर व पेंट कवरेज कैलकुलेटर।
                </p>
              </div>
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                Open Module <ArrowRight size={13} />
              </span>
            </div>

            {/* 8. P&L & DayBook */}
            <div
              onClick={() => navigate("/reports/daybook")}
              className="p-6 bg-slate-800/60 border border-slate-700/80 hover:border-green-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-green-500/10 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 group-hover:scale-110 transition">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">💰 DayBook & Shuddh Munafa</h3>
                <p className="text-xs text-slate-400 mt-1">
                  दैनिक पाई-पाई आवक vs जावक, फूड कॉस्ट %, प्रोविजन रिजर्व्स व 1-क्लिक व्हाट्सएप क्लोजिंग रिपोर्ट।
                </p>
              </div>
              <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                View Reports <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 VyaparBook Accounting & Hospitality ERP Suite. All rights reserved.</p>
        <p className="text-slate-600">Enterprise Ready • Secure Cloud & Local Offline Storage</p>
      </footer>
    </div>
  );
}
