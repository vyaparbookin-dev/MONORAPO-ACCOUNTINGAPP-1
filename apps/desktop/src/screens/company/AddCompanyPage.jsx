import React, { useState } from "react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

export default function AddCompanyPage({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    gst: "",
    address: "",
    phone: "",
    email: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `COMP-${Date.now()}`;
      const payload = { ...form, _id: newId, uuid: newId };

      // 1. Save Locally
      if (dbService.saveCompany) await dbService.saveCompany(payload);
      
      // 2. Audit Log
      await auditService.logAction('CREATE', 'company', null, payload);

      // 3. Queue Sync
      await syncQueue.enqueue({ entityId: newId, entity: 'company', method: 'POST', url: '/api/company', data: payload });

      alert("Company added offline successfully!");
      setForm({ name: "", gst: "", address: "", phone: "", email: "" });
      onAdded && onAdded();
    } catch (err) {
      console.error(err);
      alert("Error adding company!");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          placeholder="Company Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          name="gst"
          placeholder="GST No."
          value={form.gst}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Company
        </button>
      </form>
    </div>
  );
}