import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";

export default function ExpansesList() {
  const [expanses, setExpanses] = useState([]);

  const loadExpanses = async () => {
    try {
      let localList = [];
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        if (stored) {
          try {
            localList = JSON.parse(stored);
          } catch (e) {
            localList = [];
          }
        }
      } catch (e) {}
      const res = await api.get("/expenses?limit=300").catch(() => null);
      const serverList = res?.recentExpenses || res?.expenses || res?.data?.recentExpenses || res?.data?.expenses || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      const list = deduplicateExpenses([...(Array.isArray(serverList) ? serverList : []), ...localList]);
      setExpanses(list);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      setExpanses([]);
    }
  };

  useEffect(() => {
    loadExpanses();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Expanses List</h2>
      <table className="min-w-full border rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expanses.map((expanse) => (
            <tr key={expanse._id} className="border-b">
              <td className="p-3">{expanse.title}</td>
              <td className="p-3">${Number(expanse?.amount || 0).toFixed(2)}</td>
              <td className="p-3">{expanse.type}</td>
              <td className="p-3">{new Date(expanse.date).toLocaleDateString()}</td>
              <td className="p-3">
                <button className="text-blue-500 hover:underline">Edit</button>
                <button className="text-red-500 hover:underline ml-4">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
