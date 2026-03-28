import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Scale, Plus, Trash2 } from 'lucide-react';
import Loader from '../../components/Loader';

export default function UnitSettingsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    isCompound: false,
    baseUnit: '',
    conversionValue: ''
  });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/unit').catch(() => ({ data: [] }));
      setUnits(res.data?.units || res.data || []);
    } catch (error) {
      console.error("Failed to fetch units", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/unit', formData);
      alert("Unit created successfully!");
      setShowModal(false);
      setFormData({ name: '', shortName: '', isCompound: false, baseUnit: '', conversionValue: '' });
      fetchUnits();
    } catch (error) {
      alert("Failed to create unit. " + (error.response?.data?.message || ""));
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      await api.delete(`/api/unit/${id}`);
      fetchUnits();
    } catch (error) {
      alert("Failed to delete unit. It might be in use.");
    }
  };

  // Filter simple units to be used as Base Unit for compound units
  const simpleUnits = units.filter(u => !u.isCompound);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Scale className="text-blue-600"/> Unit Management</h1>
          <p className="text-gray-500 mt-1">Manage simple units (PCS, KG) and compound units (1 BOX = 10 PCS)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Create Unit
        </button>
      </div>

      {loading ? <Loader /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Unit Name</th>
                <th className="p-4 font-semibold text-gray-700">Short Name</th>
                <th className="p-4 font-semibold text-gray-700">Type</th>
                <th className="p-4 font-semibold text-gray-700">Conversion Logic</th>
                <th className="p-4 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No units found. Add some!</td></tr>}
              {units.map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{u.name}</td>
                  <td className="p-4 font-mono text-gray-600">{u.shortName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.isCompound ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {u.isCompound ? 'Compound' : 'Simple'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {u.isCompound ? `1 ${u.shortName} = ${u.conversionValue} ${u.baseUnit}` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Unit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Unit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Unit Name (e.g. Box, Piece)</label><input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded focus:ring-2 outline-none"/></div>
              <div><label className="block text-sm font-medium mb-1">Short Name (e.g. BOX, PCS)</label><input type="text" name="shortName" required value={formData.shortName} onChange={handleInputChange} className="w-full border p-2 rounded uppercase focus:ring-2 outline-none"/></div>
              
              <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 border rounded-lg">
                <input type="checkbox" id="isCompound" name="isCompound" checked={formData.isCompound} onChange={handleInputChange} className="w-4 h-4"/>
                <label htmlFor="isCompound" className="font-medium text-gray-700">This is a Compound Unit</label>
              </div>

              {formData.isCompound && (
                <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex-1"><label className="block text-sm font-medium text-purple-900 mb-1">1 {formData.shortName || 'Unit'} Equals to</label><input type="number" name="conversionValue" required={formData.isCompound} value={formData.conversionValue} onChange={handleInputChange} placeholder="e.g. 10" className="w-full border p-2 rounded"/></div>
                  <div className="flex-1"><label className="block text-sm font-medium text-purple-900 mb-1">Base Unit</label>
                    <select name="baseUnit" required={formData.isCompound} value={formData.baseUnit} onChange={handleInputChange} className="w-full border p-2 rounded">
                      <option value="">Select Base</option>
                      {simpleUnits.map(su => <option key={su._id} value={su.shortName}>{su.shortName}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}