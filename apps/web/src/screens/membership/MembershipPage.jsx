import React, { useState, useEffect } from "react";
import api from "../../services/api";

const MembershipPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "standard",
    isActive: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/membership/${editingId}`, formData);
      } else {
        await api.post("/api/membership", formData);
      }
      fetchMemberships();
      resetForm();
    } catch (err) {
      console.error("Error saving membership:", err);
      alert("Error saving membership. Please check connection.");
    }
  };

  const handleEdit = (membership) => {
    setEditingId(membership._id);
    setFormData({
      name: membership.name,
      email: membership.email,
      phone: membership.phone,
      type: membership.type,
      isActive: membership.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this membership?")) {
      try {
        await api.delete(`/api/membership/${id}`);
        fetchMemberships();
      } catch (err) {
        console.error("Error deleting membership:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      type: "standard",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/membership");
      setMemberships(response.data || []);
    } catch (err) {
      console.error("Failed to fetch memberships:", err);
      // क्रैश होने से बचाएं
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading memberships...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Membership Management</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
      >
        {showForm ? "Cancel" : "+ Add New Membership"}
      </button>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Membership" : "Add New Membership"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Member Name"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Phone"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="mr-2"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <label htmlFor="isActive">Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? "Update Membership" : "Add Membership"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Member Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Membership Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memberships.length > 0 ? (
              memberships.map((membership) => (
                <tr key={membership._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{membership.name}</td>
                  <td className="p-3">{membership.email}</td>
                  <td className="p-3">{membership.phone}</td>
                  <td className="p-3">{membership.type}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded ${
                        membership.isActive
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {membership.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(membership)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(membership._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  No memberships found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembershipPage;
