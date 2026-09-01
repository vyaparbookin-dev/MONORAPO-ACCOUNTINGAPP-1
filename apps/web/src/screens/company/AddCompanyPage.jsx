import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useCompany } from "../../contexts/CompanyContext";
import { Building2, CheckCircle2, ArrowRight, ShieldCheck, Landmark, Sparkles } from "lucide-react";

export default function AddCompanyPage({ onAdded }) {
  const navigate = useNavigate();
  const { selectCompany, refetchCompanies } = useCompany();
  const [activeStep, setActiveStep] = useState(1); // 1 = Essential Details (30s), 2 = Optional Tax & Bank
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    gstType: "regular",
    website: "",
    panNumber: "",
    businessType: ["retail"],
    ownershipType: "Proprietorship",
    industryType: "multi-industry",
    businessDescription: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    customQrCode: "",
    caName: "",
    caPhone: ""
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleBusinessTypeChange = (type) => {
    setForm((prev) => {
      const currentTypes = Array.isArray(prev.businessType) ? prev.businessType : [];
      if (currentTypes.includes(type)) {
        return { ...prev, businessType: currentTypes.filter((t) => t !== type) };
      } else {
        return { ...prev, businessType: [...currentTypes, type] };
      }
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) return alert("कृपया दुकान या कंपनी का नाम दर्ज करें!");

    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      let userObj = null;
      try { userObj = JSON.parse(userStr); } catch (err) {}

      // Clean, bulletproof payload
      const payload = {
        ...form,
        name: form.name.trim(),
        gstType: (form.gstType || "regular").toLowerCase(),
        user: userObj?._id || userObj?.id || undefined,
        enableGst: Boolean(form.gstNumber?.trim())
      };

      const res = await api.post("/api/company", payload);
      const newCompany = res.company || res.data || res;
      
      alert("🎉 कंपनी सफलतापूर्वक बन गई है!");
      onAdded && onAdded();
      
      if (newCompany?._id) {
        localStorage.setItem("companyId", newCompany._id);
        localStorage.setItem("companyName", newCompany.name);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data?.error || "कंपनी बनाने में त्रुटि हुई!");
    } finally {
      setLoading(false);
    }
  };

  const industriesList = [
    { id: "restaurant", label: "🍽️ Restaurant & Cafe" },
    { id: "banquet", label: "🏰 Banquet & Catering" },
    { id: "gamezone", label: "🎮 Gamezone & FEC Hub" },
    { id: "supermarket", label: "🛒 Supermarket & Grocery" },
    { id: "electronics", label: "📱 Mobile & Electronics" },
    { id: "garments", label: "👗 Garments & Fashion" },
    { id: "hardware", label: "📐 Hardware & Sanitary" },
    { id: "wholesale", label: "📦 Wholesale & Distribution" }
  ];

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 max-w-3xl mx-auto mt-6 border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">नई कंपनी या दुकान जोड़ें</h2>
            <p className="text-xs text-slate-500 font-medium">
              30 सेकंड में आसान ऑनबोर्डिंग • बैंक व CA डिटेल्स बाद में भी भर सकते हैं
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-lg transition ${activeStep === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Step 1: बुनियादी जानकारी
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-lg transition ${activeStep === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Step 2: टैक्स व बैंक (Optional)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: ESSENTIAL DETAILS (30 Seconds Fast Onboarding) */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                दुकान / कंपनी का नाम <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                placeholder="e.g. Shree Ganesh Supermarket / Royal Restro"
                value={form.name}
                onChange={handleChange}
                className="border-2 border-slate-300 focus:border-blue-500 p-3 rounded-xl w-full text-sm font-bold text-slate-800 outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                  मोबाइल नंबर (व्हाट्सएप) <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                  ईमेल एड्रेस
                </label>
                <input
                  name="email"
                  placeholder="e.g. business@gmail.com"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Business Types Selection */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-2">
                बिज़नेस का प्रकार (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {industriesList.map((ind) => {
                  const isSelected = form.businessType.includes(ind.id);
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => handleBusinessTypeChange(ind.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span>{ind.label}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5">
                दुकान / गोदाम का पता
              </label>
              <textarea
                name="address"
                placeholder="e.g. Shop No. 12, Main Market, Raipur (CG)"
                value={form.address}
                onChange={handleChange}
                className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
              >
                टैक्स व बैंक डिटेल्स जोड़ें (Optional) →
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                {loading ? "कंपनी बनाई जा रही है..." : "कंपनी बनाएँ और शुरू करें →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OPTIONAL TAX & BANK DETAILS */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 shrink-0" />
              <span>यह सभी डिटेल्स वैकल्पिक (Optional) हैं। आप इन्हें कभी भी ऐप सेटिंग्स से बदल सकते हैं।</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  name="gstNumber"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gstNumber}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                <input
                  name="panNumber"
                  placeholder="e.g. ABCDE1234F"
                  value={form.panNumber}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बैंक का नाम</label>
                <input
                  name="bankName"
                  placeholder="e.g. HDFC Bank"
                  value={form.bankName}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">खाता नंबर (Account No.)</label>
                <input
                  name="accountNumber"
                  placeholder="e.g. 50200012345678"
                  value={form.accountNumber}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  name="ifscCode"
                  placeholder="e.g. HDFC0001234"
                  value={form.ifscCode}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (QR Payment)</label>
                <input
                  name="upiId"
                  placeholder="e.g. mybusiness@upi"
                  value={form.upiId}
                  onChange={handleChange}
                  className="border border-slate-300 p-2.5 rounded-xl w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                ← Step 1 पर वापस जाएँ
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                {loading ? "कंपनी बनाई जा रही है..." : "सहेजें और डैशबोर्ड खोलें →"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
