import React, { useState } from "react";
import api from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    console.log("[Auth Debug] forgot-password attempt for:", normalizedEmail);

    if (!normalizedEmail) {
      setMessage("Please enter your email first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/api/auth/forgot-password", { email: normalizedEmail });
      setMessage(res?.message || "Reset link sent to your email.");
    } catch (err) {
      setMessage(err?.message || "Error: Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-96">
        <h2 className="text-xl font-semibold mb-4 text-center">Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-4 rounded"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white w-full py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && <p className="mt-4 text-sm text-center">{message}</p>}
      </form>
    </div>
  );
}