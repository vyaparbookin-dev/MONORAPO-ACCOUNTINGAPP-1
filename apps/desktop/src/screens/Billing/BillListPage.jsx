import React from "react";

export default function BillListPage({ bills, onView }) {
  return (
    <table className="min-w-full border rounded-xl overflow-hidden shadow-md">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left">Bill No</th>
          <th className="p-3 text-left">Customer</th>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr key={bill._id} className="border-t hover:bg-gray-50">
            <td className="p-3">{bill.billNo}</td>
            <td className="p-3">{bill.customerName}</td>
            <td className="p-3">{new Date(bill.date).toLocaleDateString()}</td>
            <td className="p-3">₹{bill.totalAmount}</td>
            <td className="p-3">{bill.status}</td>
            <td className="p-3">
              <button
                onClick={() => onView(bill)}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}