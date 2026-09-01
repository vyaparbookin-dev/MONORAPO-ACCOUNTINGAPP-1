import React, { useState } from "react";
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
  Sparkles,
  Clock,
  Coins,
  Gift,
  Award,
  Flame,
  Scale,
  Receipt,
  FileSpreadsheet,
  Check,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedVertical, setSelectedVertical] = useState("restaurant");

  const verticalsData = {
    restaurant: {
      id: "restaurant",
      name: "रेस्टोरेंट, कैफे व क्लाउड किचन",
      icon: ChefHat,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-400",
      borderAccent: "border-amber-500/50",
      bgAccent: "bg-amber-500/10",
      tagline: "Table KOT से लेकर किचन गैस-बिजली ओवरहेड्स और Swiggy/Zomato पेआउट का सम्पूर्ण हिसाब",
      features: [
        {
          title: "🍽️ Table KOT & Live Kitchen Display (KDS)",
          desc: "टेबल वाइज लाइव KOT, डाइन-इन, टेकअवे व पार्सल बिलिंग। किचन में आर्डर जाते ही 10 मिनट का टाइमर चालू।"
        },
        {
          title: "🍳 डिश रेसिपी BOM + गैस/बिजली ओवरहेड्स",
          desc: "सिर्फ पनीर/चावल नहीं, बल्कि प्रति प्लेट कमर्शियल गैस (₹8), बिजली (₹5), शेफ लेबर (₹18) व पैकेजिंग जोड़कर असली लागत निकालें।"
        },
        {
          title: "🛵 Swiggy & Zomato पेआउट व कमीशन ऑडिट",
          desc: "18-24% कमीशन, डिस्काउंट शेयरिंग और लेट पेनल्टी काटकर बैंक खाते में जमा होने वाली शुद्ध रकम का सटीक मिलान।"
        },
        {
          title: "⏰ 48H-72H पेरीशेबल एक्सपायरी सेफ्टी गार्ड",
          desc: "पनीर, दूध, ताज़ी क्रीम या मशरूम 48 घंटे में खराब होने वाले हों तो तुरंत अलर्ट। बासी माल पार्टी कुकिंग से ऑटो-ब्लॉक।"
        }
      ],
      route: "/billing"
    },
    banquet: {
      id: "banquet",
      name: "होटल, बैंक्वेट हॉल व कैटरिंग",
      icon: Building,
      color: "from-indigo-500 to-purple-600",
      accent: "text-indigo-400",
      borderAccent: "border-indigo-500/50",
      bgAccent: "bg-indigo-500/10",
      tagline: "₹15 से ₹30 लाख के बड़े इवेंट्स, रूम बुकिंग, Pax गारंटी और क्रॉकरी डैमेज रिकवरी",
      features: [
        {
          title: "📅 Multi-Day Event Schedule & Pax Planning",
          desc: "2 से 5 दिन के शादी/इवेंट्स का शेड्यूल, मिनिमम गारंटेड Pax (उदा. 300) + 50 फ्लोटिंग किचन बैकअप प्लेट्स।"
        },
        {
          title: "🍷 क्रॉकरी, ग्लास व बर्तन डैमेज रिकवरी",
          desc: "पार्टी में टूटे वाइन ग्लास (₹150), बोन चाइना प्लेट्स (₹200) या टेबलक्लॉथ का नुकसान सीधे होस्ट के फाइनल बिल में जोड़ें।"
        },
        {
          title: "✍️ पोस्ट-इवेंट डुअल सिग्नेचर हैंडओवर स्लिप",
          desc: "पार्टी खत्म होते ही भौतिक प्लेट्स की गिनती + होस्ट और बैंक्वेट मैनेजर के संयुक्त हस्ताक्षर वाली लीगल रसीद।"
        },
        {
          title: "🤝 आउटसोर्स्ड वेंडर ट्रैकिंग (DJ, स्टेज, डेकोर)",
          desc: "डीजे, फूल वाले, फोटोग्राफर व बाहर के हलवाई का एडवांस व फाइनल पेमेंट एक ही लेजर में।"
        }
      ],
      route: "/billing"
    },
    gamezone: {
      id: "gamezone",
      name: "गेमज़ोन, VR एरिना व आर्केड पार्क",
      icon: Gamepad2,
      color: "from-purple-500 to-pink-600",
      accent: "text-purple-400",
      borderAccent: "border-purple-500/50",
      bgAccent: "bg-purple-500/10",
      tagline: "Semnox & Sacoa स्तर का कैशलेस RFID स्मार्ट प्लेकार्ड, IoT टाइमर्स और प्राइज स्टोर",
      features: [
        {
          title: "💳 Cashless RFID Smart Playcard Wallet",
          desc: "Mifare 1K / NFC कार्ड्स पर टैप-टू-प्ले। ₹500, ₹1,000 व ₹2,000 के स्मार्ट रिचार्ज पैकेजेस (+ फ्री बोनस क्रेडिट्स)।"
        },
        {
          title: "⏱️ PS5 VIP, VR Arena & Pool Live Timers",
          desc: "प्रति मिनट/घंटा ऑटोमैटिक बिलिंग + इन-गेम कोल्ड ड्रिंक्स व स्नैक्स बिलिंग + टाइम ओवर अलर्ट।"
        },
        {
          title: "✨ Dynamic Happy Hours & Weekend Surge",
          desc: "मंगलवार-गुरुवार दोपहर को 50% छूट ताकि खाली मशीनें भरें, और शनिवार-रविवार शाम को 1.2x पीक सर्ज रेट्स।"
        },
        {
          title: "🎁 डिजिटल टिकट्स व प्राइज रिडेम्पशन स्टोर",
          desc: "गेम जीतने पर कार्ड में ऑटो-क्रेडिट हुए टिकट्स देकर बच्चे 3-Ft टेडी बियर (500 टिकट्स) या हेडसेट रिडीम करें।"
        }
      ],
      route: "/gamezone-operations"
    },
    supermarket: {
      id: "supermarket",
      name: "सुपरमार्केट, किराना व FMCG",
      icon: ShoppingBag,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-400",
      borderAccent: "border-emerald-500/50",
      bgAccent: "bg-emerald-500/10",
      tagline: "1-सेकंड हैंडहेल्ड बारकोड बिलिंग, वजन कांटा कनेक्टिविटी और एक्सपायरी कंट्रोल",
      features: [
        {
          title: "⚡ 1-सेकंड अल्ट्रा-फास्ट पीओएस बारकोड बिलिंग",
          desc: "हैंडहेल्ड बारकोड गन से लगातार बीप-बीप स्कैनिंग। 10 सेकंड में 15 आइटम्स का इनवॉइस तैयार।"
        },
        {
          title: "⚖️ इलेक्ट्रॉनिक वजन कांटा (Weighing Scale) सिंक",
          desc: "मिठाई, ड्राई फ्रूट्स, पनीर या सब्जियों का लाइव वजन (उदा. 2.450 kg) केबल से सीधे स्क्रीन पर।"
        },
        {
          title: "🔒 गोपनीय खरीद लागत (P.Cost with Owner PIN)",
          desc: "बिलिंग करते समय ओनर पिन से खरीद भाव व शुद्ध मुनाफा देखें; स्टाफ के लिए यह 100% छिपा रहेगा।"
        },
        {
          title: "📦 3-टियर प्राइसिंग (Sale A, Sale B, Sale C)",
          desc: "खुदरा ग्राहक के लिए रिटेल भाव, होलसेलर के लिए थोक भाव और डीलर के लिए विशेष भाव 1-क्लिक में।"
        }
      ],
      route: "/fast-pos"
    },
    mobile: {
      id: "mobile",
      name: "मोबाइल, कंप्यूटर व इलेक्ट्रॉनिक्स",
      icon: Smartphone,
      color: "from-cyan-500 to-blue-600",
      accent: "text-cyan-400",
      borderAccent: "border-cyan-500/50",
      bgAccent: "bg-cyan-500/10",
      tagline: "डुअल IMEI 1 व 2, बैटरी सीरियल, ब्रांड वारंटी व इनवॉइस बारकोड ट्रैकिंग",
      features: [
        {
          title: "📱 Dual IMEI 1 & IMEI 2 Scanning",
          desc: "मोबाइल बॉक्स का बारकोड स्कैन करते ही दोनों IMEI नंबर ऑटो-कैप्चर होकर इनवॉइस पर प्रिंट होते हैं।"
        },
        {
          title: "🛡️ ब्रांड वारंटी व सर्विस हिस्ट्री",
          desc: "12 महीने / 24 महीने की वारंटी ट्रैकर। बिल नंबर डालते ही हैंडसेट की पूरी गारंटी डिटेल्स सामने।"
        },
        {
          title: "🏷️ ऑटोमैटिक बारकोड व सीरियल लेबल जनरेटर",
          desc: "एक्सेसरीज, हेडफोन और चार्जर पर चिपकाने के लिए स्टिकर शीट 1-क्लिक में प्रिंट करें।"
        }
      ],
      route: "/billing"
    },
    garments: {
      id: "garments",
      name: "गारमेंट्स, फुटवियर व फैशन स्टोर",
      icon: Scissors,
      color: "from-pink-500 to-rose-600",
      accent: "text-pink-400",
      borderAccent: "border-pink-500/50",
      bgAccent: "bg-pink-500/10",
      tagline: "साइज मैट्रिक्स (S/M/L/XL), कलर वेरिएंट्स और बारकोड हैंग-टैग्स",
      features: [
        {
          title: "👗 Multi-Size & Color Matrix Grid",
          desc: "एक ही टी-शर्ट या कुर्ते के सभी साइजेस (S, M, L, XL, XXL) और कलर्स (Red, Black, Blue) का संयुक्त स्टॉक।"
        },
        {
          title: "🏷️ बारकोड हैंग-टैग व स्टाइल कोड्स",
          desc: "कपड़ों पर लगने वाले बारकोड टैग्स व सीजनल डिस्काउंट कूपन्स (Flat 20% Off, Buy 2 Get 1)।"
        }
      ],
      route: "/billing"
    },
    hardware: {
      id: "hardware",
      name: "हार्डवेयर, सेनेटरी, पेंट व पाइप्स",
      icon: Cpu,
      color: "from-teal-500 to-emerald-600",
      accent: "text-teal-400",
      borderAccent: "border-teal-500/50",
      bgAccent: "bg-teal-500/10",
      tagline: "वायर कॉइल मीटर, बंडल वजन (KG), पाइप mm और पेंट कवरेज कैलकुलेटर",
      features: [
        {
          title: "⚡ वायर कॉइल रनिंग मीटर व बंडल वजन (KG)",
          desc: "तार के वजन से लंबाई (Meters) और लंबाई से वजन निकालने का इनबिल्ट इंजीनियरिंग कैलकुलेटर।"
        },
        {
          title: "📐 पाइप डायमीटर mm व पेंट कवरेज एस्टीमेटर",
          desc: "दीवार के स्क्वायर फीट के हिसाब से जरूरी प्राइमर व पेंट बाल्टियों की मात्रा का ऑटोमैटिक अनुमान।"
        }
      ],
      route: "/billing"
    },
    daybook: {
      id: "daybook",
      name: "दैनिक डे-बुक व शुद्ध मुनाफा (P&L)",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      accent: "text-green-400",
      borderAccent: "border-green-500/50",
      bgAccent: "bg-green-500/10",
      tagline: "दैनिक पाई-पाई आवक vs जावक, फूड कॉस्ट % और 1-क्लिक व्हाट्सएप क्लोजिंग",
      features: [
        {
          title: "💰 Real-Time Net Shuddh Munafa (Cash in Hand)",
          desc: "कुल सेल (Inflow) - राशन/ग्रॉसरी खरीद - स्टाफ मजदूरी - गैस/बिजली = गल्ले में बचा शुद्ध मुनाफा।"
        },
        {
          title: "📊 गोल्ड स्टैंडर्ड कॉस्ट % रेश्यो (Industry Benchmarks)",
          desc: "फूड कॉस्ट % (29%), स्टाफ सैलरी % (17%), रेंट % (14%) और गैस/बिजली % (5.8%) का लाइव चार्ट।"
        },
        {
          title: "🎯 AI मंथली बजट प्रेडिक्टर व ब्रेक-इवन रन-रेट",
          desc: "माह की शुरुआत में ही ₹1,06,000 फिक्स बजट का अनुमान + दुकान चलाने के लिए जरूरी न्यूनतम दैनिक बिक्री।"
        },
        {
          title: "📲 1-Click WhatsApp Daily Closing Flash Report",
          desc: "रात को दुकान बंद करते समय 1 बटन दबाते ही आज की पूरी कमाई व खर्च का सारांश ओनर के व्हाट्सएप पर।"
        }
      ],
      route: "/reports/daybook"
    }
  };

  const currentVertical = verticalsData[selectedVertical];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Announcement Ribbon */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-500/30 px-4 py-2 text-center text-xs font-bold text-purple-200 flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-yellow-400 animate-pulse" />
        <span>VyaparBook 2.0 ईआरपी लाइव है — 8 बिज़नेस वर्टिकल्स + ऑफलाइन SQLite + क्लाउड सिंक!</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="ml-2 underline text-white hover:text-yellow-300 font-black cursor-pointer"
        >
          अभी खोलें →
        </button>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-500/30">
              V
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                VyaparBook <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-bold">2.0 ERP</span>
              </span>
              <p className="text-[10px] text-gray-400">All-in-One Multi-Industry Business & Accounting Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition transform hover:scale-105 cursor-pointer"
            >
              Open Web ERP <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 overflow-hidden text-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-600/15 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black shadow-inner">
            <Award size={14} className="text-yellow-400" />
            <span>भारत का सबसे शक्तिशाली 8-in-1 Multi-Business Cloud ERP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            रेस्टोरेंट, बैंक्वेट, गेमज़ोन व सुपरमार्केट का{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              ऑटोमेशन व बिलिंग ईआरपी
            </span>
          </h1>

          {/* Clean Well-Spaced Subtitle */}
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              दैनिक शुद्ध मुनाफा • KOT टेबल बिलिंग • Swiggy/Zomato पेआउट ऑडिट • RFID कैशलेस प्लेकार्ड्स • 48H एक्सपायरी अलर्ट
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-normal">
              चाहे आपका 50-टेबल का रेस्टोरेंट हो, 1,000 लोगों का बैंक्वेट हॉल, 50 मशीनों का गेमज़ोन या सुपरमार्केट — हर व्यापार के लिए विशेष मॉड्यूल्स एक ही सॉफ्टवेयर में तैयार हैं।
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition transform hover:scale-105 cursor-pointer"
            >
              <Zap size={18} className="text-yellow-300" />
              क्लाउड वेब ईआरपी खोलें (Launch Web ERP)
            </button>

            <button
              onClick={() => navigate("/billing")}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-purple-500 font-bold text-sm rounded-2xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShoppingBag size={18} className="text-emerald-400" />
              फास्ट पीओएस बिलिंग स्क्रीन (Open POS)
            </button>
          </div>

          {/* 4 Trust Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Laptop size={16} className="text-cyan-400" />
              <span>Windows Desktop App</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Smartphone size={16} className="text-purple-400" />
              <span>Mobile & Tablet POS</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>100% Offline SQLite Engine</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Share2 size={16} className="text-green-400" />
              <span>1-Click WhatsApp Invoices</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Industry Explorer Section */}
      <section className="px-6 py-16 bg-slate-900/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              हर बिज़नेस के लिए क्या खास और विशेष है? (Specialized USPs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              नीचे दिए गए किसी भी बिज़नेस पर क्लिक करें और देखें कि हमारे पास उस इंडस्ट्री के लिए कौन से खास फीचर्स हैं जो बाज़ार के किसी अन्य सॉफ्टवेयर में नहीं मिलते:
            </p>
          </div>

          {/* Industry Selection Tabs */}
          <div className="flex justify-center gap-2 flex-wrap pb-2">
            {Object.values(verticalsData).map((vert) => {
              const isSelected = selectedVertical === vert.id;
              const IconComponent = vert.icon;
              return (
                <button
                  key={vert.id}
                  onClick={() => setSelectedVertical(vert.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 scale-105 ring-2 ring-purple-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <IconComponent size={16} className={isSelected ? "text-yellow-300" : "text-slate-400"} />
                  <span>{vert.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Deep-Dive Card */}
          <div className={`p-8 bg-slate-900 border-2 ${currentVertical.borderAccent} rounded-3xl shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${currentVertical.bgAccent} border ${currentVertical.borderAccent} shadow-inner`}>
                  {React.createElement(currentVertical.icon, { size: 36, className: currentVertical.accent })}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">विशेष इंडस्ट्री मॉड्यूल</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">{currentVertical.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">{currentVertical.tagline}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(currentVertical.route)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <span>यह मॉड्यूल अभी चलाएँ</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 4 Detailed Feature Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentVertical.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2 hover:border-slate-500 transition"
                >
                  <h4 className="font-black text-white text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{feat.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-6">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8-in-1 Complete Showcase Grid */}
      <section className="px-6 py-16 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              सभी 8 बिज़नेस वर्टिकल्स एक नज़र में
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              किसी भी कार्ड पर क्लिक करके सीधे उस मॉड्यूल को लाइव टेस्ट करें
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(verticalsData).map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-3xl transition duration-200 cursor-pointer space-y-4 hover:shadow-xl hover:shadow-purple-500/10 group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl ${item.bgAccent} border ${item.borderAccent} flex items-center justify-center text-white group-hover:scale-110 transition`}>
                      <IconComp size={24} className={item.accent} />
                    </div>
                    <h3 className="font-black text-base text-white">{item.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {item.tagline}
                    </p>
                  </div>

                  <span className={`text-xs font-bold ${item.accent} flex items-center gap-1 pt-2 border-t border-slate-800`}>
                    Open Live Screen <ArrowRight size={13} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-10 text-center text-xs text-slate-500 space-y-3 bg-slate-950">
        <div className="flex justify-center items-center gap-4 text-slate-400">
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/dashboard")}>डैशबोर्ड</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/billing")}>बिलिंग</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/gamezone-operations")}>गेमज़ोन</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/reports/daybook")}>डे-बुक</span>
        </div>
        <p>© 2026 VyaparBook Accounting & Multi-Industry ERP Suite. All rights reserved.</p>
        <p className="text-slate-600">Enterprise Ready • Local Offline Storage + Supabase Cloud Database</p>
      </footer>
    </div>
  );
}
