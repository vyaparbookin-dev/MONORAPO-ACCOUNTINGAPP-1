import React, { useState } from "react";
import api from "../../services/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/register", form);
      setMsg(res.message || "Account created successfully!");
    } catch (err) {
      setMsg("Registration failed. Try again.");
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
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
        />
        <button className="bg-green-600 text-white w-full py-2 rounded">Register</button>
        {msg && <p className="mt-4 text-center text-sm">{msg}</p>}
      </form>
    </div>
  );
}