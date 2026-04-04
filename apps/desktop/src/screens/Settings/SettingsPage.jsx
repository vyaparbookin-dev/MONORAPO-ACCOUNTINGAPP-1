import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, ChevronDown, Settings, Users, Shield, Globe, Database, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("parties");
  const [parties, setParties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);

  const [partyForm, setPartyForm] = useState({
    name: "",
    partyType: "both",
    mobileNumber: "",
    address: "",
    gstNumber: "",
    contactPerson: "",
  });

  const [unitForm, setUnitForm] = useState({
    name: "",
    shortCode: "",
    description: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [brandForm, setBrandForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (activeTab === "parties") loadParties();
    if (activeTab === "categories") loadCategories();
    if (activeTab === "subCategories") loadSubCategories();
    if (activeTab === "brands") loadBrands();
  }, [activeTab]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const res = await dbService.getCustomers();
      setParties((res || []).map(p => ({ ...p, _id: p.uuid || p._id })));
    } catch (err) {
      console.error("Error loading parties:", err);
      setParties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await dbService.getCategories();
      setCategories((res || []).map(c => ({ ...c, _id: c.uuid || c._id })));
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubCategories = async () => {
    try {
      setLoading(true);
      let res = await dbService.getSubCategories?.();
      if (!res || res.length === 0) {
        const apiRes = await api.get("/api/subcategory").catch(() => null);
        res = apiRes?.data?.subCategories || apiRes?.data || [];
      }
      setSubCategories((res || []).map(c => ({ ...c, _id: c.uuid || c._id })));
    } catch (err) {
      console.error("Error loading subCategories:", err);
      setSubCategories([]);
    } finally { setLoading(false); }
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      let res = await dbService.getBrands?.();
      if (!res || res.length === 0) {
        const apiRes = await api.get("/api/brand").catch(() => null);
        res = apiRes?.data?.brands || apiRes?.data || [];
      }
      setBrands((res || []).map(c => ({ ...c, _id: c.uuid || c._id })));
    } catch (err) {
      console.error("Error loading brands:", err);
      setBrands([]);
    } finally { setLoading(false); }
  };

  const handleAddParty = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `PARTY-${Date.now()}`;
      const payload = { ...partyForm, _id: newId, uuid: newId };
      
      await dbService.addCustomer(payload);
      await auditService.logAction('CREATE', 'party', null, payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'party', method: 'POST', url: '/api/party', data: payload });

      setPartyForm({
        name: "",
        partyType: "both",
        mobileNumber: "",
        address: "",
        gstNumber: "",
        contactPerson: "",
      });
      setShowPartyForm(false);
      loadParties();
      alert("Party added offline successfully!");
    } catch (err) {
      alert(err.message || "Error adding party");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `CAT-${Date.now()}`;
      const payload = { ...categoryForm, _id: newId, uuid: newId };
      
      await dbService.saveCategory(payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'category', method: 'POST', url: '/api/category', data: payload });

      setCategoryForm({ name: "", description: "" });
      setShowCategoryForm(false);
      loadCategories();
      alert("Category added offline successfully!");
    } catch (err) {
      alert(err.message || "Error adding category");
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `SUBCAT-${Date.now()}`;
      const payload = { ...subCategoryForm, _id: newId, uuid: newId };
      if (dbService.saveSubCategory) await dbService.saveSubCategory(payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'subCategory', method: 'POST', url: '/api/subcategory', data: payload });
      setSubCategoryForm({ name: "", description: "" });
      setShowSubCategoryForm(false);
      loadSubCategories();
      alert("Sub-Category added offline successfully!");
    } catch (err) { alert(err.message || "Error adding sub-category"); }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `BRAND-${Date.now()}`;
      const payload = { ...brandForm, _id: newId, uuid: newId };
      if (dbService.saveBrand) await dbService.saveBrand(payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'brand', method: 'POST', url: '/api/brand', data: payload });
      setBrandForm({ name: "", description: "" });
      setShowBrandForm(false);
      loadBrands();
      alert("Brand added offline successfully!");
    } catch (err) { alert(err.message || "Error adding brand"); }
  };

  const handleDeleteParty = async (id) => {
    if (window.confirm("Delete this party?")) {
      try {
        const old = parties.find(p => p._id === id);
        await dbService.deleteCustomer(id);
        await auditService.logAction('DELETE', 'party', old, null);
        await syncQueue.enqueue({ entityId: id, entity: 'party', method: 'DELETE', url: `/api/party/${id}` });
        loadParties();
      } catch (err) {
        alert("Error deleting party");
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Delete this category?")) {
      try {
        await dbService.deleteCategory(id);
        await syncQueue.enqueue({ entityId: id, entity: 'category', method: 'DELETE', url: `/api/category/${id}` });
        loadCategories();
      } catch (err) {
        alert("Error deleting category");
      }
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (window.confirm("Delete this sub-category?")) {
      try {
        if (dbService.deleteSubCategory) await dbService.deleteSubCategory(id);
        await syncQueue.enqueue({ entityId: id, entity: 'subCategory', method: 'DELETE', url: `/api/subcategory/${id}` });
        loadSubCategories();
      } catch (err) { alert("Error deleting sub-category"); }
    }
  };

  const handleDeleteBrand = async (id) => {
    if (window.confirm("Delete this brand?")) {
      try {
        if (dbService.deleteBrand) await dbService.deleteBrand(id);
        await syncQueue.enqueue({ entityId: id, entity: 'brand', method: 'DELETE', url: `/api/brand/${id}` });
        loadBrands();
      } catch (err) { alert("Error deleting brand"); }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage application settings and master data</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button onClick={() => navigate("/settings/app")} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-full text-blue-600"><Settings size={24} /></div>
          <span className="font-medium text-gray-700">App Settings</span>
        </button>
        <button onClick={() => navigate("/settings/staff")} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-full text-green-600"><Users size={24} /></div>
          <span className="font-medium text-gray-700">Staff Management</span>
        </button>
        <button onClick={() => navigate("/settings/web")} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 text-center">
          <div className="p-2 bg-purple-50 rounded-full text-purple-600"><Globe size={24} /></div>
          <span className="font-medium text-gray-700">Web Preferences</span>
        </button>
        <button onClick={() => navigate("/settings/backup")} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 text-center">
          <div className="p-2 bg-orange-50 rounded-full text-orange-600"><Database size={24} /></div>
          <span className="font-medium text-gray-700">Backup & Restore</span>
        </button>        
        <button onClick={() => navigate("/settings/units")} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 text-center">
          <div className="p-2 bg-indigo-50 rounded-full text-indigo-600"><Scale size={24} /></div>
          <span className="font-medium text-gray-700">Unit Settings</span>
        </button>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Master Data</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "parties", label: "Parties" },
          { id: "categories", label: "Categories" },
          { id: "subCategories", label: "Sub-Categories" },
          { id: "brands", label: "Brands / Companies" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PARTIES TAB */}
      {activeTab === "parties" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPartyForm(!showPartyForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Party
          </button>

          {showPartyForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Add New Party</h2>
              <form onSubmit={handleAddParty} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Party Name *"
                    value={partyForm.name}
                    onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={partyForm.partyType}
                    onChange={(e) => setPartyForm({ ...partyForm, partyType: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="both">Both (Supplier & Customer)</option>
                    <option value="supplier">Supplier</option>
                    <option value="customer">Customer</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Mobile Number *"
                    value={partyForm.mobileNumber}
                    onChange={(e) => setPartyForm({ ...partyForm, mobileNumber: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="GST Number"
                    value={partyForm.gstNumber}
                    onChange={(e) => setPartyForm({ ...partyForm, gstNumber: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact Person"
                    value={partyForm.contactPerson}
                    onChange={(e) => setPartyForm({ ...partyForm, contactPerson: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Address *"
                  value={partyForm.address}
                  onChange={(e) => setPartyForm({ ...partyForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Party
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPartyForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">GST</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.length > 0 ? (
                  parties.map((party) => (
                    <tr key={party._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{party.name}</td>
                      <td className="px-6 py-3">{party.mobileNumber}</td>
                      <td className="px-6 py-3">{party.gstNumber || "-"}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {party.partyType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDeleteParty(party._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No parties added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Category
          </button>

          {showCategoryForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <input
                  type="text"
                  placeholder="Category Name *"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={category._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{category.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{category.description || "-"}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No categories added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-CATEGORIES TAB */}
      {activeTab === "subCategories" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowSubCategoryForm(!showSubCategoryForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Add Sub-Category
          </button>

          {showSubCategoryForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Add New Sub-Category</h2>
              <form onSubmit={handleAddSubCategory} className="space-y-4">
                <input
                  type="text"
                  placeholder="Sub-Category Name *"
                  value={subCategoryForm.name}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={subCategoryForm.description}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Sub-Category</button>
                  <button type="button" onClick={() => setShowSubCategoryForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sub-Category Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subCategories.length > 0 ? (
                  subCategories.map((sub) => (
                    <tr key={sub._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{sub.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{sub.description || "-"}</td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => handleDeleteSubCategory(sub._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No sub-categories added yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowBrandForm(!showBrandForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Add Brand
          </button>

          {showBrandForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Add New Brand / Company</h2>
              <form onSubmit={handleAddBrand} className="space-y-4">
                <input
                  type="text"
                  placeholder="Brand Name (e.g., Samsung) *"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Brand</button>
                  <button type="button" onClick={() => setShowBrandForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Brand Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <tr key={brand._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{brand.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{brand.description || "-"}</td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => handleDeleteBrand(brand._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No brands added yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
