import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  const [formData, setFormData] = useState({
    assetName: '',
    description: '',
    purchaseDate: '',
    purchaseCost: '',
    depreciationRate: '',
    depreciationMethod: 'WDV'
  });

  const fetchAssets = async () => {
    try {
      const res = await api.get('/api/fixed-assets');
      if (res.data.success) {
        setAssets(res.data.assets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/fixed-assets', formData);
      if (res.data.success) {
        alert("Asset added successfully!");
        setShowModal(false);
        setFormData({ assetName: '', description: '', purchaseDate: '', purchaseCost: '', depreciationRate: '', depreciationMethod: 'WDV' });
        fetchAssets();
      }
    } catch (error) {
      alert("Error adding asset: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCalculateDepreciation = async () => {
    if(!window.confirm("Are you sure you want to apply depreciation to all active assets? This will reduce their current value.")) return;
    
    setCalculating(true);
    try {
      const res = await api.post('/api/fixed-assets/calculate-depreciation');
      if (res.data.success) {
        alert("Depreciation applied successfully!");
        fetchAssets();
      }
    } catch (error) {
      alert("Error calculating depreciation: " + (error.response?.data?.message || error.message));
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Fixed Assets Register</h1>
          <div className="space-x-3">
            <button 
              onClick={handleCalculateDepreciation}
              disabled={calculating || assets.length === 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
            >
              {calculating ? 'Calculating...' : 'Run Yearly Depreciation'}
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-semibold"
            >
              + Add Asset
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Asset Name</th>
                  <th className="py-3 px-4 border-b text-left">Purchase Date</th>
                  <th className="py-3 px-4 border-b text-right">Original Cost (₹)</th>
                  <th className="py-3 px-4 border-b text-right text-blue-600">Current Value (₹)</th>
                  <th className="py-3 px-4 border-b text-right">Dep. Rate</th>
                  <th className="py-3 px-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-6 text-gray-500">No fixed assets found.</td></tr>
                )}
                {assets.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b font-medium text-gray-700">{item.assetName}</td>
                    <td className="py-2 px-4 border-b">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b text-right">{item.purchaseCost}</td>
                    <td className="py-2 px-4 border-b text-right font-bold text-blue-600">{Math.round(item.currentValue)}</td>
                    <td className="py-2 px-4 border-b text-right">{item.depreciationRate}% ({item.depreciationMethod})</td>
                    <td className="py-2 px-4 border-b text-center">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Fixed Asset</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset Name (e.g., Computer, AC)</label>
                <input type="text" name="assetName" required value={formData.assetName} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <input type="date" name="purchaseDate" required value={formData.purchaseDate} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Cost (₹)</label>
                  <input type="number" name="purchaseCost" required value={formData.purchaseCost} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Dep. Rate (%)</label>
                  <input type="number" name="depreciationRate" required value={formData.depreciationRate} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Method</label>
                  <select name="depreciationMethod" value={formData.depreciationMethod} onChange={handleInputChange} className="mt-1 w-full border p-2 rounded">
                    <option value="WDV">WDV (Written Down)</option>
                    <option value="SLM">SLM (Straight Line)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}