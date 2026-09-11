import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Sparkles, LogIn } from "lucide-react";
import api from "../../services/api";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      localStorage.removeItem("isGuestMode");
      const response = await api.post("/api/auth/google", { credential: credentialResponse.credential });
      const { token, user } = response.data || response;
      if (token && user) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (user.companyId) {
          localStorage.setItem("companyId", user.companyId);
          localStorage.setItem("selectedCompany", user.companyId);
        }
        navigate("/");
      } else {
        setError("Google लॉगिन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।");
      }
    } catch (err) {
      console.error("Google Login API Error:", err.response?.data || err);
      setError(err.response?.data?.message || err.message || "Google लॉगिन विफल रहा। कृपया नेटवर्क या क्रेडेंशियल जांचें।");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const demoUser = {
      _id: "demo_guest_user_101",
      name: "Guest Explorer (अतिथि)",
      email: "demo@vyaparbook.in",
      role: "admin",
      companyId: "demo_company_101",
      company: "demo_company_101",
      isGuest: true
    };
    localStorage.setItem("authToken", "demo_guest_token_2026_valid");
    localStorage.setItem("token", "demo_guest_token_2026_valid");
    localStorage.setItem("user", JSON.stringify(demoUser));
    localStorage.setItem("companyId", "demo_company_101");
    localStorage.setItem("selectedCompany", "demo_company_101");
    localStorage.setItem("isGuestMode", "true");
    navigate("/dashboard");
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
    if (!cleanInput) {
      setError("कृपया मोबाइल नंबर या ईमेल दर्ज करें।");
      setLoading(false);
      return;
    }

    try {
      localStorage.removeItem("isGuestMode");

      const response = await api.post("/api/auth/login", { 
        identifier: cleanInput,
        email: cleanInput, 
        phone: cleanInput,
        password 
      });
      
      const token = response?.token || response?.data?.token || response?.data?.data?.token;
      const userObj = response?.user || response?.data?.user || response?.data?.data?.user;
      
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

        navigate("/");
      } else {
        setError("लॉगिन टोकन प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।");
      }
    } catch (err) {
      const errData = err.response?.data || err;
      if (errData.requiresVerification && errData.userId) {
        alert("खाता सत्यापित नहीं है। OTP पेज पर रीडायरेक्ट किया जा रहा है...");
        navigate("/verify-otp", { state: { userId: errData.userId } });
        return;
      }
      setError(errData.message || "गलत मोबाइल नंबर, ईमेल या पासवर्ड दर्ज किया गया है।");
      console.error("🔴 Login Error:", err.response?.data || err);
    } finally {
      setLoading(false);
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

          {/* Identifier Field (Email OR 10-Digit Mobile) */}
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
            <p className="text-[11px] text-gray-400 mt-1">उदा. 9826112233 या business@example.com</p>
          </div>

          {/* Password Field */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600" />
                <span>पासवर्ड (Password)</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-600 font-bold hover:underline">
                भूल गए?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="पासवर्ड दर्ज करें"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 shadow-sm animate-shake">
              <span className="text-sm">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Login Submit Button */}
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
                <span>लॉगिन करें (Login to Account)</span>
              </>
            )}
          </button>

          {/* Instant 1-Click Guest Demo Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition transform hover:scale-[1.01] active:scale-98 cursor-pointer"
            >
              <Sparkles size={16} className="text-yellow-200" />
              <span>⚡ 1-Click Guest Mode (बिना पासवर्ड सीधे खोलें)</span>
            </button>
          </div>

          {/* OR Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">या GOOGLE द्वारा</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Login Component */}
          <div className="flex justify-center">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError("Google लॉगिन विफल रहा।")}
              theme="outline"
              shape="pill"
              text="signin_with"
            />
          </div>

          {/* Register Link */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
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
          <p className="text-xs font-bold text-amber-300 mb-1">💡 तुरंत परीक्षण (Auto-Fill Demo):</p>
          <p className="text-[11px] text-blue-100 mb-2">ID: <code>demo@example.com</code> | Pass: <code>password123</code></p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1 bg-white text-blue-900 text-xs font-bold rounded-lg shadow hover:bg-blue-50 transition cursor-pointer"
          >
            📋 Auto-Fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
