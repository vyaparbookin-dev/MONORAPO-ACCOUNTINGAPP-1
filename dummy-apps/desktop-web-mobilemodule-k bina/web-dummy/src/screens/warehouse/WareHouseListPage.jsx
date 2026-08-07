import React, { useEffect, useState } from "react";
import axios from "axios";

const WarehouseListPage = () => {
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    axios
      .get("/api/warehouse/list")
      .then((res) => setWarehouses(res.data.warehouses || res.data || []))
      .catch(() => setWarehouses([]));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Warehouse List</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">Name</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Manager</th>
            <th className="border p-2">Contact</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(warehouses) ? warehouses : []).map((w, i) => (
            <tr key={i}>
              <td className="border p-2">{w.name}</td>
              <td className="border p-2">{w.location}</td>
              <td className="border p-2">{w.manager}</td>
              <td className="border p-2">{w.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseListPage;