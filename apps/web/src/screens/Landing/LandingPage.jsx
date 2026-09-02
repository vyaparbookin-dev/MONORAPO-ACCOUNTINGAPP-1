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
  MessageCircle,
  Search,
  X,
  Apple
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  
  const APK_DOWNLOAD_URL = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/Red.Accounting.Book.v1.2.0.apk";
  const DESKTOP_EXE_DOWNLOAD_URL = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/Red.Accounting.Book.Setup.1.2.0.exe";

  const handleDownloadAndroidApk = () => {
    window.location.href = APK_DOWNLOAD_URL;
  };

  const handleDownloadWindowsApp = () => {
    window.location.href = DESKTOP_EXE_DOWNLOAD_URL;
  };

  const handleInstallMobileApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
      });
    } else {
      // Direct APK download fallback
      window.location.href = APK_DOWNLOAD_URL;
      alert("📱 VyaparBook Android APK डाउनलोड शुरू हो गया है!\n\n(या आप अपने ब्राउज़र मेनू ⋮ में 'Install App / Add to Home Screen' भी दबा सकते हैं)");
    }
  };

  

  const navigate = useNavigate();
  const [selectedVertical, setSelectedVertical] = useState("restaurant");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

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
          title: "🏷️ एक्सपायरी अलार्म व डिस्काउंट क्लीयरेंस",
          desc: "30 दिन में एक्सपायर होने वाले बिस्कुट, नमकीन या कॉस्मेटिक्स पर 'Buy 1 Get 1' ऑफर खुद सक्रिय।"
        }
      ],
      route: "/billing"
    },
    mobile: {
      id: "mobile",
      name: "मोबाइल, लैपटॉप व इलेक्ट्रॉनिक्स",
      icon: Smartphone,
      color: "from-cyan-500 to-blue-600",
      accent: "text-cyan-400",
      borderAccent: "border-cyan-500/50",
      bgAccent: "bg-cyan-500/10",
      tagline: "15-Digit IMEI नंबर स्कैनिंग, ब्रांड वारंटी ट्रैकिंग और रिपेयरिंग जॉब-कार्ड",
      features: [
        {
          title: "📱 15-Digit Dual IMEI व सीरियल नंबर बारकोड",
          desc: "स्मार्टफोन बेचते समय बॉक्स का बारकोड स्कैन करें; दोनों IMEI और बैटरी सीरियल नंबर इनवॉइस पर स्वतः प्रिंट।"
        },
        {
          title: "🛡️ ब्रांड वारंटी क्लेम व सर्विस सेंटर रिप्लेसमेंट",
          desc: "सैमसंग, एप्पल, रियलमी के वारंटी क्लेम, डेड-ऑन-अराइवल (DOA) रिटर्न और क्रेडिट नोट मैनेजमेंट।"
        },
        {
          title: "🔧 रिपेयरिंग जॉब-कार्ड व फॉल्ट डायग्नोस्टिक्स",
          desc: "टूटी स्क्रीन, बैटरी प्रॉब्लम, कस्टमर का लॉक पैटर्न और रिपेयरिंग एस्टीमेट स्लिप।"
        },
        {
          title: "🔄 ओल्ड फोन एक्सचेंज (Cashify Style Buyback)",
          desc: "पुराना फोन एक्सचेंज में लेते समय IMEI वेरिफिकेशन, कस्टमर का आधार व कंडीशन डिस्काउंट।"
        }
      ],
      route: "/serial-tracking"
    },
    hardware: {
      id: "hardware",
      name: "हार्डवेयर, सेनेटरी, पाइप्स व पेंट्स",
      icon: Cpu,
      color: "from-orange-500 to-amber-600",
      accent: "text-orange-400",
      borderAccent: "border-orange-500/50",
      bgAccent: "bg-orange-500/10",
      tagline: "स्क्वायर फीट/मीटर डाइमेंशन कैलकुलेटर, वजन-से-मीटर कन्वर्जन व कटिंग वेस्टेज",
      features: [
        {
          title: "📐 L × W × H डाइमेंशन कैलकुलेटर (ग्लास/प्लाई)",
          desc: "प्लाईवुड, मार्बल, टफन्ड ग्लास या ग्रेनाइट: इंच/सूट में माप डालें, स्क्वायर फीट व कुल रेट खुद बनेगा।"
        },
        {
          title: "⚖️ तार/पाइप का वजन-से-मीटर ऑटो कन्वर्जन",
          desc: "कांटे पर 42.5 Kg वायर का बंडल तौलें; सिस्टम अपने आप '250 Meters' बिल में दर्ज करेगा।"
        },
        {
          title: "✂️ कटिंग वेस्टेज चार्जिंग (Scrap Loss Recovery)",
          desc: "लोहे के एंगल या पीवीसी पाइप के कटने पर बचे छोटे टुकड़ों का वेस्टेज चार्ज ग्राहक बिल में शामिल।"
        },
        {
          title: "🎨 पेंट टिंटिंग बेस व कलरेंट फॉर्मूलेशन",
          desc: "कंप्यूटराइज्ड पेंट मिक्सिंग: 20L बेस व्हाइट + 40ml रेड + 15ml येलो कलरेंट का सही स्टॉक डिडक्शन।"
        }
      ],
      route: "/inventory"
    },
    salon: {
      id: "salon",
      name: "सैलून, स्पा व वेलनेस क्लिनिक",
      icon: Scissors,
      color: "from-pink-500 to-rose-600",
      accent: "text-pink-400",
      borderAccent: "border-pink-500/50",
      bgAccent: "bg-pink-500/10",
      tagline: "अपॉइंटमेंट शेड्यूलिंग, ब्यूटीशियन इंसेंटिव कमीशन और मेंबरशिप वैक्स/फेशियल पैकेजेस",
      features: [
        {
          title: "📅 Stylist Chair & Appointment Scheduler",
          desc: "हेयरड्रेसर व ब्यूटीशियन की खाली कुर्सियों का टाइम-स्लॉट कैलेंडर; कस्टमर को व्हाट्सएप कन्फर्मेशन।"
        },
        {
          title: "💇‍♀️ 10-25% स्टाफ सर्विस इंसेंटिव कमीशन",
          desc: "हेयर कट (₹500 पर ₹50) या ब्राइडल मेकअप (₹8,000 पर ₹1,200) का स्टाफ वाइज कमीशन ऑटोमैटिक वेतन में जुड़े।"
        },
        {
          title: "🧴 सैलून बैक-बार शैम्पू/कलर कंजम्पशन",
          desc: "कस्टमर पर इस्तेमाल हुआ 50ml L'Oreal शैम्पू, हेयर स्पा क्रीम या वैक्स का इंटरनल कंजम्पशन ट्रैकिंग।"
        },
        {
          title: "💳 VIP मेंबरशिप वैलेट व एनुअल पैकेजेस",
          desc: "₹10,000 का कार्ड रिचार्ज कराने पर 12 हेयरकट + 3 फेशियल फ्री; वॉलेट से प्रति विजिट डिडक्शन।"
        }
      ],
      route: "/billing"
    },
    core: {
      id: "core",
      name: "कोर अकाउंटिंग व डे-बुक रोकड़ बही",
      icon: Receipt,
      color: "from-blue-600 to-indigo-700",
      accent: "text-blue-400",
      borderAccent: "border-blue-500/50",
      bgAccent: "bg-blue-500/10",
      tagline: "सुबह का गल्ला, दैनिक नकद आवक-जावक, शुद्ध मुनाफा और GSTR-1/3B फाइलिंग",
      features: [
        {
          title: "💰 डे-बुक रोकड़ बही (Daily Cash In/Out)",
          desc: "सुबह का ओपनिंग गल्ला (₹15,000) + नकद बिक्री (₹38.5k) - खर्चे = रात को गल्ले में सुरक्षित नकद।"
        },
        {
          title: "📊 दैनिक शुद्ध मुनाफा (Real Shuddh Munafa)",
          desc: "सिर्फ सेल नहीं, बल्कि माल खरीद लागत (COGS) और दुकान खर्चे काटकर आज का शुद्ध मुनाफा।"
        },
        {
          title: "🏛️ ऑटोमैटिक GSTR-1, GSTR-2B व 3B टैक्स फाइलिंग",
          desc: "B2B व B2C बिक्री का वर्गीकरण, 18% इनपुट टैक्स क्रेडिट (ITC) क्लेम और सरकारी पोर्टल पर 1-क्लिक JSON।"
        },
        {
          title: "🚛 ई-वे बिल व ट्रांसपोर्ट LR बिल्टी ट्रैकिंग",
          desc: "₹50,000 से अधिक माल की गाड़ी के लिए 1-क्लिक e-Way Bill और ट्रांसपोर्टर LR बिल्टी ट्रैकिंग।"
        }
      ],
      route: "/reports/daybook"
    }
  };

  const currentVertical = verticalsData[selectedVertical] || verticalsData.restaurant;

  // Search filter
  const filteredVerticals = Object.values(verticalsData).filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Announcement Ribbon */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-500/30 px-4 py-2 text-center text-xs font-bold text-purple-200 flex flex-wrap items-center justify-center gap-2">
        <Sparkles size={14} className="text-yellow-400 animate-pulse" />
        <span>VyaparBook 2.0 ERP लाइव है — 8 बिज़नेस वर्टिकल्स + ऑफलाइन SQLite + क्लाउड सिंक!</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="ml-2 underline text-white hover:text-yellow-300 font-black cursor-pointer"
        >
          अभी खोलें →
        </button>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-lg md:text-xl text-white shadow-lg shadow-purple-500/30">
              V
            </div>
            <div>
              <span className="font-black text-lg md:text-xl tracking-tight text-white flex items-center gap-1.5">
                VyaparBook <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-bold">2.0 ERP</span>
              </span>
              <p className="text-[9px] md:text-[10px] text-gray-400 hidden sm:block">All-in-One Multi-Industry Business Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">ऐप डाउनलोड करें</span>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              लॉगिन
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>डैशबोर्ड</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-12 pb-16 overflow-hidden text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] md:text-xs font-black shadow-inner">
            <Award size={14} className="text-yellow-400" />
            <span>भारत का सबसे शक्तिशाली 8-in-1 Multi-Business Cloud ERP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            रेस्टोरेंट, बैंक्वेट, गेमज़ोन व सुपरमार्केट का{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              ऑटोमेशन व बिलिंग ईआरपी
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            दैनिक शुद्ध मुनाफा • KOT टेबल बिलिंग • Swiggy/Zomato पेआउट ऑडिट • RFID कैशलेस प्लेकार्ड्स • 48H एक्सपायरी अलर्ट
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="अपने व्यापार का नाम या फीचर खोजें (उदा: रेस्टोरेंट, हार्डवेयर, KOT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-2xl text-xs text-white placeholder-slate-400 outline-none shadow-lg"
            />
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap size={16} className="text-yellow-300" />
              क्लाउड वेब ईआरपी खोलें (Launch Web ERP)
            </button>

            <button
              onClick={() => setDownloadModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-2xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download size={16} className="text-emerald-400" />
              विंडोज़ डेस्कटॉप व मोबाइल ऐप डाउनलोड
            </button>
          </div>

          {/* 4 Trust Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 max-w-4xl mx-auto text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Laptop size={15} className="text-cyan-400" />
              <span>Windows App</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Smartphone size={15} className="text-purple-400" />
              <span>Mobile POS</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>Offline SQLite</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-300">
              <Share2 size={15} className="text-green-400" />
              <span>WhatsApp Bills</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Industry Explorer Section */}
      <section className="px-4 sm:px-6 py-12 md:py-16 bg-slate-900/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              हर बिज़नेस के लिए विशेष मॉड्यूल्स (Specialized USPs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              नीचे दिए गए किसी भी बिज़नेस पर क्लिक करें और देखें कि हमारे पास उस इंडस्ट्री के लिए कौन से खास फीचर्स हैं:
            </p>
          </div>

          {/* Industry Selection Tabs */}
          <div className="flex justify-center gap-2 flex-wrap pb-2">
            {filteredVerticals.map((vert) => {
              const isSelected = selectedVertical === vert.id;
              const IconComponent = vert.icon;
              return (
                <button
                  key={vert.id}
                  onClick={() => setSelectedVertical(vert.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 scale-105 ring-2 ring-purple-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <IconComponent size={15} className={isSelected ? "text-yellow-300" : "text-slate-400"} />
                  <span>{vert.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Deep-Dive Card */}
          <div className={`p-6 sm:p-8 bg-slate-900 border-2 ${currentVertical.borderAccent} rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`p-3.5 rounded-2xl ${currentVertical.bgAccent} border ${currentVertical.borderAccent} shadow-inner`}>
                  {React.createElement(currentVertical.icon, { size: 30, className: currentVertical.accent })}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">विशेष इंडस्ट्री मॉड्यूल</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{currentVertical.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">{currentVertical.tagline}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(currentVertical.route)}
                className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <span>यह मॉड्यूल अभी चलाएँ</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 4 Detailed Feature Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentVertical.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-1.5 hover:border-slate-500 transition"
                >
                  <h4 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>{feat.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-5">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Download Modal Popup */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                <Download size={24} />
              </div>
              <h3 className="text-xl font-black">VyaparBook 2.0 ऐप्स डाउनलोड करें</h3>
              <p className="text-xs text-slate-400">विंडोज़ कंप्यूटर या एंड्रॉइड/आईफोन मोबाइल के लिए ऐप चुनें</p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Windows App */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Laptop size={28} className="text-cyan-400" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Windows Desktop Setup (.exe)</h4>
                    <p className="text-slate-400 text-[11px]">100% ऑफलाइन SQLite, थर्मल प्रिंटर व बारकोड सिंक</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadWindowsApp}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl"
                >
                  Download .exe
                </button>
              </div>

              {/* Android App */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Smartphone size={28} className="text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Android Mobile App (PWA / APK)</h4>
                    <p className="text-slate-400 text-[11px]">मोबाइल बिलिंग, कैमरा बारकोड व व्हाट्सएप इनवॉइस</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    alert("📱 मोबाइल में इसे ऐप की तरह चलाने के लिए ब्राउज़र मेनू में जाकर 'Add to Home Screen' या 'Install App' पर टैप करें!");
                    setDownloadModalOpen(false);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl"
                >
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-4 md:px-6 py-8 text-center text-xs text-slate-500 space-y-3 bg-slate-950">
        <div className="flex justify-center items-center gap-3 text-slate-400 text-xs">
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/dashboard")}>डैशबोर्ड</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/billing")}>बिलिंग</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/gamezone-operations")}>गेमज़ोन</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate("/reports/daybook")}>डे-बुक</span>
        </div>
        <p>© 2026 VyaparBook Accounting & Multi-Industry ERP Suite.</p>
      </footer>
    </div>
  );
}
