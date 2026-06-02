import React, { useState, useEffect } from 'react';
import { Trash2, FileSpreadsheet, Package, Clock } from 'lucide-react';
import api from '../services/api'; // Corrected import path

const ImportHistoryManager = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/inventory/import-batches');
      setBatches(res.data?.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const deleteBatch = async (batchId, itemCount) => {
    if (!window.confirm(`Are you sure you want to delete ${itemCount} products from batch ${batchId}?\n\nNote: Unused products will be permanently deleted. Products already used in billing will be safely archived (soft-deleted).`)) return;
    
    try {
      const res = await api.post('/api/inventory/bulk-delete', { batchId });
      alert(res.data.message);
      fetchBatches(); // Refresh list after delete
    } catch (error) {
      alert('Failed to delete batch.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6 max-w-4xl w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <FileSpreadsheet className="text-blue-600" /> Excel Import History
      </h2>
      <p className="text-sm text-gray-600 mb-6">Manage your bulk uploaded products. You can delete entire Excel imports if you made a mistake.</p>
      
      {loading ? (
        <p className="text-gray-500 font-medium p-4">Loading history...</p>
      ) : batches.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 font-medium">No import batches found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch._id} className="flex flex-wrap items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Batch ID: <span className="text-blue-600 font-mono text-sm">{batch._id}</span>
                </h3>
                <div className="text-sm text-gray-600 flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1"><Package size={14} /> {batch.itemCount} Products</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {new Date(batch.uploadDate).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteBatch(batch._id, batch.itemCount)}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition font-medium"
              >
                <Trash2 size={18} /> Delete Batch
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportHistoryManager;
