import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import api from "../../services/api";

const SalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [filteredSalaries, setFilteredSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    amount: 0,
    status: "unpaid",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    fetchSalaries();
  }, []);

  useEffect(() => {
    filterSalaries();
  }, [salaries, searchTerm, statusFilter]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/salary");
      const salariesList = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : (response?.salaries || []));
      setSalaries(salariesList);
    } catch (err) {
      console.error("Failed to fetch salaries:", err);
      setSalaries([]); // Set empty array on error to prevent crash
    } finally {
      setLoading(false);
    }
  };

  const filterSalaries = () => {
    let filtered = Array.isArray(salaries) ? [...salaries] : [];
    if (searchTerm) {
      filtered = filtered.filter((sal) =>
        sal.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((sal) => sal.status === statusFilter);
    }
    setFilteredSalaries(filtered);
  };

  const handleEdit = (salary) => {
    setEditingId(salary._id);
    setFormData({
      employeeName: salary.employeeName,
      amount: salary.amount,
      status: salary.status,
      date: new Date(salary.date).toISOString().split("T")[0],
      notes: salary.notes,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      employeeName: "",
      amount: 0,
      status: "unpaid",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowForm(false);
  };

  const handleAddSalary = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/salary/${editingId}`, formData);
        alert("Salary updated successfully!");
      } else {
        await api.post("/api/salary", formData);
        alert("Salary recorded successfully!");
      }
      fetchSalaries();
      resetForm();
    } catch (err) {
      console.error("Error saving salary:", err);
      alert("Error saving salary. Please check connection.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this salary record?")) {
      try {
        await api.delete(`/api/salary/${id}`);
        fetchSalaries();
      } catch (err) {
        console.error("Error deleting salary:", err);
      }
    }
  };

  const safeSalaries = Array.isArray(salaries) ? salaries : [];
  const totalSalaries = safeSalaries.reduce((sum, sal) => sum + (sal.amount || 0), 0);
  const paidCount = safeSalaries.filter((sal) => sal.status === "paid").length;
  const unpaidCount = safeSalaries.filter((sal) => sal.status === "unpaid").length;
  const employeeCount = new Set(safeSalaries.map((s) => s.employeeName)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600 mt-1">Track and manage employee salaries</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Record Salary
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employeeCount} icon="👥" />
        <StatCard label="Total Paid" value={`₹${salaries.filter(s => s.status === 'paid').reduce((a, b) => a + b.amount, 0).toLocaleString()}`} icon={<CheckCircle className="text-green-600" size={24} />} />
        <StatCard label="Pending Payment" value={unpaidCount} icon={<Clock className="text-orange-600" size={24} />} />
        <StatCard label="Month Total" value={`₹${totalSalaries.toLocaleString()}`} icon="💰" />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by employee name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Add Salary Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? "Edit Salary" : "Record Salary Payment"}
          </h2>
          <form onSubmit={handleAddSalary} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Employee Name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.employeeName}
                onChange={(e) =>
                  setFormData({ ...formData, employeeName: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Salary Amount"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
                required
              />
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
              <textarea
                placeholder="Notes (optional)"
                className="col-span-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows="3"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingId ? "Save Changes" : "Record Salary"}
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

      {/* Salary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Notes
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
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading salaries...
                  </td>
                </tr>
              ) : filteredSalaries.length > 0 ? (
                filteredSalaries.map((salary) => (
                  <tr
                    key={salary._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Users className="text-gray-400" size={18} />
                        <span className="font-semibold text-gray-900">
                          {salary.employeeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{salary.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(salary.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={salary.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {salary.notes || "-"}
                    .</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(salary)}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(salary._id)}
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
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No salary records found
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

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-3xl">
          {typeof icon === "string" ? icon : icon}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statuses = {
    paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
    unpaid: { bg: "bg-orange-100", text: "text-orange-800", label: "Unpaid" },
  };

  const style = statuses[status] || statuses.unpaid;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

export default SalaryPage;
