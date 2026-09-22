import React, { useState, useEffect } from "react";
import { Edit, Save, X, Building2, Mail, Phone, MapPin, FileText, Plus, Trash2, Briefcase, CreditCard, UserCheck, Share2, QrCode, Star, Gift, Percent, Video, MessageCircle, ExternalLink, Smartphone } from "lucide-react";
import api from "../../services/api";
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
    panNumber: company?.panNumber || "",
    businessType: Array.isArray(company?.businessType) 
      ? company.businessType 
      : company?.businessType 
        ? [company.businessType] 
        : ["retail"],
    industryType: company?.industryType || "",
    modulesEnabled: Array.isArray(company?.modulesEnabled) ? company.modulesEnabled : [],
    businessDescription: company?.businessDescription || "",
    bankName: company?.bankName || "",
    accountName: company?.accountName || "",
    accountNumber: company?.accountNumber || "",
    ifscCode: company?.ifscCode || "",
    upiId: company?.upiId || "",
    customQrCode: company?.customQrCode || "",
    caName: company?.caName || "",
    caPhone: company?.caPhone || "",
    googleReviewUrl: company?.googleReviewUrl || "",
    instagramUrl: company?.instagramUrl || "",
    facebookUrl: company?.facebookUrl || "",
    youtubeUrl: company?.youtubeUrl || "",
    whatsappBusinessNumber: company?.whatsappBusinessNumber || "",
    reviewRewardCouponCode: company?.reviewRewardCouponCode || "STAR5",
    reviewRewardCouponDiscount: company?.reviewRewardCouponDiscount || 10
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

  const handleBusinessTypeChange = (type) => {
    setFormData((prev) => {
      const currentTypes = Array.isArray(prev.businessType) ? prev.businessType : [];
      if (currentTypes.includes(type)) {
        return { ...prev, businessType: currentTypes.filter((t) => t !== type) };
      } else {
        return { ...prev, businessType: [...currentTypes, type] };
      }
    });
  };

  const handleModuleToggle = (moduleId) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.modulesEnabled) ? prev.modulesEnabled : [];
      const updated = current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId];

      return { ...prev, modulesEnabled: updated };
    });
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File size should be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, customQrCode: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const response = await api.post("/api/company", formData);
        addCompany(response.company || response);
        setIsAdding(false);
        alert("Company added successfully!");
      } else {
        const response = await api.put(`/api/company/${selectedCompany._id}`, formData);
        updateCompany(response.company || response);
        setIsEditing(false);
        alert("Company updated successfully!");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage your companies and business types</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing(false);
            setFormData(getInitialFormState());
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      {/* Company List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company._id}
            onClick={() => {
              selectCompany(company);
              // Flush stale cache and hard reload to prevent ghost data
              localStorage.setItem("companyId", company._id);
              localStorage.setItem("companyName", company.name);
              localStorage.removeItem("categories");
              localStorage.removeItem("subCategories");
              window.location.href = "/dashboard";
            }}
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
            <p className="text-sm text-gray-600 capitalize">{Array.isArray(company.businessType) ? company.businessType.join(', ') : company.businessType}</p>
            <p className="text-sm text-gray-500">{company.address}</p>
          </div>
        ))}
      </div>

      {/* Selected Company Details */}
      {selectedCompany && !isAdding && (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="1" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type (Select multiple)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "retail", label: "Retail" },
                    { id: "wholesale", label: "Wholesale" },
                    { id: "manufacturing", label: "Manufacturing" },
                    { id: "service", label: "Services" },
                    { id: "trading", label: "Trading" }
                  ].map((type) => (
                    <label key={type.id} className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={Array.isArray(formData.businessType) && formData.businessType.includes(type.id)} onChange={() => handleBusinessTypeChange(type.id)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Payment QR Code (GPay/PhonePe) *Optional</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                        {formData.customQrCode ? (
                          <img src={formData.customQrCode} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">No QR</span>
                        )}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <p className="text-xs text-gray-500 mt-1">Upload your shop's fixed QR code (Max 2MB)</p>
                        {formData.customQrCode && <button type="button" onClick={() => setFormData({ ...formData, customQrCode: "" })} className="text-xs text-red-600 mt-1 hover:underline">Remove QR</button>}
                      </div>
                    </div>
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

              {/* 🌐 Social Media & Google Business Hub */}
              <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/70 p-5 rounded-2xl border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2.5">
                  <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                    <Share2 className="text-indigo-600" size={20} /> 🌐 सोशल मीडिया, Google Business व कूपन रिवॉर्ड हब
                  </h3>
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 font-extrabold px-3 py-1 rounded-full border border-indigo-200">
                    Social & Review Funnel
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  यहाँ अपने सोशल प्रोफाइल्स व Google Reviews लिंक डालें। 4 या 5-स्टार रिव्यू देने वाले ग्राहकों को ऑटोमैटिक कूपन कोड मिलेगा और आपके Instagram, Facebook व YouTube पर फॉलोअर्स बढ़ेंगे।
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" /> Google My Business / Review लिंक (Google Maps)
                    </label>
                    <input
                      type="url"
                      name="googleReviewUrl"
                      value={formData.googleReviewUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://g.page/r/... या https://maps.google.com/..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-pink-600" /> Instagram Profile लिंक
                    </label>
                    <input
                      type="url"
                      name="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://instagram.com/your_shop"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Share2 size={14} className="text-blue-600" /> Facebook Page लिंक
                    </label>
                    <input
                      type="url"
                      name="facebookUrl"
                      value={formData.facebookUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://facebook.com/your_page"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Video size={14} className="text-red-600" /> YouTube Channel लिंक
                    </label>
                    <input
                      type="url"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleChange}
                      placeholder="उदा. https://youtube.com/@your_channel"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-emerald-600" /> WhatsApp Business नंबर / लिंक
                    </label>
                    <input
                      type="text"
                      name="whatsappBusinessNumber"
                      value={formData.whatsappBusinessNumber}
                      onChange={handleChange}
                      placeholder="उदा. 919876543210 या https://wa.me/919876543210"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Gift size={14} className="text-amber-600" /> 4/5⭐ कूपन कोड
                      </label>
                      <input
                        type="text"
                        name="reviewRewardCouponCode"
                        value={formData.reviewRewardCouponCode}
                        onChange={handleChange}
                        placeholder="STAR5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black uppercase focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Percent size={14} className="text-indigo-600" /> छूट प्रतिशत (%)
                      </label>
                      <input
                        type="number"
                        name="reviewRewardCouponDiscount"
                        value={formData.reviewRewardCouponDiscount}
                        onChange={handleChange}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-emerald-700"
                      />
                    </div>
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
                    <p className="font-medium text-gray-800 capitalize">{(Array.isArray(selectedCompany.businessType) ? selectedCompany.businessType.join(' & ') : selectedCompany.businessType)} {selectedCompany.industryType && `- ${selectedCompany.industryType}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">{selectedCompany.address || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{selectedCompany.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedCompany.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Tax & Bank Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Firm Type & GST Details</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                          selectedCompany.gstType === 'composition' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          selectedCompany.gstType === 'unregistered' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {selectedCompany.gstType === 'composition' ? 'Composition Firm' : selectedCompany.gstType === 'unregistered' ? 'Unregistered Firm' : 'Regular Firm'}
                        </span>
                        {selectedCompany.gstNumber && (
                          <span className="font-medium text-gray-800 uppercase text-sm border-l pl-2 border-gray-300">
                            GSTIN: {selectedCompany.gstNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Bank Account Details</p>
                      <p className="font-medium text-gray-800">
                        {selectedCompany.bankName ? `${selectedCompany.bankName} - ${selectedCompany.accountNumber}` : "Not provided"}
                      </p>
                      {selectedCompany.ifscCode && <p className="text-xs text-gray-500">IFSC: {selectedCompany.ifscCode.toUpperCase()}</p>}
                    </div>
                  </div>
                  {selectedCompany.customQrCode && (
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <QrCode className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Payment QR Code</p>
                        <img src={selectedCompany.customQrCode} alt="Payment QR" className="w-32 h-32 border rounded-lg shadow-sm" />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <FileText size={16} className="text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs uppercase px-2 py-1 border rounded font-bold tracking-wider ${
                            selectedCompany.gstType === 'composition' ? 'bg-orange-900 border-orange-700 text-orange-300' :
                            selectedCompany.gstType === 'unregistered' ? 'bg-gray-800 border-gray-600 text-gray-300' :
                            'bg-green-900 border-green-700 text-green-300'
                          }`}>
                            {selectedCompany.gstType === 'composition' ? 'COMPOSITION' : selectedCompany.gstType === 'unregistered' ? 'UNREGISTERED' : 'REGULAR GST'}
                          </span>
                          {selectedCompany.gstNumber && (
                            <span className="text-xs uppercase bg-gray-800 px-2 py-1 border border-gray-600 rounded font-medium tracking-wider text-gray-200">GST: {selectedCompany.gstNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">CA Details</p>
                      <p className="font-medium text-gray-800">{selectedCompany.caName || "Not provided"}</p>
                      {selectedCompany.caPhone && <p className="text-xs text-gray-500">{selectedCompany.caPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌐 Social Media & Google Reviews Display Hub */}
              <div className="mt-6 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-lg border border-indigo-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl">
                      <Share2 className="text-indigo-400" size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                        🌐 सोशल मीडिया, Google Reviews व कूपन रिवॉर्ड
                      </h3>
                      <p className="text-xs text-indigo-200/70">
                        ग्राहकों से 5-स्टार Google रिव्यू प्राप्त करें और Instagram / Facebook पर फॉलोअर्स बढ़ाएं
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Gift size={13} /> {selectedCompany.reviewRewardCouponCode || 'STAR5'} ({selectedCompany.reviewRewardCouponDiscount || 10}% OFF)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Google Reviews */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Star size={14} className="fill-amber-300" /> Google Review
                      </span>
                      {selectedCompany.googleReviewUrl && (
                        <a href={selectedCompany.googleReviewUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.googleReviewUrl || "लिंक सेट नहीं है (Edit में जोड़ें)"}
                    </p>
                  </div>

                  {/* Instagram */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                        <Smartphone size={14} /> Instagram
                      </span>
                      {selectedCompany.instagramUrl && (
                        <a href={selectedCompany.instagramUrl} target="_blank" rel="noreferrer" className="text-pink-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.instagramUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>

                  {/* Facebook */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <Share2 size={14} /> Facebook Page
                      </span>
                      {selectedCompany.facebookUrl && (
                        <a href={selectedCompany.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.facebookUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>

                  {/* YouTube */}
                  <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-1.5 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <Video size={14} /> YouTube
                      </span>
                      {selectedCompany.youtubeUrl && (
                        <a href={selectedCompany.youtubeUrl} target="_blank" rel="noreferrer" className="text-rose-300 hover:text-white text-[11px] flex items-center gap-0.5 font-bold">
                          खोलें <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono">
                      {selectedCompany.youtubeUrl || "लिंक सेट नहीं है"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Digital Visiting Card Preview - ONLY MAIN DETAILS */}
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
        <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea name="address" rows="1" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Business & Tax */}
              <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-3 text-gray-800">Business & Tax Details</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type (Select multiple)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "retail", label: "Retail" },
                    { id: "wholesale", label: "Wholesale" },
                    { id: "manufacturing", label: "Manufacturing" },
                    { id: "service", label: "Services" },
                    { id: "trading", label: "Trading" }
                  ].map((type) => (
                    <label key={type.id} className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={Array.isArray(formData.businessType) && formData.businessType.includes(type.id)} onChange={() => handleBusinessTypeChange(type.id)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Payment QR Code (GPay/PhonePe) *Optional</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                        {formData.customQrCode ? (
                          <img src={formData.customQrCode} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">No QR</span>
                        )}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <p className="text-xs text-gray-500 mt-1">Upload your shop's fixed QR code (Max 2MB)</p>
                        {formData.customQrCode && <button type="button" onClick={() => setFormData({ ...formData, customQrCode: "" })} className="text-xs text-red-600 mt-1 hover:underline">Remove QR</button>}
                      </div>
                    </div>
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