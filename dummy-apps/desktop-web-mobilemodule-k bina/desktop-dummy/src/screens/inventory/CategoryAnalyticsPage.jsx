import React, { useState, useEffect } from "react";
import { dbService } from "../../services/dbService";
import { Package, AlertTriangle, TrendingUp, Eye, BarChart3, ShoppingCart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CategoryAnalyticsPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [groupBy, setGroupBy] = useState("category");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (inventory.length > 0) {
      processData(inventory, groupBy);
    }
  }, [groupBy, inventory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const products = await dbService.getProducts() || [];
      const safe = Array.isArray(products) ? products : [];
      setInventory(safe);
      processData(safe, groupBy);
    } catch (e) {
      console.error("Error fetching inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  const processData = (items, groupByKey) => {
      // Group by category
      const grouped = {};
      items.forEach(p => {
        let cat = p[groupByKey];
        if (!cat || String(cat).trim() === '') {
          cat = `Uncategorized ${groupByKey}`;
        }
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      });

      // Calculate stats per category
      const stats = {};
      Object.keys(grouped).forEach(cat => {
        const items = grouped[cat];
        const lowStockCount = items.filter(p => (p.currentStock || 0) < (p.minimumStock || 10)).length;
        const totalValue = items.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0);
        const totalStock = items.reduce((sum, p) => sum + (p.currentStock || 0), 0);

        stats[cat] = {
          itemCount: items.length,
          lowStockCount,
          totalValue,
          totalStock,
          items,
        };
      });

      setCategories(Object.keys(grouped).sort());
      setCategoryStats(stats);
      setSelectedCategory(null);
  };

  if (loading) return <div className="p-6 text-center">Loading categories...</div>;

  const getGroupLabel = () => {
    if (groupBy === 'category') return 'Category';
    if (groupBy === 'subCategory') return 'Sub-Category';
    if (groupBy === 'brand') return 'Brand';
    return 'Category';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={32} /> Inventory Analytics
            </h1>
            <p className="text-gray-600">View inventory grouped by categories, sub-categories, or brands.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <label className="text-sm font-medium text-gray-700 pl-2">Group By:</label>
            <select 
              className="border-none bg-gray-50 rounded-md py-1.5 px-3 text-sm font-semibold text-blue-700 focus:ring-0 cursor-pointer outline-none"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="category">Category</option>
              <option value="subCategory">Sub-Category</option>
              <option value="brand">Brand / Company</option>
            </select>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No {getGroupLabel().toLowerCase()} data found. Add products first.</p>
          </div>
        ) : (
          <div>
            {!selectedCategory ? (
              /* Category Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categories.map(cat => {
                const stats = categoryStats[cat] || {};
                const lowStockPct = stats.itemCount > 0 ? ((stats.lowStockCount / stats.itemCount) * 100).toFixed(0) : 0;

                return (
                  <div
                    key={cat}
                    className="bg-white rounded-lg shadow border-l-4 border-blue-500 p-5 hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-bold text-gray-800">{cat}</h2>
                      <Package className="text-blue-500" size={20} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-semibold text-gray-900">{stats.itemCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Low Stock:</span>
                        <span className={`font-semibold ${stats.lowStockCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {stats.lowStockCount} ({lowStockPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Stock Value:</span>
                        <span className="font-semibold text-gray-900">₹{stats.totalValue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Qty in Stock:</span>
                        <span className="font-semibold text-blue-600">{stats.totalStock}</span>
                      </div>
                    </div>

                    <button className="mt-4 w-full bg-blue-100 text-blue-700 py-2 rounded font-medium text-sm hover:bg-blue-200 flex items-center justify-center gap-1">
                      <Eye size={16} /> View Details
                    </button>
                  </div>
                );
              })}
            </div>
            ) : (
              /* Selected Category Details */
              categoryStats[selectedCategory] && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"><ArrowLeft size={24} /></button>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCategory}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Items</p>
                    <p className="text-2xl font-bold text-blue-600">{categoryStats[selectedCategory].itemCount}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{categoryStats[selectedCategory].lowStockCount}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Stock Qty</p>
                    <p className="text-2xl font-bold text-green-600">{categoryStats[selectedCategory].totalStock}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Stock Value</p>
                    <p className="text-2xl font-bold text-purple-600">₹{(categoryStats[selectedCategory].totalValue / 1000).toFixed(1)}K</p>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left font-semibold">Product Name</th>
                        <th className="p-3 text-left font-semibold">SKU</th>
                        <th className="p-3 text-right font-semibold">Stock</th>
                        <th className="p-3 text-right font-semibold">Min</th>
                        <th className="p-3 text-right font-semibold">Cost Price</th>
                        <th className="p-3 text-right font-semibold">Value</th>
                        <th className="p-3 text-center font-semibold">Status</th>
                        <th className="p-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryStats[selectedCategory].items.map((p, i) => {
                        const isLow = (p.currentStock || 0) < (p.minimumStock || 10);
                        const value = (p.currentStock || 0) * (p.costPrice || 0);

                        return (
                          <tr key={i} className={isLow ? 'bg-orange-50' : ''}>
                            <td className="p-3 font-medium text-gray-900">{p.name}</td>
                            <td className="p-3 text-gray-600">{p.sku}</td>
                            <td className="p-3 text-right font-semibold">{p.currentStock || 0}</td>
                            <td className="p-3 text-right text-gray-600">{p.minimumStock || 10}</td>
                            <td className="p-3 text-right text-gray-600">₹{p.costPrice || 0}</td>
                            <td className="p-3 text-right font-semibold">₹{value.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              {isLow ? (
                                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                                  <AlertTriangle size={14} /> Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                  <TrendingUp size={14} /> OK
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isLow && (
                                <button onClick={(e) => { e.stopPropagation(); navigate('/inventory/purchase'); }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 justify-center mx-auto shadow-sm transition">
                                  <ShoppingCart size={14} /> Restock
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
