import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterScreen() {
  const [step, setStep] = useState(1); // 1: Register, 2: OTP
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    console.log("🔵 1. Register Button Clicked. Sending data to API...");
    try {
      const res = await api.post("/api/auth/register", form);
      const data = res.data || res; // Handle axios wrapping
      console.log("🟢 2. API Response Received:", data);

      if (data?.requiresVerification && (data?.userId || data?.id)) {
        setUserId(data.userId || data.id);
        setStep(2); // Switch directly to OTP Box
        setTimer(60); // Start 60 second countdown
        alert("OTP sent to your email!");
      } else if (data?.success) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setMsg(data?.message || "Registration failed. Try again.");
      }
    } catch (err) {
      const errData = err.response?.data || err;
      console.log("🔴 2. API Catch Error:", errData);
      
      if (errData?.requiresVerification && (errData?.userId || errData?.id)) {
        setUserId(errData.userId || errData.id);
        setStep(2); // Switch directly to OTP Box
        setTimer(60); // Start countdown
        setMsg(errData.message || "Please check your email for OTP.");
      } else {
        setMsg(errData?.message || err.message || "Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/api/auth/verify-otp", { userId, otp });
      const data = res.data || res;
      if (data?.success || (data?.message && data.message.includes("verified successfully"))) {
        alert("Account Verified Successfully! 🎉 Please login.");
        navigate("/login");
      } else {
        setMsg(data?.message || "Invalid OTP.");
      }
    } catch (err) {
      const errData = err.response?.data || err;
      setMsg(errData?.message || err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    setMsg("");
    try {
      // Hum wapas register API call kar rahe hain kyunki backend already handle karta hai "Resend OTP if user exists but unverified"
      const res = await api.post("/api/auth/register", form);
      const data = res.data || res;
      if (data?.requiresVerification) {
        setTimer(60);
        alert("A new OTP has been sent to your email!");
      }
    } catch (err) {
      setMsg("Failed to resend OTP. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Step 1: Register Box */}
        <div className={`bg-white p-6 rounded-xl shadow-md transition-all duration-300 ${step === 2 ? 'opacity-50 pointer-events-none grayscale border-l-4 border-gray-400' : 'border-l-4 border-blue-600 scale-100'}`}>
          <form onSubmit={handleRegister}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Create Account</h2>
            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
            <button disabled={loading || step === 2} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg transition font-bold shadow-sm">
              {loading && step === 1 ? "Sending OTP..." : "Register & Get OTP"}
            </button>
            {step === 1 && msg && <p className={`mt-3 text-center text-sm font-medium ${msg.toLowerCase().includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
            
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-bold">Login here</Link>
            </p>
          </form>
        </div>

        {/* Step 2: OTP Box (Permanent on screen) */}
        <div className={`bg-white p-6 rounded-xl shadow-md transition-all duration-300 ${step === 1 ? 'opacity-40 pointer-events-none grayscale border-l-4 border-gray-300' : 'border-l-4 border-green-500 shadow-xl scale-[1.02]'}`}>
          <form onSubmit={handleVerifyOtp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">2. Verify OTP</h2>
              {step === 2 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded animate-pulse">OTP Sent!</span>}
            </div>
            <p className="text-sm text-gray-600 mb-4 font-medium">Enter the 6-digit code sent to your email.</p>
            <input type="text" maxLength="6" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="border border-gray-300 p-4 w-full mb-4 rounded-lg text-center tracking-[0.7em] text-2xl font-black focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50" required disabled={step === 1} />
            <button disabled={loading || step === 1} className="bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-lg transition font-bold shadow-sm">
              {loading && step === 2 ? "Verifying..." : "Verify & Login"}
            </button>
            
            {step === 2 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={timer > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:underline font-semibold disabled:text-gray-400 disabled:no-underline text-sm transition"
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive OTP? Resend"}
                </button>
              </div>
            )}
            {step === 2 && msg && <p className="mt-3 text-center text-sm font-medium text-red-500">{msg}</p>}
          </form>
        </div>

      </div>
    </div>
  );
}