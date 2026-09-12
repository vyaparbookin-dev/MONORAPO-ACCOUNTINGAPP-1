import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Share2,
  TrendingUp,
  Wallet,
  ChefHat,
  Users,
  Flame,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  Award,
  Sparkles,
  Package,
  Target
} from "lucide-react";
import CustomerSummaryModal from "../../components/modals/CustomerSummaryModal";

export default function DayBookPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [rawdata, setRawData] = useState(null);
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    cashSales: 0,
    partyIn: 0,
    cashPurchases: 0,
    expenses: 0,
    salaries: 0,
    partyOut: 0,
  });

  // State for Dish / Menu Item Performance Analytics
  const [menuPerformance, setMenuPerformance] = useState({
    totalProducts: 0,
    activeSellingCount: 0,
    zeroSellingCount: 0,
    topSellers: [],
    mediumSellers: [],
    zeroSellers: []
  });

  // State for Customer 360° Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    fetchDayBook();
  }, [period, startDate, endDate]);

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      let url = `/api/daybook?period=${period}&limit=500`;
      if (period === "custom") {
        url = `/api/daybook?startDate=${startDate}&endDate=${endDate}&limit=500`;
      } else if (period === "today") {
        url = `/api/daybook?date=${startDate}&limit=500`;
      }

      const [res, invRes] = await Promise.all([
        api.get(url),
        api.get("/api/inventory").catch(() => null)
      ]);

      const data = res?.data?.data || res?.data || res;
      const products = invRes?.data?.products || invRes?.data || [];

      if (data) {
        setRawData(data);
        calculateSummary(data);
        calculateMenuPerformance(data.bills || [], products);
      }
    } catch (err) {
      console.error("Failed to fetch Daybook", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMenuPerformance = (bills, products) => {
    const itemStats = {};

    // 1. Tally from bills in this period
    (bills || []).forEach((bill) => {
      (bill.items || []).forEach((item) => {
        const key = (item.name || item.productName || "Dish").trim();
        if (!itemStats[key]) {
          itemStats[key] = {
            name: key,
            quantity: 0,
            revenue: 0,
            orderCount: 0,
            rate: item.rate || item.price || 0,
            category: item.category || ""
          };
        }
        itemStats[key].quantity += Number(item.quantity) || 1;
        const itemTot = Number(item.total) || ((Number(item.rate || item.price) || 0) * (Number(item.quantity) || 1));
        itemStats[key].revenue += itemTot;
        itemStats[key].orderCount += 1;
      });
    });

    const prodsList = Array.isArray(products) && products.length > 0 ? products : [];
    const totalDishesInMenu = prodsList.length;

    // Cross reference with all products in inventory
    const topSellers = [];
    const mediumSellers = [];
    const zeroSellers = [];

    // All active sold items
    const soldItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);

    // Dynamic threshold for Top Sellers vs Medium
    const maxQty = soldItems.length > 0 ? soldItems[0].quantity : 0;
    const topThreshold = Math.max(3, Math.round(maxQty * 0.4));

    soldItems.forEach((item) => {
      if (item.quantity >= topThreshold) {
        topSellers.push({
          ...item,
          status: "Star ⭐ (सर्वाधिक बिक्री)",
          profitImpact: "उच्चतम सेल व मुख्य मुनाफा"
        });
      } else {
        mediumSellers.push({
          ...item,
          status: "Regular 🟡 (औसत मांग)",
          profitImpact: "संतुलित बिक्री व स्थिर मांग"
        });
      }
    });

    // Find products in restaurant menu with zero sales in this period
    prodsList.forEach((prod) => {
      const prodName = (prod.name || prod.productName || "").trim();
      if (prodName && !itemStats[prodName]) {
        const isRaw = prod.category === "Kitchen Raw Materials" || /कच्चा माल|raw|cylinder/i.test(prodName);
        zeroSellers.push({
          name: prodName,
          category: prod.category || "General",
          price: prod.sellingPrice || prod.price || prod.costPrice || 0,
          currentStock: prod.currentStock ?? prod.stock ?? 0,
          unit: prod.unit || "pcs",
          isRaw,
          riskNote: isRaw
            ? "कच्चा माल स्टॉक / शेल्फ-लाइफ एक्सपायरी रिस्क"
            : "मेनू में अप्रयुक्त व्यंजन / 0 ऑर्डर (वेस्टेज खतरा)"
        });
      }
    });

    setMenuPerformance({
      totalProducts: totalDishesInMenu > 0 ? totalDishesInMenu : soldItems.length,
      activeSellingCount: soldItems.length,
      zeroSellingCount: zeroSellers.length,
      topSellers,
      mediumSellers,
      zeroSellers
    });
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPeriod === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPeriod === "week") {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      setStartDate(startOfWeek.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (newPeriod === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (newPeriod === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      setStartDate(startOfQuarter.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (newPeriod === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  const calculateSummary = (data) => {
    let tIn = 0,
      tOut = 0;

    const cashSales = (data.bills || [])
      .filter((b) => b.paymentMethod !== "credit")
      .reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const partyIn = (data.partyTransactions || []).reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    const cashPurchases = (data.purchases || []).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const expenses = (data.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const salaries = (data.salaries || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const partyOut = (data.partyTransactions || []).reduce((sum, t) => sum + (t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn,
      totalOut: tOut,
      netBalance: tIn - tOut,
      cashSales,
      partyIn,
      cashPurchases,
      expenses,
      salaries,
      partyOut,
    });
  };

  const handleTallyExport = async () => {
    try {
      const res = await api.get(`/api/tally/export?startDate=${startDate}&endDate=${endDate}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data || res], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tally_Daybook_${startDate}_to_${endDate}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Tally Export Failed", err);
      alert("Failed to export Tally XML. Ensure the backend is running.");
    }
  };

  const handleCustomerClick = (partyId) => {
    if (!partyId) return;
    setSelectedCustomerId(partyId);
    setIsModalOpen(true);
  };

  // WhatsApp Daily Business Closing Flash Report
  const shareDailyFlashWhatsApp = () => {
    let msg = `*📊 DAILY BUSINESS CASHFLOW & SHUDDH MUNAFA REPORT*\n`;
    msg += `*Period / Date:* ${startDate} ${startDate !== endDate ? `to ${endDate}` : ""}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 TOTAL MONEY RECEIVED (INFLOW):* ₹${summary.totalIn.toLocaleString("en-IN")}\n`;
    msg += `  • Direct Cash/Online Sales: ₹${summary.cashSales.toLocaleString("en-IN")}\n`;
    msg += `  • Customer Udhar Received: ₹${summary.partyIn.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*🔴 TOTAL EXPENSES & OUTFLOW (OUT):* ₹${summary.totalOut.toLocaleString("en-IN")}\n`;
    msg += `  • Grocery & Raw Purchases: ₹${summary.cashPurchases.toLocaleString("en-IN")}\n`;
    msg += `  • Staff Daily Wages / Salary: ₹${summary.salaries.toLocaleString("en-IN")}\n`;
    msg += `  • Operating Expenses (Gas/Power): ₹${summary.expenses.toLocaleString("en-IN")}\n`;
    msg += `  • Supplier / Party Paid: ₹${summary.partyOut.toLocaleString("en-IN")}\n`;
    msg += `----------------------------------\n`;
    msg += `*💰 NET SHUDDH MUNAFA (IN HAND SURPLUS):* *₹${summary.netBalance.toLocaleString("en-IN")}*\n`;
    msg += `----------------------------------\n`;
    msg += `_Generated automatically from Business Accounting App._`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-6">
      {/* Header & Preset Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/m')}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
              title="वापस मोबाइल ऐप पर जाएं"
            >
              <ArrowLeft size={16} />
              <span>वापस</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={24} />
                Day Book & Daily Shuddh Munafa Register
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">
                दैनिक शुद्ध मुनाफा • पाई-पाई का हिसाब (आवक vs जावक vs शुद्ध बचत)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareDailyFlashWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Share2 size={15} /> WhatsApp Closing Flash
            </button>
            <button
              onClick={handleTallyExport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Download size={15} /> Tally XML
            </button>
            <button
              onClick={fetchDayBook}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              title="Refresh Daybook"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 1-Click Multi-Period Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {[
            { id: "today", label: "📅 Today (आज)" },
            { id: "yesterday", label: "⏮️ Yesterday (कल)" },
            { id: "week", label: "📆 This Week" },
            { id: "month", label: "🗓️ This Month" },
            { id: "quarter", label: "📊 This Quarter" },
            { id: "year", label: "📈 This Year" },
            { id: "custom", label: "⚙️ Custom Range" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                period === p.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs font-medium">
            <span className="text-blue-900 font-bold">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-gray-600">From:</label>
              <input
                type="date"
                className="border p-1.5 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600">To:</label>
              <input
                type="date"
                className="border p-1.5 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Master Summary Flash Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-800 font-extrabold text-sm uppercase tracking-wide">
                  Total Money IN (कुल आवक)
                </span>
                <ArrowDownCircle className="text-emerald-600" size={24} />
              </div>
              <div className="text-3xl font-black text-emerald-700">
                ₹{summary.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-2">
                सेल (Cash/UPI) + पार्टी जमा रकम
              </p>
            </div>

            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-800 font-extrabold text-sm uppercase tracking-wide">
                  Total Money OUT (कुल खर्चे)
                </span>
                <ArrowUpCircle className="text-rose-600" size={24} />
              </div>
              <div className="text-3xl font-black text-rose-700">
                ₹{summary.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-rose-600 font-medium mt-2">
                ग्रॉसरी + स्टाफ मजदूरी + गैस/बिजली + वेंडर
              </p>
            </div>

            <div
              className={`${
                summary.netBalance >= 0
                  ? "bg-gradient-to-br from-blue-900 to-slate-900 text-yellow-400"
                  : "bg-red-900 text-white"
              } p-6 rounded-2xl flex flex-col justify-between shadow-md border`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 font-extrabold text-sm uppercase tracking-wide">
                  💰 Shuddh Munafa (शुद्ध बचत)
                </span>
                <Wallet className="text-yellow-300" size={24} />
              </div>
              <div className="text-3xl font-black">
                ₹{summary.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-blue-200 font-semibold mt-2">
                {summary.netBalance >= 0
                  ? `✓ Net Cash Surplus In Hand (${(
                      summary.totalIn > 0 ? (summary.netBalance / summary.totalIn) * 100 : 0
                    ).toFixed(1)}% Margin)`
                  : "⚠️ Deficit / Loss Today"}
              </p>
            </div>
          </div>

          {/* Itemized Inflow & Outflow Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IN Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base font-black text-gray-900 border-b pb-3 flex items-center justify-between">
                <span>🟢 Income & Revenue Sources (आवक)</span>
                <span className="text-sm font-bold text-emerald-700">
                  ₹{summary.totalIn.toLocaleString("en-IN")}
                </span>
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-gray-800">
                    🍽️ Restaurant / Counter Cash & Online Sales
                  </span>
                  <span className="font-black text-emerald-700">
                    ₹{summary.cashSales.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-gray-800">
                    🤝 Customer Collections / Party Token Jama
                  </span>
                  <span className="font-black text-emerald-700">
                    ₹{summary.partyIn.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* OUT Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base font-black text-gray-900 border-b pb-3 flex items-center justify-between">
                <span>🔴 Operating Cost & Outflow (जावक)</span>
                <span className="text-sm font-bold text-rose-700">
                  ₹{summary.totalOut.toLocaleString("en-IN")}
                </span>
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🥬 Kitchen Grocery & Raw Materials Inward
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.cashPurchases.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    👨‍🍳 Staff Daily Wages & Salary Disbursals
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.salaries.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🔥 Operating Expenses (Gas, Power, Maintenance)
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.expenses.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🤝 Supplier & Outsource Vendor Payouts
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.partyOut.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🍽️ Dish & Menu Performance Section (मेनू व्यंजन व बिक्री विश्लेषण) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <ChefHat className="text-orange-600" size={24} />
                  🍽️ रेस्टोरेंट मेनू व व्यंजन बिक्री विश्लेषण (Menu Performance Matrix)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  मेनू में कुल व्यंजन • सर्वाधिक बिकने वाले व्यंजन • औसत बिक्री • 0 ऑर्डर (Zero-Sale) वाले व्यंजन व वेस्टेज रिस्क
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">कुल आइटम्स</span>
                  <span className="text-sm font-black text-blue-900">{menuPerformance.totalProducts} Items</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">बिकने वाले व्यंजन</span>
                  <span className="text-sm font-black text-emerald-800">{menuPerformance.activeSellingCount} Active</span>
                </div>
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">0 सेल (Unsold)</span>
                  <span className="text-sm font-black text-rose-800">{menuPerformance.zeroSellingCount} Zero</span>
                </div>
              </div>
            </div>

            {/* 3 Performance Buckets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. TOP SELLERS */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-200/80 pb-2">
                  <h3 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                    <Award size={18} className="text-amber-500" />
                    <span>🌟 सर्वाधिक बिकने वाले (Star Items)</span>
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    {menuPerformance.topSellers.length} व्यंजन
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {menuPerformance.topSellers.length > 0 ? (
                    menuPerformance.topSellers.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-emerald-100 rounded-xl shadow-2xs hover:border-emerald-300 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {item.quantity} प्लेट/पीस बिके • {item.orderCount} बिल्स में शामिल
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900 block">₹{item.revenue.toLocaleString("en-IN")}</span>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              Star ⭐
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      इस अवधि में कोई विशेष बेस्ट-सेलर रिकॉर्ड नहीं मिला।
                    </div>
                  )}
                </div>
              </div>

              {/* 2. MEDIUM SELLERS */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-amber-200/80 pb-2">
                  <h3 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                    <TrendingUp size={18} className="text-amber-600" />
                    <span>🟡 औसत बिकने वाले (Steady Items)</span>
                  </h3>
                  <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    {menuPerformance.mediumSellers.length} व्यंजन
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {menuPerformance.mediumSellers.length > 0 ? (
                    menuPerformance.mediumSellers.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-amber-100 rounded-xl shadow-2xs hover:border-amber-300 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <span className="text-[10px] text-amber-700 font-semibold">
                              {item.quantity} प्लेट/पीस बिके • {item.orderCount} बिल्स
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900 block">₹{item.revenue.toLocaleString("en-IN")}</span>
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                              Regular
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      कोई औसत बिक्री वाले व्यंजन नहीं।
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ZERO SELLERS & RAW STOCK */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-rose-200/80 pb-2">
                  <h3 className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                    <AlertTriangle size={18} className="text-rose-600" />
                    <span>⚠️ 0 सेल (Unsold / Non-Moving)</span>
                  </h3>
                  <span className="text-[10px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    {menuPerformance.zeroSellers.length} आइटम्स
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {menuPerformance.zeroSellers.length > 0 ? (
                    menuPerformance.zeroSellers.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-rose-100 rounded-xl shadow-2xs hover:border-rose-300 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              ⚠️ {item.riskNote}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              स्टॉक: {item.currentStock} {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-700 block">₹{item.price}</span>
                            <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                              0 Order
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      बधाई! सभी व्यंजन व आइटम्स बिक रहे हैं।
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant Impact Advisory Callout */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm border border-indigo-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-black text-yellow-300 flex items-center gap-1.5 text-sm uppercase tracking-wide">
                  <Sparkles size={16} /> रेस्टोरेंट बिजनेस व कच्चा माल वेस्टेज एनालिसिस (Chef & Owner Advisory)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  • <strong>मुख्य बिक्री स्तंभ:</strong> टॉप सेलर डिशेज कुल कमाई का 75%+ हिस्सा ला रही हैं। इनके कच्चे माल (पनीर, मैदा, मसाले) का स्टॉक हमेशा पर्याप्त रखें।<br />
                  • <strong>0 सेल का खतरा:</strong> जो व्यंजन बार-बार 0 सेल में आ रहे हैं, उनके लिए ताजी सब्जियां/डेयरी ज्यादा न मंगाएं ताकि <em>खराब होने (Spoilage Loss)</em> से बचा जा सके।<br />
                  • <strong>सलाह:</strong> 0 सेल वाले व्यंजनों को टॉप-सेलर (जैसे बटर नान या कोल्ड ड्रिंक) के साथ 'कॉम्बो मील' में ऑफर करें।
                </p>
              </div>
              <div className="shrink-0 bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-300 uppercase block font-bold">Menu Velocity</span>
                <span className="text-xl font-black text-emerald-400">
                  {menuPerformance.totalProducts > 0 ? Math.round((menuPerformance.activeSellingCount / menuPerformance.totalProducts) * 100) : 0}%
                </span>
                <span className="text-[10px] text-slate-300 block">Active Flow</span>
              </div>
            </div>
          </div>

          {/* Today's Sales Bills */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
              <span>🧾 Invoices & Bills for Selected Period</span>
              <span className="text-xs text-gray-500 font-normal">
                Total: {rawdata?.bills?.length || 0} Bills
              </span>
            </h2>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
              {Array.isArray(rawdata?.bills) && rawdata.bills.length > 0 ? (
                rawdata.bills.map((bill) => (
                  <div key={bill._id || bill.id || Math.random()} className="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg transition">
                    <div>
                      <span className="font-bold text-gray-900">#{bill.billNumber || bill.invoiceNo || 'N/A'}</span>
                      <button
                        onClick={() => handleCustomerClick(bill.partyId?._id || bill.partyId?.id)}
                        className="ml-3 text-blue-600 hover:underline font-semibold disabled:text-gray-600 disabled:no-underline"
                        disabled={!bill.partyId?._id && !bill.partyId?.id}
                      >
                        {bill.partyId?.name || bill.customerName || "Walk-in Guest"}
                      </button>
                      {bill.paymentMethod && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border uppercase">
                          {bill.paymentMethod}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-gray-900 text-sm">
                      ₹{(bill.finalAmount || bill.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No sales bills found for this period.
                </div>
              )}
            </div>
          </div>

          {/* Manual Outflow & Expense Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-900 mb-4 border-b pb-2">
              📝 Expense, Staff & Vendor Transaction Logs
            </h2>
            <div className="divide-y max-h-80 overflow-y-auto pr-1 text-xs">
              {Array.isArray(rawdata?.expenses) && rawdata.expenses.map((e) => (
                <div key={e._id || e.id || Math.random()} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    {e.title || "Expense Entry"} <span className="text-[10px] text-gray-500 font-normal">({e.category || "General"})</span>
                  </span>
                  <span className="font-black text-rose-600">- ₹{e.amount}</span>
                </div>
              ))}
              {Array.isArray(rawdata?.salaries) && rawdata.salaries.map((s) => (
                <div key={s._id || s.id || Math.random()} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    👨‍🍳 Staff Salary / Daily Wage Payout ({s.staffId?.name || s.staffName || "Staff"})
                  </span>
                  <span className="font-black text-rose-600">- ₹{s.amount}</span>
                </div>
              ))}
              {Array.isArray(rawdata?.partyTransactions) && rawdata.partyTransactions.map((t) => (
                <div key={t._id || t.id || Math.random()} className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                  <span className="font-bold text-gray-800">
                    {t.details || "Party Transaction"} ({t.partyId?.name || "Party"})
                  </span>
                  <span
                    className={`font-black ${
                      t.credit > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {t.credit > 0 ? `+ ₹${t.credit}` : `- ₹${t.debit}`}
                  </span>
                </div>
              ))}
              {!rawdata?.expenses?.length &&
                !rawdata?.salaries?.length &&
                !rawdata?.partyTransactions?.length && (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    No manual expense or salary entries recorded for this period.
                  </div>
                )}
            </div>
          </div>
        </>
      )}

      {/* Customer 360° Modal */}
      {isModalOpen && (
        <CustomerSummaryModal
          partyId={selectedCustomerId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
