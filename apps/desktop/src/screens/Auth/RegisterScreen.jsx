import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/api/auth/register", form);
      if (res?.success && res?.requiresVerification) {
        alert("Registration successful! Please check your email for the OTP.");
        navigate("/verify-otp", { state: { userId: res.userId } });
      } else if (res?.success) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setMsg(res?.message || "Registration failed. Try again.");
      }
    } catch (err) {
      setMsg(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow w-96">
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Account</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
          required
        />
        <button disabled={loading} className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded disabled:opacity-50 transition">
          {loading ? "Registering..." : "Register"}
        </button>
        {msg && <p className={`mt-4 text-center text-sm ${msg.toLowerCase().includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </form>
    </div>
  );
}