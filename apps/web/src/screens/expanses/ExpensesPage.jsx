import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, DollarSign, Calendar, Tag, PieChart } from "lucide-react";
import api from "../../services/api";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    category: "other",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/expance");
      const expensesList = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : (response?.expenses || []));
      setExpenses(expensesList);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setExpenses([]); // Error आने पर खाली Array सेट करें ताकि पेज क्रैश ना हो
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = Array.isArray(expenses) ? [...expenses] : [];
    if (searchTerm) {
      filtered = filtered.filter((exp) =>
        exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((exp) => exp.category === categoryFilter);
    }
    setFilteredExpenses(filtered);
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date).toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      amount: 0,
      category: "other",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/expance/${editingId}`, formData);
        alert("Expense updated successfully!");
      } else {
        await api.post("/api/expance", formData);
        alert("Expense recorded successfully!");
      }
      fetchExpenses();
      resetForm();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Error saving expense. Please check connection.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this expense?")) {
      try {
        await api.delete(`/api/expance/${id}`);
        fetchExpenses();
      } catch (err) {
        console.error("Error deleting expense:", err);
      }
    }
  };

  const categories = ["rent", "utilities", "supplies", "salary", "travel", "marketing", "other"];
  const categoryColors = {
    rent: "bg-red-100 text-red-800",
    utilities: "bg-blue-100 text-blue-800",
    supplies: "bg-green-100 text-green-800",
    salary: "bg-purple-100 text-purple-800",
    travel: "bg-yellow-100 text-yellow-800",
    marketing: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800",
  };

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const expensesByCategory = {};
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  safeExpenses.forEach((exp) => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + (exp.amount || 0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage all your business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} icon="💰" />
        <StatCard label="This Month" value={filteredExpenses.length} icon="📊" />
        <StatCard label="Avg Expense" value={`₹${Math.round(totalExpenses / (filteredExpenses.length || 1)).toLocaleString()}`} icon="📈" />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? "Edit Expense" : "Record New Expense"}
          </h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Expense Title"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Amount"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
                required
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <textarea
                placeholder="Description (optional)"
                className="col-span-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="3"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingId ? "Save Changes" : "Record Expense"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Tag className="text-gray-400" size={18} />
                          <span className="font-semibold text-gray-900">
                            {expense.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            categoryColors[expense.category] ||
                            categoryColors.other
                          }`}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{expense.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-gray-400" />
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString("en-IN")
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense._id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-blue-600" />
            By Category
          </h3>
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([cat, amount]) => {
              const percentage = ((amount / Object.values(expensesByCategory).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return (
                <div key={cat}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{cat}</span>
                    <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default ExpensesPage;
