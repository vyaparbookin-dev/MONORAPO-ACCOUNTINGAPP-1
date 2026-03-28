import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Receipt,
} from "lucide-react";
import api from "../../services/api";

const ReportsPage = () => {
  const [reportType, setReportType] = useState("income");
  const [dateRange, setDateRange] = useState("month");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [reportType, dateRange]);

  const exportToCsv = () => {
    if (reports.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Date", "Type", "Description", "Amount", "Category"];
    const csvContent = [
      headers.join(","),
      ...reports.map((row) =>
        [
          row.date || "",
          row.type || "",
          row.description || "",
          row.amount || 0,
          row.category || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `report_${reportType}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Use the correct POST endpoint for generating reports
      const response = await api.post("/report/generate", { type: reportType === "all" ? undefined : reportType });
      const data = response.reports || response.data || response;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      // सर्वर बंद होने पर क्रैश और पुराने डेटा से बचने के लिए खाली एरे सेट करें
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Dummy data for charts
  const chartData = {
    income: [45000, 52000, 48000, 61000, 55000, 67000],
    expenses: [30000, 35000, 28000, 32000, 27000, 38000],
    profit: [15000, 17000, 20000, 29000, 28000, 29000],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  };

  const maxValue = Math.max(...chartData.income);
  const totalIncome = chartData.income.reduce((a, b) => a + b, 0);
  const totalExpenses = chartData.expenses.reduce((a, b) => a + b, 0);
  const totalProfit = chartData.profit.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Business performance and financial analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/reports/gst" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Receipt size={20} />
            GST Report
          </Link>
          <Link to="/reports/product-gst" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
            Product GST
          </Link>
          <Link to="/reports/itemwise" className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition">
            Item-wise
          </Link>
          <Link to="/reports/billwise" className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">
            Invoices
          </Link>
          <Link to="/reports/gstr3b" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            GSTR-3B
          </Link>
          <Link to="/reports/sitewise" className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            Sitewise Report
          </Link>
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="income">Income Analysis</option>
              <option value="expenses">Expense Analysis</option>
              <option value="profit">Profit & Loss</option>
              <option value="cashflow">Cash Flow</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Income"
          value={`₹${totalIncome.toLocaleString()}`}
          change="+12.5%"
          icon={<DollarSign className="text-green-600" size={24} />}
          bgColor="bg-green-50"
        />
        <MetricCard
          label="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          change="+8.2%"
          icon={<TrendingUp className="text-red-600" size={24} />}
          bgColor="bg-red-50"
        />
        <MetricCard
          label="Net Profit"
          value={`₹${totalProfit.toLocaleString()}`}
          change="+15.3%"
          icon={<BarChart3 className="text-blue-600" size={24} />}
          bgColor="bg-blue-50"
        />
        <MetricCard
          label="Profit Margin"
          value={`${((totalProfit / totalIncome) * 100).toFixed(1)}%`}
          change="+2.1%"
          icon={<LineChart className="text-purple-600" size={24} />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Income Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LineChart size={20} className="text-blue-600" />
            Income Trend
          </h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {chartData.income.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t" style={{ height: `${(value / maxValue) * 200}px` }}></div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-blue-600">Average Monthly Income:</span> ₹
              {Math.round(totalIncome / chartData.income.length).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bar Chart - Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-red-600" />
            Expense Trend
          </h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {chartData.expenses.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-red-400 to-red-500 rounded-t" style={{ height: `${(value / maxValue) * 200}px` }}></div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-red-600">Average Monthly Expenses:</span> ₹
              {Math.round(totalExpenses / chartData.expenses.length).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Profit Margin Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Profit Margin
          </h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {chartData.profit.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-green-400 to-green-500 rounded-t" style={{ height: `${(value / maxValue) * 200}px` }}></div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-green-600">Highest Profit Month:</span> Jun - ₹
              {Math.max(...chartData.profit).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon size={20} className="text-purple-600" />
            Category Distribution
          </h3>
          <div className="space-y-4">
            <DistributionItem label="Rent" amount={50000} percentage={45} />
            <DistributionItem label="Utilities" amount={5000} percentage={5} />
            <DistributionItem label="Salary" amount={75000} percentage={68} />
            <DistributionItem label="Supplies" amount={15000} percentage={13} />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Total Expenses:</span> ₹145,000
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.slice(0, 10).map((report, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-700">{report.date || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {report.type || "Transaction"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{report.description || "N/A"}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{report.amount?.toLocaleString() || "0"}</td>
                    <td className="px-6 py-4 text-gray-700">{report.category || "Other"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No reports available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ label, value, change, icon, bgColor }) {
  return (
    <div className={`${bgColor} rounded-xl border border-gray-200 p-6`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change && <p className="text-xs text-green-600 mt-2">{change} vs last period</p>}
    </div>
  );
}

function DistributionItem({ label, amount, percentage }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default ReportsPage;
