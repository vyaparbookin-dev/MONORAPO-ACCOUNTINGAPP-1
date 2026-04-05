import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, ListTree, Scale, ListMinus, Tag } from "lucide-react";
import api from "../../services/api";

const CategoryManagementPage = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", shortCode: "" });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "categories") {
        const res = await api.get("/api/category");
        setCategories(res.data.categories || res.data.data || (Array.isArray(res.data) ? res.data : []));
      } else if (activeTab === "subCategories") {
        const res = await api.get("/api/subcategory");
        setSubCategories(res.data.subCategories || res.data.data || (Array.isArray(res.data) ? res.data : []));
      } else if (activeTab === "brands") {
        const res = await api.get("/api/brand");
        setBrands(res.data.brands || res.data.data || (Array.isArray(res.data) ? res.data : []));
      } else {
        const res = await api.get("/api/unit");
        setUnits(res.data.units || res.data.data || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, shortCode: item.shortCode || "" });
    } else {
      setEditingItem(null);
      setFormData({ name: "", shortCode: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: "", shortCode: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = "";
      if (activeTab === "categories") endpoint = "/api/category";
      else if (activeTab === "subCategories") endpoint = "/api/subcategory";
      else if (activeTab === "brands") endpoint = "/api/brand";
      else endpoint = "/api/unit";

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, formData);
      } else {
        await api.post(endpoint, formData);
      }
      
      fetchData();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      let endpoint = "";
      if (activeTab === "categories") endpoint = "/api/category";
      else if (activeTab === "subCategories") endpoint = "/api/subcategory";
      else if (activeTab === "brands") endpoint = "/api/brand";
      else endpoint = "/api/unit";

      await api.delete(`${endpoint}/${id}`);
      
      fetchData();
    } catch (error) {
      alert("Failed to delete. It might be in use.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Inventory Fields</h1>
          <p className="text-gray-600 mt-1">Organize Categories, Brands, and Units for your products</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add {
            activeTab === "categories" ? "Category" : 
            activeTab === "subCategories" ? "Sub-Category" : 
            activeTab === "brands" ? "Brand" : "Unit"
          }
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          <ListTree size={18} />
          Categories
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "subCategories"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("subCategories")}
        >
          <ListMinus size={18} />
          Sub Categories
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "brands"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("brands")}
        >
          <Tag size={18} />
          Brands / Companies
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "units"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("units")}
        >
          <Scale size={18} />
          Units
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                {activeTab === "units" && <th className="p-4 font-semibold text-gray-600">Short Code</th>}
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "categories" ? categories : activeTab === "subCategories" ? subCategories : activeTab === "brands" ? brands : units).length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No {activeTab} found. Click 'Add' to create one.
                  </td>
                </tr>
              ) : (
                (activeTab === "categories" ? categories : activeTab === "subCategories" ? subCategories : activeTab === "brands" ? brands : units).map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{item.name}</td>
                    {activeTab === "units" && (
                      <td className="p-4 text-gray-600 uppercase">{item.shortCode || "-"}</td>
                    )}
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">
                {editingItem ? "Edit" : "Add"} {
                  activeTab === "categories" ? "Category" : 
                  activeTab === "subCategories" ? "Sub-Category" : 
                  activeTab === "brands" ? "Brand" : "Unit"
                }
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`e.g., ${activeTab === "categories" ? "Electronics" : activeTab === "subCategories" ? "Mobile Phones" : activeTab === "brands" ? "Samsung" : "Kilogram"}`}
                />
              </div>
              {activeTab === "units" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    value={formData.shortCode}
                    onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                    placeholder="e.g., KG, PCS"
                  />
                </div>
              )}
              <div className="pt-4 flex gap-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;