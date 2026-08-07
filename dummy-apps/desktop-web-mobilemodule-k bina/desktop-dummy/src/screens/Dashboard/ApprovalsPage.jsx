import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle, XCircle, Clock, FileText, Truck, Receipt } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { syncQueue } from '@repo/shared';

export default function ApprovalsPage() {
  const [pendingData, setPendingData] = useState({ bills: [], expenses: [], stockTransfers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bills');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      let localData = await dbService.getApprovals?.();
      
      if ((!localData || Object.keys(localData).length === 0) && navigator.onLine) {
        try {
          const res = await api.get('/api/approvals');
          if (res.data && res.data.success) localData = res.data.data;
        } catch (e) {
          console.warn("Could not fetch approvals from API");
        }
      }
      
      // Strictly enforce arrays to prevent .map crashes
      const safeData = {
        bills: (localData && Array.isArray(localData.bills) ? localData.bills : []).filter(Boolean),
        expenses: (localData && Array.isArray(localData.expenses) ? localData.expenses : []).filter(Boolean),
        stockTransfers: (localData && Array.isArray(localData.stockTransfers) ? localData.stockTransfers : []).filter(Boolean)
      };
      setPendingData(safeData);
    } catch (error) {
      console.error("Failed to load approvals", error);
      setPendingData({ bills: [], expenses: [], stockTransfers: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (type, id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this ?`)) return;
    
    try {
      // Try to update locally if dbService supports it
      if (dbService.updateApproval) {
         await dbService.updateApproval(id, status);
      }
      
      await syncQueue.enqueue({ entityId: id, entity: 'approval', method: "POST", url: "/api/approvals/update", data: { type, id, status } });
      alert(`Offline: ${status} action recorded safely!`);
      fetchApprovals(); // Refresh list after action
    } catch (error) {
      alert('Action failed: ' + error.message);
    }
  };

  const renderEmpty = (msg) => (
    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed mt-4">
      <CheckCircle size={40} className="mx-auto text-gray-300 mb-2" />
      <p className="text-lg font-medium">All caught up!</p>
      <p className="text-sm">No pending {msg} requiring your approval.</p>
    </div>
  );

  const safeBills = pendingData?.bills || [];
  const safeExpenses = pendingData?.expenses || [];
  const safeTransfers = pendingData?.stockTransfers || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
          <p className="text-gray-500">Review and approve actions requested by staff.</p>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          <button onClick={() => setActiveTab('bills')} className={`px-4 py-2 font-medium border-b-2 flex gap-2 items-center ${activeTab === 'bills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <FileText size={18}/> Invoices ({safeBills.length})
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 font-medium border-b-2 flex gap-2 items-center ${activeTab === 'expenses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <Receipt size={18}/> Expenses ({safeExpenses.length})
          </button>
          <button onClick={() => setActiveTab('transfers')} className={`px-4 py-2 font-medium border-b-2 flex gap-2 items-center ${activeTab === 'transfers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <Truck size={18}/> Stock Transfers ({safeTransfers.length})
          </button>
        </div>

        {loading ? <p className="text-center py-10 text-gray-500">Loading pending requests...</p> : (
          <div className="space-y-4">
            
            {/* Bills Tab */}
            {activeTab === 'bills' && (safeBills.length === 0 ? renderEmpty('invoices') : safeBills.map(item => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-blue-500 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{item.billNumber} <span className="text-sm font-normal text-gray-500">({new Date(item.date).toLocaleDateString()})</span></h3>
                  <p className="text-gray-600">Customer: <span className="font-medium">{item.customerName}</span> | Amount: <span className="font-bold text-red-600">₹{item.total}</span></p>
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><Clock size={12}/> Pending Cashier Draft</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('bill', item._id, 'rejected')} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center gap-1"><XCircle size={16}/> Reject</button>
                  <button onClick={() => handleAction('bill', item._id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"><CheckCircle size={16}/> Approve</button>
                </div>
              </div>
            )))}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (safeExpenses.length === 0 ? renderEmpty('expenses') : safeExpenses.map(item => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-yellow-500 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{item.title} <span className="text-sm font-normal text-gray-500">({new Date(item.date).toLocaleDateString()})</span></h3>
                  <p className="text-gray-600">Category: {item.category || 'General'} | Amount Claimed: <span className="font-bold text-red-600">₹{item.amount}</span></p>
                  {item.description && <p className="text-sm text-gray-500 italic mt-1">"{item.description}"</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('expense', item._id, 'rejected')} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center gap-1"><XCircle size={16}/> Reject</button>
                  <button onClick={() => handleAction('expense', item._id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"><CheckCircle size={16}/> Approve</button>
                </div>
              </div>
            )))}

            {/* Stock Transfers Tab */}
            {activeTab === 'transfers' && (safeTransfers.length === 0 ? renderEmpty('stock transfers') : safeTransfers.map(item => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-purple-500 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Transfer #{item.transferNumber}</h3>
                  <p className="text-gray-600 font-medium mt-1">
                    From: <span className="text-blue-600">{item.fromBranchId?.name || 'Main'}</span> ➡️ To: <span className="text-green-600">{item.toBranchId?.name || 'Godown'}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Items: {item.items?.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('transfer', item._id, 'rejected')} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center gap-1"><XCircle size={16}/> Reject</button>
                  <button onClick={() => handleAction('transfer', item._id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"><CheckCircle size={16}/> Approve</button>
                </div>
              </div>
            )))}

          </div>
        )}
      </div>
    </div>
  );
}
