import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, Sparkles, Eye, EyeOff } from "lucide-react";
import api from "../../services/api";

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInstantReset = async (e) => {
    e.preventDefault();
    const cleanInput = identifier.trim();
    const cleanPassword = newPassword.trim();

    if (!cleanInput) {
      setError("कृपया अपना मोबाइल नंबर या ईमेल दर्ज करें।");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setError("नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      localStorage.removeItem("isGuestMode");
      const res = await api.post("/api/auth/quick-reset-password", { 
        identifier: cleanInput,
        email: cleanInput,
        phone: cleanInput,
        newPassword: cleanPassword 
      });

      const token = res?.token || res?.data?.token || res?.data?.data?.token;
      const userObj = res?.user || res?.data?.user || res?.data?.data?.user;

      if (token) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("token", token);
        if (userObj) {
          const normalizedUser = {
            ...userObj,
            _id: userObj._id || userObj.id,
            companyId: userObj.companyId || userObj.company || userObj.company_id,
            company: userObj.companyId || userObj.company || userObj.company_id,
          };
          localStorage.setItem("user", JSON.stringify(normalizedUser));
          const companyId = normalizedUser.companyId || normalizedUser.company;
          if (companyId) {
            localStorage.setItem("companyId", companyId);
            localStorage.setItem("selectedCompany", companyId);
          }
        }
        setMessage("🎉 पासवर्ड सफलतापूर्वक बदल गया! सीधे डैशबोर्ड पर ले जाया जा रहा है...");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setMessage(res?.message || "पासवर्ड अपडेट हो गया है! अब लॉगिन करें।");
        setTimeout(() => navigate("/login"), 1200);
      }
    } catch (err) {
      const errData = err.response?.data || err;
      setError(errData.message || err.message || "पासवर्ड बदलने में समस्या आई।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-7 sm:p-8 border border-white/40">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-500/30 mx-auto mb-3">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">पासवर्ड रीसेट</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">1-Click में तुरंत नया पासवर्ड बनाएं और लॉगिन करें</p>
          </div>

          <form onSubmit={handleInstantReset} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" />
                <span>पंजीकृत मोबाइल नंबर या ईमेल</span>
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="10 अंकों का मोबाइल नंबर या ईमेल दर्ज करें"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">उदा. 9826112233 या आपका ईमेल</p>
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600" />
                <span>नया पासवर्ड (New Password)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="कम से कम 4 अक्षरों का नया पासवर्ड"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11 transition"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {message && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin text-lg">⏳</span> पासवर्ड अपडेट हो रहा है...
                </span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>पासवर्ड सेट करें और तुरंत लॉगिन करें</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              <ArrowLeft size={14} />
              <span>वापस लॉगिन स्क्रीन पर जाएँ (Back to Login)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
