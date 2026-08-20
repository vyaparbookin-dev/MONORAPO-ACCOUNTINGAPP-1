import React, { useState, useEffect } from "react";
import api from "../../services/api";

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: 0,
    validFrom: "",
    validTo: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/coupon/${editingId}`, formData);
        alert("Coupon updated successfully!");
      } else {
        await api.post("/api/coupon", formData);
        alert("Coupon created successfully!");
      }
      fetchCoupons();
      resetForm();
    } catch (err) {
      console.error("Error saving coupon:", err);
      alert("Error saving coupon. Please check connection.");
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
      validTo: new Date(coupon.validTo).toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await api.delete(`/api/coupon/${id}`);
        fetchCoupons();
      } catch (err) {
        console.error("Error deleting coupon:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercentage: 0,
      validFrom: "",
      validTo: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/coupon");
      const data = response.data || response;
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
      // क्रैश होने से बचाएं
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading coupons...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Coupon Management</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
      >
        {showForm ? "Cancel" : "+ Add New Coupon"}
      </button>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Coupon" : "Add New Coupon"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Coupon Code"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Discount Percentage"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercentage: parseFloat(e.target.value),
                  })
                }
                required
              />
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                required
              />
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? "Update Coupon" : "Add Coupon"}
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
              <th className="p-3 text-left">Coupon Code</th>
              <th className="p-3 text-left">Discount (%)</th>
              <th className="p-3 text-left">Valid From</th>
              <th className="p-3 text-left">Valid To</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr key={coupon._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{coupon.code}</td>
                  <td className="p-3">{coupon.discountPercentage}%</td>
                  <td className="p-3">{new Date(coupon.validFrom).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(coupon.validTo).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-3 text-center text-gray-500">
                  No coupons found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponsPage;
