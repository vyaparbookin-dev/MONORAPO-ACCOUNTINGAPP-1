import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { dbService } from "../../services/dbService"; // Use dbService for desktop

export default function GraphicalAnalytics() {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalExpenses: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateReport = async () => {
      setLoading(true);
      try {
        // OFFLINE-FIRST: Fetch from local SQLite DB for Desktop
        const bills = await dbService.getInvoices();
        const expenses = await dbService.getExpenses();

        const months = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            sales: 0,
            expenses: 0,
          });
        }

        bills.forEach(sale => {
          const d = new Date(sale.date || sale.createdAt);
          const monthEntry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
          if (monthEntry) monthEntry.sales += (Number(sale.totalAmount) || Number(sale.finalAmount) || Number(sale.total) || 0);
        });

        expenses.forEach(exp => {
          const d = new Date(exp.date || exp.createdAt);
          const monthEntry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
          if (monthEntry) monthEntry.expenses += (Number(exp.amount) || 0);
        });
        
        const finalChartData = months.map(m => ({
            month: m.name,
            sales: m.sales,
            expenses: m.expenses,
            profit: m.sales - m.expenses
        }));

        setChartData(finalChartData);

        const totalSales = finalChartData.reduce((sum, m) => sum + m.sales, 0);
        const totalExpenses = finalChartData.reduce((sum, m) => sum + m.expenses, 0);
        setSummary({ totalSales, totalExpenses, netProfit: totalSales - totalExpenses });

      } catch (err) {
        console.error("Failed to generate graphical report:", err);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, []);

  if (loading) {
      return <div className="text-center p-10 text-gray-500">Generating graphical report...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Advanced Graphical Reports
          </h1>
          <p className="text-gray-600 mt-1">Visualize your business performance, compare sales vs expenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Total Sales (6M)</p><p className="text-2xl font-bold text-gray-900">₹{summary.totalSales.toLocaleString()}</p></div><div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Total Expenses (6M)</p><p className="text-2xl font-bold text-gray-900">₹{summary.totalExpenses.toLocaleString()}</p></div><div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Net Profit (6M)</p><p className="text-2xl font-bold text-blue-600">₹{summary.netProfit.toLocaleString()}</p></div><div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={24} /></div></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend (Sales vs Expenses)</h3>
        <div style={{ width: '100%', height: 400, minHeight: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="expenses" name="Expenses (₹)" stroke="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}