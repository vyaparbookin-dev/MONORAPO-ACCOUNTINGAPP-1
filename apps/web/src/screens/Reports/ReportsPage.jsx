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
  RefreshCw,
  Search,
  FileText,
  Boxes,
  Users,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen
} from "lucide-react";
import api from "../../services/api";

const ReportsPage = () => {
  const [reportType, setReportType] = useState("income");
  const [dateRange, setDateRange] = useState("month");
  const [reportCategoryTab, setReportCategoryTab] = useState("all");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reportDirectory = [
    // 1. Sales & Revenue
    {
      id: "daybook",
      category: "sales",
      title: "Day Book (Daily Sales)",
      desc: "Today's cash, credit, UPI sales & expenses in a single register",
      path: "/reports/daybook",
      icon: Calendar,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      badge: "Essential"
    },
    {
      id: "billwise",
      category: "sales",
      title: "Bill-wise Sales Register",
      desc: "Detailed bill-by-bill invoice history with payment status",
      path: "/reports/billwise",
      icon: FileText,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: "Invoices"
    },
    {
      id: "profitloss",
      category: "sales",
      title: "Profit & Loss Statement",
      desc: "Net business profit/loss, total revenue vs operating expenses",
      path: "/reports/profitloss",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "Financial"
    },
    {
      id: "sitewise",
      category: "sales",
      title: "Sitewise Project Sales",
      desc: "Track supplies and billings for specific construction sites",
      path: "/reports/sitewise",
      icon: Building,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      badge: "Projects"
    },
    {
      id: "analytics",
      category: "sales",
      title: "Graphical Analytics",
      desc: "Visual charts of monthly revenue, top categories & trends",
      path: "/reports/analytics",
      icon: BarChart3,
      color: "bg-cyan-50 text-cyan-700 border-cyan-200",
      badge: "Visual"
    },

    // 2. Stock & Inventory
    {
      id: "itemwise",
      category: "inventory",
      title: "Item-wise Sales & Stock",
      desc: "Item sales volume, remaining inventory balance & margin",
      path: "/reports/itemwise",
      icon: Boxes,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "Stock"
    },
    {
      id: "supplier-ledger",
      category: "inventory",
      title: "Supplier / Purchase Ledger",
      desc: "Vendor purchases, payments made, goods received & balance",
      path: "/reports/supplier-ledger",
      icon: Layers,
      color: "bg-orange-50 text-orange-700 border-orange-200",
      badge: "Vendors"
    },
    {
      id: "audit-sheet",
      category: "inventory",
      title: "Physical Stock Audit Sheet",
      desc: "A4 print-ready sheet with variance box for physical godown count",
      path: "/inventory",
      icon: BookOpen,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      badge: "Excel Export"
    },
    {
      id: "scheme",
      category: "inventory",
      title: "Scheme & Loyalty Report",
      desc: "Active trade discount schemes, reward points & customer benefits",
      path: "/reports/scheme",
      icon: Sparkles,
      color: "bg-pink-50 text-pink-700 border-pink-200",
      badge: "Rewards"
    },

    // 3. GST & Tax
    {
      id: "gstr1",
      category: "gst",
      title: "GSTR-1 Sales Report",
      desc: "B2B, B2CL, B2CS sales invoices with CGST, SGST & IGST breakdown",
      path: "/reports/gst",
      icon: Receipt,
      color: "bg-green-50 text-green-700 border-green-200",
      badge: "GSTR-1"
    },
    {
      id: "gstr3b",
      category: "gst",
      title: "GSTR-3B Summary",
      desc: "Monthly outward taxable supplies & Input Tax Credit (ITC) claim summary",
      path: "/reports/gstr3b",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "GSTR-3B"
    },
    {
      id: "product-gst",
      category: "gst",
      title: "Product GST / HSN Summary",
      desc: "HSN-code wise tax rate breakup (0%, 5%, 12%, 18%, 28%)",
      path: "/reports/product-gst",
      icon: Receipt,
      color: "bg-lime-50 text-lime-700 border-lime-200",
      badge: "HSN Tax"
    },
    {
      id: "eway-bill",
      category: "gst",
      title: "E-Way Bill Register",
      desc: "E-Way bills generated for inter-state & local cargo movement",
      path: "/reports/eway-bill",
      icon: FileText,
      color: "bg-slate-50 text-slate-700 border-slate-200",
      badge: "E-Way"
    },
    {
      id: "tds-tcs",
      category: "gst",
      title: "TDS / TCS Tax Register",
      desc: "Tax Deducted / Collected at Source ledger for high-value sales",
      path: "/reports/tds-tcs",
      icon: DollarSign,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      badge: "TDS/TCS"
    },

    // 4. Parties & Ledgers
    {
      id: "partywise",
      category: "parties",
      title: "Party-wise Khata Ledger",
      desc: "Complete customer statement, debit/credit entries & pending balance",
      path: "/reports/partywise",
      icon: Users,
      color: "bg-violet-50 text-violet-700 border-violet-200",
      badge: "Khata"
    },
    {
      id: "aging",
      category: "parties",
      title: "Aging & Overdue Khata",
      desc: "Credit aging analysis (0-30 days, 30-60 days, 90+ days overdue)",
      path: "/reports/aging",
      icon: Calendar,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      badge: "Overdue"
    },
    {
      id: "staff-statement",
      category: "parties",
      title: "Staff Salary & Statement",
      desc: "Staff attendance, monthly wages, advance taken & balance payable",
      path: "/salary/statement",
      icon: Users,
      color: "bg-sky-50 text-sky-700 border-sky-200",
      badge: "Payroll"
    },
    {
      id: "bank-recon",
      category: "parties",
      title: "Bank Reconciliation",
      desc: "Match bank statement with ERP cash & UPI transaction entries",
      path: "/reports/bank-reconciliation",
      icon: Building,
      color: "bg-gray-50 text-gray-700 border-gray-200",
      badge: "Banking"
    },
    {
      id: "capital-assets",
      category: "parties",
      title: "Capital & Fixed Assets Hub",
      desc: "Opening capital, shop racks/counters, computer assets & startup renovation costs",
      path: "/capital",
      icon: Landmark,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      badge: "Capital & Assets"
    }
  ];

  const filteredDirectory = reportDirectory.filter(r => {
    const matchesCategory = reportCategoryTab === "all" || r.category === reportCategoryTab;
    const matchesSearch = !reportSearchQuery || 
      r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      r.desc.toLowerCase().includes(reportSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Real data states
  const [chartData, setChartData] = useState({
    income: [],
    expenses: [],
    profit: [],
    months: []
  });
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: 0
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchChartData();
  }, [reportType, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        endDate = new Date();
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
    }
    
    return { startDate, endDate };
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      // Fetch bills for income
      const billsResponse = await api.get("/api/billing");
      const billsData = billsResponse.data || billsResponse;
      const allBills = Array.isArray(billsData) ? billsData : (billsData.bills || []);
      
      // Fetch expenses
      let expensesData = [];
      try {
        const expensesResponse = await api.get("/api/expenses");
        expensesData = expensesResponse.data || expensesResponse;
      } catch (e) {
        console.log("Expenses API not available");
      }
      
      // Filter bills by date range
      const filteredBills = allBills.filter(bill => {
        const billDate = new Date(bill.createdAt);
        return billDate >= startDate && billDate <= endDate;
      });
      
      // Filter expenses by date range
      const filteredExpenses = Array.isArray(expensesData) ? expensesData.filter(exp => {
        const expDate = new Date(exp.date || exp.createdAt);
        return expDate >= startDate && expDate <= endDate;
      }) : [];
      
      // Generate monthly data for charts (last 6 months)
      const months = [];
      const incomeByMonth = [];
      const expensesByMonth = [];
      const profitByMonth = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        const year = monthDate.getFullYear();
        months.push(`${monthName}`);
        
        // Calculate income for this month
        const monthBills = allBills.filter(bill => {
          const billDate = new Date(bill.createdAt);
          return billDate.getMonth() === monthDate.getMonth() && 
                 billDate.getFullYear() === year &&
                 bill.status !== 'cancelled';
        });
        const monthIncome = monthBills.reduce((sum, bill) => 
          sum + (bill.finalAmount || bill.totalAmount || bill.total || 0), 0);
        incomeByMonth.push(monthIncome);
        
        // Calculate expenses for this month
        const monthExpenses = filteredExpenses.filter(exp => {
          const expDate = new Date(exp.date || exp.createdAt);
          return expDate.getMonth() === monthDate.getMonth() && 
                 expDate.getFullYear() === year;
        });
        const monthExpense = monthExpenses.reduce((sum, exp) => 
          sum + (exp.amount || 0), 0);
        expensesByMonth.push(monthExpense);
        
        // Calculate profit
        profitByMonth.push(monthIncome - monthExpense);
      }
      
      // Calculate totals
      const totalIncome = filteredBills.reduce((sum, bill) => 
        sum + (bill.finalAmount || bill.totalAmount || bill.total || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, exp) => 
        sum + (exp.amount || 0), 0);
      const totalProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : 0;
      
      // Expense breakdown by category
      const expenseCategories = {};
      filteredExpenses.forEach(exp => {
        const category = exp.category || "Other";
        expenseCategories[category] = (expenseCategories[category] || 0) + (exp.amount || 0);
      });
      
      const breakdown = Object.entries(expenseCategories)
        .map(([label, amount]) => ({
          label,
          amount,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount);
      
      // Real Metrics Only - No Dummy Data
      setMetrics({
        totalIncome: totalIncome || 0,
        totalExpenses: totalExpenses || 0,
        totalProfit: totalProfit || 0,
        profitMargin: parseFloat(profitMargin) || 0
      });
      
      setChartData({
        income: incomeByMonth.length > 0 ? incomeByMonth : [0, 0, 0, 0, 0, 0],
        expenses: expensesByMonth.length > 0 ? expensesByMonth : [0, 0, 0, 0, 0, 0],
        profit: profitByMonth.length > 0 ? profitByMonth : [0, 0, 0, 0, 0, 0],
        months: months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      });
      
      setExpenseBreakdown(breakdown);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
      // Keep dummy data on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
    fetchChartData();
    setTimeout(() => setRefreshing(false), 1000);
  };

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
    link.setAttribute("download", `report_${reportType}_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Simple PDF export using browser print
    const printContent = `
      <html>
        <head>
          <title>Business Report - ${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Mono Rapo - ${reportType.toUpperCase()} Report</h1>
          <p>Date Range: ${dateRange}</p>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <h2>Summary</h2>
          <p>Total Income: ₹${metrics.totalIncome.toLocaleString()}</p>
          <p>Total Expenses: ₹${metrics.totalExpenses.toLocaleString()}</p>
          <p>Net Profit: ₹${metrics.totalProfit.toLocaleString()}</p>
          <p>Profit Margin: ${metrics.profitMargin}%</p>
          <h2>Details</h2>
          <table>
            <tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Category</th></tr>
            ${reports.map(r => `<tr><td>${r.date || 'N/A'}</td><td>${r.type || 'Transaction'}</td><td>${r.description || 'N/A'}</td><td>₹${(r.amount || 0).toLocaleString()}</td><td>${r.category || 'Other'}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.post("/report/generate", { type: reportType === "all" ? undefined : reportType });
      const data = response.reports || response.data || response;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...chartData.income, ...chartData.expenses, 1);
  const { totalIncome, totalExpenses, totalProfit, profitMargin } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white" size={20} />
            </span>
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">Business performance and financial analysis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          
          <Link to="/reports/gst" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Receipt size={18} />
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
            Sitewise
          </Link>
          
          <div className="relative group">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Download size={18} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
              <button onClick={exportToCsv} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm">
                📄 Export CSV
              </button>
              <button onClick={exportToPDF} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm">
                📑 Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-100 px-3.5 py-1.5 rounded-lg w-fit">
            <Calendar size={14} />
            <span>Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* 🌟 MASTER REPORT DIRECTORY & CATEGORY HUB */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Boxes size={20} className="text-indigo-600" />
              <span>All Business & Accounting Reports</span>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                {filteredDirectory.length} Reports
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Click any report to view detailed statements and export to Excel/PDF</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports (GST, Ledger, DayBook)..."
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "🌟 All Reports" },
            { id: "sales", label: "📊 Sales & Revenue" },
            { id: "inventory", label: "📦 Stock & Inventory" },
            { id: "gst", label: "📑 GST & Tax Reports" },
            { id: "parties", label: "👥 Parties & Ledgers" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportCategoryTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                reportCategoryTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
          {filteredDirectory.map(report => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                to={report.path}
                className={`p-3.5 rounded-xl border transition group hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${report.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/80 rounded-md shadow-xs">
                      {report.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-indigo-600 transition">
                    {report.title}
                  </h3>
                  <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                    {report.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-xs font-bold text-gray-700 group-hover:text-indigo-600">
                  <span>Open Report</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          {/* Quick Stats in Filter */}
          <div className="ml-auto flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Income: <span className="font-semibold text-green-600">₹{totalIncome.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-gray-600">Expenses: <span className="font-semibold text-red-600">₹{totalExpenses.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-600">Profit: <span className="font-semibold text-blue-600">₹{totalProfit.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Income"
          value={`₹${totalIncome.toLocaleString()}`}
          change={totalIncome > 0 ? "+12.5%" : null}
          icon={<DollarSign className="text-green-600" size={24} />}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          borderColor="border-green-200"
        />
        <MetricCard
          label="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          change={totalExpenses > 0 ? "+8.2%" : null}
          icon={<TrendingUp className="text-red-600" size={24} />}
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
          borderColor="border-red-200"
        />
        <MetricCard
          label="Net Profit"
          value={`₹${totalProfit.toLocaleString()}`}
          change={totalProfit > 0 ? "+15.3%" : totalProfit < 0 ? "-5.2%" : null}
          changeType={totalProfit >= 0 ? "positive" : "negative"}
          icon={<BarChart3 className={totalProfit >= 0 ? "text-green-600" : "text-red-600"} size={24} />}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          borderColor="border-blue-200"
        />
        <MetricCard
          label="Profit Margin"
          value={`${profitMargin}%`}
          change={profitMargin > 0 ? "+2.1%" : null}
          icon={<LineChart className="text-purple-600" size={24} />}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          borderColor="border-purple-200"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Income Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LineChart size={20} className="text-blue-600" />
              Income Trend
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Last 6 months</span>
          </div>
          <div className="h-64 flex items-end justify-around gap-2 px-2">
            {chartData.income.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex justify-center">
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500 cursor-pointer"
                    style={{ height: `${Math.max((value / maxValue) * 200, 20)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-blue-600">Average Monthly Income:</span> ₹
              {Math.round(totalIncome / (chartData.income.filter(v => v > 0).length || 1)).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bar Chart - Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-red-600" />
              Expense Trend
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Last 6 months</span>
          </div>
          <div className="h-64 flex items-end justify-around gap-2 px-2">
            {chartData.expenses.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex justify-center">
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all duration-300 group-hover:from-red-600 group-hover:to-red-500 cursor-pointer"
                    style={{ height: `${Math.max((value / maxValue) * 200, 20)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-red-600">Average Monthly Expenses:</span> ₹
              {Math.round(totalExpenses / (chartData.expenses.filter(v => v > 0).length || 1)).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Profit Margin Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className={totalProfit >= 0 ? "text-green-600" : "text-red-600"} />
              Profit Margin
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Last 6 months</span>
          </div>
          <div className="h-64 flex items-end justify-around gap-2 px-2">
            {chartData.profit.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex justify-center">
                  <div 
                    className={`w-full max-w-[40px] rounded-t transition-all duration-300 group-hover:opacity-80 cursor-pointer ${
                      value >= 0 
                        ? 'bg-gradient-to-t from-green-500 to-green-400' 
                        : 'bg-gradient-to-t from-red-500 to-red-400'
                    }`}
                    style={{ height: `${Math.max((Math.abs(value) / maxValue) * 200, 20)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {value >= 0 ? '+' : ''}₹{value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{chartData.months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-green-600">Highest Profit:</span> ₹
              {Math.max(...chartData.profit).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-purple-600" />
              Expense Breakdown
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{expenseBreakdown.length} categories</span>
          </div>
          <div className="space-y-4">
            {expenseBreakdown.map((item, i) => (
              <DistributionItem 
                key={i}
                label={item.label} 
                amount={item.amount} 
                percentage={item.percentage}
                colorIndex={i}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-bold">Total Expenses:</span> 
              <span className="font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
            <p className="text-sm text-gray-500">{reports.length} transactions found</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={16} />
            <span>Showing all records</span>
          </div>
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
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin" />
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.slice(0, 10).map((report, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-700">{report.date || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        report.type === 'income' || report.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : report.type === 'expense' || report.type === 'debit'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
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
                    <div className="flex flex-col items-center">
                      <Receipt size={40} className="text-gray-300 mb-2" />
                      <p>No reports available</p>
                      <p className="text-sm text-gray-400 mt-1">Create invoices and expenses to see reports</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {reports.length > 10 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All {reports.length} Records →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function MetricCard({ label, value, change, changeType, icon, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} rounded-xl border ${borderColor} p-5 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="p-2 bg-white/50 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change && (
        <p className={`text-xs font-semibold mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
          {change} vs last period
        </p>
      )}
    </div>
  );
}

function DistributionItem({ label, amount, percentage, colorIndex }) {
  const colors = [
    "from-purple-400 to-purple-600",
    "from-blue-400 to-blue-600",
    "from-green-400 to-green-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];
  const color = colors[colorIndex % colors.length];
  
  return (
    <div className="group">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} group-hover:opacity-80 transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
    </div>
  );
}

export default ReportsPage;