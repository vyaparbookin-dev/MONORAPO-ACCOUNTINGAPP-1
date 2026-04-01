import React, { useState } from "react";
import api from "../../services/api";

export default function AddCompanyPage({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    gstType: "regular",
    website: "",
    panNumber: "",
    businessType: ["retail"],
    ownershipType: "Proprietorship",
    industryType: "",
    businessDescription: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    caName: "",
    caPhone: ""
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleBusinessTypeChange = (type) => {
    setForm((prev) => {
      const currentTypes = Array.isArray(prev.businessType) ? prev.businessType : [];
      if (currentTypes.includes(type)) {
        return { ...prev, businessType: currentTypes.filter((t) => t !== type) };
      } else {
        return { ...prev, businessType: [...currentTypes, type] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/company", form);
      alert("Company added successfully!");
      setForm({ 
        name: "", email: "", phone: "", address: "", gstNumber: "", gstType: "regular", 
        website: "", panNumber: "", businessType: ["retail"], ownershipType: "Proprietorship", industryType: "", 
        businessDescription: "", bankName: "", accountName: "", accountNumber: "", 
        ifscCode: "", upiId: "", caName: "", caPhone: "" 
      });
      onAdded && onAdded();
    } catch (err) {
      console.error(err);
      alert("Error adding company!");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Company</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-4 text-gray-700">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Company Name *" value={form.name} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" required />
            <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="email" placeholder="Email Address" type="email" value={form.email} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="website" placeholder="Website URL (Optional)" type="url" value={form.website} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <textarea name="address" placeholder="Full Address" value={form.address} onChange={handleChange} className="border p-2.5 rounded-lg w-full md:col-span-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="2" />
          </div>
        </div>

        {/* Business & Tax */}
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-4 text-gray-700">Business & Tax Details</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type (Select multiple if applicable)</label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "retail", label: "Retail" },
                { id: "wholesale", label: "Wholesale" },
                { id: "manufacturing", label: "Manufacturing" },
                { id: "service", label: "Services" },
                { id: "trading", label: "Trading" }
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" checked={Array.isArray(form.businessType) && form.businessType.includes(type.id)} onChange={() => handleBusinessTypeChange(type.id)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select name="ownershipType" value={form.ownershipType} onChange={handleChange} className="border p-2.5 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Proprietorship">Proprietorship (एकल स्वामित्व)</option>
              <option value="Partnership">Partnership</option>
              <option value="Private Limited">Private Limited (Pvt Ltd)</option>
              <option value="LLC / LLP">LLC / LLP</option>
              <option value="HUF">HUF</option>
              <option value="Other">Other</option>
            </select>
            <input name="industryType" placeholder="Industry (e.g. Hardware)" value={form.industryType} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="businessDescription" placeholder="What does your firm do?" value={form.businessDescription} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="gstNumber" placeholder="GST Number" value={form.gstNumber} onChange={handleChange} className="border p-2.5 rounded-lg w-full uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
            <select name="gstType" value={form.gstType} onChange={handleChange} className="border p-2.5 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="regular">Regular</option>
              <option value="composition">Composition</option>
              <option value="unregistered">Unregistered</option>
            </select>
            <input name="panNumber" placeholder="PAN Number" value={form.panNumber} onChange={handleChange} className="border p-2.5 rounded-lg w-full uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-4 text-gray-700">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="bankName" placeholder="Bank Name" value={form.bankName} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="accountName" placeholder="Account Holder Name" value={form.accountName} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="accountNumber" placeholder="Account Number" value={form.accountNumber} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="ifscCode" placeholder="IFSC Code" value={form.ifscCode} onChange={handleChange} className="border p-2.5 rounded-lg w-full uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="upiId" placeholder="UPI ID (For Bill QR)" value={form.upiId} onChange={handleChange} className="border p-2.5 rounded-lg w-full md:col-span-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* CA Details */}
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-4 text-gray-700">CA / Accountant Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="caName" placeholder="CA Name" value={form.caName} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="caPhone" placeholder="CA Phone" value={form.caPhone} onChange={handleChange} className="border p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold transition shadow-sm w-full md:w-auto"
          >
            Create Company
          </button>
        </div>
      </form>
    </div>
  );
}