import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Package, TrendingUp, DollarSign, History, ShoppingCart } from 'lucide-react';
import Loader from '../Loader';

// Dummy auth context hook - replace with your actual implementation
const useAuth = () => ({ user: { role: 'owner' } }); // DUMMY: 'owner', 'manager', or 'staff'

export default function ProductAnalyticsModal({ productId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Get user from auth context

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/products/${productId}/analytics`);
        setData(res.data.analytics);
      } catch (err) {
        console.error("Failed to fetch product analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [productId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return null; // Or some error state
  }

  const { product, profitability, daysInStock, purchaseHistory } = data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{product.name} - Analytics</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-500 font-medium">Current Stock</p>
              <p className="text-2xl font-bold text-blue-600">{product.currentStock} <span className="text-base font-normal">{product.unit}</span></p>
            </div>
            {/* Show profitability only to owner or manager */}
            {(user.role === 'owner' || user.role === 'manager') && (
              <>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-500 font-medium">Profit Margin</p>
                  <p className="text-2xl font-bold text-green-600">{profitability.margin.toFixed(2)}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-500 font-medium">Total Profit</p>
                  <p className="text-2xl font-bold text-purple-600">₹{profitability.totalProfit.toFixed(2)}</p>
                </div>
              </>
            )}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-500 font-medium">Days in Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{daysInStock}</p>
            </div>
          </div>

          {/* Purchase History & Quick Order */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><History size={18} /> Recent Purchase History</h3>
              {product.currentStock < (product.minimumStock || 10) && (
                 <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition">
                    <ShoppingCart size={18} /> Create Purchase Order
                 </button>
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {purchaseHistory.length > 0 ? purchaseHistory.map(p => (
                <div key={p._id} className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-md">
                  <span className="text-gray-600">{new Date(p.date).toLocaleDateString()}</span>
                  <span className="font-medium text-gray-800 col-span-2">From: {p.partyId?.name || 'N/A'}</span>
                  <span className="font-semibold text-right">₹{p.items.find(i => i.productId.toString() === productId)?.price.toFixed(2)}/unit</span>
                </div>
              )) : <p className="text-gray-500 text-center py-4">No purchase history found.</p>}
            </div>
          </div>

          {/* Sales Trend (Placeholder for graph) */}
          <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp size={18} /> Sales Trend (Last 6 Months)</h3>
             <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Graph will be implemented here.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}