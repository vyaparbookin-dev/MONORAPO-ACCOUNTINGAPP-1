import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, DollarSign, Calendar, Tag, PieChart, Users, Home, Building2, CheckCircle2 } from "lucide-react";
import api from "../../services/api";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState(() => {
    try {
      const stored = localStorage.getItem("vb_local_expenses");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [activeTypeTab, setActiveTypeTab] = useState("all"); // 'all', 'operating' (Business), 'drawings' (Ghar Kharch)
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "other",
    expenseType: "operating", // 'operating' or 'drawings'
    transactionFlow: "given", // 'given' or 'received'
    notes: "",
    familyMember: "Self",
    description: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter, memberFilter, activeTypeTab]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let localList = [];
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        if (stored) localList = JSON.parse(stored);
      } catch (e) {}

      const response = await api.get("/expenses?limit=300").catch(() => null);
      const serverList = response?.recentExpenses || response?.expenses || response?.data?.recentExpenses || response?.data?.expenses || (Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []));

      const combinedMap = new Map();
      [...localList, ...(Array.isArray(serverList) ? serverList : [])].forEach(item => {
        if (!item) return;
        const key = item._id || item.id || `${item.title}_${item.amount}_${item.date}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });
      const combined = Array.from(combinedMap.values());
      setExpenses(combined);
      try {
        localStorage.setItem("vb_local_expenses", JSON.stringify(combined));
      } catch (e) {}
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = Array.isArray(expenses) ? [...expenses] : [];
    
    // Filter by Tab (All, Business, Ghar Kharch)
    if (activeTypeTab !== "all") {
      filtered = filtered.filter(exp => exp.expenseType === activeTypeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter((exp) =>
        exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.familyMember?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((exp) => exp.category === categoryFilter);
    }

    if (memberFilter !== "all") {
      filtered = filtered.filter((exp) => (exp.familyMember || 'Unassigned').toLowerCase() === memberFilter.toLowerCase());
    }

    setFilteredExpenses(filtered);
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category || "other",
      expenseType: expense.expenseType || "operating",
      transactionFlow: expense.transactionFlow || "given",
      notes: expense.notes || expense.description || "",
      familyMember: expense.familyMember || "Self",
      description: expense.description || "",
      paymentMethod: expense.paymentMethod || "cash",
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      amount: "",
      category: "other",
      expenseType: activeTypeTab === "drawings" ? "drawings" : "operating",
      transactionFlow: "given",
      notes: "",
      familyMember: "Self",
      description: "",
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("कृपया सही खर्च राशि दर्ज करें!");
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        alert("खर्च सफलतापूर्वक अपडेट हो गया!");
      } else {
        await api.post("/expenses", payload);
        alert(payload.expenseType === 'drawings' ? `🏡 ${payload.familyMember} का घर खर्च ₹${payload.amount} दर्ज हो गया!` : `🏢 दुकान खर्च ₹${payload.amount} दर्ज हो गया!`);
      }
      fetchExpenses();
      resetForm();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("खर्च सेव करने में त्रुटि आई।");
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm("क्या आप इस खर्च को हमेशा के लिए हटाना चाहते हैं?")) {
      try {
        try {
          const stored = localStorage.getItem("vb_local_expenses");
          if (stored) {
            const list = JSON.parse(stored);
            const updated = list.filter(k => (k._id || k.id) !== id && k.id !== id && k._id !== id);
            localStorage.setItem("vb_local_expenses", JSON.stringify(updated));
          }
        } catch (e) {}

        setExpenses(prev => prev.filter(k => (k._id || k.id) !== id && k.id !== id && k._id !== id));
        await api.delete(`/expenses/${id}`).catch(err => console.warn("Backend delete err:", err));
        fetchExpenses();
      } catch (err) {
        console.error("Error deleting expense:", err);
      }
    }
  };

  const businessCategories = ["rent", "utilities", "supplies", "salary", "travel", "marketing", "दुकान किराया", "बिजली बिल", "चाय/नाश्ता", "स्टाफ सैलरी", "other"];
  const gharKharchCategories = ["राशन/किराना", "स्कूल/कॉलेज फीस", "दवाई/अस्पताल", "बिजली/पानी/गैस", "कपड़े/शॉपिंग", "निजी जेब खर्च", "पेट्रोल/वाहन", "अन्य घरेलू खर्च"];

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  
  const totalBusinessExpenses = safeExpenses.filter(e => e.expenseType === 'operating').reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  
  let totalGharKharchGiven = 0;
  let totalGharKharchReceived = 0;
  const familyMembersMap = {};

  safeExpenses.filter(e => e.expenseType === 'drawings' || (e.familyMember && e.familyMember.trim() !== '')).forEach(e => {
    const mem = e.familyMember?.trim() || "Family";
    const amt = Number(e.amount) || 0;
    const flow = e.transactionFlow === 'received' ? 'received' : 'given';

    if (!familyMembersMap[mem]) {
      familyMembersMap[mem] = { totalGiven: 0, totalReceived: 0, netBalance: 0 };
    }

    if (flow === 'received') {
      totalGharKharchReceived += amt;
      familyMembersMap[mem].totalReceived += amt;
    } else {
      totalGharKharchGiven += amt;
      familyMembersMap[mem].totalGiven += amt;
    }
    familyMembersMap[mem].netBalance = familyMembersMap[mem].totalGiven - familyMembersMap[mem].totalReceived;
  });

  const uniqueFamilyMembers = Object.keys(familyMembersMap);
  const totalGharKharch = totalGharKharchGiven;
  const netFamilyBalance = totalGharKharchGiven - totalGharKharchReceived;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            💰 खर्च प्रबंधन (Expenses & Ghar Kharch)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            दुकान का बिजनेस खर्च और घर खर्च (Papa, Mummy, Family-wise) आसानी से मैनेज करें
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFormData({ ...formData, expenseType: "drawings" });
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus size={16} /> 🏡 + घर खर्च दर्ज करें
          </button>
          <button
            onClick={() => {
              setFormData({ ...formData, expenseType: "operating" });
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus size={16} /> 🏢 + दुकान खर्च दर्ज करें
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 text-xs font-extrabold max-w-xl">
        <button
          onClick={() => { setActiveTypeTab("all"); setMemberFilter("all"); }}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTypeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          <span>📊 सभी खर्च (All)</span>
        </button>
        <button
          onClick={() => { setActiveTypeTab("operating"); setMemberFilter("all"); }}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTypeTab === "operating" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
        >
          <Building2 size={14} /> 🏢 दुकान खर्च (₹{totalBusinessExpenses.toLocaleString('en-IN')})
        </button>
        <button
          onClick={() => { setActiveTypeTab("drawings"); setMemberFilter("all"); }}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTypeTab === "drawings" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}
        >
          <Home size={14} /> 🏡 घर खर्च (₹{totalGharKharch.toLocaleString('en-IN')})
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">कुल सिलेक्टेड खर्च</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">₹{totalExpenses.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-slate-400">{filteredExpenses.length} खर्च एंट्रीज</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <span className="text-xs font-bold text-indigo-700 block">🏢 कुल दुकान खर्च (Business)</span>
          <span className="text-2xl font-black text-indigo-950 mt-1 block">₹{totalBusinessExpenses.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-indigo-500">किराया, सैलरी, बिजली व मेंटेनेंस</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <span className="text-xs font-bold text-amber-800 block">🏡 कुल घर खर्च (Family Drawings)</span>
          <span className="text-2xl font-black text-amber-950 mt-1 block">₹{totalGharKharch.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-amber-600">{uniqueFamilyMembers.length} फैमिली मेंबर्स के खाते</span>
        </div>
      </div>

      {/* Family Member Breakdown Bar (Shown when viewing Ghar Kharch or All) */}
      {(activeTypeTab === "drawings" || activeTypeTab === "all") && uniqueFamilyMembers.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
              <Users size={16} className="text-amber-600" /> 👥 फैमिली मेंबर-वाइज घर खर्च (Family Ledger Breakdown)
            </h3>
            <span className="text-[11px] text-slate-400">सदस्य पर क्लिक करके फिल्टर करें</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {uniqueFamilyMembers.map(mem => (
              <button
                key={mem}
                onClick={() => setMemberFilter(memberFilter === mem ? "all" : mem)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${memberFilter.toLowerCase() === mem.toLowerCase() ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'}`}
              >
                <span className="text-xs font-bold block truncate">👤 {mem}</span>
                <span className="text-sm font-black mt-0.5 block">₹{familyMembersMap[mem].toLocaleString('en-IN')}</span>
                <span className="text-[10px] opacity-75 block">
                  {totalGharKharch > 0 ? +((familyMembersMap[mem] / totalGharKharch) * 100).toFixed(0) : 0}% खर्च
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="खर्च का नाम, विवरण या फैमिली मेंबर खोजें..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {memberFilter !== "all" && (
            <button
              onClick={() => setMemberFilter("all")}
              className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              सदस्य: {memberFilter} ✕
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                {editingId ? "खर्च एडिट करें" : "नया खर्च दर्ज करें (+ Record Expense)"}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, expenseType: "operating" })}
                className={`py-2.5 rounded-xl border transition cursor-pointer ${formData.expenseType === "operating" ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700"}`}
              >
                🏢 दुकान खर्च (Business Expense)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, expenseType: "drawings" })}
                className={`py-2.5 rounded-xl border transition cursor-pointer ${formData.expenseType === "drawings" ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700"}`}
              >
                🏡 घर खर्च (Family & Personal)
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              {/* If Ghar Kharch: Select Family Member */}
              {formData.expenseType === "drawings" && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-2">
                  <label className="font-extrabold text-amber-900 block">
                    👤 फैमिली मेंबर चुनें (किसका / किसके लिए खर्च):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 font-bold">
                    {["Self", "Papa", "Mummy", "Bhai", "Wife", "Children"].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, familyMember: m })}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${formData.familyMember === m ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-amber-200 text-amber-900'}`}
                      >
                        {m === "Self" ? "👨‍💼 Self (खुद)" : m === "Papa" ? "👴 Papa (पिताजी)" : m === "Mummy" ? "👵 Mummy (माताजी)" : m === "Bhai" ? "👦 Bhai (भाई)" : m === "Wife" ? "👩 Wife (पत्नी)" : "👶 बच्चे (Kids)"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">खर्च राशि (₹) *</label>
                  <input
                    type="number"
                    placeholder="₹ 500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">श्रेणी (Category)</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {(formData.expenseType === "drawings" ? gharKharchCategories : businessCategories).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">खर्च का नाम / विवरण (Title)</label>
                <input
                  type="text"
                  placeholder={formData.expenseType === "drawings" ? "उदा. महीने का राशन, पापा की दवाई..." : "उदा. दुकान का बिजली बिल..."}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">तारीख (Date)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">भुगतान माध्यम</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="cash">💵 नकद (Cash)</option>
                    <option value="upi">📲 UPI / QR</option>
                    <option value="bank">🏦 बैंक ट्रांसफर / चेक</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow cursor-pointer"
                >
                  {editingId ? "अपडेट करें" : "💾 खर्च सेव करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase">
            <tr>
              <th className="p-3.5">तारीख</th>
              <th className="p-3.5">खर्च का विवरण (Title)</th>
              <th className="p-3.5">प्रकार</th>
              <th className="p-3.5">फैमिली मेंबर</th>
              <th className="p-3.5">श्रेणी</th>
              <th className="p-3.5">माध्यम</th>
              <th className="p-3.5 text-right">राशि (₹)</th>
              <th className="p-3.5 text-center">एक्शन</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-400">लोड हो रहा है...</td></tr>
            ) : filteredExpenses.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-400">कोई खर्च नहीं मिला</td></tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 text-slate-500 font-medium">
                    {exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "-"}
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900">{exp.title}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${exp.expenseType === 'drawings' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {exp.expenseType === 'drawings' ? '🏡 घर खर्च' : '🏢 दुकान खर्च'}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">
                    {exp.familyMember ? `👤 ${exp.familyMember}` : "-"}
                  </td>
                  <td className="p-3.5 text-slate-600">{exp.category || "General"}</td>
                  <td className="p-3.5 uppercase text-slate-500 text-[10px] font-bold">{exp.paymentMethod || "cash"}</td>
                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                    ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      <button onClick={() => handleEdit(exp)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(exp._id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesPage;
