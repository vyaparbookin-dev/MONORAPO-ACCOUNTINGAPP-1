import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, AlertCircle, Clock } from "lucide-react";
import api from "../../services/api";

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    completedPayments: 0,
    activeProducts: 0,
  });
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const billsResponse = await api.get("/api/billing");
      const rawData = billsResponse.data || billsResponse;
      const billsData = Array.isArray(rawData) ? rawData : (rawData.bills || []);
      setBills(billsData.slice(0, 8));

      const totalRevenue = billsData.reduce((sum, b) => sum + (b.total || 0), 0);
      const totalExpenses = 55000; // From seed data
      const pendingPayments = billsData.filter((b) => b.status !== "paid").length;
      const completedPayments = billsData.filter((b) => b.status === "paid").length;

      setStats({
        totalRevenue,
        totalExpenses,
        pendingPayments,
        completedPayments,
        activeProducts: 3,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      // क्रैश होने से बचाने के लिए डिफ़ॉल्ट/खाली डेटा सेट करें
      setBills([]);
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        pendingPayments: 0,
        completedPayments: 0,
        activeProducts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const netProfit = stats.totalRevenue - stats.totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change="+12.5%"
          icon={<ArrowUpRight className="text-green-600" size={20} />}
          bgColor="bg-green-50"
          borderColor="border-green-200"
        />

        <KPICard
          label="Total Expenses"
          value={`₹${stats.totalExpenses.toLocaleString()}`}
          change="+8.2%"
          icon={<ArrowDownLeft className="text-red-600" size={20} />}
          bgColor="bg-red-50"
          borderColor="border-red-200"
        />

        <KPICard
          label="Net Profit"
          value={`₹${netProfit.toLocaleString()}`}
          change="+15.3%"
          icon={<TrendingUp className="text-blue-600" size={20} />}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
        />

        <KPICard
          label="Pending Payments"
          value={stats.pendingPayments}
          subtext={`₹${(stats.totalRevenue * 0.3).toLocaleString()}`}
          icon={<Clock className="text-orange-600" size={20} />}
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
        />

        <KPICard
          label="Active Products"
          value={stats.activeProducts}
          subtext="3 low stock"
          icon={<AlertCircle className="text-purple-600" size={20} />}
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills - Larger Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <p className="text-sm text-gray-600">Latest transactions</p>
            </div>
            <a href="/billing" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.length > 0 ? (
                  bills.map((bill) => (
                    <tr key={bill._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <a href={`/billing/${bill._id}`} className="text-blue-600 hover:underline font-medium">
                          {bill.billNumber}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{bill.customerName}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{bill.total?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {bill.createdAt
                          ? new Date(bill.createdAt).toLocaleDateString("en-IN")
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No bills yet. <a href="/billing" className="text-blue-600 hover:underline">Create one</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <ActionButton label="Create Invoice" href="/billing" icon="📄" color="blue" />
              <ActionButton label="Add Product" href="/inventory" icon="📦" color="green" />
              <ActionButton label="Record Expense" href="/expenses" icon="💰" color="orange" />
              <ActionButton label="View Reports" href="/reports" icon="📊" color="purple" />
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-600" />
              Alerts
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-orange-600 font-bold">•</span>
                <span className="text-gray-700">
                  <strong>3 products</strong> have low stock
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-red-600 font-bold">•</span>
                <span className="text-gray-700">
                  <strong>INV001</strong> is 10 days overdue
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-gray-700">
                  <strong>2 invoices</strong> pending approval
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64 bg-gradient-to-t from-blue-100 to-transparent rounded-lg flex items-end justify-around p-4">
            {[40, 60, 55, 75, 65, 80].map((height, i) => (
              <div
                key={i}
                className="w-full h-full mx-1 bg-blue-500 rounded-t opacity-75 hover:opacity-100 transition"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            <ExpenseItem label="Rent" amount={50000} percentage={45} color="from-red-400" />
            <ExpenseItem label="Utilities" amount={5000} percentage={5} color="from-orange-400" />
            <ExpenseItem label="Salary" amount={75000} percentage={68} color="from-blue-400" />
            <ExpenseItem label="Supplies" amount={15000} percentage={13} color="from-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, change, subtext, icon, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} rounded-xl border ${borderColor} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-600 mt-1">{subtext}</p>}
      </div>
      {change && <p className="text-xs font-medium text-green-600">{change} vs last month</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const statuses = {
    paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
    issued: { bg: "bg-blue-100", text: "text-blue-800", label: "Issued" },
    draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  };

  const style = statuses[status] || statuses.draft;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function ActionButton({ label, href, icon, color }) {
  const colors = {
    blue: "hover:bg-blue-50 text-blue-700",
    green: "hover:bg-green-50 text-green-700",
    orange: "hover:bg-orange-50 text-orange-700",
    purple: "hover:bg-purple-50 text-purple-700",
  };

  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 ${colors[color]} transition font-medium`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </a>
  );
}

function ExpenseItem({ label, amount, percentage, color }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color} to-orange-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
