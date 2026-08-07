import React, { useEffect, useState } from "react";
import { dbService } from "../../services/dbService";

export default function ExpansesList() {
  const [expanses, setExpanses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadExpanses = async () => {
    setLoading(true);
    try {
      const expensesList = await dbService.getExpenses();
      
      const finalList = [...expensesList];
      // Fix Sorting
      finalList.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).reverse();
      setExpanses(finalList);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpanses();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Expanses List</h2>
      {loading ? <p className="text-gray-500">Loading expenses...</p> : (
      <table className="min-w-full border rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Type/Category</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expanses.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-500">No expenses found</td></tr>}
          {expanses.map((expanse) => (
            <tr key={expanse._id || expanse.id} className="border-b">
              <td className="p-3">{expanse.title}</td>
              <td className="p-3">₹{(Number(expanse.amount) || 0).toFixed(2)}</td>
              <td className="p-3 capitalize">{expanse.type || expanse.category}</td>
              <td className="p-3">{expanse.date ? new Date(expanse.date).toLocaleDateString() : 'N/A'}</td>
              <td className="p-3">
                <button className="text-blue-500 hover:underline">Edit</button>
                <button className="text-red-500 hover:underline ml-4">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
