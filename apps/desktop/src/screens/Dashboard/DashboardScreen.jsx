import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, AlertCircle, Clock, Landmark, Wallet } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { dbService } from "../../services/dbService";

export default function DashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    cashInHand: 0,
    bankBalance: 0,
    completedPayments: 0,
    activeProducts: 0,
    chartData: [0, 0, 0, 0, 0, 0],
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    expenseBreakdown: []
  });
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      let billsData = [];
      let productsCount = 3;
      const billsMap = new Map();
      const expenseMap = new Map();

      // 1. STRICT OFFLINE: Read ONLY from SQLite Data
        try {
        const localBills = await dbService.getInvoices();
        (localBills || []).forEach(b => {
          const formatted = {
            _id: b.uuid || b._id || b.id,
            billNumber: b.invoice_number || b.billNumber,
            customerName: b.customer_uuid === 'walk-in' ? 'Cash' : (b.customerName || 'Customer'),
            total: b.total_amount || b.total || b.finalAmount || 0,
            status: b.status || 'draft',
            createdAt: b.date || b.createdAt || new Date().toISOString()
          };
          billsMap.set(formatted._id, formatted);
        });
        const localExps = await dbService.getExpenses();
        (localExps || []).forEach(e => expenseMap.set(e.uuid || e._id || e.id, e));
        const localInventory = await dbService.getInventory();
        productsCount = localInventory ? localInventory.length : 0;
        } catch(e) { console.error("SQLite Read Error", e); }
      
      // 2. PROCESS DATA
      const processAndSetStats = () => {
        billsData = Array.from(billsMap.values());
        billsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBills(billsData.slice(0, 8));

        const totalRevenue = billsData.reduce((sum, b) => sum + (Number(b.total) || 0), 0);

        const expensesData = Array.from(expenseMap.values());
        const totalExpenses = expensesData.reduce((sum, e) => sum + (parseFloat(e.amount) || parseFloat(e.price) || 0), 0);

        const pendingPayments = billsData.filter((b) => b.status !== "paid" && b.status !== "cancelled").length;
        const completedPayments = billsData.filter((b) => b.status === "paid").length;

        // Calculate last 6 months revenue for chart
        const monthlyRevenue = [0, 0, 0, 0, 0, 0];
        const monthNames = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          monthNames.push(d.toLocaleString('default', { month: 'short' }));
        }
        billsData.forEach(b => {
          const d = new Date(b.createdAt);
          const monthDiff = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
          if (monthDiff >= 0 && monthDiff < 6) {
            monthlyRevenue[5 - monthDiff] += (Number(b.total) || 0);
          }
        });
        const maxRev = Math.max(...monthlyRevenue, 100);
        const chartData = monthlyRevenue.map(rev => (rev / maxRev) * 100);

        // Expense Breakdown
        const expensesByCategory = {};
        expensesData.forEach(e => {
          const cat = e.category || e.type || 'Other';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (parseFloat(e.amount) || parseFloat(e.price) || 0);
        });
        const expenseBreakdown = Object.keys(expensesByCategory).map(cat => ({
          label: cat,
          amount: expensesByCategory[cat],
          percentage: totalExpenses > 0 ? (expensesByCategory[cat] / totalExpenses) * 100 : 0
        })).sort((a,b) => b.amount - a.amount).slice(0, 4);

        // Temporary Logic for Cash and Bank (We will replace this with real Banking data later)
        const estCashInHand = (totalRevenue * 0.4) - (totalExpenses * 0.6); // Just a placeholder formula
        const estBankBalance = (totalRevenue * 0.6) - (totalExpenses * 0.4); // Just a placeholder formula

        setStats({
          totalRevenue, totalExpenses, pendingPayments, completedPayments,
          activeProducts: productsCount, chartData, monthNames, expenseBreakdown,
          cashInHand: estCashInHand > 0 ? estCashInHand : 0, bankBalance: estBankBalance > 0 ? estBankBalance : 0
        });
      };

      // Immediately render Offline Data
      processAndSetStats();
      setLoading(false); // Stop loading immediately for snappy UX

    } catch (err) {
      console.error("Dashboard error:", err);
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
          label="Cash in Hand"
          value={`₹${stats.cashInHand.toLocaleString()}`}
          change="Updated live"
          icon={<Wallet className="text-cyan-600" size={20} />}
          bgColor="bg-cyan-50"
          borderColor="border-cyan-200"
        />

        <KPICard
          label="Bank Balance"
          value={`₹${stats.bankBalance.toLocaleString()}`}
          change="Updated live"
          icon={<Landmark className="text-indigo-600" size={20} />}
          bgColor="bg-indigo-50"
          borderColor="border-indigo-200"
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
            <button 
              onClick={() => navigate("/billing")} 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </button>
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
                        <button 
                          onClick={() => navigate(`/billing/${bill._id}`)} 
                          className="text-blue-600 hover:underline font-medium text-left"
                        >
                          {bill.billNumber}
                        </button>
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
                      No bills yet. <button onClick={() => navigate("/billing")} className="text-blue-600 hover:underline">Create one</button>
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
              <ActionButton label="Create Invoice" onClick={() => navigate("/billing")} icon="📄" color="blue" />
              <ActionButton label="Add Product" onClick={() => navigate("/inventory")} icon="📦" color="green" />
              <ActionButton label="Record Expense" onClick={() => navigate("/expenses")} icon="💰" color="orange" />
              <ActionButton label="View Reports" onClick={() => navigate("/reports")} icon="📊" color="purple" />
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
            {stats.chartData.map((height, i) => (
              <div
                key={i}
                className="w-full h-full mx-1 bg-blue-500 rounded-t opacity-75 hover:opacity-100 transition"
                style={{ height: `${height}%` }}
                title={`Revenue for ${stats.monthNames[i]}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            {stats.monthNames.map((month, i) => (
              <span key={i}>{month}</span>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            {stats.expenseBreakdown.length > 0 ? (
              stats.expenseBreakdown.map((exp, i) => (
                <ExpenseItem key={i} label={exp.label} amount={exp.amount} percentage={exp.percentage} color={i % 2 === 0 ? "from-red-400" : "from-blue-400"} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No expenses recorded yet.</p>
            )}
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

function ActionButton({ label, onClick, icon, color }) {
  const colors = {
    blue: "hover:bg-blue-50 text-blue-700",
    green: "hover:bg-green-50 text-green-700",
    orange: "hover:bg-orange-50 text-orange-700",
    purple: "hover:bg-purple-50 text-purple-700",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 ${colors[color]} transition font-medium`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
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
