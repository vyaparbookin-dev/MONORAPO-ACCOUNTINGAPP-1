import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function CouponListPage() {
  const [coupons, setCoupons] = useState([]);

  const loadCoupons = async () => {
    try {
      const res = await api.get("/api/coupon");
      const data = res.data || res;
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load coupons", err);
      setCoupons([]);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Coupons</h2>
      <table className="min-w-full border rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Code</th>
            <th className="p-3 text-left">Discount (%)</th>
            <th className="p-3 text-left">Start Date</th>
            <th className="p-3 text-left">End Date</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c._id} className="border-t hover:bg-gray-50">
              <td className="p-3">{c.code}</td>
              <td className="p-3">{c.discount}</td>
              <td className="p-3">{new Date(c.startDate).toLocaleDateString()}</td>
              <td className="p-3">{new Date(c.endDate).toLocaleDateString()}</td>
              <td className="p-3">{c.active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}