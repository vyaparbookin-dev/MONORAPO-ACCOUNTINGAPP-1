import React, { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const GenerateCoupanPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: "", discount: "", validTill: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/coupon", form);
      alert("Coupon Generated Successfully!");
      navigate("/coupons/list");
    } catch (err) {
      console.error(err);
      alert("Failed to generate coupon");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow mt-10">
      <h2 className="text-2xl font-bold mb-6">Generate New Coupon</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
          <input className="w-full border p-2 rounded mt-1 uppercase" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="e.g. SALE50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
          <input type="number" className="w-full border p-2 rounded mt-1" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} required placeholder="e.g. 10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valid Till</label>
          <input type="date" className="w-full border p-2 rounded mt-1" value={form.validTill} onChange={e => setForm({...form, validTill: e.target.value})} required />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-medium">
          Generate Coupon
        </button>
      </form>
    </div>
  );
};

export default GenerateCoupanPage;