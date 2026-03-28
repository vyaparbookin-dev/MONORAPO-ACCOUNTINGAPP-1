import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Box, Save } from "lucide-react";

export default function AddWarehousePage() {
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: "",
    name: "",
    location: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchRes, whRes] = await Promise.all([
        api.get("/api/branch"),
        api.get("/api/warehouse")
      ]);
      setBranches(branchRes.data?.branches || branchRes.data?.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branchId || !formData.name) return alert("Branch and Warehouse Name are required");

    setLoading(true);
    try {
      await api.post("/api/warehouse", formData);
      alert("Warehouse Added Successfully!");
      setFormData({ branchId: "", name: "", location: "", isDefault: false });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add warehouse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Box className="text-orange-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Warehouses / Godowns</h1>
          <p className="text-gray-500 text-sm">Create warehouses attached to specific branches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Add New Warehouse</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch *</label>
              <select className="w-full border p-2 rounded" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
                <option value="">-- Choose Branch --</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name *</label>
              <input type="text" className="w-full border p-2 rounded" placeholder="e.g. Basement Godown" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Details</label>
              <textarea className="w-full border p-2 rounded" rows="2" placeholder="Warehouse location..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}></textarea>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-orange-50 p-3 rounded border border-orange-200">
              <input type="checkbox" className="w-4 h-4 text-orange-600" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} />
              <span className="text-orange-800 font-medium text-sm">Default Godown for this Branch</span>
            </label>

            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md flex justify-center items-center gap-2">
              <Save size={18} /> {loading ? "Saving..." : "Save Warehouse"}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Warehouse Name</th>
                  <th className="p-4 font-semibold">Attached Branch</th>
                  <th className="p-4 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-500">No warehouses added yet.</td></tr>}
                {warehouses.map(wh => (
                  <tr key={wh._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">
                      {wh.name} 
                      {wh.isDefault && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-2">Default</span>}
                    </td>
                    <td className="p-4 text-blue-600 font-medium">{wh.branchId?.name || 'Unknown'}</td>
                    <td className="p-4 text-gray-600 text-sm">{wh.location || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}