import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ExpansesList() {
  const [expanses, setExpanses] = useState([]);

  const loadExpanses = async () => {
    // Mock data for now, as the API endpoint might not be ready
    const mockExpanses = [
      { _id: "1", title: "Office Supplies", amount: 150.75, type: "Office", date: "2025-12-20" },
      { _id: "2", title: "Client Lunch", amount: 85.50, type: "Meals", date: "2025-12-19" },
      { _id: "3", title: "Software Subscription", amount: 49.99, type: "Software", date: "2025-12-18" },
    ];
    // In a real scenario, you would use axios to fetch data:
    // const res = await axios.get("/api/expanses");
    // setExpanses(res.data);
    setExpanses(mockExpanses);
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
              <td className="p-3">${expanse.amount.toFixed(2)}</td>
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
