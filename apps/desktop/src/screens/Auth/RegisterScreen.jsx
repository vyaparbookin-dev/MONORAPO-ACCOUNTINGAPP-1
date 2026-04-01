import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    console.log("🔵 1. Register Button Clicked. Sending data to API...");
    try {
      const res = await api.post("/api/auth/register", form);
      const data = res.data || res;
      console.log("🟢 2. API Response Received:", data);

      if (data?.requiresVerification && (data?.userId || data?.id)) {
        alert("Registration successful! Please check your email for the OTP.");
        navigate("/verify-otp", { 
          state: { userId: data.userId || data.id } 
        });
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
        alert(errData.message || "Please check your email for OTP.");
        navigate("/verify-otp", { 
          state: { userId: errData.userId || errData.id } 
        });
      } else {
        setMsg(errData?.message || err.message || "Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-96">
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
      </div>
    </div>
  );
}