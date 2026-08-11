import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, ShoppingBag, X, History } from 'lucide-react';

// Dummy auth context hook - replace with your actual implementation
const useAuth = () => ({ user: { role: 'owner' } }); // DUMMY: 'owner', 'manager', or 'staff'

export default function CustomerSummaryModal({ partyId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchSummary = async () => {
      if (!partyId) return;
      setLoading(true);
      try {
        // For desktop, always try to fetch latest from API if online
        if (navigator.onLine) {
            const res = await api.get(`/api/parties/${partyId}/summary`);
            setCustomer(res.data.summary);
        } else {
            // Offline logic can be added here if needed, e.g., from dbService
            alert("You are offline. Cannot fetch customer summary.");
            onClose();
        }
      } catch (err) {
        console.error("Failed to fetch customer summary", err);
        alert("Could not load customer data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [partyId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Customer 360° View</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>
        {loading ? ( 
          <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : customer ? (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-8 h-8 text-blue-600" /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{customer.name}</h3>
                <p className="text-gray-500">{customer.mobileNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
              {(user.role === 'owner' || user.role === 'manager') && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 font-medium">Lifetime Value</p>
                  <p className="text-2xl font-bold text-blue-600">₹{customer.lifetimeValue?.toFixed(2)}</p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 font-medium">Total Visits</p>
                <p className="text-2xl font-bold text-blue-600">{customer.visitCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-500 font-medium">Returns ({customer.returnCount})</p>
                <p className="text-2xl font-bold text-red-600">₹{customer.totalReturnValue?.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 font-medium">First / Last Visit</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(customer.firstVisit).toLocaleDateString()} / {new Date(customer.lastVisit).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><ShoppingBag size={18} /> Top Purchased Products</h4>
                {customer.topProducts?.length > 0 ? (
                  <ul className="space-y-2">
                    {customer.topProducts.map(prod => (
                      <li key={prod.name} className="flex justify-between bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-700">{prod.name}</span>
                        <span className="font-semibold text-gray-900">{prod.quantity} units</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No product data available.</p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><History size={18} /> Recent Transactions</h4>
                {customer.transactionHistory?.length > 0 ? (
                  <ul className="space-y-2">
                    {customer.transactionHistory.map((tx, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <div>
                          <p className="font-medium text-gray-800">{tx.details}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`font-bold ${tx.type === 'Sale' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'Sale' ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No recent transactions found.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500"><p>Could not load customer data.</p></div>
        )}
      </div>
    </div>
  );
}