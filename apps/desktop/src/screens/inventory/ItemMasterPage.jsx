import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Tag, Grid, Layers, Scale, X, Save } from "lucide-react";
import api from "../../services/api";

const ItemMasterPage = () => {
  const [activeTab, setActiveTab] = useState("category"); // 'category', 'subcategory', 'brand', 'unit'
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", shortCode: "" });

  const tabs = [
    { id: "category", label: "Categories", icon: <Grid size={18} />, endpoint: "category" },
    { id: "subcategory", label: "Sub-Categories", icon: <Layers size={18} />, endpoint: "subcategory" },
    { id: "brand", label: "Brands", icon: <Tag size={18} />, endpoint: "brand" },
    { id: "unit", label: "Units of Measure", icon: <Scale size={18} />, endpoint: "unit" },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/${currentTab.endpoint}`);
      let list = [];
      // Handle different API response structures dynamically
      if (res.data) {
        if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.data[currentTab.endpoint + 's'])) list = res.data[currentTab.endpoint + 's'];
        else if (activeTab === 'subcategory' && Array.isArray(res.data['subCategories'])) list = res.data['subCategories'];
        else list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      } else {
        list = res[currentTab.endpoint + 's'] || res['subCategories'] || [];
      }
      
      // Convert string arrays to objects for consistent mapping if needed
      const normalizedList = list.map(item => 
        typeof item === 'string' ? { _id: item, name: item, isStringOnly: true } : item
      );
      
      setDataList(normalizedList);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchTerm("");
    setShowForm(false);
  }, [activeTab]);

  const handleAddEdit = (item = null) => {
    if (item && !item.isStringOnly) {
      setEditingItem(item);
      setFormData({ 
        name: item.name || "", 
        description: item.description || "", 
        shortCode: item.shortCode || "" 
      });
    } else if (item && item.isStringOnly) {
      setEditingItem({ _id: item.name, name: item.name }); // Using name as ID for string records
      setFormData({ name: item.name, description: "", shortCode: "" });
    } else {
      setEditingItem(null);
      setFormData({ name: "", description: "", shortCode: "" });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Name is required");
    
    try {
      if (editingItem && !editingItem.isStringOnly) {
        await api.put(`/api/${currentTab.endpoint}/${editingItem._id}`, formData);
      } else {
        await api.post(`/api/${currentTab.endpoint}`, formData);
      }
      setShowForm(false);
      fetchData();
      
      // Clear Cache so Inventory Page refreshes automatically
      localStorage.removeItem("categories");
      localStorage.removeItem("subCategories");
    } catch (error) {
      alert(`Error saving ${activeTab}: ` + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab}?`)) {
      try {
        await api.delete(`/api/${currentTab.endpoint}/${id}`);
        fetchData();
        localStorage.removeItem("categories");
        localStorage.removeItem("subCategories");
      } catch (error) {
        alert(`Error deleting ${activeTab}. It might be in use.`);
      }
    }
  };

  const filteredData = dataList.filter(item => 
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Masters</h1>
          <p className="text-gray-600 mt-1">Centrally manage Categories, Brands, and Units</p>
        </div>
        <button
          onClick={() => handleAddEdit()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} />
          Add New {currentTab.label.slice(0, -1)}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Master Types</h2>
          </div>
          <div className="flex flex-col p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                }`}
              >
                <span className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          {showForm ? (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {editingItem ? <Edit size={20} className="text-blue-600"/> : <Plus size={20} className="text-green-600"/>} 
                  {editingItem ? "Edit" : "Create New"} {currentTab.label.slice(0, -1)}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} autoFocus required placeholder={`e.g. ${activeTab === 'unit' ? 'Pieces' : 'Electronics'}`} />
                </div>
                {activeTab === 'unit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Code</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.shortCode} onChange={(e) => setFormData({...formData, shortCode: e.target.value})} placeholder="e.g. PCS, KG" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Add some notes..." />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    <Save size={18}/> {editingItem ? "Update" : "Save"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  {currentTab.icon} Manage {currentTab.label}
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 text-center text-gray-500 animate-pulse">Loading {currentTab.label}...</div>
              ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-6 font-semibold text-gray-600">Name</th>
                        {activeTab === 'unit' && <th className="py-3 px-6 font-semibold text-gray-600">Short Code</th>}
                        <th className="py-3 px-6 font-semibold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item, idx) => (
                        <tr key={item._id || idx} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-6 font-medium text-gray-800">{item.name}</td>
                          {activeTab === 'unit' && <td className="py-3 px-6 text-gray-600">{item.shortCode || '-'}</td>}
                          <td className="py-3 px-6 text-right">
                            <button onClick={() => handleAddEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded mr-2" title="Edit"><Edit size={16} /></button>
                            {!item.isStringOnly && <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Delete"><Trash2 size={16} /></button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">No {currentTab.label.toLowerCase()} found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemMasterPage;