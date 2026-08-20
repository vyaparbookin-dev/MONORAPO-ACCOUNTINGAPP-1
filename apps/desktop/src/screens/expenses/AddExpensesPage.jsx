import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Receipt, DollarSign, Calendar, Tag, ShieldCheck, Home, Landmark, Briefcase, Percent, HelpCircle } from "lucide-react";
import api from "../../services/api";

export default function AddExpensesPage({ onAdded }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expenseType, setExpenseType] = useState("operating"); // operating, drawings, personal_investment, security_deposit, bank_interest_paid, bank_interest_received

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Rent",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "cash",
    
    // Deposit Specific Fields
    dealershipCompany: "",
    depositType: "dealership_security",
    hasInterest: false,
    interestRate: "",
    interestCycle: "yearly",
    refundDate: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleTypeSelect = (type) => {
    setExpenseType(type);
    if (type === "drawings") {
      setForm(prev => ({ ...prev, category: "Household / घर-खर्च", title: prev.title || "घर-खर्च (आहरण / Household)" }));
    } else if (type === "personal_investment") {
      setForm(prev => ({ ...prev, category: "Personal FD / RD", title: prev.title || "मालिक की निजी बचत (FD/RD)" }));
    } else if (type === "security_deposit") {
      setForm(prev => ({ ...prev, category: "Security Deposit / डीलरशिप", title: prev.title || "कंपनी सिक्योरिटी डिपॉजिट" }));
    } else if (type === "bank_interest_paid") {
      setForm(prev => ({ ...prev, category: "Bank Loan / CC Interest", title: prev.title || "बैंक लोन / CC लिमिट ब्याज" }));
    } else if (type === "bank_interest_received") {
      setForm(prev => ({ ...prev, category: "Bank Interest Income", title: prev.title || "बैंक ब्याज / FD ब्याज मिला" }));
    } else {
      setForm(prev => ({ ...prev, category: "Rent" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      alert("कृपया नाम (Title) और राशि (Amount) भरें।");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        description: form.description,
        paymentMethod: form.paymentMethod,
        expenseType: expenseType,
        depositDetails: expenseType === "security_deposit" ? {
          dealershipCompany: form.dealershipCompany || form.title,
          depositType: form.depositType,
          hasInterest: form.hasInterest,
          interestRate: form.hasInterest ? parseFloat(form.interestRate || 0) : 0,
          interestCycle: form.interestCycle,
          refundDate: form.refundDate || undefined,
          terms: form.description
        } : undefined
      };

      await api.post("/api/expenses", payload);
      alert("✅ एंट्री सफलतापूर्वक सेव हो गई!");
      onAdded && onAdded();
      navigate("/expenses");
    } catch (err) {
      console.error("Expense save error:", err);
      alert("एंट्री सेव करने में समस्या आई। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Receipt size={24} className="text-blue-600" />
              Expense & Fund Outflow / खर्च व फंड एंट्री
            </h1>
            <p className="text-xs text-gray-500">Record shop expenses, owner drawings (घर-खर्च), dealership deposits & savings</p>
          </div>
        </div>
      </div>

      {/* Entry Type Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { id: "operating", label: "🏢 Shop Expense", desc: "दुकान का खर्च (P&L में जुड़ेगा)", color: "blue" },
          { id: "drawings", label: "🏠 Ghar Kharch", desc: "मालिक का घर-खर्च (P&L से अलग)", color: "purple" },
          { id: "personal_investment", label: "💼 Personal FD/RD", desc: "मालिक की बचत/FD", color: "indigo" },
          { id: "security_deposit", label: "🤝 Dealership Deposit", desc: "कंपनी सिक्योरिटी/एडवांस", color: "amber" },
          { id: "bank_interest_paid", label: "🏦 Loan Interest Paid", desc: "बैंक लोन/CC ब्याज", color: "rose" },
          { id: "bank_interest_received", label: "📈 Interest Income", desc: "बैंक ब्याज आमदनी", color: "emerald" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTypeSelect(t.id)}
            className={`p-3 rounded-2xl text-left border-2 transition flex flex-col justify-between ${
              expenseType === t.id
                ? "border-blue-600 bg-blue-50/70 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className={`text-xs font-black ${expenseType === t.id ? "text-blue-900" : "text-gray-800"}`}>
              {t.label}
            </span>
            <span className="text-[11px] text-gray-500 mt-1 leading-tight">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Accounting Clarification Note */}
        {expenseType === "drawings" && (
          <div className="mb-5 p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-900 font-medium">
            <Home size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">🏠 घर-खर्च (Owner Drawings):</span> यह एंट्री डे-बुक में कैश कम करेगी (ताकि शाम को गल्ला सही मिले), लेकिन दुकान के P&L और GST में <b>नहीं जुड़ेगी</b>।
            </div>
          </div>
        )}

        {expenseType === "security_deposit" && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">🤝 डीलरशिप/डिस्ट्रीब्यूटरशिप डिपॉजिट:</span> यह कंपनी (उदा. Asian Paints, Berger, Kamdhenu) को दिया गया रिफंडेबल डिपॉजिट है। यह दुकान की <b>एसेट (Asset)</b> के रूप में दर्ज होगा।
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {expenseType === "security_deposit" ? "Company / Dealership Name (कंपनी/डीलरशिप का नाम) *" : "Title / विवरण *"}
            </label>
            <input
              name="title"
              placeholder={
                expenseType === "security_deposit"
                  ? "उदा. Berger Paints India Ltd - Dealership Security Deposit"
                  : expenseType === "drawings"
                  ? "उदा. घर का राशन, दूध, सब्जी, बच्चों की स्कूल फीस"
                  : expenseType === "personal_investment"
                  ? "उदा. SBI Bank 1-Year FD (मालिक की बचत)"
                  : "उदा. Shop Rent, Electricity Bill, Tea/Snacks, Staff Advance"
              }
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Amount (₹) / राशि *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category / श्रेणी *
              </label>
              {expenseType === "operating" ? (
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                >
                  <option value="Rent">🏢 Shop Rent (किराया)</option>
                  <option value="Electricity">⚡ Electricity Bill (बिजली बिल)</option>
                  <option value="Salary">👥 Staff Salary & Advance (वेतन)</option>
                  <option value="Supplies">📦 Shop Supplies & Packaging</option>
                  <option value="Tea & Snacks">☕ Tea & Refreshments (चाय-नाश्ता)</option>
                  <option value="Transport">🚚 Transport & Freight (भाड़ा)</option>
                  <option value="Maintenance">🔧 Maintenance & Repairs (मरम्मत)</option>
                  <option value="Other">📄 Other Operating Expenses (अन्य)</option>
                </select>
              ) : (
                <input
                  name="category"
                  value={form.category}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Dealership Specific Terms & Interest Section */}
          {expenseType === "security_deposit" && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={16} className="text-amber-700" />
                Dealership Deposit Conditions & Interest / शर्तें व ब्याज
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Type / प्रकार</label>
                  <select
                    name="depositType"
                    value={form.depositType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium"
                  >
                    <option value="dealership_security">🤝 Dealership Security (डीलरशिप डिपॉजिट)</option>
                    <option value="distributor_advance">📦 Distributor Advance (कंपनी एडवांस)</option>
                    <option value="shop_rent_deposit">🏢 Shop Landlord Deposit (दुकान पगड़ी/डिपॉजिट)</option>
                    <option value="electricity_security">⚡ Electricity Board Security Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expected Refund Date / वापसी तारीख</label>
                  <input
                    name="refundDate"
                    type="date"
                    value={form.refundDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="hasInterestCheck"
                  name="hasInterest"
                  checked={form.hasInterest}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="hasInterestCheck" className="text-xs font-bold text-gray-800 cursor-pointer">
                  क्या कंपनी इस डिपॉजिट पर ब्याज (Interest) देती है? (With Interest Deposit)
                </label>
              </div>

              {form.hasInterest && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Interest Rate (% p.a.) / वार्षिक ब्याज दर</label>
                    <input
                      name="interestRate"
                      type="number"
                      placeholder="उदा. 6.5"
                      value={form.interestRate}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Interest Cycle / ब्याज मिलने की अवधि</label>
                    <select
                      name="interestCycle"
                      value={form.interestCycle}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium"
                    >
                      <option value="yearly">📅 Yearly (सालाना)</option>
                      <option value="quarterly">📊 Quarterly (तिमाही)</option>
                      <option value="monthly">🗓️ Monthly (मासिक)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date / तारीख
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Payment Mode / भुगतान माध्यम
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              >
                <option value="cash">💵 Cash (दुकान का गल्ला)</option>
                <option value="upi">📱 UPI / PhonePe / GPay</option>
                <option value="bank">🏦 Bank Transfer / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Notes / Description (शर्तें / अतिरिक्त विवरण)
            </label>
            <textarea
              name="description"
              placeholder="कोई अतिरिक्त जानकारी, चेक नंबर, रसीद नंबर या शर्तें दर्ज करें..."
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{loading ? "Saving..." : "Save Entry (सुरक्षित सेव करें)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}