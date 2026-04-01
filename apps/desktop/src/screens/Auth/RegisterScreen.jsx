import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New states for inline OTP verification
  const [step, setStep] = useState(1); // 1: Register, 2: OTP
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/api/auth/register", form);
      const data = res.data || res; // Handle both nested axios data and direct responses

      if (data?.success && data?.requiresVerification) {
        alert("Registration successful! Please check your email for the OTP.");
        setUserId(data.userId);
        setStep(2); // Move to inline OTP step
      } else if (data?.success) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setMsg(data?.message || "Registration failed. Try again.");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || "Registration failed. Try again.");
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
      
      if (data?.success || data?.message?.includes("verified successfully")) {
        alert("Account Verified Successfully! 🎉 Please login.");
        navigate("/login");
      } else {
        setMsg(data?.message || "Invalid OTP");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-96">
        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <h2 className="text-2xl font-semibold mb-4 text-center">Create Account</h2>
            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="border p-2 w-full mb-3 rounded focus:outline-none focus:border-blue-500" required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} className="border p-2 w-full mb-3 rounded focus:outline-none focus:border-blue-500" required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} className="border p-2 w-full mb-3 rounded focus:outline-none focus:border-blue-500" required />
            <button disabled={loading} className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded disabled:opacity-50 transition font-medium">
              {loading ? "Registering..." : "Register"}
            </button>
            {msg && <p className={`mt-4 text-center text-sm ${msg.toLowerCase().includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <h2 className="text-2xl font-bold mb-2 text-center text-indigo-600">Verify Email</h2>
            <p className="text-sm text-center text-gray-600 mb-4">We sent a 6-digit OTP to your email. Enter it below.</p>
            <input type="text" maxLength="6" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="border border-gray-300 p-3 w-full mb-4 rounded text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded disabled:opacity-50 transition font-bold">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            {msg && <p className="mt-4 text-center text-sm text-red-500">{msg}</p>}
            
            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-gray-600 mb-2">Verified via mobile link?</p>
              <button type="button" onClick={() => navigate("/login")} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded transition font-medium">
                Go to Login Page
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}