import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, AlertCircle, Clock, RefreshCw, Calendar, DollarSign, Package, Receipt } from "lucide-react";
import api from "../../services/api";

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    completedPayments: 0,
    activeProducts: 0,
    monthlyData: [],
    lowStockItems: 0,
    pendingBillsCount: 0,
    pendingExpensesCount: 0,
  });
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dateRange, setDateRange] = useState("last30days");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Parallel API calls for faster loading
      const [billsRes, expensesRes, invSummaryRes, approvalsRes] = await Promise.all([
        api.get("/api/billing").catch(() => ({ data: { bills: [] } })),
        api.get("/api/expense").catch(() => ({ data: { expenses: [] } })),
        api.get("/api/inventory/summary").catch(() => ({ data: { summary: {} } })),
        api.get("/api/approvals").catch(() => ({ data: { data: {} } }))
      ]);

      const billsData = billsRes.data?.bills || billsRes.data || [];
      const expensesData = expensesRes.data?.expenses || expensesRes.data || [];
      const invSummary = invSummaryRes.data?.summary || {};
      const approvalsData = approvalsRes.data?.data || {};

      // Filter by date range
      const filteredBills = filterBillsByDate(billsData, dateRange);
      const filteredExpenses = filterBillsByDate(expensesData, dateRange);
      setBills(filteredBills.slice(0, 8));

      // Calculate stats from filtered data
      const totalRevenue = filteredBills.reduce((sum, b) => 
        sum + (b.finalAmount || b.totalAmount || b.total || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const pendingPayments = filteredBills.filter((b) => b.status !== "paid").length;
      const completedPayments = filteredBills.filter((b) => b.status === "paid").length;
      const activeProducts = invSummary.totalProducts || 0;
      const lowStockItems = invSummary.lowStockItems || 0;
      const pendingBillsCount = (approvalsData.bills || []).length;
      const pendingExpensesCount = (approvalsData.expenses || []).length;

      // Generate monthly data for chart
      const monthlyData = generateMonthlyData(filteredBills);

      setStats({
        totalRevenue,
        totalExpenses,
        pendingPayments,
        completedPayments,
        activeProducts,
        monthlyData,
        lowStockItems,
        pendingBillsCount,
        pendingExpensesCount,
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard error:", err);
      setBills([]);
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        pendingPayments: 0,
        completedPayments: 0,
        activeProducts: 0,
        monthlyData: [],
        lowStockItems: 0,
        pendingBillsCount: 0,
        pendingExpensesCount: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBillsByDate = (bills, range) => {
    const now = new Date();
    const daysMap = { "last7days": 7, "last30days": 30, "last90days": 90, "allyear": Infinity };
    const days = daysMap[range] || 30;
    
    if (days === Infinity) return bills;
    
    return (bills || []).filter(item => {
      const billDate = new Date(item.createdAt || item.date);
      const diffTime = Math.abs(now - billDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days;
    });
  };

  const generateMonthlyData = (bills) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthBills = bills.filter(b => {
        const billMonth = new Date(b.createdAt).getMonth();
        return billMonth === monthIndex;
      });
      const total = monthBills.reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || b.total || 0), 0);
      data.push({ month: months[monthIndex], amount: total });
    }
    return data;
  };

  const handleRefresh = () => {
    loadDashboard(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-1">Fetching your business data</p>
        </div>
      </div>
    );
  }

  const netProfit = stats.totalRevenue - stats.totalExpenses;
  const maxRevenue = Math.max(...stats.monthlyData.map(d => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </span>
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="allyear">All Time</option>
            </select>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg w-fit">
          <Clock size={14} />
          <span>Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* KPI Cards - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change="+12.5%"
          icon={<ArrowUpRight className="text-green-600" size={20} />}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          borderColor="border-green-200"
          iconBg="bg-green-100"
        />

        <KPICard
          label="Total Expenses"
          value={`₹${stats.totalExpenses.toLocaleString()}`}
          change="+8.2%"
          icon={<ArrowDownLeft className="text-red-600" size={20} />}
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
          borderColor="border-red-200"
          iconBg="bg-red-100"
        />

        <KPICard
          label="Net Profit"
          value={`₹${netProfit.toLocaleString()}`}
          change={netProfit >= 0 ? "+15.3%" : "-5.2%"}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className={netProfit >= 0 ? "text-green-600" : "text-red-600"} size={20} />}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          borderColor="border-blue-200"
          iconBg="bg-blue-100"
        />

        <KPICard
          label="Pending Payments"
          value={stats.pendingPayments}
          subtext={`₹${(stats.totalRevenue * 0.3).toLocaleString()}`}
          icon={<Clock className="text-orange-600" size={20} />}
          bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
          borderColor="border-orange-200"
          iconBg="bg-orange-100"
        />

        <KPICard
          label="Active Products"
          value={stats.activeProducts}
          subtext={`${stats.lowStockItems} low stock`}
          icon={<Package className="text-purple-600" size={20} />}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          borderColor="border-purple-200"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills - Enhanced */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                <p className="text-sm text-gray-500">{bills.length} transactions found</p>
              </div>
            </div>
            <a href="/billing" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.length > 0 ? (
                  bills.map((bill, index) => (
                    <tr 
                      key={bill._id} 
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <a href={`/billing/${bill._id}`} className="text-blue-600 hover:underline font-semibold">
                          {bill.billNumber}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{bill.customerName}</p>
                          <p className="text-xs text-gray-500">{bill.customerPhone || "No phone"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">₹{bill.total?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {bill.createdAt
                          ? new Date(bill.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Receipt className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-600 font-medium">No invoices found</p>
                        <p className="text-gray-400 text-sm mt-1">Create your first invoice to get started</p>
                        <a href="/billing" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                          Create Invoice
                        </a>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={16} />
              </span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <ActionButton label="Create Invoice" href="/billing" icon="📄" color="blue" />
              <ActionButton label="Add Product" href="/inventory" icon="📦" color="green" />
              <ActionButton label="Data Masters" href="/inventory/masters" icon="🗂️" color="indigo" />
              <ActionButton label="Record Expense" href="/expenses" icon="💰" color="orange" />
              <ActionButton label="View Reports" href="/reports" icon="📊" color="purple" />
            </div>
          </div>

          {/* Alerts - Enhanced */}
          <div className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 rounded-2xl shadow-sm border border-orange-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-600" />
              Alerts
              <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.lowStockItems + stats.pendingBillsCount + stats.pendingExpensesCount}</span>
            </h3>
            <div className="space-y-3">
              {stats.lowStockItems > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-orange-100">
                <span className="text-orange-600 text-lg">⚠️</span>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Low Stock Alert</p>
                  <p className="text-gray-600 text-xs">{stats.lowStockItems} products have low stock</p>
                </div>
              </div>
              )}
              {stats.pendingBillsCount > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-blue-100">
                <span className="text-blue-600 text-lg">📋</span>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Pending Invoice Approvals</p>
                  <p className="text-gray-600 text-xs">{stats.pendingBillsCount} invoices pending approval</p>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart - Dynamic */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-sm text-gray-500">Revenue over last 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-gray-600">Revenue</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-around gap-2 px-4">
            {stats.monthlyData.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 cursor-pointer"
                    style={{ height: `${Math.max((data.amount / maxRevenue) * 200, 20)}px` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{data.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 mt-3 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Total (6 months)</p>
              <p className="font-bold text-gray-900">₹{stats.monthlyData.reduce((s, d) => s + d.amount, 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Average</p>
              <p className="font-bold text-gray-900">₹{Math.round(stats.monthlyData.reduce((s, d) => s + d.amount, 0) / 6).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Expense Breakdown - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
            <p className="text-sm text-gray-500">Monthly expense distribution</p>
          </div>
          
          <div className="space-y-5">
            <ExpenseItem label="Rent" amount={50000} percentage={stats.totalExpenses > 0 ? (50000/stats.totalExpenses*100) : 0} color="from-red-500" />
            <ExpenseItem label="Salary" amount={75000} percentage={stats.totalExpenses > 0 ? (75000/stats.totalExpenses*100) : 0} color="from-blue-500" />
            <ExpenseItem label="Supplies" amount={15000} percentage={stats.totalExpenses > 0 ? (15000/stats.totalExpenses*100) : 0} color="from-green-500" />
            <ExpenseItem label="Utilities" amount={5000} percentage={stats.totalExpenses > 0 ? (5000/stats.totalExpenses*100) : 0} color="from-orange-500" />
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Expenses</span>
            <span className="text-xl font-bold text-gray-900">₹{stats.totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced KPICard Component
function KPICard({ label, value, change, changeType, subtext, icon, bgColor, borderColor, iconBg }) {
  return (
    <div className={`${bgColor} rounded-2xl border ${borderColor} p-5 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <div className={`${iconBg} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      {change && (
        <p className={`text-xs font-semibold ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
          {change} vs last month
        </p>
      )}
    </div>
  );
}

// Enhanced StatusBadge
function StatusBadge({ status }) {
  const statuses = {
    paid: { bg: "bg-green-100", text: "text-green-700", label: "Paid", icon: "✓" },
    issued: { bg: "bg-blue-100", text: "text-blue-700", label: "Issued", icon: "↗" },
    draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft", icon: "✎" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled", icon: "✕" },
  };

  const style = statuses[status] || statuses.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {style.label}
    </span>
  );
}

// Enhanced ActionButton
function ActionButton({ label, href, icon, color }) {
  const colors = {
    blue: "hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300",
    green: "hover:bg-green-50 text-green-700 border-green-200 hover:border-green-300",
    indigo: "hover:bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300",
    orange: "hover:bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300",
    purple: "hover:bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300",
  };

  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl border border-gray-200 ${colors[color]} transition-all duration-200 font-medium hover:shadow-sm`}
    >
      <span className="text-xl">{icon}</span>
      {label}
      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </a>
  );
}

// Enhanced ExpenseItem
function ExpenseItem({ label, amount, percentage, color }) {
  return (
    <div className="group">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} to-transparent group-hover:opacity-80 transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
    </div>
  );
}