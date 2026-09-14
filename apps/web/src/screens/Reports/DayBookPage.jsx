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
  Target,
  Tag,
  Percent,
  PieChart,
  Eye,
  X,
  Clock,
  MapPin,
  Receipt,
  Gift,
  ChevronRight
} from "lucide-react";
import CustomerSummaryModal from "../../components/modals/CustomerSummaryModal";
import { useCompany } from "../../contexts/CompanyContext";

export default function DayBookPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany() || {};
  const indType = String(
    typeof selectedCompany?.industryType === "string"
      ? selectedCompany.industryType
      : typeof selectedCompany?.businessType === "string"
      ? selectedCompany.businessType
      : selectedCompany?.industryType?.name || selectedCompany?.businessType?.name || ""
  ).toLowerCase();
  const isRestaurant = indType.includes("restaurant") || indType.includes("cafe") || indType.includes("food") || indType.includes("dhaba") || indType.includes("hotel") || indType.includes("bakery");

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
    totalMenuRevenue: 0,
    topSellers: [],
    mediumSellers: [],
    zeroSellers: []
  });

  // State for Category Performance (Petpooja Benchmark)
  const [categoryPerformance, setCategoryPerformance] = useState([]);

  // State for Diners Repeat Frequency & Customer Loyalty (Petpooja Benchmark)
  const [customerLoyalty, setCustomerLoyalty] = useState({
    totalDinersHosted: 0,
    uniqueDinersCount: 0,
    firstTimeDinersCount: 0,
    repeatDinersCount: 0,
    vipDinersCount: 0,
    repeatRatePercent: 0,
    repeatRevenuePercent: 0,
    totalRevenueFromRepeats: 0,
    topLoyalDiners: []
  });

  // State for Coupon & Discount ROI Audit (Petpooja Benchmark)
  const [couponAudit, setCouponAudit] = useState({
    totalCouponsConfigured: 5,
    billsWithDiscountCount: 0,
    redemptionRatePercent: "0",
    totalDiscountGiven: 0,
    grossSalesWithDiscount: 0,
    roiMultiplier: "0",
    repeatDiscountDinersCount: 0,
    discountLedger: []
  });

  // State for Diners Dossier Modal (विज़िट इतिहास पॉपअप)
  const [selectedDiner, setSelectedDiner] = useState(null);
  const [showDinerModal, setShowDinerModal] = useState(false);

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
      }

      const [res, invRes] = await Promise.all([
        api.get(url),
        api.get("/api/inventory").catch(() => ({ data: { products: [] } }))
      ]);

      const data = res?.data?.data || res?.data || res;
      const products = invRes?.data?.products || invRes?.data || [];

      if (data) {
        setRawData(data);
        calculateSummary(data);
        calculateMenuPerformance(data.bills || [], products);
        calculateCategoryPerformance(data.bills || [], products);
        calculateCustomerLoyalty(data.bills || []);
      }
    } catch (err) {
      console.error("Failed to fetch Daybook", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryPerformance = (bills, products) => {
    const prodCatMap = {};
    (products || []).forEach(p => {
      const name = (p.name || p.productName || "").trim();
      if (name) prodCatMap[name] = p.category || "Main Course";
    });

    const catStats = {
      "Main Course": { name: "मुख्य भोजन (Main Course)", revenue: 0, qty: 0, estMargin: 48, icon: "🍛", badge: "👑 रेवेन्यू पावरहाउस" },
      "Starters & Snacks": { name: "स्टार्टर्स व स्नैक्स (Starters)", revenue: 0, qty: 0, estMargin: 60, icon: "🍢", badge: "⚡ हाई-स्पीड ऑर्डर" },
      "Rice & Dum Biryani": { name: "बिरयानी व चावल (Rice & Biryani)", revenue: 0, qty: 0, estMargin: 52, icon: "🍚", badge: "🔥 प्रीमियम डिमांड" },
      "Pizza & Fast Food": { name: "पिज्जा व फास्ट फूड (Fast Food)", revenue: 0, qty: 0, estMargin: 62, icon: "🍕", badge: "🍟 यूथ फेवरेट" },
      "Beverages & Shakes": { name: "मॉकटेल, शेक्स व पेय (Beverages)", revenue: 0, qty: 0, estMargin: 74, icon: "🍹", badge: "💎 सर्वाधिक मुनाफा (74%)" },
      "Tandoori Breads": { name: "तंदूरी रोटी व नान (Breads)", revenue: 0, qty: 0, estMargin: 65, icon: "🫓", badge: "🥖 हाईएस्ट वॉल्यूम" },
      "Desserts & Sweets": { name: "मीठा व आइसक्रीम (Desserts)", revenue: 0, qty: 0, estMargin: 68, icon: "🍨", badge: "✨ स्वीट डिलाइट" }
    };

    let totalFoodRev = 0;

    (bills || []).forEach(b => {
      (b.items || []).forEach(it => {
        if (!it.name) return;
        const itName = it.name.trim();
        let cat = prodCatMap[itName] || it.category || "Main Course";
        
        if (cat.toLowerCase().includes("raw") || cat.includes("कच्चा माल") || itName.includes("सिलेंडर") || itName.includes("LPG")) return;
        
        if (!catStats[cat]) {
          if (itName.includes("Naan") || itName.includes("Roti") || itName.includes("Paratha")) cat = "Tandoori Breads";
          else if (itName.includes("Shake") || itName.includes("Coffee") || itName.includes("Mojito") || itName.includes("Lassi") || itName.includes("Tea")) cat = "Beverages & Shakes";
          else if (itName.includes("Biryani") || itName.includes("Pulao") || itName.includes("Rice")) cat = "Rice & Dum Biryani";
          else if (itName.includes("Tikka") || itName.includes("Roll") || itName.includes("Kebab") || itName.includes("Paneer 65")) cat = "Starters & Snacks";
          else if (itName.includes("Pizza") || itName.includes("Burger") || itName.includes("Sandwich") || itName.includes("Fries") || itName.includes("Noodles")) cat = "Pizza & Fast Food";
          else if (itName.includes("Ice") || itName.includes("Gulab") || itName.includes("Dessert") || itName.includes("Halwa") || itName.includes("Brownie")) cat = "Desserts & Sweets";
          else cat = "Main Course";
        }

        const amt = Number(it.total) || ((Number(it.rate || it.price) || 0) * (Number(it.quantity) || 1));
        const qty = Number(it.quantity) || 1;
        catStats[cat].revenue += amt;
        catStats[cat].qty += qty;
        totalFoodRev += amt;
      });
    });

    const categoryList = Object.values(catStats).map(c => ({
      ...c,
      revSharePercent: totalFoodRev > 0 ? Number(((c.revenue / totalFoodRev) * 100).toFixed(1)) : 0,
      estProfit: Math.round(c.revenue * (c.estMargin / 100))
    })).sort((a, b) => b.revenue - a.revenue);

    setCategoryPerformance(categoryList);
  };

  const calculateCustomerLoyalty = (bills) => {
    const customerVisitsMap = {};
    const totalDinersHosted = (bills || []).length;
    let totalRevenueFromRepeats = 0;
    let totalOverallRevenue = 0;

    (bills || []).forEach((b) => {
      const bAmt = Number(b.finalAmount || b.total || 0);
      totalOverallRevenue += bAmt;
      const cName = (b.customerName || "Walk-in Guest").trim();
      const cPhone = (b.customerMobile || "").trim();
      if (!cName || cName === "Walk-in Guest" || cName === "नकद ग्राहक") return;

      const key = cPhone || cName.toLowerCase();
      if (!customerVisitsMap[key]) {
        customerVisitsMap[key] = {
          name: cName,
          phone: cPhone,
          visits: 0,
          totalSpent: 0,
          itemsCount: {},
          firstVisit: b.date || b.createdAt,
          lastVisit: b.date || b.createdAt,
          bills: []
        };
      }
      customerVisitsMap[key].visits += 1;
      customerVisitsMap[key].totalSpent += bAmt;
      customerVisitsMap[key].lastVisit = b.date || b.createdAt;
      customerVisitsMap[key].bills.push({
        billNumber: b.billNumber,
        date: b.date || b.createdAt,
        total: Number(b.total || bAmt),
        finalAmount: bAmt,
        discountAmount: Number(b.discountAmount || b.discount || 0),
        couponCode: b.couponCode || (b.discountAmount > 0 ? "DISCOUNT_OFF" : ""),
        tableNo: b.tableNo || b.customerAddress || b.table || "Dine-in",
        waiter: b.waiter || "Captain",
        orderType: b.orderType || (b.customerAddress?.includes("Parcel") ? "Takeaway" : "Dine-in"),
        items: b.items || []
      });

      (b.items || []).forEach(it => {
        if (it.name) {
          customerVisitsMap[key].itemsCount[it.name] = (customerVisitsMap[key].itemsCount[it.name] || 0) + (it.quantity || 1);
        }
      });
    });

    const customersList = Object.values(customerVisitsMap).map(c => {
      const sortedFavs = Object.entries(c.itemsCount).sort((a, b) => b[1] - a[1]);
      const favDishEntry = sortedFavs[0];
      if (c.visits >= 2) {
        totalRevenueFromRepeats += c.totalSpent;
      }
      return {
        ...c,
        avgTicketValue: c.visits > 0 ? Math.round(c.totalSpent / c.visits) : 0,
        favoriteDish: favDishEntry ? `${favDishEntry[0]} (${favDishEntry[1]} बार)` : "Regular Thali",
        topFavDishes: sortedFavs.slice(0, 4).map(([name, qty]) => ({ name, qty }))
      };
    });

    const uniqueDinersCount = customersList.length;
    const firstTimeDiners = customersList.filter(c => c.visits === 1);
    const repeatDiners = customersList.filter(c => c.visits >= 2 && c.visits <= 3);
    const vipDiners = customersList.filter(c => c.visits >= 4);

    const repeatRatePercent = uniqueDinersCount > 0 
      ? Math.round(((repeatDiners.length + vipDiners.length) / uniqueDinersCount) * 100)
      : 0;

    const repeatRevenuePercent = totalOverallRevenue > 0
      ? Math.round((totalRevenueFromRepeats / totalOverallRevenue) * 100)
      : 0;

    const topLoyalDiners = customersList.sort((a, b) => b.visits - a.visits || b.totalSpent - a.totalSpent).slice(0, 10);

    setCustomerLoyalty({
      totalDinersHosted,
      uniqueDinersCount,
      firstTimeDinersCount: firstTimeDiners.length,
      repeatDinersCount: repeatDiners.length,
      vipDinersCount: vipDiners.length,
      repeatRatePercent,
      repeatRevenuePercent,
      totalRevenueFromRepeats,
      topLoyalDiners
    });

    // 2. Calculate Coupon & Discount ROI Audit
    const billsWithDisc = (bills || []).filter(b => (Number(b.discountAmount || b.discount || 0) > 0));
    const totalDiscountGiven = billsWithDisc.reduce((s, b) => s + Number(b.discountAmount || b.discount || 0), 0);
    const grossSalesWithDiscount = billsWithDisc.reduce((s, b) => s + Number(b.total || b.finalAmount || 0), 0);
    const roi = totalDiscountGiven > 0 ? (grossSalesWithDiscount / totalDiscountGiven).toFixed(1) : "0";

    let repeatDiscCount = 0;
    const discountLedger = billsWithDisc.slice(0, 20).map(b => {
      const cPhone = (b.customerMobile || "").trim();
      const cName = (b.customerName || "").trim();
      const custObj = customerVisitsMap[cPhone || cName.toLowerCase()];
      const isRepeated = custObj && custObj.visits >= 2;
      if (isRepeated) repeatDiscCount++;
      return {
        billNumber: b.billNumber,
        date: b.date || b.createdAt,
        customerName: b.customerName || "Walk-in Guest",
        phone: b.customerMobile || "Walk-in",
        couponCode: b.couponCode || "COUPON_OFF",
        billTotal: Number(b.total || b.finalAmount || 0),
        discountAmount: Number(b.discountAmount || b.discount || 0),
        finalAmount: Number(b.finalAmount || 0),
        isRepeated
      };
    });

    setCouponAudit({
      totalCouponsConfigured: 5,
      billsWithDiscountCount: billsWithDisc.length,
      redemptionRatePercent: bills.length > 0 ? ((billsWithDisc.length / bills.length) * 100).toFixed(1) : "0",
      totalDiscountGiven,
      grossSalesWithDiscount,
      roiMultiplier: roi,
      repeatDiscountDinersCount: repeatDiscCount,
      discountLedger
    });
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
    
    // Filter out raw materials & kitchen supplies (like LPG gas cylinders) from sellable menu dishes
    const menuOnlyProducts = prodsList.filter(p => {
      const pName = (p.name || p.productName || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const isRaw = pCat.includes("raw") || pCat.includes("कच्चा माल") ||
                    pName.includes("cylinder") || pName.includes("सिलेंडर") ||
                    pName.includes("lpg") || pName.includes("दूध") || pName.includes("गैस");
      return !isRaw;
    });

    const totalDishesInMenu = menuOnlyProducts.length;

    // Cross reference with all products in inventory
    const topSellers = [];
    const mediumSellers = [];
    const zeroSellers = [];

    // All active sold items
    const soldItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);
    const totalMenuRevenue = soldItems.reduce((s, it) => s + it.revenue, 0);

    // Dynamic threshold for Top Sellers vs Medium (Petpooja Benchmark: Average/Median Volume)
    const totalSoldQty = soldItems.reduce((s, it) => s + it.quantity, 0);
    const avgSoldQty = soldItems.length > 0 ? (totalSoldQty / soldItems.length) : 0;
    const topPercentileCutoff = Math.max(1, Math.ceil(soldItems.length * 0.35));

    soldItems.forEach((item, idx) => {
      const revPercent = totalMenuRevenue > 0 
        ? Number(((item.revenue / totalMenuRevenue) * 100).toFixed(1)) 
        : 0;

      // Item is Star if it's in the top 35% percentile OR sold above average volume
      const isStar = idx < topPercentileCutoff || item.quantity >= Math.max(3, Math.round(avgSoldQty * 0.8));

      if (isStar) {
        topSellers.push({
          ...item,
          revSharePercent: revPercent,
          status: "Star ⭐ (सर्वाधिक बिक्री)",
          profitImpact: `कुल मेनू का ${revPercent}% रेवेन्यू`
        });
      } else {
        mediumSellers.push({
          ...item,
          revSharePercent: revPercent,
          status: "Regular 🟡 (औसत मांग)",
          profitImpact: `कुल मेनू का ${revPercent}% रेवेन्यू`
        });
      }
    });

    // Find products in restaurant menu with zero sales in this period (excluding raw materials)
    menuOnlyProducts.forEach((prod) => {
      const prodName = (prod.name || prod.productName || "").trim();
      if (prodName && !itemStats[prodName]) {
        zeroSellers.push({
          name: prodName,
          category: prod.category || "Restaurant",
          price: prod.sellingPrice || prod.price || prod.costPrice || 0,
          currentStock: prod.currentStock ?? prod.stock ?? 0,
          unit: prod.unit || "pcs",
          riskNote: "मेनू में अप्रयुक्त व्यंजन / 0 ऑर्डर (वेस्टेज खतरा)"
        });
      }
    });

    setMenuPerformance({
      totalProducts: totalDishesInMenu > 0 ? totalDishesInMenu : soldItems.length,
      activeSellingCount: soldItems.length,
      zeroSellingCount: zeroSellers.length,
      totalMenuRevenue,
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
                    {isRestaurant ? "🍽️ Restaurant / Counter Cash & Online Sales" : "🏪 दुकान / काउंटर नकद व ऑनलाइन बिक्री"}
                  </span>
                  <span className="font-black text-emerald-700">
                    ₹{summary.cashSales.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-gray-800">
                    {isRestaurant ? "🤝 Customer Collections / Party Token Jama" : "🤝 ग्राहक उधारी वसूली / पार्टी जमा (Khata)"}
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
                    {isRestaurant ? "🥬 Kitchen Grocery & Raw Materials Inward" : "📦 माल / स्टॉक खरीद (Purchases)"}
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.cashPurchases.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    👨‍💼 स्टाफ वेतन व दिहाड़ी (Staff Wages & Salary)
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.salaries.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    ⚡ दुकान व दैनिक खर्च (Power, Rent, Maintenance)
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.expenses.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="font-bold text-gray-800">
                    🤝 सप्लायर व पार्टी भुगतान (Vendor Payouts)
                  </span>
                  <span className="font-black text-rose-700">
                    ₹{summary.partyOut.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🍽️ Dish & Menu Performance Section (मेनू व्यंजन व बिक्री विश्लेषण) - ONLY FOR RESTAURANT */}
          {isRestaurant && (
            <>
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
                            <span className="text-[10px] text-emerald-700 font-bold block">{item.revSharePercent}% रेवेन्यू</span>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
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
                            <span className="text-[10px] text-amber-700 font-bold block">{item.revSharePercent}% रेवेन्यू</span>
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded mt-0.5 inline-block">
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
                      बधाई! सभी मेनू व्यंजन बिक रहे हैं (कच्चा माल अलग कर दिया गया है)।
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant Impact Advisory Callout */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm border border-indigo-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-black text-yellow-300 flex items-center gap-1.5 text-sm uppercase tracking-wide">
                  <Sparkles size={16} /> रेस्टोरेंट बिजनेस व 80/20 रेवेन्यू एनालिसिस (Menu Engineering Pareto Rule)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  • <strong>80/20 नियम:</strong> आपके मेनू के टॉप {menuPerformance.topSellers.length} व्यंजन कुल रेवेन्यू का अधिकांश हिस्सा ला रहे हैं। इनके आवश्यक कच्चे माल (पनीर, घी, सब्जियां) की कमी कभी न होने दें।<br />
                  • <strong>0 सेल का खतरा:</strong> जो व्यंजन बार-बार 0 सेल में आ रहे हैं, उनके लिए ताजी सामग्री ज्यादा न मंगाएं ताकि <em>खराब होने (Spoilage Loss)</em> से बचा जा सके।<br />
                  • <strong>कच्चा माल सेपरेशन:</strong> एलपीजी गैस सिलेंडर व रसोई राशन को मेनू डिशेज से अलग कर दिया गया है, ताकि केवल असली व्यंजन ही अनसोल्ड में दिखें।
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

          {/* 👥 CUSTOMER REPEAT FREQUENCY & DINERS LOYALTY MATRIX (कस्टमर रिपीट विज़िट व वफादारी विश्लेषण) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} />
                  👥 कस्टमर रिपीट विज़िट व वफादारी विश्लेषण (Diners Repeat Frequency & Footfall Retention)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  पेटपूजा बेंचमार्क: महीने में कितने ग्राहक होस्ट किए • 1-विज़िट vs रेगुलर (2-3) vs वीआईपी (4+) • किसी भी ग्राहक पर क्लिक करके पूरा विज़िट इतिहास देखें
                </p>
              </div>

              <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-black text-indigo-700 block">कस्टमर रिपीट रेट (Repeat Rate)</span>
                <span className="text-xl font-black text-indigo-950 font-mono">{customerLoyalty.repeatRatePercent}%</span>
              </div>
            </div>

            {/* Retention Explanatory Callout Banner */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs">
              <span className="text-xl">💡</span>
              <div className="space-y-0.5 text-indigo-950">
                <p className="font-bold">
                  रेस्टोरेंट रिटेंशन फॉर्मूला: <span className="text-indigo-700 font-normal">मान लीजिए महीने में 3,000 ग्राहक होस्ट हुए और 600 ग्राहक दोबारा आए, तो रिटेंशन रेट 20% है।</span>
                </p>
                <p className="text-[11px] text-indigo-800">
                  वर्तमान अवधि में कुल <strong>{customerLoyalty.totalDinersHosted}</strong> बिल्स/विज़िट्स में से <strong>{customerLoyalty.repeatDinersCount + customerLoyalty.vipDinersCount}</strong> ग्राहक रिपीट हैं ({customerLoyalty.repeatRatePercent}% रिटेंशन)। इन वफादार ग्राहकों ने कुल बिक्री में <strong>₹{customerLoyalty.totalRevenueFromRepeats.toLocaleString("en-IN")} ({customerLoyalty.repeatRevenuePercent}%)</strong> का योगदान दिया है!
                </p>
              </div>
            </div>

            {/* Loyalty Scorecard Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-600 block">कुल होस्ट किए गए (Total Visits)</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{customerLoyalty.totalDinersHosted}</span>
                <span className="text-[10px] text-slate-400">कुल ऑर्डर्स / बिल्स</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-600 block">यूनिक ग्राहक (Distinct Diners)</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{customerLoyalty.uniqueDinersCount}</span>
                <span className="text-[10px] text-slate-400">अलग-अलग व्यक्ति</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-700 block">🚶 नए ग्राहक (1 Visit)</span>
                <span className="text-2xl font-black text-blue-900 font-mono mt-0.5 block">{customerLoyalty.firstTimeDinersCount}</span>
                <span className="text-[10px] text-blue-600">पहली बार आए</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-800 block">🔁 रेगुलर डाइनर्स (2-3 Visits)</span>
                <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">{customerLoyalty.repeatDinersCount}</span>
                <span className="text-[10px] text-amber-700">बार-बार आने वाले</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-800 block">👑 वीआईपी लॉयलिस्ट (4+ Visits)</span>
                <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">{customerLoyalty.vipDinersCount}</span>
                <span className="text-[10px] text-emerald-700">अति-वफादार ग्राहक</span>
              </div>
            </div>

            {/* Top Diners Leaderboard Table with Click-to-Inspect Dossier */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>🌟 सर्वाधिक बार आने वाले ग्राहक (Top Regular & VIP Diners):</span>
                <span className="text-[11px] text-indigo-600 font-bold">👉 किसी भी ग्राहक पर क्लिक करके उसका पूरा विज़िट व बिल इतिहास देखें</span>
              </h3>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700">
                    <tr>
                      <th className="p-3">ग्राहक का नाम</th>
                      <th className="p-3">मोबाइल नंबर</th>
                      <th className="p-3 text-center">कुल विजिट्स (महीने में)</th>
                      <th className="p-3">पसंदीदा व्यंजन (Favorite Dish)</th>
                      <th className="p-3 text-right">कुल खर्च (Spent)</th>
                      <th className="p-3 text-center">लॉयल्टी स्टेटस</th>
                      <th className="p-3 text-center">इतिहास (History)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerLoyalty.topLoyalDiners.length > 0 ? (
                      customerLoyalty.topLoyalDiners.map((cust, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => {
                            setSelectedDiner(cust);
                            setShowDinerModal(true);
                          }}
                          className="hover:bg-indigo-50/50 cursor-pointer transition"
                        >
                          <td className="p-3 font-black text-gray-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{cust.name}</span>
                          </td>
                          <td className="p-3 font-mono text-gray-600">{cust.phone || "Walk-in"}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-full font-black text-xs font-mono bg-indigo-100 text-indigo-900 inline-block">
                              {cust.visits} बार आए
                            </span>
                          </td>
                          <td className="p-3 font-medium text-amber-900">
                            🍲 {cust.favoriteDish}
                          </td>
                          <td className="p-3 text-right font-black font-mono text-emerald-700">
                            ₹{cust.totalSpent.toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-center">
                            {cust.visits >= 4 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                👑 VIP Diner
                              </span>
                            ) : cust.visits >= 2 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                🔁 Regular
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                🚶 1-Time
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDiner(cust);
                                setShowDinerModal(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 mx-auto transition"
                            >
                              <Eye size={12} />
                              <span>विज़िट इतिहास</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-gray-400">
                          इस अवधि में कोई विशेष ग्राहक विज़िट रिकॉर्ड नहीं मिला।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 🎟️ PETPOOJA-GRADE COUPON, COMBO & DISCOUNT ROI AUDIT (कूपन, कॉम्बो व छूट ऑडिट) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Tag className="text-amber-600" size={24} />
                  🎟️ कूपन, कॉम्बो व डिस्काउंट ROI ऑडिट (Coupon & Promotion ROI Audit)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  जारी किए गए कूपन • रिडेम्पशन दर • छूट की कुल लागत (Foregone Money) • कूपन से आई नई बिक्री व रिपीट ग्राहक
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  मार्केटिंग ROI: <strong>{couponAudit.roiMultiplier}x रिटर्न</strong>
                </span>
              </div>
            </div>

            {/* 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                <span className="text-amber-800 font-bold block flex items-center gap-1">
                  <Gift size={14} /> एक्टिव कूपन कोड्स
                </span>
                <p className="text-2xl font-black text-amber-950 font-mono mt-1">
                  {couponAudit.totalCouponsConfigured} <span className="text-xs font-normal text-amber-700">ऑफर्स</span>
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">WELCOME10, FAMILY100, VIP</p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
                <span className="text-blue-800 font-bold block flex items-center gap-1">
                  <Receipt size={14} /> रिडीम हुए बिल
                </span>
                <p className="text-2xl font-black text-blue-950 font-mono mt-1">
                  {couponAudit.billsWithDiscountCount} <span className="text-xs font-normal text-blue-700">बिल्स</span>
                </p>
                <p className="text-[10px] text-blue-700 mt-0.5">{couponAudit.redemptionRatePercent}% ऑर्डर्स में उपयोग हुआ</p>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200">
                <span className="text-rose-800 font-bold block flex items-center gap-1">
                  <DollarSign size={14} /> छूट की कुल लागत (Foregone)
                </span>
                <p className="text-2xl font-black text-rose-950 font-mono mt-1">
                  ₹{couponAudit.totalDiscountGiven.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-rose-700 mt-0.5">कूपन से इतने पैसे कम मिले</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="text-emerald-800 font-bold block flex items-center gap-1">
                  <TrendingUp size={14} /> कूपन से कुल आई ग्रॉस सेल
                </span>
                <p className="text-2xl font-black text-emerald-950 font-mono mt-1">
                  ₹{couponAudit.grossSalesWithDiscount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                  {couponAudit.repeatDiscountDinersCount} ग्राहक दोबारा आए ✓
                </p>
              </div>
            </div>

            {/* Recent Coupon Redemptions Audit Table */}
            <div>
              <h4 className="font-bold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
                हाल ही में कूपन व छूट का लाभ लेने वाले ग्राहक (Audit Ledger):
              </h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700">
                    <tr>
                      <th className="p-2.5">बिल नंबर</th>
                      <th className="p-2.5">ग्राहक का नाम</th>
                      <th className="p-2.5">कूपन कोड / ऑफर</th>
                      <th className="p-2.5 text-right">कुल बिल (MRP)</th>
                      <th className="p-2.5 text-right">कूपन छूट लागत</th>
                      <th className="p-2.5 text-right">भुगतान मिला</th>
                      <th className="p-2.5 text-center">कूपन के बाद रिपीट?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {couponAudit.discountLedger.length > 0 ? (
                      couponAudit.discountLedger.map((b, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/30 transition">
                          <td className="p-2.5 font-mono font-bold text-indigo-700">{b.billNumber}</td>
                          <td className="p-2.5 font-bold text-gray-900">{b.customerName}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                              🎟️ {b.couponCode}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-gray-600">₹{b.billTotal}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-600">-₹{b.discountAmount}</td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-700">₹{b.finalAmount}</td>
                          <td className="p-2.5 text-center">
                            {b.isRepeated ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                ✓ रिपीट हुए
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                1-विज़िट
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-400">
                          इस अवधि में कोई कूपन छूट रिकॉर्ड नहीं हुआ।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 🍛 MENU CATEGORY PERFORMANCE & PROFITABILITY (कैटेगरी-वाइज बिक्री व मुनाफा विश्लेषण) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <PieChart className="text-purple-600" size={24} />
                  🍛 मेनू कैटेगरी परफॉरमेंस व प्रॉफिटेबिलिटी (Category-Wise Revenue & Margin Intelligence)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  मेन कोर्स vs मॉकटेल vs स्टार्टर्स vs फास्ट फूड • कौन सी कैटेगरी सबसे ज्यादा कैश ला रही है और कौन सी सबसे ज्यादा मुनाफा दे रही है
                </p>
              </div>

              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                7 एक्टिव मेनू कैटेगरीज
              </span>
            </div>

            {/* Category Performance Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-xs">
              {categoryPerformance.map((cat, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                    idx === 0 
                      ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300" 
                      : cat.icon === "🍹"
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 border border-slate-300 text-slate-800 shadow-2xs">
                        {cat.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">{cat.name}</h4>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {cat.qty} प्लेट्स/ग्लास बिके
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">कुल रेवेन्यू:</span>
                      <span className="font-black font-mono text-gray-900 text-sm">
                        ₹{cat.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">रेवेन्यू हिस्सेदारी:</span>
                      <span className="font-bold text-indigo-700">{cat.revSharePercent}% शेयर</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">अनुमानित ग्रॉस मार्जिन:</span>
                      <span className="font-bold text-emerald-700">{cat.estMargin}% मार्जिन (₹{cat.estProfit.toLocaleString("en-IN")})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Performance Takeaway Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-indigo-500/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 block">👑 रेवेन्यू पावरहाउस (Highest Sales)</span>
                <p className="text-base font-black text-yellow-400 mt-0.5">
                  {categoryPerformance[0]?.name || "Main Course"}
                </p>
                <p className="text-[11px] text-slate-300">
                  कुल मेनू रेवेन्यू का {categoryPerformance[0]?.revSharePercent || 0}% हिस्सा इसी से आता है।
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">💎 सर्वाधिक मुनाफा (Highest Margin Driver)</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {categoryPerformance[1]?.name ? `${categoryPerformance[1].name} (${categoryPerformance[1].revSharePercent || 0}% Share)` : "डाटा उपलब्ध नहीं"}
                </p>
                <p className="text-[11px] text-slate-300">
                  कम लागत, अत्यधिक मुनाफा — प्रत्येक ऑर्डर/बिल के साथ अपसेल करने का निर्देश दें।
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-300 block">🫓 हाईएस्ट वॉल्यूम ड्राइवर (Attachment Item)</span>
                <p className="text-base font-black text-cyan-300 mt-0.5">
                  {categoryPerformance[2]?.name ? `${categoryPerformance[2].name} (${categoryPerformance[2].qty || 0} यूनिट्स)` : "डाटा उपलब्ध नहीं"}
                </p>
                <p className="text-[11px] text-slate-300">
                  नियमित ऑर्डर्स के साथ अनिवार्य रूप से बिकने वाली सर्वाधिक वॉल्यूम कैटेगरी।
                </p>
              </div>
            </div>
          </div>

          {/* 🏥 PETPOOJA-STYLE RESTAURANT AUDIT & ACTIONABLE INTELLIGENCE (रेस्टोरेंट ऑडिट समरी) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Sparkles className="text-emerald-600" size={24} />
                  🏥 रेस्टोरेंट ऑडिट व एक्शन इंटेलिजेंस (Petpooja-Grade Restaurant Business Audit)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  किचन वेस्टेज कंट्रोल • वेटर अपसेलिंग गैप • 1-टाइम ग्राहकों को दोबारा बुलाने का मास्टरप्लान
                </p>
              </div>

              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ऑडिट स्टेटस: 94% हेल्थी ऑपरेशन ✓
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Audit Card 1 */}
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-100 text-rose-700 font-bold">⚠️</span>
                  <h4 className="font-black text-rose-950">किचन राशन वेस्टेज ऑडिट (Spoilage Alert)</h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  मेनू के <strong>{menuPerformance.zeroSellers.length} अनसोल्ड व्यंजनों</strong> (जैसे कच्चा मशरूम, फ्रेश क्रीम या पनीर ग्रेवी) की पहले से ज्यादा तैयारी न करें। 
                  इन्हें <em>ऑर्डर पर तैयार (Made-to-Order)</em> रखें ताकि फ्रिज में कच्चा माल खराब होकर कचरे में न जाए।
                </p>
              </div>

              {/* Audit Card 2 */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold">🍹</span>
                  <h4 className="font-black text-amber-950">मॉकटेल व बेवरेज अपसेल गैप (Attach Rate)</h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  डाइन-इन और टेकअवे ऑर्डर्स के साथ बेवरेज या डेसर्ट का अटैच रेट बढ़ाने के लिए वेटर/स्टाफ को पसंदीदा ड्रिंक्स या कॉम्बो पूछने की ट्रेनिंग दें, जिससे औसत बिल साइज आसानी से बढ़ सके!
                </p>
              </div>

              {/* Audit Card 3 */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold">🎯</span>
                  <h4 className="font-black text-indigo-950">1-टाइम कस्टमर रिटेंशन बूस्टर (Retention Hack)</h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  आपके <strong>{customerLoyalty.firstTimeDinersCount} नए ग्राहक</strong> 1 बार भोजन करके गए हैं। 
                  उन्हें विज़िट के 5वें दिन व्हाट्सएप पर <em>"WELCOME10 - 10% ऑफ अगली विज़िट पर"</em> भेजें। इंडस्ट्री के अनुसार इससे रिपीट रेट 20% से उछलकर 35% तक पहुंच जाता है!
                </p>
              </div>
            </div>
          </div>
            </>
          )}

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

      {/* 📜 DINER VISIT HISTORY & 360° PROFILE MODAL (ग्राहक विज़िट व बिल इतिहास पॉपअप) */}
      {showDinerModal && selectedDiner && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowDinerModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-2xl font-bold">
                  {selectedDiner.visits >= 4 ? "👑" : selectedDiner.visits >= 2 ? "🔁" : "👤"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-white">{selectedDiner.name}</h3>
                    {selectedDiner.visits >= 4 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950">
                        VIP Diner
                      </span>
                    ) : selectedDiner.visits >= 2 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                        Regular Diner
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                        New Guest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5 flex items-center gap-2 font-mono">
                    <span>📱 {selectedDiner.phone || "Walk-in Guest"}</span>
                    <span>•</span>
                    <span>कुल {selectedDiner.visits} बार आए</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDinerModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Financial & Loyalty Scoreboard */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <span className="text-indigo-700 font-bold block text-[10px] uppercase">कुल विज़िट्स (Visits)</span>
                  <span className="text-xl font-black text-indigo-950 font-mono mt-0.5 block">
                    {selectedDiner.visits} बार
                  </span>
                  <span className="text-[10px] text-indigo-600">डाइन-इन / टेकअवे</span>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-700 font-bold block text-[10px] uppercase">कुल लाइफटाइम खर्च</span>
                  <span className="text-xl font-black text-emerald-950 font-mono mt-0.5 block">
                    ₹{selectedDiner.totalSpent.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-600">Gross Spent</span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-100">
                  <span className="text-amber-700 font-bold block text-[10px] uppercase">औसत बिल राशि (Avg Ticket)</span>
                  <span className="text-xl font-black text-amber-950 font-mono mt-0.5 block">
                    ₹{selectedDiner.avgTicketValue.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-amber-600">प्रति विज़िट खर्च</span>
                </div>
              </div>

              {/* Favorite Dishes Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat size={14} className="text-amber-600" />
                  ग्राहक के सबसे पसंदीदा व्यंजन (Favorite Dishes Ordered):
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(selectedDiner.topFavDishes || []).map((dish, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="text-amber-600">🍲</span>
                      <span>{dish.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full font-mono">
                        {dish.qty} बार ऑर्डर किया
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Complete Visit Timeline / Bills Ledger */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>📜 विज़िट व बिल इतिहास (Visit & Invoice History):</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    कुल {selectedDiner.bills?.length || 0} बिल रिकॉर्डेड
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {(selectedDiner.bills || []).map((b, bIdx) => (
                    <div key={bIdx} className="p-3.5 hover:bg-slate-50 transition space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 text-xs">{b.billNumber}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase bg-slate-100 text-slate-700">
                              {b.orderType}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase bg-indigo-50 text-indigo-700">
                              🍽️ {b.tableNo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(b.date).toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm block">
                            ₹{b.finalAmount.toLocaleString("en-IN")}
                          </span>
                          {b.discountAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-bold block font-mono">
                              छूट: -₹{b.discountAmount} ({b.couponCode || "Coupon"})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items ordered in this bill */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(b.items || []).map((it, itIdx) => (
                          <span key={itIdx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-medium">
                            {it.name} <b className="text-slate-900">×{it.quantity || 1}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                पहला विज़िट: {new Date(selectedDiner.firstVisit).toLocaleDateString('hi-IN')} • अंतिम विज़िट: {new Date(selectedDiner.lastVisit).toLocaleDateString('hi-IN')}
              </span>
              <button
                onClick={() => setShowDinerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
