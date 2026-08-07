import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Building2, Save, MapPin } from "lucide-react";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

export default function BranchPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactNumber: "",
    isMainBranch: false,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // Offline First
      let localBranches = await dbService.getBranches?.() || [];
      
      if (!localBranches || localBranches.length === 0) {
        const res = await api.get("/api/branch").catch(() => ({ data: { branches: [] } }));
        localBranches = res.data?.branches || res.data?.data || [];
      }
      
      setBranches(localBranches);
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Branch Name is required");

    setLoading(true);
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `BRANCH-${Date.now()}`;
      const payload = { ...formData, _id: newId, uuid: newId };

      // Save Locally
      if (dbService.saveBranch) await dbService.saveBranch(payload);
      
      // Audit & Sync
      await auditService.logAction('CREATE', 'branch', null, payload);
      await syncQueue.enqueue({ entityId: newId, entity: 'branch', method: 'POST', url: '/api/branch', data: payload });

      alert("Branch Added Offline Successfully!");
      setFormData({ name: "", address: "", contactNumber: "", isMainBranch: false });
      fetchBranches();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Building2 className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Branches / Stores</h1>
          <p className="text-gray-500 text-sm">Add and view multiple locations for your company</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Add New Branch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
              <input type="text" className="w-full border p-2 rounded" placeholder="e.g. Main Market Shop" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="text" className="w-full border p-2 rounded" placeholder="e.g. 9876543210" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea className="w-full border p-2 rounded" rows="3" placeholder="Branch Address..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 p-3 rounded border border-blue-200">
              <input type="checkbox" className="w-4 h-4 text-blue-600" checked={formData.isMainBranch} onChange={e => setFormData({...formData, isMainBranch: e.target.checked})} />
              <span className="text-blue-800 font-medium text-sm">Set as Main/Default Branch</span>
            </label>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex justify-center items-center gap-2">
              <Save size={18} /> {loading ? "Saving..." : "Save Branch"}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Branch Name</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">Address</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500">No branches added yet.</td></tr>}
                {branches.map(branch => (
                  <tr key={branch._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500"/> {branch.name}
                      {branch.isMainBranch && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-2">Main</span>}
                    </td>
                    <td className="p-4 text-gray-600">{branch.contactNumber || 'N/A'}</td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{branch.address || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${branch.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
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