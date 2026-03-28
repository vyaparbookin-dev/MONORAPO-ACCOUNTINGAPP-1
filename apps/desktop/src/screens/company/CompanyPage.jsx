import React, { useState, useEffect } from "react";
import { Edit, Save, X, Building2, Mail, Phone, MapPin, FileText, Plus, Trash2, Briefcase, CreditCard, UserCheck, Share2, Globe } from "lucide-react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";
import { useCompany } from "../../contexts/CompanyContext";

const CompanyPage = () => {
  const { companies, selectedCompany, selectCompany, addCompany, updateCompany, deleteCompany, refetchCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const getInitialFormState = (company = null) => ({
    name: company?.name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    gstNumber: company?.gstNumber || "",
    gstType: company?.gstType || "regular",
    website: company?.website || "",
    panNumber: company?.panNumber || "",
    businessType: company?.businessType || "retail",
    industryType: company?.industryType || "",
    businessDescription: company?.businessDescription || "",
    bankName: company?.bankName || "",
    accountName: company?.accountName || "",
    accountNumber: company?.accountNumber || "",
    ifscCode: company?.ifscCode || "",
    upiId: company?.upiId || "",
    caName: company?.caName || "",
    caPhone: company?.caPhone || ""
  });

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    if (selectedCompany) {
      setFormData(getInitialFormState(selectedCompany));
    }
  }, [selectedCompany]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const newId = crypto.randomUUID ? crypto.randomUUID() : `COMP-${Date.now()}`;
        const payload = { ...formData, _id: newId, uuid: newId };
        
        if (dbService.saveCompany) await dbService.saveCompany(payload);
        await auditService.logAction('CREATE', 'company', null, payload);
        await syncQueue.enqueue({ entityId: newId, entity: 'company', method: 'POST', url: '/api/company', data: payload });
        
        addCompany(payload);
        setIsAdding(false);
        alert("Company added offline successfully!");
      } else {
        const payload = { ...formData };
        
        if (dbService.updateCompany) await dbService.updateCompany(selectedCompany._id, payload);
        await auditService.logAction('UPDATE', 'company', selectedCompany, payload);
        await syncQueue.enqueue({ entityId: selectedCompany._id, entity: 'company', method: 'PUT', url: `/api/company/${selectedCompany._id}`, data: payload });

        updateCompany({ ...selectedCompany, ...payload });
        setIsEditing(false);
        alert("Company updated offline successfully!");
      }
    } catch (err) {
      console.error("Failed to save company:", err);
      alert("Failed to save company");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAdding(false);
    setFormData(getInitialFormState(selectedCompany));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage your companies and business types</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      {/* Company List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.length > 0 ? (
          companies.map((company) => (
            <div
              key={company._id}
              onClick={() => selectCompany(company)}
              className={`p-4 border rounded-lg cursor-pointer transition relative group ${
                selectedCompany && selectedCompany._id === company._id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
                    deleteCompany(company._id);
                  }
                }}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full z-10"
                title="Delete Company"
              >
                <Trash2 size={18} />
              </button>
              <h3 className="font-semibold text-lg pr-8">{company.name}</h3>
              <p className="text-sm text-gray-600">{company.businessType}</p>
              <p className="text-sm text-gray-500">{company.address}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Building2 className="mx-auto text-gray-400 mb-2" size={40} />
            <p className="text-gray-500">No companies found. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Selected Company Details */}
      {selectedCompany && !isAdding && companies.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Company Details</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Edit size={20} />
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <form className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="service">Services</option>
                      <option value="jewellery">Jewellery</option>
                      <option value="clothes">Clothes / Garments</option>
                      <option value="hardware">Hardware & Builder</option>
                      <option value="electronic">Electronics</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="hotel">Hotel / Resort</option>
                      <option value="science">Science Equipment</option>
                      <option value="sports">Sports & Fitness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
                    <input type="text" name="industryType" list="industry-options" placeholder="e.g. Hardware, Paints or Custom" value={formData.industryType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    <datalist id="industry-options">
                      <option value="Hardware & Electricals" />
                      <option value="Electronics & Mobiles" />
                      <option value="Jewellery" />
                      <option value="Clothing & Fashion" />
                      <option value="Medical & Pharmacy" />
                      <option value="Bakery" />
                      <option value="Restaurant & Cafe" />
                      <option value="Hotel & Resort" />
                      <option value="Hotel & Restaurant (Combined)" />
                      <option value="FMCG & Grocery" />
                      <option value="Construction & Builder" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What does your firm do? (For Visiting Card)</label>
                    <input type="text" name="businessDescription" placeholder="e.g. Hardware, Sanitaryware, Electronics" value={formData.businessDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                    <select name="gstType" value={formData.gstType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="unregistered">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (For Bill QR Code)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. yourbusiness@upi" />
                  </div>
                </div>
              </div>

              {/* CA Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">CA / Accountant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Name</label>
                    <input type="text" name="caName" value={formData.caName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Phone</label>
                    <input type="text" name="caPhone" value={formData.caPhone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm">
                  <Save size={20} /> Save Details
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">
                  <X size={20} /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic & Business Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="text-blue-600 mt-1" size={24} />
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-bold text-lg text-gray-900">{selectedCompany.name}</p>
                      {selectedCompany.businessDescription && (
                        <p className="text-sm text-blue-600 font-medium">{selectedCompany.businessDescription}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="font-medium text-gray-800 capitalize">{selectedCompany.businessType?.replace('_', ' & ')} {selectedCompany.industryType && `- ${selectedCompany.industryType}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">{selectedCompany.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{selectedCompany.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedCompany.email || "N/A"}</p>
                    </div>
                  </div>
                  {selectedCompany.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">{selectedCompany.website}</a>
                    </div>
                  </div>
                  )}
                </div>

                {/* Tax & Bank Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">GST Number</p>
                      <p className="font-medium text-gray-800 uppercase">
                        {selectedCompany.gstNumber || "N/A"} 
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2 capitalize">{selectedCompany.gstType}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Bank Account Details</p>
                      <p className="font-medium text-gray-800">
                        {selectedCompany.bankName ? `${selectedCompany.bankName} - ${selectedCompany.accountNumber}` : "N/A"}
                      </p>
                      {selectedCompany.ifscCode && <p className="text-xs text-gray-500">IFSC: {selectedCompany.ifscCode.toUpperCase()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">CA Details</p>
                      <p className="font-medium text-gray-800">{selectedCompany.caName || "N/A"}</p>
                      {selectedCompany.caPhone && <p className="text-xs text-gray-500">{selectedCompany.caPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Visiting Card Preview */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Digital Visiting Card Preview</h3>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition">
                    <Share2 size={16} /> Share Card
                  </button>
                </div>
                
                <div className="max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-xl overflow-hidden border border-gray-700 relative">
                  {/* Decorative shapes */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 opacity-20 rounded-tr-full"></div>
                  
                  <div className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-6 border-b border-gray-700 pb-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white mb-1">{selectedCompany.name || "Company Name"}</h2>
                        <p className="text-blue-400 font-medium text-sm tracking-wide uppercase">{selectedCompany.businessDescription || selectedCompany.businessType || "Business Description"}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <span>{selectedCompany.phone || "+91 XXXXXXXXXX"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span>{selectedCompany.email || "email@example.com"}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-gray-400 mt-1" />
                        <span className="leading-tight pr-4">{selectedCompany.address || "Company Address Details"}</span>
                      </div>
                      {selectedCompany.website && (
                        <div className="flex items-center gap-3">
                          <Globe size={16} className="text-gray-400" />
                          <span>{selectedCompany.website}</span>
                        </div>
                      )}
                      {selectedCompany.gstNumber && (
                        <div className="flex items-center gap-3 pt-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-xs uppercase bg-gray-800 px-2 py-1 border border-gray-600 rounded font-medium tracking-wider text-gray-200">GST: {selectedCompany.gstNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Company Form */}
      {isAdding && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
          <form className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="service">Services</option>
                      <option value="jewellery">Jewellery</option>
                      <option value="clothes">Clothes / Garments</option>
                      <option value="hardware">Hardware & Builder</option>
                      <option value="electronic">Electronics</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="hotel">Hotel / Resort</option>
                      <option value="science">Science Equipment</option>
                      <option value="sports">Sports & Fitness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
                    <input type="text" name="industryType" list="industry-options" placeholder="e.g. Hardware, Paints or Custom" value={formData.industryType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    <datalist id="industry-options">
                      <option value="Hardware & Electricals" />
                      <option value="Electronics & Mobiles" />
                      <option value="Jewellery" />
                      <option value="Clothing & Fashion" />
                      <option value="Medical & Pharmacy" />
                      <option value="Bakery" />
                      <option value="Restaurant & Cafe" />
                      <option value="Hotel & Resort" />
                      <option value="Hotel & Restaurant (Combined)" />
                      <option value="FMCG & Grocery" />
                      <option value="Construction & Builder" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What does your firm do? (For Visiting Card)</label>
                    <input type="text" name="businessDescription" placeholder="e.g. Hardware, Sanitaryware, Electronics" value={formData.businessDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                    <select name="gstType" value={formData.gstType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="unregistered">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (For Bill QR Code)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. yourbusiness@upi" />
                  </div>
                </div>
              </div>

              {/* CA Details */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">CA / Accountant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Name</label>
                    <input type="text" name="caName" value={formData.caName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Phone</label>
                    <input type="text" name="caPhone" value={formData.caPhone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm">
                  <Save size={20} /> Create Company
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">
                  <X size={20} /> Cancel
                </button>
              </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;