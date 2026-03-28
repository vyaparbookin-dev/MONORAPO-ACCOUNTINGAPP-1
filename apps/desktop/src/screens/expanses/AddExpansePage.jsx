import React, { useState } from "react";
import { syncQueue } from "@repo/shared";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";

export default function AddExpansesPage({ onAdded }) {
  const [form, setForm] = useState({ title: "", amount: "", type: "", date: new Date().toISOString().split("T")[0] });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseAmount = parseFloat(form.amount) || 0;
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        alert("Please enter a valid amount!");
        return;
      }

      const payload = { 
        ...form, 
        amount: expenseAmount,
        price: expenseAmount, // Safety fallback for SQLite
        category: form.type?.toLowerCase() || 'other'
      };
      const newId = crypto.randomUUID ? crypto.randomUUID() : `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const finalPayload = { ...payload, _id: newId, uuid: newId, createdAt: new Date().toISOString() };

      await dbService.saveExpense(finalPayload);
      await auditService.logAction('CREATE', 'expense', null, finalPayload);

      const cloudPayload = { ...payload, uuid: newId, createdAt: finalPayload.createdAt };
      await syncQueue.enqueue({ entityId: newId, entity: 'expense', method: "POST", url: "/api/expance", data: cloudPayload });

      alert("Expanse added offline successfully!");
      setForm({ title: "", amount: "", type: "", date: new Date().toISOString().split("T")[0] });
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
          step="any"
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