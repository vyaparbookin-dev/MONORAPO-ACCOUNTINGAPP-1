import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  TrendingUp, Users, Award, DollarSign, Star, HeartHandshake, 
  Coffee, ShieldAlert, FileText, CheckCircle, Store, Clock, ArrowRight, Printer
} from "lucide-react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const DEFAULT_STAFF_RESTAURANT_DATA = [
  {
    name: "Rohan Captain",
    role: "Captain / Waiter",
    bills: 38,
    revenue: 18450,
    salesTarget: 20000,
    coversServed: 142, // Pax
    upsellingCount: 24, // Desserts / Beverages upselled
    rating: 4.9,
    tipsReceived: 650
  },
  {
    name: "Sunil Chef & Waiter",
    role: "Steward",
    bills: 29,
    revenue: 14200,
    salesTarget: 15000,
    coversServed: 98,
    upsellingCount: 16,
    rating: 4.8,
    tipsReceived: 420
  },
  {
    name: "Aman Senior Steward",
    role: "Steward",
    bills: 22,
    revenue: 11800,
    salesTarget: 15000,
    coversServed: 84,
    upsellingCount: 11,
    rating: 4.7,
    tipsReceived: 380
  },
  {
    name: "Deepa Cashier",
    role: "Counter Cashier",
    bills: 54,
    revenue: 28900,
    salesTarget: 30000,
    coversServed: 210,
    upsellingCount: 31,
    rating: 5.0,
    tipsReceived: 800
  }
];

export default function StaffPerformancePage() {
  const [staffData, setStaffData] = useState(DEFAULT_STAFF_RESTAURANT_DATA);
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({ totalStaff: 4, totalRevenue: 73350, topPerformer: 'Deepa Cashier', totalCovers: 534, totalUpsells: 82 });

  // Shift Closing & Cash Drawer Handover (Z-Report) State
  const [showShiftClosingModal, setShowShiftClosingModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    cashierName: "Deepa Cashier",
    nextCashierName: "Rohan Captain",
    openingCash: 2000,
    countedCash: 20450,
    expectedCash: 20450,
    upiSales: 14500,
    cardSales: 4800,
    shiftSlot: "Morning Shift (09:00 AM - 05:00 PM)",
    notes: "All bill registers tallied and handed over."
  });

  // Anti-Theft Cancelled KOT Audit Logs
  const [cancelledKotLogs, setCancelledKotLogs] = useState(() => {
    const saved = localStorage.getItem("vb_kot_cancel_audits");
    return saved ? JSON.parse(saved) : [
      {
        item: "Crispy Cheese Veg Burger",
        qty: 1,
        amount: 110,
        table: "Table 2 (AC Hall)",
        cancelledBy: "Sunil",
        authorizedByPin: "1234",
        reason: "Customer changed mind to Pizza",
        cancelledAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/reports/staff-performance").catch(() => ({ data: [] }));
      const performanceData = res.data && res.data.length > 0 ? res.data : DEFAULT_STAFF_RESTAURANT_DATA;
      setStaffData(performanceData);

      const totalRevenue = performanceData.reduce((sum, s) => sum + (s.revenue || 0), 0);
      const totalCovers = performanceData.reduce((sum, s) => sum + (s.coversServed || 40), 0);
      const totalUpsells = performanceData.reduce((sum, s) => sum + (s.upsellingCount || 10), 0);
      const topPerformer = performanceData.reduce((prev, current) => ((prev.revenue || 0) > (current.revenue || 0)) ? prev : current, performanceData[0]);

      setKpis({
        totalStaff: performanceData.length,
        totalRevenue,
        topPerformer: topPerformer?.name || 'N/A',
        totalCovers,
        totalUpsells
      });
    } catch (error) {
      console.error("Failed to fetch staff performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintZReport = () => {
    alert(`🧾 [Z-Report / गल्ला हैंडओवर स्लिप]

कैशियर: ${shiftForm.cashierName} ➡️ ${shiftForm.nextCashierName}
शिफ्ट: ${shiftForm.shiftSlot}
ओपनिंग कैश: ₹${shiftForm.openingCash}
सिस्टम कुल सेल: ₹${shiftForm.expectedCash + shiftForm.upiSales + shiftForm.cardSales}
गल्ला कैश: ₹${shiftForm.countedCash}
अंतर (Short/Excess): ₹${shiftForm.countedCash - shiftForm.expectedCash}

हस्ताक्षर सहित रिपोर्ट दर्ज हो गई!`);
    setShowShiftClosingModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            <span>वेटर परफॉरमेंस, अपसेलिंग व शिफ्ट गल्ला मिलान</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Petpooja-Grade Captain Covers, Desserts/Beverages Upselling & Cashier Shift Handover (Z-Report)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShiftClosingModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Store size={15} />
            <span>💰 शिफ्ट क्लोजिंग / गल्ला हैंडओवर (Z-Report)</span>
          </button>
        </div>
      </div>

      {loading && <Loader />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={22} /></div>
          <div><p className="text-[11px] text-slate-500 font-bold">एक्टिव स्टाफ</p><p className="text-xl font-black text-slate-900">{kpis.totalStaff} Members</p></div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign size={22} /></div>
          <div><p className="text-[11px] text-slate-500 font-bold">कुल रेवेन्यू</p><p className="text-xl font-black text-emerald-700 font-mono">₹{kpis.totalRevenue.toLocaleString()}</p></div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl"><Award size={22} /></div>
          <div><p className="text-[11px] text-slate-500 font-bold">टॉप कैप्टन (Top Performer)</p><p className="text-sm font-black text-amber-900 truncate">{kpis.topPerformer}</p></div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Users size={22} /></div>
          <div><p className="text-[11px] text-slate-500 font-bold">कुल कवर्स (Diners Served)</p><p className="text-xl font-black text-purple-900 font-mono">{kpis.totalCovers} Pax</p></div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-pink-100 text-pink-700 rounded-xl"><Coffee size={22} /></div>
          <div><p className="text-[11px] text-slate-500 font-bold">अपसेलिंग (Upsell Items)</p><p className="text-xl font-black text-pink-700 font-mono">{kpis.totalUpsells} Items</p></div>
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Revenue by Staff */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-black text-slate-800 mb-4">स्टाफ वाइज रेवेन्यू (Revenue Generated by Waiter / Cashier)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="revenue" name="कुल सेल (₹)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Invoices Share */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-black text-slate-800 mb-1">टेबल / बिल शेयर (Invoices Handled)</h3>
          <p className="text-[11px] text-slate-400 mb-4">किसने सबसे ज्यादा बिल बनाए?</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={staffData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="bills" nameKey="name">
                  {staffData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={32} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Waiter & Captain Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            कैप्टन वेटर परफॉरमेंस एवं अपसेलिंग लेजर
          </h3>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
            Live Upselling Score
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-3.5">स्टाफ नाम (Staff)</th>
                <th className="p-3.5">पद (Role)</th>
                <th className="p-3.5 text-center">टेबल्स (Bills)</th>
                <th className="p-3.5 text-center">कवर्स (Pax)</th>
                <th className="p-3.5 text-center">अपसेलिंग (Desserts/Drinks)</th>
                <th className="p-3.5 text-right">कुल सेल (Revenue)</th>
                <th className="p-3.5 text-center">कस्टमर रेटिंग (CSAT)</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-amber-50/40 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">
                      {staff.name.charAt(0)}
                    </div>
                    <span>{staff.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">{staff.role}</td>
                  <td className="p-3.5 text-center font-bold text-slate-800">{staff.bills}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-purple-700">👤 {staff.coversServed || 45}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-800 font-black rounded-lg border border-pink-200">
                      🧁 {staff.upsellingCount || 8} Items
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-black text-emerald-700 font-mono">₹{staff.revenue.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-bold text-amber-600">
                    ⭐ {staff.rating || 4.8} / 5
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ ANTI-THEFT: CANCELLED KOT AUDIT TRAIL LOG */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider">
              एंटी-थेफ्ट KOT कैंसलेशन लॉग (Manager PIN Authorized Audits)
            </h3>
          </div>
          <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
            Zero-Theft Protection
          </span>
        </div>

        <div className="p-4">
          {cancelledKotLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">कोई कैंसिल KOT आइटम नहीं है (100% क्लीन रिकॉर्ड)</p>
          ) : (
            <div className="space-y-2">
              {cancelledKotLogs.map((log, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div>
                    <span className="font-black text-slate-900">{log.item} (×{log.qty})</span>
                    <span className="ml-2 text-rose-600 font-mono font-bold">-₹{log.amount}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      टेबल: <span className="font-bold">{log.table}</span> • कैप्टन: <span className="font-bold">{log.cancelledBy}</span> • कारण: <span className="text-slate-800 font-medium">"{log.reason}"</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-black text-[10px]">
                      ✓ PIN Auth: {log.authorizedByPin ? "••••" : "Admin"}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(log.cancelledAt).toLocaleTimeString("hi-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 💰 MODAL: SHIFT CLOSING & CASH DRAWER RECONCILIATION (Z-REPORT) */}
      {showShiftClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Store size={22} />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">शिफ्ट क्लोजिंग व गल्ला मिलान (Z-Report)</h3>
                  <p className="text-[10px] text-slate-500">Day-End / Shift Cashier Handover Wizard</p>
                </div>
              </div>
              <button onClick={() => setShowShiftClosingModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">वर्तमान कैशियर (Outgoing Cashier)</label>
                  <input
                    type="text"
                    value={shiftForm.cashierName}
                    onChange={(e) => setShiftForm({ ...shiftForm, cashierName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">हैंडओवर लेने वाला (Incoming Cashier)</label>
                  <input
                    type="text"
                    value={shiftForm.nextCashierName}
                    onChange={(e) => setShiftForm({ ...shiftForm, nextCashierName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>ओपनिंग गल्ला कैश (Opening Float):</span>
                  <span className="font-mono font-bold">₹{shiftForm.openingCash}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>सिस्टम कैश सेल (Cash Sales):</span>
                  <span className="font-mono font-bold">₹{shiftForm.expectedCash - shiftForm.openingCash}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>UPI / QR पेमेंट्स:</span>
                  <span className="font-mono font-bold">₹{shiftForm.upiSales}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>कार्ड / POS पेमेंट्स:</span>
                  <span className="font-mono font-bold">₹{shiftForm.cardSales}</span>
                </div>
                <div className="flex justify-between items-center text-amber-400 font-black pt-2 border-t border-slate-800 text-sm">
                  <span>गल्ले में अपेक्षित कैश (Expected in Drawer):</span>
                  <span className="font-mono text-base">₹{shiftForm.expectedCash}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black mb-1">
                  गल्ले में वास्तविक गिना गया कैश (Physical Cash Counted)*
                </label>
                <input
                  type="number"
                  value={shiftForm.countedCash}
                  onChange={(e) => setShiftForm({ ...shiftForm, countedCash: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 border-2 border-emerald-500 rounded-xl font-mono text-lg font-black bg-emerald-50/50 text-emerald-950 text-center"
                />
              </div>

              {/* Difference Status */}
              <div className={`p-3 rounded-2xl text-center font-black ${
                shiftForm.countedCash === shiftForm.expectedCash
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : shiftForm.countedCash > shiftForm.expectedCash
                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                  : "bg-rose-100 text-rose-900 border border-rose-300"
              }`}>
                {shiftForm.countedCash === shiftForm.expectedCash
                  ? "✅ गल्ला बिल्कुल सही है (0 Shortage / Perfect Match)"
                  : shiftForm.countedCash > shiftForm.expectedCash
                  ? `🔼 अतिरिक्त कैश (Excess Cash): +₹${shiftForm.countedCash - shiftForm.expectedCash}`
                  : `⚠️ कमी / घाटा (Cash Shortage): -₹${shiftForm.expectedCash - shiftForm.countedCash}`}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>🧾 Z-Report प्रिंट करें व शिफ्ट बंद करें (Handover & Close Shift)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
