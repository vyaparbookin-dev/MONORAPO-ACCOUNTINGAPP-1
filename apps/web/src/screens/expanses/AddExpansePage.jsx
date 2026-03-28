import React, { useState } from "react";
import axios from "axios";

export default function AddExpansesPage({ onAdded }) {
  const [form, setForm] = useState({ title: "", amount: 0, type: "", date: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/expanses", form);
      alert("Expanse added!");
      setForm({ title: "", amount: 0, type: "", date: "" });
      onAdded && onAdded();
    } catch (err) {
      console.error(err);
      alert("Error adding expanse");
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Add Expanses</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">Select Type</option>
          <option value="Rent">Rent</option>
          <option value="Electricity">Electricity</option>
          <option value="Staff">Staff</option>
          <option value="Other">Other</option>
        </select>
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add
        </button>
      </form>
    </div>
  );
}