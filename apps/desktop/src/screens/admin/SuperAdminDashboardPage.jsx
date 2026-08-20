import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  ShieldCheck, Users, HardDrive, Cpu, DollarSign, 
  TrendingUp, RefreshCw, Search, CheckCircle, Smartphone, 
  Cloud, Award, Gift, ArrowUpRight, BarChart3, Database
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/metrics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handlePlanChange = async (companyId, newPlan) => {
    setUpdatingId(companyId);
    try {
      await api.patch('/api/admin/companies/' + companyId + '/plan', { planType: newPlan });
      alert("✅ कंपनी का प्लान सफलतापूर्वक बदल दिया गया!");
      fetchMetrics();
    } catch (err) {
      alert("Failed to update plan");
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = data?.summary || {};
  const companies = data?.companies || [];
  const recentAiLogs = data?.recentAiLogs || [];

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || (c.planType || 'pro').toLowerCase() === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              Super Admin Only
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-bold">ERP SaaS Master Control</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <ShieldCheck className="text-red-600" size={26} />
            SaaS Platform Analytics & Admin Hub
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            सभी दुकानों के लाइव रिकॉर्ड्स, AI टोकन खपत, स्टोरेज डेटा यूसेज और 3-Tier प्लान लाइसेंसिंग
          </p>
        </div>

        <button 
          onClick={fetchMetrics}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 4 Master KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Registered Businesses</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            {(summary.totalCompanies || 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-blue-600">Dukans</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">
            Total Users: {(summary.totalUsers || 0).toLocaleString('en-IN')}
          </p>
        </div>

        {/* AI Tokens Metered */}
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 p-5 rounded-2xl border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">AI Tokens Metered</span>
            <Cpu size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            {(summary.aiMetrics?.totalTokensUsed || 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-purple-600">Tokens</span>
          </div>
          <p className="text-[11px] text-purple-700 mt-1 font-medium">
            Queries: {summary.aiMetrics?.totalQueries || 0} | Est. Cost: ₹{(summary.aiMetrics?.totalCostInr || 0).toFixed(2)}
          </p>
        </div>

        {/* Storage / Cloud Data Usage */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cloud Data Storage</span>
            <HardDrive size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {summary.storageMetrics?.estimatedStorageMB || 0} <span className="text-xs font-bold text-emerald-600">MB</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            Docs: {(summary.storageMetrics?.totalDocuments || 0).toLocaleString('en-IN')} | Avg: {summary.storageMetrics?.averagePerCompanyKB || 0} KB/shop
          </p>
        </div>

        {/* 20% Discounts & Revenue */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Estimated ARR</span>
            <Award size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            ₹{(summary.saasRevenue?.estimatedAnnualRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
            <Gift size={12} /> 20% Referral Discounts Active
          </p>
        </div>
      </div>

      {/* 3-Tier SaaS Distribution Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-600" />
          3-Tier Subscription Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone size={14} className="text-slate-600" />
                📱 Mobile Offline (₹299/yr)
              </div>
              <div className="text-gray-500 text-[11px] mt-0.5">100% Local SQLite Only</div>
            </div>
            <div className="text-xl font-black text-slate-800">
              {summary.planDistribution?.offline || 0}
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Cloud size={14} className="text-blue-600" />
                ☁️ Cloud Hybrid (₹599/yr)
              </div>
              <div className="text-blue-600 text-[11px] mt-0.5">Mobile + Auto Cloud Backup</div>
            </div>
            <div className="text-xl font-black text-blue-900">
              {summary.planDistribution?.hybrid || 0}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-600" />
                🚀 Enterprise Pro (₹2,999/yr)
              </div>
              <div className="text-emerald-700 text-[11px] mt-0.5">Web + Desktop + Mobile 3-Way</div>
            </div>
            <div className="text-xl font-black text-emerald-900">
              {summary.planDistribution?.pro || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Companies Master Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">All Registered Businesses & Plan Control</h2>
            <p className="text-xs text-gray-500">Search by shop name, owner or phone to view usage & change plans</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search shop, phone, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
            >
              <option value="all">All Plans</option>
              <option value="offline">Offline (₹299)</option>
              <option value="hybrid">Cloud (₹599)</option>
              <option value="pro">Pro (₹2999)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-black tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Business / Dukan</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4 text-center">Active Plan</th>
                <th className="py-3 px-4 text-right">AI Tokens Metered</th>
                <th className="py-3 px-4 text-center">Plan Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredCompanies.map(c => (
                <tr key={c._id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-[11px] text-gray-500">GST: {c.gstNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-800">{c.ownerName}</div>
                    <div className="text-[11px] text-gray-500">{c.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={'px-2.5 py-1 rounded-full text-[10px] font-black ' + (
                      c.planType === 'offline' ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                      c.planType === 'hybrid' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    )}>
                      {c.planType === 'offline' ? '📱 Offline (₹299)' :
                       c.planType === 'hybrid' ? '☁️ Cloud (₹599)' : '🚀 Pro (₹2,999)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-purple-900">
                    {(c.aiTokensUsed || 0).toLocaleString('en-IN')} <span className="text-[10px] text-gray-500">Tokens</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={c.planType || 'pro'}
                      onChange={(e) => handlePlanChange(c._id, e.target.value)}
                      disabled={updatingId === c._id}
                      className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-bold outline-none cursor-pointer"
                    >
                      <option value="offline">Set Offline (₹299)</option>
                      <option value="hybrid">Set Cloud (₹599)</option>
                      <option value="pro">Set Pro (₹2999)</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">
                    No businesses found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
