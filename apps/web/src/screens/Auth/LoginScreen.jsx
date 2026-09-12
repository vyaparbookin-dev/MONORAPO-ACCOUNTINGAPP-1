import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Sparkles, LogIn, KeyRound, CheckCircle2, Zap } from "lucide-react";
import api from "../../services/api";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [showQuickReset, setShowQuickReset] = useState(false);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = !!googleClientId && googleClientId !== "dummy-client-id-for-dev";

  const handleSuccessfulAuth = (token, userObj) => {
    localStorage.removeItem("isGuestMode");
    localStorage.setItem("authToken", token);
    localStorage.setItem("token", token);
    localStorage.setItem("last_login_timestamp", String(Date.now()));

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

    // Check if mobile device
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      navigate("/m");
    } else {
      navigate("/");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/api/auth/google", { credential: credentialResponse.credential });
      const token = response?.token || response?.data?.token;
      const userObj = response?.user || response?.data?.user;
      if (token) {
        handleSuccessfulAuth(token, userObj);
      } else {
        setError("Google लॉगिन पूरा नहीं हो सका। कृपया '⚡ 1-Click डायरेक्ट लॉगिन' का उपयोग करें।");
      }
    } catch (err) {
      console.error("Google Login API Error:", err);
      setError("Google लॉगिन में समस्या आई। कृपया नीचे '⚡ 1-Click डायरेक्ट लॉगिन' दबाएँ।");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    localStorage.clear();
    sessionStorage.clear();

    const demoUser = {
      _id: "demo_guest_user_101",
      name: "Guest Explorer (अतिथि)",
      email: "guest@vyaparbook.in",
      role: "admin",
      companyId: "demo_company_restaurant",
      company: "demo_company_restaurant",
      isGuest: true
    };
    localStorage.setItem("authToken", "demo_guest_token_2026_valid");
    localStorage.setItem("token", "demo_guest_token_2026_valid");
    localStorage.setItem("user", JSON.stringify(demoUser));
    localStorage.setItem("companyId", "demo_company_restaurant");
    localStorage.setItem("selectedCompany", "demo_company_restaurant");
    localStorage.setItem("isGuestMode", "true");
    localStorage.setItem("isDemoActive", "true");
    
    const target = window.innerWidth < 768 ? "/m" : "/dashboard";
    window.location.href = target;
  };

  const handleFillDemo = () => {
    setIdentifier("demo@example.com");
    setPassword("password123");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanInput = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      setError("कृपया मोबाइल नंबर या ईमेल और पासवर्ड दोनों दर्ज करें।");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/login", { 
        identifier: cleanInput,
        email: cleanInput, 
        phone: cleanInput,
        password: cleanPassword 
      });
      
      const token = response?.token || response?.data?.token || response?.data?.data?.token;
      const userObj = response?.user || response?.data?.user || response?.data?.data?.user;
      
      if (token) {
        handleSuccessfulAuth(token, userObj);
      } else {
        setError("लॉगिन टोकन प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।");
      }
    } catch (err) {
      const errData = err.response?.data || err;
      setError(errData.message || "गलत मोबाइल नंबर, ईमेल या पासवर्ड दर्ज किया गया है।");
      setShowQuickReset(true);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ 1-Click Magic Login (Direct Entry Without Password Lockout)
  const handleMagicLogin = async () => {
    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError("कृपया पहले ऊपर अपना मोबाइल नंबर या ईमेल दर्ज करें।");
      return;
    }

    setMagicLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const res = await api.post("/api/auth/magic-login", {
        identifier: cleanInput,
        email: cleanInput,
        phone: cleanInput,
      });

      const token = res?.token || res?.data?.token;
      const userObj = res?.user || res?.data?.user;

      if (token) {
        setResetSuccess("🎉 डायरेक्ट लॉगिन सफल! अकाउंट खुल रहा है...");
        setTimeout(() => handleSuccessfulAuth(token, userObj), 500);
      } else {
        setError("लॉगिन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।");
      }
    } catch (err) {
      const errData = err.response?.data || err;
      setError(errData.message || "डायरेक्ट लॉगिन में समस्या आई।");
    } finally {
      setMagicLoading(false);
    }
  };

  // Direct Password Reset
  const handleQuickReset = async (e) => {
    e.preventDefault();
    const cleanInput = identifier.trim();
    const cleanPassword = resetPasswordVal.trim();

    if (!cleanInput) {
      setError("कृपया पहले ऊपर मोबाइल नंबर या ईमेल दर्ज करें।");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setError("नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const res = await api.post("/api/auth/quick-reset-password", {
        identifier: cleanInput,
        email: cleanInput,
        phone: cleanInput,
        newPassword: cleanPassword
      });

      const token = res?.token || res?.data?.token;
      const userObj = res?.user || res?.data?.user;

      if (token) {
        setResetSuccess("🎉 नया पासवर्ड सेट हो गया! तुरंत लॉगिन किया जा रहा है...");
        setTimeout(() => handleSuccessfulAuth(token, userObj), 600);
      } else {
        setResetSuccess("पासवर्ड अपडेट हो गया! अब आप लॉगिन कर सकते हैं।");
        setShowQuickReset(false);
        setPassword(cleanPassword);
      }
    } catch (err) {
      const errData = err.response?.data || err;
      setError(errData.message || "पासवर्ड रीसेट करने में समस्या आई।");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-4 font-sans">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin} className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-7 sm:p-8 border border-white/40">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30 mx-auto mb-3">
              ⚡
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Red Accounting</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Smart Cloud Billing & Business POS</p>
          </div>

          {/* Identifier Field */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={14} className="text-blue-600" />
              <span>मोबाइल नंबर या ईमेल (Mobile / Email)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                placeholder="10 अंकों का मोबाइल नंबर या ईमेल"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">उदा. 9826112233 या आपका ईमेल</p>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600" />
                <span>पासवर्ड (Password)</span>
              </label>
              <button 
                type="button" 
                onClick={() => setShowQuickReset(!showQuickReset)} 
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                {showQuickReset ? "पासवर्ड लॉगिन पर वापस" : "पासवर्ड भूल गए?"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="पासवर्ड दर्ज करें"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!showQuickReset}
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 shadow-sm">
              <span className="text-sm">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccess && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Instant Password Reset Box */}
          {showQuickReset ? (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-2">
                <KeyRound size={16} className="text-blue-600" />
                <span>1-Click में नया पासवर्ड सेट करें:</span>
              </div>
              <input
                type="text"
                placeholder="अपना नया पासवर्ड यहाँ लिखें"
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleQuickReset}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? "अपडेट हो रहा है..." : "⚡ नया पासवर्ड सेट करें और तुरंत लॉगिन हों"}
              </button>
            </div>
          ) : (
            /* Standard Login Button */
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin text-lg">⏳</span> लॉगिन हो रहा है...
                </span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>पासवर्ड से लॉगिन करें</span>
                </>
              )}
            </button>
          )}

          {/* ⚡ 1-Click Direct Magic Login Button (No Password Barrier) */}
          <div className="mt-3">
            <button
              type="button"
              disabled={magicLoading}
              onClick={handleMagicLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition transform hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Zap size={16} className="text-yellow-300 fill-yellow-300" />
              <span>{magicLoading ? "खाता खोला जा रहा है..." : "⚡ 1-Click डायरेक्ट लॉगिन (बिना पासवर्ड के)"}</span>
            </button>
          </div>

          {/* Instant Guest Demo Button */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} className="text-yellow-200" />
              <span>अतिथि मोड (Guest Demo Mode)</span>
            </button>
          </div>

          {/* Google Login Component (Render only if configured, otherwise show direct entry) */}
          {isGoogleConfigured && (
            <>
              <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">GOOGLE द्वारा</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="flex justify-center flex-col items-center gap-1.5">
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess} 
                  onError={() => setError("Google लॉगिन विफल रहा।")}
                  theme="outline"
                  shape="pill"
                  text="signin_with"
                />
              </div>
            </>
          )}

          {/* Register Link */}
          <div className="mt-5 pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600 font-medium">
              नया खाता बनाना चाहते हैं?{" "}
              <Link to="/register" className="text-blue-600 font-bold hover:underline ml-1">
                यहाँ रजिस्टर करें (Register)
              </Link>
            </p>
          </div>
        </form>

        {/* Quick Demo Access Box */}
        <div className="mt-4 text-center bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
          <p className="text-xs font-bold text-amber-300 mb-1">💡 डेमो खाता (Demo Credentials):</p>
          <p className="text-[11px] text-blue-100 mb-2">ID: <code>demo@example.com</code> | Pass: <code>password123</code></p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1 bg-white text-blue-900 text-xs font-bold rounded-lg shadow hover:bg-blue-50 transition cursor-pointer"
          >
            📋 Auto-Fill Demo
          </button>
        </div>
      </div>
    </div>
  );
}
