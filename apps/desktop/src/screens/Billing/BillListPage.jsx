import React from "react";

export default function BillListPage({ bills, onView, onLoadMore, hasMore, loadingMore }) {
  return (
    <div className="flex flex-col items-center w-full pb-6">
      <table className="min-w-full border rounded-xl overflow-hidden shadow-md mb-4 bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left text-gray-700 font-semibold">Bill No</th>
            <th className="p-3 text-left text-gray-700 font-semibold">Customer</th>
            <th className="p-3 text-left text-gray-700 font-semibold">Date</th>
            <th className="p-3 text-left text-gray-700 font-semibold">Amount</th>
            <th className="p-3 text-left text-gray-700 font-semibold">Status</th>
            <th className="p-3 text-left text-gray-700 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!bills || bills.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-6 text-center text-gray-500 font-medium">
                No bills found. Create a new bill to get started!
              </td>
            </tr>
          ) : (
            bills.map((bill) => (
              <tr key={bill._id || bill.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="p-3">{bill.billNo || bill.billNumber || 'N/A'}</td>
                <td className="p-3">{bill.customerName || (bill.partyId ? bill.partyId.name : 'Unknown')}</td>
                <td className="p-3">{new Date(bill.date || bill.createdAt).toLocaleDateString()}</td>
                <td className="p-3 font-semibold text-green-600">₹{(bill.totalAmount || bill.finalAmount || 0).toFixed(2)}</td>
                <td className="p-3 uppercase text-xs font-bold text-gray-500">{bill.status || 'ISSUED'}</td>
                <td className="p-3">
                  <button
                    onClick={() => onView(bill)}
                    className="px-4 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-all"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination: Load More Button */}
      {hasMore && (
        <button 
          onClick={onLoadMore} 
          disabled={loadingMore}
          className="mt-2 px-6 py-2 bg-gray-800 text-white rounded-full shadow hover:bg-gray-900 disabled:bg-gray-400 transition-all"
        >
          {loadingMore ? "Loading..." : "Load More Bills"}
        </button>
      )}
    </div>
  );
}