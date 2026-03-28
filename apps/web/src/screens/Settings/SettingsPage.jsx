import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, ChevronDown, Settings, Users, Shield, Globe, Database, Scale } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("parties");
  const [parties, setParties] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [partyForm, setPartyForm] = useState({
    name: "",
    partyType: "both",
    mobileNumber: "",
    address: "",
    gstNumber: "",
    contactPerson: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (activeTab === "parties") loadParties();
    if (activeTab === "categories") loadCategories();
  }, [activeTab]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/party");
      setParties(response.parties || []);
    } catch (err) {
      console.error("Error loading parties:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/category");
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParty = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/party", partyForm);
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
      alert("Party added successfully!");
    } catch (err) {
      alert(err.error || "Error adding party");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/category", categoryForm);
      setCategoryForm({ name: "", description: "" });
      setShowCategoryForm(false);
      loadCategories();
      alert("Category added successfully!");
    } catch (err) {
      alert(err.error || "Error adding category");
    }
  };

  const handleDeleteParty = async (id) => {
    if (window.confirm("Delete this party?")) {
      try {
        await api.delete(`/api/party/${id}`);
        loadParties();
      } catch (err) {
        alert("Error deleting party");
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Delete this category?")) {
      try {
        await api.delete(`/api/category/${id}`);
        loadCategories();
      } catch (err) {
        alert("Error deleting category");
      }
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
      <div className="flex gap-2 border-b border-gray-200">
        {["parties", "categories"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
    </div>
  );
}
